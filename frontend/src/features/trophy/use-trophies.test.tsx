import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTrophies, type Trophy } from './use-trophies';
import api from '@/services/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock api
vi.mock('@/services/api');

// Mock useAuthStore
vi.mock('../auth/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    accessToken: 'fake-token',
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTrophies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches trophies for a player', async () => {
    const mockTrophies: Trophy[] = [
      {
        id: 't1',
        name: 'First Blood',
        description: 'First win in battle',
        icon: 'trophy-icon',
        unlockedAt: new Date().toISOString(),
        rarity: 'PURPLE',
      },
    ];

    (api.get as any).mockResolvedValue(mockTrophies);

    const { result } = renderHook(() => useTrophies('player-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTrophies);
    expect(api.get).toHaveBeenCalledWith('/trophy/player-123');
  });

  it('does not fetch if no accessToken or playerId is provided', () => {
    const { result } = renderHook(() => useTrophies(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
  });
});
