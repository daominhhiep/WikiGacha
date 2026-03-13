import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CollectionPage from './collection-page';
import { useInfiniteCollection, useToggleFavorite } from './use-collection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('./use-collection', () => ({
  useInfiniteCollection: vi.fn(),
  useToggleFavorite: vi.fn(),
}));

// Mock CardDetail to avoid complex rendering
vi.mock('./card-detail', () => ({
  default: () => <div data-testid="card-detail" />,
}));

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe = mockObserve;
    disconnect = mockDisconnect;
  },
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('CollectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useInfiniteCollection as any).mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                id: '1',
                card: { title: 'Card 1', rarity: 'C' },
                acquiredAt: new Date().toISOString(),
              },
            ],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          },
        ],
      },
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    (useToggleFavorite as any).mockReturnValue({
      mutate: vi.fn(),
    });
  });

  it('renders the collection grid with items', () => {
    render(<CollectionPage />, { wrapper });
    expect(screen.getAllByText('Card 1').length).toBeGreaterThan(0);
    expect(screen.getByText('1')).toBeInTheDocument(); // totalCount
  });

  it('shows loading state', () => {
    (useInfiniteCollection as any).mockReturnValue({
      isLoading: true,
    });

    render(<CollectionPage />, { wrapper });
    // When loading, we still show the header but the grid is empty/skeletons
    expect(screen.getByText('Collection')).toBeInTheDocument();
  });

  it('shows end of database message when no more pages', () => {
    render(<CollectionPage />, { wrapper });
    expect(screen.getByText('— END_OF_DATABASE —')).toBeInTheDocument();
  });
});
