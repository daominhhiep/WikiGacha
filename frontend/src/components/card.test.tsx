import { render, screen } from '@testing-library/react';
import Card, { Rarity } from './card';
import { describe, it, expect } from 'vitest';

const mockCard = {
  id: '123',
  title: 'Test Article',
  summary: 'This is a test summary from Wikipedia.',
  imageUrl: 'https://example.com/image.jpg',
  wikiUrl: 'https://en.wikipedia.org/wiki/Test_Article',
  rarity: Rarity.SSR,
  hp: 120,
  atk: 45,
  def: 30,
};

describe('Card Component', () => {
  it('renders card title and stats correctly', () => {
    render(<Card card={mockCard} />);

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('displays the correct rarity badge', () => {
    render(<Card card={mockCard} />);
    expect(screen.getByText('SSR')).toBeInTheDocument();
  });

  it('renders Wikipedia attribution link', () => {
    render(<Card card={mockCard} />);

    const link = screen.getByRole('link', { name: /access_data/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', mockCard.wikiUrl);
  });

  it('renders Wikipedia source label', () => {
    render(<Card card={mockCard} />);
    expect(screen.getByText(/SOURCE: WIKIPEDIA_API/i)).toBeInTheDocument();
  });

  it('shows summary when showSummary prop is true', () => {
    render(<Card card={mockCard} showSummary={true} />);
    expect(screen.getByText(mockCard.summary)).toBeInTheDocument();
  });

  it('hides summary by default', () => {
    render(<Card card={mockCard} />);
    expect(screen.queryByText(mockCard.summary)).not.toBeInTheDocument();
  });
});
