import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useInfiniteCollection } from './use-collection';
import api from '@/services/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

describe('useInfiniteCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paginated collection data', async () => {
    const mockData = {
      items: [{ id: '1', card: { title: 'Card 1' } }],
      meta: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };

    (api.get as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useInfiniteCollection({ sortBy: 'NEWEST' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pages[0]).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith(
      '/collection',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, limit: 20 }),
      }),
    );
  });

  it('provides the next page param when more pages exist', async () => {
    const mockData = {
      items: [],
      meta: {
        total: 40,
        page: 1,
        limit: 20,
        totalPages: 2,
      },
    };

    (api.get as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useInfiniteCollection({ sortBy: 'NEWEST' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Test getNextPageParam logic internally
      (useInfiniteCollection as any).mock?.calls?.[0]?.[0]?.getNextPageParam ||
      (result.current as any).options?.getNextPageParam;

    // Access internal TanStack query option via result.current if possible or just trust the hook implementation
    // Actually we can just check hasNextPage
    expect(result.current.hasNextPage).toBe(true);
  });
});
