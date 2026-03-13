import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import CollectionGrid from './collection-grid';
import { Rarity } from '@/components/card';
import type { InventoryItem } from './use-collection';

const mockItems: InventoryItem[] = [
  {
    id: 'inv-1',
    playerId: 'p1',
    cardId: 'c1',
    acquiredAt: new Date().toISOString(),
    isFavorite: false,
    card: {
      id: 'c1',
      title: 'Test Card 1',
      summary: 'Summary 1',
      wikiUrl: 'https://wiki.url/1',
      rarity: Rarity.C,
      hp: 100,
      atk: 10,
      def: 10,
    },
  },
  {
    id: 'inv-2',
    playerId: 'p1',
    cardId: 'c2',
    acquiredAt: new Date().toISOString(),
    isFavorite: true,
    card: {
      id: 'c2',
      title: 'Test Card 2',
      summary: 'Summary 2',
      wikiUrl: 'https://wiki.url/2',
      rarity: Rarity.SSR,
      hp: 200,
      atk: 50,
      def: 50,
    },
  },
];

describe('CollectionGrid', () => {
  it('renders "NO_DATA_DETECTED" when items list is empty', () => {
    render(<CollectionGrid items={[]} />);
    expect(screen.getByText('NO_DATA_DETECTED')).toBeInTheDocument();
  });

  it('renders all items in the collection', () => {
    render(<CollectionGrid items={mockItems} />);
    // Card component might render title twice (background and header)
    expect(screen.getAllByText('Test Card 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Test Card 2').length).toBeGreaterThan(0);
  });

  it('calls onToggleFavorite when star button is clicked', () => {
    const onToggleFavorite = vi.fn();
    render(<CollectionGrid items={mockItems} onToggleFavorite={onToggleFavorite} />);

    const starButtons = screen.getAllByRole('button');
    fireEvent.click(starButtons[0]);

    expect(onToggleFavorite).toHaveBeenCalledWith('inv-1');
  });

  it('calls onCardClick when a card is clicked', () => {
    const onCardClick = vi.fn();
    render(<CollectionGrid items={mockItems} onCardClick={onCardClick} />);

    // Find one of the card titles and click the container
    const cardTitles = screen.getAllByText('Test Card 1');
    const card = cardTitles[0].closest('.cursor-pointer');
    if (card) fireEvent.click(card);

    expect(onCardClick).toHaveBeenCalledWith(mockItems[0]);
  });
});
