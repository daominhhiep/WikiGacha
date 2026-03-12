import { render, screen, fireEvent } from '@testing-library/react';
import GachaReveal from './gacha-reveal';
import { Rarity } from '@/components/card';
import { describe, it, expect, vi } from 'vitest';

const mockCards = [
  {
    id: '1',
    title: 'Card 1',
    summary: 'Summary 1',
    wikiUrl: 'https://wiki.url/1',
    imageUrl: 'img1.jpg',
    rarity: Rarity.N,
    hp: 101,
    atk: 11,
    def: 12,
  },
  {
    id: '2',
    title: 'Card 2',
    summary: 'Summary 2',
    wikiUrl: 'https://wiki.url/2',
    imageUrl: 'img2.jpg',
    rarity: Rarity.SSR,
    hp: 151,
    atk: 26,
    def: 21,
  },
];

describe('GachaReveal', () => {
  it('renders all cards provided', () => {
    render(<GachaReveal cards={mockCards} />);

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('calls onComplete when Continue button is clicked', () => {
    const onComplete = vi.fn();
    render(<GachaReveal cards={mockCards} onComplete={onComplete} />);

    const continueButton = screen.getByText('CONFIRM_ACQUISITION');
    fireEvent.click(continueButton);

    expect(onComplete).toHaveBeenCalled();
  });
});
