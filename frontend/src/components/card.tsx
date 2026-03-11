import React from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, Heart, Sword, Shield } from 'lucide-react';

/**
 * Rarity levels based on the project design system.
 * Using const object for erasableSyntaxOnly compatibility.
 */
export const Rarity = {
  N: 'N',
  R: 'R',
  SR: 'SR',
  SSR: 'SSR',
} as const;

export type Rarity = (typeof Rarity)[keyof typeof Rarity];

/**
 * Interface representing the data structure of a Game Card.
 */
export interface CardData {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  wikiUrl: string;
  rarity: Rarity;
  hp: number;
  atk: number;
  def: number;
}

/**
 * Props for the Card component.
 */
interface CardProps {
  /** The card data to display. */
  card: CardData;
  /** Optional additional CSS classes. */
  className?: string;
  /** Optional inline styles. */
  style?: React.CSSProperties;
  /** Whether to show the card summary. */
  showSummary?: boolean;
}

/**
 * Returns the border color class based on card rarity.
 */
const getRarityBorder = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.SSR:
      return 'border-rarity-ssr shadow-[0_0_15px_rgba(255,215,0,0.4)]';
    case Rarity.SR:
      return 'border-rarity-sr shadow-[0_0_15px_rgba(176,38,255,0.4)]';
    case Rarity.R:
      return 'border-rarity-r shadow-[0_0_15px_rgba(0,240,255,0.4)]';
    default:
      return 'border-rarity-n';
  }
};

/**
 * Returns the text color class based on card rarity.
 */
const getRarityTextColor = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.SSR:
      return 'text-rarity-ssr';
    case Rarity.SR:
      return 'text-rarity-sr';
    case Rarity.R:
      return 'text-rarity-r';
    default:
      return 'text-rarity-n';
  }
};

/**
 * Card component displays a Wikipedia-based game card in Cyberpunk style.
 * Adheres to the "Anti-Softness Rule" (rounded-none).
 *
 * @param props The card properties.
 * @returns A themed card component.
 */
const Card: React.FC<CardProps> = ({ card, className, style, showSummary = false }) => {
  return (
    <div
      className={cn(
        'group relative h-[30rem] w-72 flex flex-col rounded-none border-2 bg-bg-surface p-4 transition-all duration-300 hover:translate-y-[-4px]',
        getRarityBorder(card.rarity),
        className,
      )}
      style={style}
    >
      {/* HUD Decorative Elements (Cyberpunk vibe) */}
      <div className="absolute top-0 left-0 size-2 border-t-2 border-l-2 border-primary opacity-50" />
      <div className="absolute top-0 right-0 size-2 border-t-2 border-r-2 border-primary opacity-50" />
      <div className="absolute bottom-0 left-0 size-2 border-b-2 border-l-2 border-primary opacity-50" />
      <div className="absolute bottom-0 right-0 size-2 border-b-2 border-r-2 border-primary opacity-50" />

      {/* Card Header & Image */}
      <div className="relative aspect-square w-full overflow-hidden border border-border-grid bg-black flex items-center justify-center">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.title}
            className="h-full w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="text-6xl font-black text-white/10 font-mono">DATA_MISSING</div>
        )}

        {/* Rarity Label (HUD Style) */}
        <div
          className={cn(
            'absolute top-0 right-0 px-3 py-1 text-xs font-black font-mono bg-black/80 border-l border-b border-border-grid',
            getRarityTextColor(card.rarity),
          )}
        >
          {card.rarity}
        </div>

        {/* Scanning Line Animation */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1/2 w-full animate-scan pointer-events-none" />
      </div>

      {/* Card Body */}
      <div className="mt-4 flex flex-col flex-1 gap-2">
        <h3 className="font-bold uppercase tracking-wider text-lg line-clamp-2 min-h-[3.5rem] leading-tight border-b border-border-grid pb-2">
          {card.title}
        </h3>

        {showSummary && (
          <p className="text-[10px] font-mono text-muted-foreground line-clamp-3 leading-relaxed opacity-80">
            {card.summary}
          </p>
        )}

        {/* Stats Section (HUD/Monospace) */}
        <div className="mt-auto grid grid-cols-1 gap-1 font-mono text-xs">
          <div className="flex items-center justify-between border-l-2 border-red-500 pl-2 bg-red-500/5 py-1">
            <span className="flex items-center gap-2 opacity-70">
              <Heart className="size-3" /> INTEGRITY
            </span>
            <span className="font-black text-red-400">{card.hp}</span>
          </div>
          <div className="flex items-center justify-between border-l-2 border-orange-500 pl-2 bg-orange-500/5 py-1">
            <span className="flex items-center gap-2 opacity-70">
              <Sword className="size-3" /> OFFENSE
            </span>
            <span className="font-black text-orange-400">{card.atk}</span>
          </div>
          <div className="flex items-center justify-between border-l-2 border-blue-500 pl-2 bg-blue-500/5 py-1">
            <span className="flex items-center gap-2 opacity-70">
              <Shield className="size-3" /> BARRIER
            </span>
            <span className="font-black text-blue-400">{card.def}</span>
          </div>
        </div>
      </div>

      {/* Footer (Wikipedia Link) */}
      <div className="mt-4 pt-2 border-t border-border-grid flex items-center justify-between">
        <span className="text-[8px] font-mono opacity-50">SOURCE: WIKIPEDIA_API_v1</span>
        <a
          href={card.wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-white transition-colors uppercase tracking-tighter"
          onClick={(e) => e.stopPropagation()}
        >
          ACCESS_DATA <ExternalLink className="size-2.5" />
        </a>
      </div>
    </div>
  );
};

export default Card;
