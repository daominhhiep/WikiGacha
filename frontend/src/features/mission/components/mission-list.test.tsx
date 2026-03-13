import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MissionList } from './mission-list';
import { useMissions, useClaimMissionReward } from '../use-missions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the hooks
vi.mock('../use-missions', () => ({
  useMissions: vi.fn(),
  useClaimMissionReward: vi.fn(),
}));

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

describe('MissionList', () => {
  const mockMissions = [
    {
      id: 1,
      playerId: 'user1',
      missionId: 101,
      progress: 2,
      isCompleted: false,
      isClaimed: false,
      mission: {
        id: 101,
        title: 'Pull 5 Cards',
        description: 'Open gacha packs to get 5 cards.',
        rewardCredits: 50,
        type: 'DAILY',
        criteria: { count: 5 },
      },
    },
    {
      id: 2,
      playerId: 'user1',
      missionId: 102,
      progress: 10,
      isCompleted: true,
      isClaimed: false,
      mission: {
        id: 102,
        title: 'Win 10 Battles',
        description: 'Defeat 10 opponents in the arena.',
        rewardCredits: 200,
        type: 'LIFETIME',
        criteria: { count: 10 },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useMissions as any).mockReturnValue({
      isLoading: true,
    });

    render(<MissionList />, { wrapper });
    expect(screen.getByText(/Initializing Mission Terminal/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    (useMissions as any).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    render(<MissionList />, { wrapper });
    expect(screen.getByText(/CONNECTION_ERROR: UNABLE TO FETCH MISSIONS/i)).toBeInTheDocument();
  });

  it('renders mission list correctly', () => {
    (useMissions as any).mockReturnValue({
      data: mockMissions,
      isLoading: false,
    });
    
    (useClaimMissionReward as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MissionList />, { wrapper });
    
    expect(screen.getByText('Pull 5 Cards')).toBeInTheDocument();
    expect(screen.getByText('Win 10 Battles')).toBeInTheDocument();
    expect(screen.getByText('2 / 5 (40%)')).toBeInTheDocument();
    expect(screen.getByText('10 / 10 (100%)')).toBeInTheDocument();
  });

  it('shows claim button for completed but unclaimed missions', () => {
    (useMissions as any).mockReturnValue({
      data: mockMissions,
      isLoading: false,
    });
    
    const mockMutate = vi.fn();
    (useClaimMissionReward as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<MissionList />, { wrapper });
    
    const claimButton = screen.getByText(/\[ CLAIM_REWARD \]/i);
    expect(claimButton).toBeInTheDocument();
    
    fireEvent.click(claimButton);
    expect(mockMutate).toHaveBeenCalledWith(2); // userMission.id is 2
  });

  it('renders empty state when no missions are found', () => {
    (useMissions as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<MissionList />, { wrapper });
    expect(screen.getByText(/\[ NO_ACTIVE_MISSIONS_FOUND \]/i)).toBeInTheDocument();
  });
});
