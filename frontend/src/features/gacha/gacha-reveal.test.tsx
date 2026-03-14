import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GachaReveal from './gacha-reveal';
import { Rarity } from '@/components/card';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCards = [
  {
    id: '1',
    title: 'Card 1',
    summary: 'Summary 1',
    wikiUrl: 'https://wiki.url/1',
    imageUrl: 'img1.jpg',
    rarity: Rarity.C,
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
  beforeEach(() => {
    // Mock scrollTo which is not implemented in JSDOM
    Element.prototype.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders all cards provided', async () => {
    render(<GachaReveal cards={mockCards} />);

    // Card 1 is revealed automatically (Common)
    await waitFor(() => expect(screen.getByText('Card 1')).toBeInTheDocument(), { timeout: 2000 });

    // Card 2 requires manual click (SSR)
    const card2Overlay = screen.getByText('MANUAL_DECRYPT');
    fireEvent.click(card2Overlay);

    await waitFor(() => expect(screen.getByText('Card 2')).toBeInTheDocument(), { timeout: 2000 });
  });

  it('calls onComplete when Continue button is clicked', async () => {
    const onComplete = vi.fn();
    render(<GachaReveal cards={mockCards} onComplete={onComplete} />);

    // Reveal the manual card first
    await waitFor(() => screen.getByText('MANUAL_DECRYPT'), { timeout: 2000 });
    fireEvent.click(screen.getByText('MANUAL_DECRYPT'));

    // Wait for all cards to be auto-revealed
    await waitFor(() => expect(screen.getByText('CONFIRM_ACQUISITION')).toBeInTheDocument(), {
      timeout: 3000,
    });

    const continueButton = screen.getByText('CONFIRM_ACQUISITION');
    fireEvent.click(continueButton);

    expect(onComplete).toHaveBeenCalled();
  });

  it('shows placeholder slots when isLoading is true', () => {
    render(<GachaReveal cards={null} isLoading={true} />);

    expect(screen.getByText('EXTRACTING...')).toBeInTheDocument();
    // 5 placeholders are rendered
    const placeholders = screen.getAllByText('[ FETCHING ]');
    expect(placeholders).toHaveLength(5);
  });

  it('shows error state when error is present', () => {
    const onComplete = vi.fn();
    const error = new Error('BREACH_FAILED_BY_FIREWALL');
    render(<GachaReveal cards={null} error={error} onComplete={onComplete} />);

    expect(screen.getByText('BREACH_ABORTED')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL_ERROR')).toBeInTheDocument();
    expect(screen.getByText('BREACH_FAILED_BY_FIREWALL')).toBeInTheDocument();

    const terminateButton = screen.getByText('TERMINATE');
    fireEvent.click(terminateButton);
    expect(onComplete).toHaveBeenCalled();
  });
});
