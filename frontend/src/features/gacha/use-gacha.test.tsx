import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGachaStore, useOpenPack } from './use-gacha';
import { Rarity } from '@/components/card';
import api from '@/services/api';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API client
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock useAuthStore
vi.mock('../auth/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    accessToken: 'fake-token',
    deductCredits: vi.fn(),
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGachaStore', () => {
  beforeEach(() => {
    useGachaStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = useGachaStore.getState();
    expect(state.lastOpenedCards).toBeNull();
  });

  it('should set last opened cards', () => {
    const mockCards = [{ id: '1' } as any];
    useGachaStore.getState().setLastOpenedCards(mockCards);
    expect(useGachaStore.getState().lastOpenedCards).toEqual(mockCards);
  });
});

describe('useOpenPack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGachaStore.getState().reset();
  });

  it('should handle successful pack opening', async () => {
    const mockCards = [
      {
        id: '1',
        title: 'Test Article',
        summary: 'Summary content',
        imageUrl: 'http://image.url',
        wikiUrl: 'http://wiki.url',
        rarity: Rarity.N,
        hp: 100,
        atk: 20,
        def: 15,
      },
    ];

    const mockResponse = {
      newCards: mockCards,
      remainingCredits: 90,
    };

    (api.post as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOpenPack(), { wrapper: createWrapper() });

    result.current.mutate('BASIC');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(useGachaStore.getState().lastOpenedCards).toEqual(mockCards);
    expect(api.post).toHaveBeenCalledWith('/gacha/open', { packType: 'BASIC' });
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Insufficient credits';
    (api.post as any).mockRejectedValue({
      response: {
        data: {
          error: {
            message: errorMessage,
          },
        },
      },
    });

    const { result } = renderHook(() => useOpenPack(), { wrapper: createWrapper() });

    result.current.mutate('BASIC');

    await waitFor(() => expect(result.current.isError).toBe(true));

    // In TanStack Query v5, the error is an object, the message handling is in the component
    expect(result.current.error).toBeDefined();
    expect(useGachaStore.getState().lastOpenedCards).toBeNull();
  });
});
