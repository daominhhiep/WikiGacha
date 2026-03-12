import { create } from 'zustand';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { CardData } from '@/components/card';
import { useAuthStore } from '../auth/auth-store';

/**
 * Interface for the gacha pack opening response.
 */
export interface OpenPackResponse {
  /** The list of cards generated from the pack. */
  newCards: CardData[];
  /** The remaining credits for the player (if logged in). */
  remainingCredits?: number;
  /** The current pity counter for the player. */
  pityCounter?: number;
  /** The cost of the pack (if anonymous). */
  cost?: number;
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
 * Supports both authenticated (DB) and anonymous (Local) modes.
 *
 * @returns Mutation object for the gacha pack opening process.
 */
export const useOpenPack = () => {
  const queryClient = useQueryClient();
  const setLastOpenedCards = useGachaStore((state) => state.setLastOpenedCards);
  const { accessToken, updatePlayerStats } = useAuthStore();

  return useMutation({
    mutationFn: async (packType: 'BASIC' | 'THEMED' = 'BASIC') => {
      if (!accessToken) {
        throw new Error('AUTHENTICATION_REQUIRED: Please login to open packs.');
      }

      // If logged in, use the standard endpoint
      const response = await api.post<OpenPackResponse>('/gacha/open', { packType });
      return response as unknown as OpenPackResponse;
    },
    onSuccess: (data) => {
      setLastOpenedCards(data.newCards);

      // Synchronize player stats (credits, pity)
      if (data.remainingCredits !== undefined || data.pityCounter !== undefined) {
        updatePlayerStats({
          credits: data.remainingCredits,
          pityCounter: data.pityCounter,
        });
      }

      // Invalidate queries that might depend on player credits or inventory
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
