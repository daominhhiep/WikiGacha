import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Interface for the player data stored in the auth session.
 */
export interface Player {
  id: string;
  username: string;
  email?: string;
  googleId?: string;
  credits: number;
  level: number;
  xp: number;
  pityCounter: number;
  avatarUrl?: string;
}

/**
 * Zustand store for managing authentication and local guest state.
 */
interface AuthStore {
  /** The currently logged-in player, if any. */
  player: Player | null;
  /** The JWT access token for API requests. */
  accessToken: string | null;
  /** Persisted guest username to resume sessions. */
  persistedGuestUsername: string | null;

  /** Sets the auth session data. */
  setAuth: (player: Player, accessToken: string) => void;
  /** Updates specific player stats (credits, pity, etc.) */
  updatePlayerStats: (stats: Partial<Player>) => void;
  /** Deducts credits from remote account. */
  deductCredits: (amount: number) => void;
  /** Clears the auth session (logout). */
  logout: () => void;
}

/**
 * Global store for authentication and local persistence.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      player: null,
      accessToken: null,
      persistedGuestUsername: null,

      setAuth: (player, accessToken) => {
        set({ player, accessToken });
        // If this is a guest account (no googleId), remember the username
        if (!player.googleId) {
          set({ persistedGuestUsername: player.username });
        }
      },

      updatePlayerStats: (stats) => {
        set((state) => {
          if (state.player) {
            return {
              player: { ...state.player, ...stats },
            };
          }
          return {};
        });
      },

      deductCredits: (amount) => {
        set((state) => {
          if (state.player) {
            return {
              player: { ...state.player, credits: state.player.credits - amount },
            };
          }
          return {};
        });
      },

      logout: () => {
        set({ player: null, accessToken: null });
      },
    }),
    {
      name: 'wikigacha-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist the token, player, and the guest username
      partialize: (state) => ({
        accessToken: state.accessToken,
        player: state.player,
        persistedGuestUsername: state.persistedGuestUsername,
      }),
    },
  ),
);
