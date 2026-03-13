import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '../auth/auth-store';

/**
 * Interface for a trophy.
 */
export interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'GOLD' | 'PURPLE';
}

/**
 * Custom hook for fetching the player's trophies.
 * 
 * @param playerId The ID of the player whose trophies to fetch.
 * @returns Query object for trophies.
 */
export const useTrophies = (playerId: string) => {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ['trophies', playerId],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('AUTHENTICATION_REQUIRED: Please login to view trophies.');
      }

      // The task specified /api/v1/trophy/:playerId
      // Our api axios instance already has /api/v1 as baseURL
      const response = await api.get<Trophy[]>(`/trophy/${playerId}`);
      return response as unknown as Trophy[];
    },
    enabled: !!accessToken && !!playerId,
  });
};
