import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import TrophyGrid from './trophy-grid';
import type { Trophy } from '../use-trophies';

const mockTrophies: Trophy[] = [
  {
    id: 't1',
    name: 'First Blood',
    description: 'First win in battle',
    icon: 'trophy-icon',
    unlockedAt: new Date().toISOString(),
    rarity: 'PURPLE',
  },
  {
    id: 't2',
    name: 'Legendary Collector',
    description: 'Collect 10 SSR cards',
    icon: 'http://example.com/icon.png',
    unlockedAt: new Date().toISOString(),
    rarity: 'GOLD',
  },
];

describe('TrophyGrid', () => {
  it('renders loading state', () => {
    render(<TrophyGrid trophies={[]} isLoading={true} />);
    expect(screen.getByText('Syncing_Trophies...')).toBeInTheDocument();
  });

  it('renders "NO_TROPHIES_UNLOCKED" when trophies list is empty', () => {
    render(<TrophyGrid trophies={[]} />);
    expect(screen.getByText('NO_TROPHIES_UNLOCKED')).toBeInTheDocument();
  });

  it('renders all trophies in the grid', () => {
    render(<TrophyGrid trophies={mockTrophies} />);
    expect(screen.getByText('First Blood')).toBeInTheDocument();
    expect(screen.getByText('Legendary Collector')).toBeInTheDocument();
  });

  it('shows description when hovered', async () => {
    render(<TrophyGrid trophies={mockTrophies} />);

    const trophyName = screen.getByText('First Blood');
    const card = trophyName.closest('.relative');

    if (card) {
      fireEvent.mouseEnter(card);
    }

    expect(screen.getByText('DATA_EXTRACTED')).toBeInTheDocument();
    expect(screen.getByText('First win in battle')).toBeInTheDocument();
  });
});
