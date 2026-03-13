import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import CardDetail from './card-detail';
import { Rarity } from '@/components/card';
import { InventoryItem } from './use-collection';

const mockItem: InventoryItem = {
  id: 'inv-1',
  playerId: 'p1',
  cardId: 'c1',
  acquiredAt: '2026-03-13T00:00:00.000Z',
  isFavorite: true,
  card: {
    id: 'c1',
    title: 'Detailed Card',
    summary: 'This is a long summary of the Wikipedia article for the detailed card.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Detailed_Card',
    rarity: Rarity.SSR,
    hp: 150,
    atk: 45,
    def: 30,
  },
};

describe('CardDetail', () => {
  it('renders nothing when item is null', () => {
    const { container } = render(<CardDetail item={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders card details when item is provided', () => {
    render(<CardDetail item={mockItem} onClose={vi.fn()} />);
    
    // Check title (might be multiple due to Card component background)
    expect(screen.getAllByText('Detailed Card').length).toBeGreaterThan(0);
    
    // Check summary
    expect(screen.getByText(/This is a long summary/)).toBeInTheDocument();
    
    // Check stats (displayed in both Card and Sidebar)
    expect(screen.getAllByText('150').length).toBeGreaterThan(0);
    expect(screen.getAllByText('45').length).toBeGreaterThan(0);
    expect(screen.getAllByText('30').length).toBeGreaterThan(0);
    
    // Check favorite badge
    expect(screen.getByText('FAVORITE_ASSET')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<CardDetail item={mockItem} onClose={onClose} />);
    
    // In our implementation, the close button is the first button in the DOM order of the modal.
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // The X button
    
    expect(onClose).toHaveBeenCalled();
  });

  it('renders the Wikipedia link', () => {
    render(<CardDetail item={mockItem} onClose={vi.fn()} />);
    const link = screen.getByRole('link', { name: /ACCESS_FULL_ARCHIVE/ });
    expect(link).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Detailed_Card');
  });
});
