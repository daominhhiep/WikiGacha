import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { CardData } from '@/components/card';
import { useAuthStore } from '../auth/auth-store';

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
 * Custom hook for fetching the player's card collection.
 *
 * @returns Query object for the player collection.
 */
export const useCollection = () => {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ['collection'],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('AUTHENTICATION_REQUIRED: Please login to view your collection.');
      }
      const response = await api.get<InventoryItem[]>('/collection');
      return response as unknown as InventoryItem[];
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
