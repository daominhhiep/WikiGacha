import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import api from '@/services/api';
import { useAuthStore } from '../auth/auth-store';
import type { InventoryItem } from '../collection/use-collection';

/**
 * Interface for a card in battle.
 */
export interface BattleCard {
  instanceId: string;
  title: string;
  imageUrl?: string;
  rarity: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
}

/**
 * Interface for a battle participant (Player or AI).
 */
export interface BattleParticipant {
  id: string;
  username?: string;
  avatarUrl?: string;
  cards: BattleCard[];
}

/**
 * Interface for a battle log entry.
 */
export interface BattleLogEntry {
  turn: number;
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  damage: number;
  hpRemaining: number;
  isDefeated: boolean;
}

/**
 * Interface for the battle result response.
 */
export interface BattleResult {
  battleId: string;
  winnerId: string;
  participants: {
    p1: BattleParticipant;
    p2: BattleParticipant;
  };
  log: BattleLogEntry[];
  rewards: {
    credits: number;
    xp: number;
  };
}

/**
 * Interface for a battle history record.
 */
export interface BattleHistory {
  id: string;
  player1Id: string;
  player2Id: string | null;
  winnerId: string | null;
  status: string;
  createdAt: string;
  player1: { id: string; username: string };
  player2: { id: string; username: string } | null;
  winner: { id: string; username: string } | null;
}

/**
 * Zustand store for managing the current deck selection.
 */
interface BattleStore {
  selectedCardIds: string[];
  cardRegistry: Record<string, InventoryItem>;
  toggleCard: (cardId: string) => void;
  registerCards: (items: InventoryItem[]) => void;
  clearDeck: () => void;
  maxDeckSize: number;
}

export const useBattleStore = create<BattleStore>((set) => ({
  selectedCardIds: [],
  cardRegistry: {},
  maxDeckSize: 5,
  toggleCard: (inventoryId) =>
    set((state) => {
      const isSelected = state.selectedCardIds.includes(inventoryId);
      if (isSelected) {
        return { selectedCardIds: state.selectedCardIds.filter((id) => id !== inventoryId) };
      }
      if (state.selectedCardIds.length < state.maxDeckSize) {
        return { selectedCardIds: [...state.selectedCardIds, inventoryId] };
      }
      return state;
    }),
  registerCards: (items) =>
    set((state) => {
      const next = { ...state.cardRegistry };
      let hasNew = false;
      items.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = item;
          hasNew = true;
        }
      });
      return hasNew ? { cardRegistry: next } : state;
    }),
  clearDeck: () => set({ selectedCardIds: [] }),
}));

/**
 * Custom hook for battle-related operations.
 */
export const useBattle = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  /**
   * Mutation for starting an auto-battle.
   */
  const startBattleMutation = useMutation({
    mutationFn: async (deckIds: string[]) => {
      if (!accessToken) {
        throw new Error('AUTHENTICATION_REQUIRED: Please login to start a battle.');
      }
      const response = await api.post<BattleResult>('/battle/start', { deckIds });
      return response as unknown as BattleResult;
    },
    onSuccess: () => {
      // Refresh battle history and player profile (for rewards)
      queryClient.invalidateQueries({ queryKey: ['battle-history'] });
      queryClient.invalidateQueries({ queryKey: ['player-profile'] });
    },
  });

  /**
   * Query for fetching battle history.
   */
  const battleHistoryQuery = useQuery({
    queryKey: ['battle-history'],
    queryFn: async () => {
      if (!accessToken) return [];
      const response = await api.get<BattleHistory[]>('/battle/history');
      return response as unknown as BattleHistory[];
    },
    enabled: !!accessToken,
  });

  return {
    startBattle: startBattleMutation.mutateAsync,
    isStartingBattle: startBattleMutation.isPending,
    battleHistory: battleHistoryQuery.data || [],
    isLoadingHistory: battleHistoryQuery.isLoading,
  };
};
