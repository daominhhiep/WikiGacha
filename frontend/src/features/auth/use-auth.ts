import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/services/api';
import { useAuthStore, type Player } from './auth-store';

/**
 * Interface for the guest login response.
 */
interface AuthResponse {
  player: Player;
  accessToken: string;
}

/**
 * Custom hook for guest login mutation.
 *
 * @returns Mutation object for guest login.
 */
export const useGuestLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (username?: string) => {
      // The api client is configured to return response.data.data directly
      const response = await api.post<AuthResponse>('/auth/guest', { username });
      return response as unknown as AuthResponse;
    },
    onSuccess: (data) => {
      setAuth(data.player, data.accessToken);
    },
  });
};

/**
 * Custom hook for Google one-click verification.
 *
 * @returns Mutation object for Google verification.
 */
export const useGoogleLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credential: string) => {
      const response = await api.post<AuthResponse>('/auth/google/verify', { credential });
      return response as unknown as AuthResponse;
    },
    onSuccess: (data) => {
      setAuth(data.player, data.accessToken);
    },
  });
};

/**
 * Custom hook to fetch the current player's profile if already logged in.
 *
 * @returns Query object for the player profile.
 */
export const usePlayerProfile = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);

  const query = useQuery({
    queryKey: ['player'],
    queryFn: async () => {
      // Assuming GET /auth/me returns the player profile
      const response = await api.get<Player>('/auth/me');
      return response as unknown as Player;
    },
    enabled: !!accessToken,
  });

  // Update store when data changes
  useEffect(() => {
    if (query.data && accessToken) {
      setAuth(query.data, accessToken);
    }
  }, [query.data, accessToken, setAuth]);

  return query;
};
