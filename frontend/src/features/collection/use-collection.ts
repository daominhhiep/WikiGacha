import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { CardData } from '@/components/card';
import { useAuthStore } from '../auth/auth-store';
import type { SortOption } from './collection-filters';

/**
 * Interface for a record in the player's inventory.
 */
export interface InventoryItem {
  id: string;
  playerId: string;
  cardId: string;
  acquiredAt: string;
  isFavorite: boolean;
  card: CardData;
}

/**
 * Interface for the paginated collection response.
 */
export interface PaginatedCollection {
  items: InventoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Custom hook for fetching the player's card collection with pagination and filters.
 * Uses TanStack Query's useInfiniteQuery for lazy loading.
 */
export const useInfiniteCollection = (filters: {
  search?: string;
  rarity?: string | 'ALL';
  sortBy?: SortOption;
}) => {
  const { accessToken } = useAuthStore();

  return useInfiniteQuery({
    queryKey: ['collection', filters],
    queryFn: async ({ pageParam = 1 }) => {
      if (!accessToken) {
        throw new Error('AUTHENTICATION_REQUIRED: Please login to view your collection.');
      }

      const params = {
        page: pageParam,
        limit: 20,
        search: filters.search || undefined,
        rarity: filters.rarity === 'ALL' ? undefined : filters.rarity,
        sortBy: filters.sortBy,
      };

      const response = await api.get<PaginatedCollection>('/collection', { params });
      return response as unknown as PaginatedCollection;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    enabled: !!accessToken,
  });
};

/**
 * Custom hook for toggling the favorite status of a card in the collection.
 *
 * @returns Mutation object for toggling favorite status.
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (inventoryId: string) => {
      if (!accessToken) {
        throw new Error('AUTHENTICATION_REQUIRED: Please login to perform this action.');
      }
      const response = await api.patch<InventoryItem>(`/collection/${inventoryId}/favorite`, {});
      return response as unknown as InventoryItem;
    },
    onSuccess: () => {
      // Invalidate the collection query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
};
