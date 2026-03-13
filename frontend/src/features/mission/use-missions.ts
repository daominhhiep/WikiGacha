import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '../auth/auth-store';

export type MissionType = 'DAILY' | 'LIFETIME';

export interface MissionCriteria {
  type: string;
  count: number;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  rewardCredits: number;
  type: MissionType;
  criteria: MissionCriteria;
}

export interface UserMission {
  id: number;
  playerId: string;
  missionId: number;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  mission: Mission;
}

export interface ClaimRewardResponse {
  success: boolean;
  rewardCredits: number;
  totalCredits: number;
}

/**
 * Custom hook for fetching the current user's missions.
 */
export const useMissions = () => {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('AUTHENTICATION_REQUIRED: Please login to view missions.');
      }
      const response = await api.get<UserMission[]>('/missions');
      return response as unknown as UserMission[];
    },
    enabled: !!accessToken,
  });
};

/**
 * Custom hook for claiming a mission reward.
 */
export const useClaimMissionReward = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (userMissionId: number) => {
      if (!accessToken) {
        throw new Error('AUTHENTICATION_REQUIRED: Please login to claim rewards.');
      }
      const response = await api.post<ClaimRewardResponse>(`/missions/${userMissionId}/claim`, {});
      return response as unknown as ClaimRewardResponse;
    },
    onSuccess: () => {
      // Invalidate the missions query to refresh progress/claimed status
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      // Might want to invalidate user profile/credits too
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    },
  });
};
