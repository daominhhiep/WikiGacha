import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ExternalLink, Heart, Sword, Shield, Sparkles } from 'lucide-react';

/**
 * Rarity levels based on the project design system.
 * Using const object for erasableSyntaxOnly compatibility.
 */
export const Rarity = {
  C: 'C',
  UC: 'UC',
  R: 'R',
  SR: 'SR',
  SSR: 'SSR',
  UR: 'UR',
  LR: 'LR',
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
  /** Whether the card is currently revealed (flipped). */
  isRevealed?: boolean;
}

const getRarityBorder = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.LR:
      return 'border-rarity-ssr shadow-[0_0_30px_rgba(255,215,0,0.8)]';
    case Rarity.UR:
      return 'border-rarity-ssr shadow-[0_0_20px_rgba(255,215,0,0.6)]';
    case Rarity.SSR:
      return 'border-rarity-ssr shadow-[0_0_20px_rgba(255,215,0,0.5)]';
    case Rarity.SR:
      return 'border-rarity-sr shadow-[0_0_20px_rgba(176,38,255,0.5)]';
    case Rarity.R:
      return 'border-rarity-r shadow-[0_0_20px_rgba(0,240,255,0.5)]';
    case Rarity.UC:
      return 'border-rarity-s shadow-[0_0_15px_rgba(57,255,20,0.3)]';
    default:
      return 'border-rarity-n';
  }
};

/**
 * Returns the text color class based on card rarity.
 */
const getRarityTextColor = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.LR:
    case Rarity.UR:
    case Rarity.SSR:
      return 'text-rarity-ssr';
    case Rarity.SR:
      return 'text-rarity-sr';
    case Rarity.R:
      return 'text-rarity-r';
    case Rarity.UC:
      return 'text-rarity-s';
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
const Card: React.FC<CardProps> = ({
  card,
  className,
  style,
  showSummary = false,
  isRevealed = true,
}) => {
  return (
    <motion.div
      layout
      initial={false}
      whileHover={isRevealed ? { y: -8, scale: 1.02 } : { scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      className={cn(
        'group relative h-[30rem] w-72 flex flex-col rounded-none border-2 p-4 transition-all duration-300',
        isRevealed
          ? getRarityBorder(card.rarity)
          : 'border-primary/20 bg-black/80 shadow-[0_0_15px_rgba(0,240,255,0.1)]',
        isRevealed ? 'bg-bg-surface' : 'bg-black',
        className,
      )}
      style={style}
    >
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="facedown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-cover"
          >
            <div className="size-32 border-2 border-primary/40 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              <div className="size-24 border border-primary/20 flex items-center justify-center">
                <div className="text-4xl font-black text-primary/40 italic">?</div>
              </div>
              {/* Decorative corners for facedown */}
              <div className="absolute -top-1 -left-1 size-3 border-t-2 border-l-2 border-primary" />
              <div className="absolute -bottom-1 -right-1 size-3 border-b-2 border-r-2 border-primary" />
            </div>
            <div className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.3em] animate-pulse">
              [ WAITING_FOR_DECRYPTION ]
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="faceup"
            initial={{ opacity: 0, scale: 0.95, filter: 'brightness(1.5) blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'brightness(1) blur(0px)' }}
            transition={{ duration: 0.5 }}
            className="flex flex-col h-full"
          >
            {/* Rare Card Effects */}
            {(card.rarity === Rarity.SSR || card.rarity === Rarity.UR || card.rarity === Rarity.LR) && (
              <>
                <motion.div
                  animate={{ opacity: [0.1, 0.4, 0.1], rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-20 bg-gradient-to-tr from-rarity-ssr/30 via-transparent to-rarity-ssr/30 blur-[100px] z-[-1]"
                />
                <div className="absolute top-2 left-2 z-20">
                  <Sparkles className="size-5 text-rarity-ssr animate-bounce" />
                </div>
              </>
            )}

            {card.rarity === Rarity.SR && (
              <motion.div
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-10 bg-rarity-sr/10 blur-[60px] z-[-1]"
              />
            )}

            {/* HUD Decorative Elements (Cyberpunk vibe) */}
            <div className="absolute top-0 left-0 size-2 border-t-2 border-l-2 border-primary opacity-50" />
            <div className="absolute top-0 right-0 size-2 border-t-2 border-r-2 border-primary opacity-50" />
            <div className="absolute bottom-0 left-0 size-2 border-b-2 border-l-2 border-primary opacity-50" />
            <div className="absolute bottom-0 right-0 size-2 border-b-2 border-r-2 border-primary opacity-50" />

            {/* Card Header & Image */}
            <div className="relative aspect-square w-full overflow-hidden border border-border-grid bg-black flex items-center justify-center">
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  className="h-full w-full object-cover transition-all duration-500 grayscale-[0.3] group-hover:grayscale-0"
                />
              )}

              {!card.imageUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-surface/20 p-6">
                  {/* Cyberpunk abstract background for missing images */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)]" />
                  <div className="absolute inset-0 opacity-10 flex flex-wrap gap-2 p-2 pointer-events-none">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-1 w-full bg-primary/20 animate-pulse"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                  <div className="relative z-10 text-center">
                    <div className="line-clamp-4 font-mono text-2xl font-black uppercase leading-tight text-white/40">
                      {card.title}
                    </div>
                  </div>
                </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Card;
