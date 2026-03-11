import React from 'react';
import Card from '@/components/card';
import type { CardData } from '@/components/card';
import { Button } from '@/components/ui/button';

/**
 * Props for the GachaReveal component.
 */
interface GachaRevealProps {
  /** The list of cards to reveal. */
  cards: CardData[];
  /** Callback function triggered when the user finishes viewing the revealed cards. */
  onComplete?: () => void;
}

/**
 * GachaReveal displays a Cyberpunk-themed animation for newly opened cards.
 * Adheres to project styling standards: high contrast, dark mode, no rounded corners.
 *
 * @param props The reveal properties.
 * @returns A themed reveal interface.
 */
const GachaReveal: React.FC<GachaRevealProps> = ({ cards, onComplete }) => {
  return (
    <div className="flex flex-col items-center animate-in fade-in duration-700 bg-black/40 p-8 backdrop-blur-md border border-border-grid">
      <div className="flex flex-wrap justify-center gap-8 py-8">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            data-testid={`card-${index}`}
            className="animate-in fade-in zoom-in slide-in-from-bottom-12 fill-mode-both"
            style={{ animationDelay: `${index * 300}ms` }}
          />
        ))}
      </div>

      {onComplete && (
        <Button
          onClick={onComplete}
          variant="secondary"
          className="mt-12 h-14 px-16 text-xl font-black rounded-none border-2 border-primary bg-black text-primary hover:bg-primary hover:text-black transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 fill-mode-both shadow-[0_0_20px_rgba(0,240,255,0.2)]"
          style={{ animationDelay: `${cards.length * 300 + 500}ms` }}
        >
          CONFIRM_ACQUISITION
        </Button>
      )}
    </div>
  );
};

export default GachaReveal;
