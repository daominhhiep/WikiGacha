import { create } from 'zustand';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { CardData } from '@/components/card';

/**
 * Interface for the gacha pack opening response.
 */
export interface OpenPackResponse {
  /** The list of cards generated from the pack. */
  newCards: CardData[];
  /** The remaining credits for the player. */
  remainingCredits: number;
}

/**
 * Zustand store for persisting the result of the last opened gacha pack.
 */
interface GachaStore {
  /** The cards from the most recently opened pack. */
  lastOpenedCards: CardData[] | null;
  /** Sets the last opened cards. */
  setLastOpenedCards: (cards: CardData[] | null) => void;
  /** Resets the gacha state. */
  reset: () => void;
}

/**
 * Global store for gacha results.
 */
export const useGachaStore = create<GachaStore>((set) => ({
  lastOpenedCards: null,
  setLastOpenedCards: (cards) => set({ lastOpenedCards: cards }),
  reset: () => set({ lastOpenedCards: null }),
}));

/**
 * Custom hook for opening a gacha pack using TanStack Query.
 * Adheres to the project convention of using React Query for async data.
 *
 * @returns Mutation object for the gacha pack opening process.
 */
export const useOpenPack = () => {
  const queryClient = useQueryClient();
  const setLastOpenedCards = useGachaStore((state) => state.setLastOpenedCards);

  return useMutation({
    mutationFn: async (packType: 'BASIC' | 'THEMED' = 'BASIC') => {
      // The api client is configured to return response.data.data directly
      const response = await api.post<OpenPackResponse>('/gacha/open', { packType });
      return response as unknown as OpenPackResponse;
    },
    onSuccess: (data) => {
      setLastOpenedCards(data.newCards);
      // Invalidate queries that might depend on player credits or inventory
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
