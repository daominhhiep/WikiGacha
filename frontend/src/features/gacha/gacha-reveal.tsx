import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants, Variant } from 'framer-motion';
import { cn } from '@/lib/utils';
import Card, { Rarity } from '@/components/card';
import type { CardData } from '@/components/card';
import { Button } from '@/components/ui/button';
import { Cpu, ShieldAlert, Loader2 } from 'lucide-react';
import axios from 'axios';

// External counter for unique IDs to satisfy strict purity rules (Math.random/Date.now in render)
let particleBurstIdCounter = 0;

/**
 * Lightweight particle component for reveal effects.
 * Receives pre-calculated coordinates to remain "pure" during render.
 */
const Particle = ({
  color,
  angle,
  distance,
}: {
  color: string;
  angle: number;
  distance: number;
}) => {
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        scale: 0,
      }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="absolute size-2 z-50 pointer-events-none"
      style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
    />
  );
};

/**
 * Props for the GachaReveal component.
 */
interface GachaRevealProps {
  /** The list of cards to reveal. */
  cards: CardData[] | null;
  /** Callback function triggered when the user finishes viewing the revealed cards. */
  onComplete?: () => void;
  /** Whether the gacha pack is still being opened/extracted. */
  isLoading?: boolean;
  /** Any API error that occurred during the breach. */
  error?: Error | null;
}

interface BurstData {
  id: string;
  cardId: string;
  color: string;
  particles: { angle: number; distance: number }[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 } as Variant,
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  } as Variant,
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, rotateY: 90 } as Variant,
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 120,
    },
  } as Variant,
};

/**
 * GachaReveal displays a Cyberpunk-themed manual reveal interface for newly opened cards.
 * Users must click individual cards to "decrypt" them.
 */
const GachaReveal: React.FC<GachaRevealProps> = ({
  cards: initialCards,
  onComplete,
  isLoading,
  error,
}) => {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [activeBursts, setActiveBursts] = useState<BurstData[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getErrorMessage = (error: Error | null) => {
    if (!error) return null;
    if (axios.isAxiosError(error)) {
      return (error.response?.data as any)?.error?.message || error.message || 'DATA_BREACH_FAILED';
    }
    return error.message;
  };

  // Sort cards: Move best card to the end
  const cards = useMemo(() => {
    if (!initialCards) return [];
    const sorted = [...initialCards];
    let bestIndex = 0;
    const rarityPower = {
      [Rarity.C]: 0,
      [Rarity.UC]: 1,
      [Rarity.R]: 2,
      [Rarity.SR]: 3,
      [Rarity.SSR]: 4,
      [Rarity.UR]: 5,
      [Rarity.LR]: 6,
    };

    for (let i = 1; i < sorted.length; i++) {
      if (rarityPower[sorted[i].rarity] > rarityPower[sorted[bestIndex].rarity]) {
        bestIndex = i;
      }
    }

    if (rarityPower[sorted[bestIndex].rarity] > 0) {
      const [bestCard] = sorted.splice(bestIndex, 1);
      sorted.push(bestCard);
    }
    return sorted;
  }, [initialCards]);

  const isAllRevealed =
    revealedIds.size > 0 && cards.length > 0 && revealedIds.size === cards.length;

  const handleReveal = useCallback(
    (card: CardData, index: number) => {
      if (revealedIds.has(card.id)) return;

      setRevealedIds((prev) => new Set(prev).add(card.id));

      // Auto-scroll to the specific card being revealed
      if (scrollRef.current && cardRefs.current[index]) {
        const container = scrollRef.current;
        const cardElement = cardRefs.current[index];

        if (cardElement) {
          const containerWidth = container.offsetWidth;
          const cardOffset = cardElement.offsetLeft;
          const cardWidth = cardElement.offsetWidth;
          const scrollTarget = cardOffset - containerWidth / 2 + cardWidth / 2;

          container.scrollTo({
            left: scrollTarget,
            behavior: 'smooth',
          });
        }
      }

      // Add particle burst for rare cards (R+)
      if (card.rarity !== Rarity.C && card.rarity !== Rarity.UC) {
        const colorMap = {
          [Rarity.R]: '#22c55e',
          [Rarity.SR]: '#3b82f6',
          [Rarity.SSR]: '#ef4444',
          [Rarity.UR]: '#eab308',
          [Rarity.LR]: '#a855f7',
        };
        const color = colorMap[card.rarity] || '#00F0FF';

        const burstId = `burst-${particleBurstIdCounter++}`;

        // Pre-calculate random values in the event handler (safe from purity rules)
        const newBurst: BurstData = {
          id: burstId,
          cardId: card.id,
          color,
          particles: Array.from({ length: 12 }).map((_, i) => ({
            angle: (i / 12) * Math.PI * 2,
            distance: 100 + Math.random() * 100,
          })),
        };

        setActiveBursts((prev) => [...prev, newBurst]);

        // Cleanup particles after animation
        setTimeout(() => {
          setActiveBursts((prev) => prev.filter((p) => p.id !== burstId));
        }, 1000);
      }
    },
    [revealedIds],
  );

  // Auto-reveal sequence: Only for N and R cards
  useEffect(() => {
    if (isLoading || cards.length === 0) return;

    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    cards.forEach((card, index) => {
      // ONLY auto-reveal C, UC, R, SR cards. SSR, UR and LR require manual click.
      const isManualRarity =
        card.rarity === Rarity.SSR || card.rarity === Rarity.UR || card.rarity === Rarity.LR;
      if (isManualRarity) return;

      const tid = setTimeout(
        () => {
          handleReveal(card, index);
        },
        (index + 1) * 150,
      );
      timeoutIds.push(tid);
    });

    return () => timeoutIds.forEach((id) => clearTimeout(id));
  }, [cards, isLoading, handleReveal]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center bg-black/60 p-8 backdrop-blur-xl border border-border-grid w-full min-h-[60vh] relative"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_100%)] opacity-5 pointer-events-none" />

      {/* Header Info (Visible during loading or error) */}
      <div className="mb-8 text-center space-y-2 z-20">
        <div className="flex items-center justify-center gap-4 text-primary animate-pulse">
          <Cpu className="size-8" />
          <h2 className="text-4xl font-black tracking-widest uppercase font-mono italic">
            {error ? 'BREACH_ABORTED' : isLoading ? 'EXTRACTING_DATA...' : 'DATA_EXTRACTED'}
          </h2>
          <Cpu className="size-8" />
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-2" />
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-4">
          {error
            ? 'Critical failure in the extraction protocol.'
            : isLoading
              ? 'Bypassing Wikipedia firewalls. Converting article metadata...'
              : 'Inventory synchronized with global data terminal.'}
        </p>
      </div>

      {/* 5 Cards in 1 Line Roll Container */}
      <div ref={scrollRef} className="w-full overflow-x-auto no-scrollbar py-20 z-10 scroll-smooth">
        <div
          className="flex flex-nowrap justify-start lg:justify-center gap-12 px-[25vw] min-w-max"
          style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}
        >
          {error ? (
            <div className="flex flex-col items-center gap-6 py-10 w-full max-w-lg mx-auto bg-red-950/20 border border-red-500/50 p-8">
              <ShieldAlert className="size-16 text-red-500 animate-pulse" />
              <div className="text-center font-mono space-y-4">
                <div className="text-xl font-black text-red-500 uppercase tracking-tighter">
                  CRITICAL_BREACH_ERROR
                </div>
                <div className="text-xs text-red-400/80 leading-relaxed max-w-xs">
                  {getErrorMessage(error)}
                </div>
                <div className="pt-4">
                  <Button
                    onClick={onComplete}
                    variant="destructive"
                    className="h-12 px-8 rounded-none border border-red-500 bg-black text-red-500 hover:bg-red-500 hover:text-black transition-all uppercase italic font-black"
                  >
                    TERMINATE_SESSION
                  </Button>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            // Placeholder Slots during loading
            Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={`placeholder-${i}`}
                variants={itemVariants}
                className="relative flex-shrink-0"
              >
                <div className="group relative h-[30rem] w-72 flex flex-col rounded-none border-2 border-primary/20 bg-black/40 backdrop-blur-sm p-4 overflow-hidden">
                  {/* Scanning Line */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-1/3 w-full animate-scan" />

                  <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-40">
                    <Loader2 className="size-16 animate-spin text-primary/40" />
                    <div className="text-center space-y-2">
                      <div className="text-[10px] font-mono text-primary animate-pulse uppercase tracking-[0.2em]">
                        [ SEARCHING_ARTICLE ]
                      </div>
                      <div className="h-1 w-24 bg-primary/20 overflow-hidden">
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                          className="h-full w-full bg-primary/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            cards.map((card, index) => {
              const cardBurst = activeBursts.find((b) => b.cardId === card.id);
              const isRevealed = revealedIds.has(card.id);
              const isManualRarity =
                card.rarity === Rarity.SR ||
                card.rarity === Rarity.SSR ||
                card.rarity === Rarity.UR ||
                card.rarity === Rarity.LR;

              return (
                <motion.div
                  key={card.id}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                  variants={itemVariants}
                  className="relative flex-shrink-0 cursor-pointer"
                  onClick={() => handleReveal(card, index)}
                >
                  {/* Particle Burst Anchor */}
                  <AnimatePresence>
                    {cardBurst && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {cardBurst.particles.map((p, i) => (
                          <Particle
                            key={`${cardBurst.id}-${i}`}
                            angle={p.angle}
                            distance={p.distance}
                            color={cardBurst.color}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>

                  <Card
                    card={card}
                    isRevealed={isRevealed}
                    data-testid={`card-${index}`}
                    className="shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                  />

                  {!isRevealed && (
                    <div
                      className={cn(
                        'absolute -bottom-4 left-1/2 -translate-x-1/2 text-black text-[8px] font-black px-2 py-0.5 uppercase italic z-20 shadow-[0_0_10px_rgba(0,240,255,0.5)]',
                        isManualRarity
                          ? (card.rarity === Rarity.LR
                              ? 'bg-rarity-lr'
                              : card.rarity === Rarity.UR
                                ? 'bg-rarity-ur'
                                : card.rarity === Rarity.SSR
                                  ? 'bg-rarity-ssr'
                                  : 'bg-rarity-sr') + ' animate-bounce'
                          : 'bg-primary animate-pulse',
                      )}
                    >
                      {isManualRarity ? '[ MANUAL_DECRYPTION_REQUIRED ]' : 'DECRYPTING...'}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-8 h-20 flex items-center justify-center z-10">
        <AnimatePresence>
          {isAllRevealed && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Button
                onClick={onComplete}
                variant="secondary"
                className="h-14 px-16 text-xl font-black rounded-none border-2 border-primary bg-black text-primary hover:bg-primary hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] uppercase italic"
              >
                CONFIRM_ACQUISITION
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress HUD */}
      {!isLoading && !error && (
        <div className="mt-4 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
          [ {revealedIds.size} / {cards.length} DATA_UNITS_DECRYPTED ]
        </div>
      )}
    </motion.div>
  );
};

export default GachaReveal;
