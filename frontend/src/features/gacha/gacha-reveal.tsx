import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants, Variant } from 'framer-motion';
import { cn } from '@/lib/utils';
import Card, { Rarity } from '@/components/card';
import type { CardData } from '@/components/card';
import { Button } from '@/components/ui/button';
import { Cpu, ShieldAlert, Loader2 } from 'lucide-react';
import axios from 'axios';

// External counter for unique IDs
let particleBurstIdCounter = 0;

const Particle = ({ color, angle, distance }: { color: string; angle: number; distance: number }) => {
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

interface GachaRevealProps {
  cards: CardData[] | null;
  onComplete?: () => void;
  isLoading?: boolean;
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
      staggerChildren: 0.1,
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

const GachaReveal: React.FC<GachaRevealProps> = ({
  cards: initialCards,
  onComplete,
  isLoading,
  error,
}) => {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [activeBursts, setActiveBursts] = useState<BurstData[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getErrorMessage = (error: Error | null) => {
    if (!error) return null;
    if (axios.isAxiosError(error)) {
      return (error.response?.data as any)?.error?.message || error.message || 'DATA_BREACH_FAILED';
    }
    return error.message;
  };

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
    (card: CardData, _index: number) => {
      if (revealedIds.has(card.id)) return;

      setRevealedIds((prev) => new Set(prev).add(card.id));

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

        const newBurst: BurstData = {
          id: burstId,
          cardId: card.id,
          color,
          particles: Array.from({ length: 12 }).map((_, i) => ({
            angle: (i / 12) * Math.PI * 2,
            distance: 80 + Math.random() * 80,
          })),
        };

        setActiveBursts((prev) => [...prev, newBurst]);
        setTimeout(() => {
          setActiveBursts((prev) => prev.filter((p) => p.id !== burstId));
        }, 1000);
      }
    },
    [revealedIds],
  );

  useEffect(() => {
    if (isLoading || cards.length === 0) return;

    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    cards.forEach((card, index) => {
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
      className="h-full w-full flex flex-col items-center justify-between bg-black/40 p-4 backdrop-blur-md border border-border-grid relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_100%)] opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-1 z-20 flex-shrink-0">
        <div className="flex items-center justify-center gap-3 text-primary animate-pulse">
          <Cpu className="size-6" />
          <h2 className="text-2xl font-black tracking-widest uppercase font-mono italic leading-none">
            {error ? 'BREACH_ABORTED' : isLoading ? 'EXTRACTING...' : 'DATA_EXTRACTED'}
          </h2>
          <Cpu className="size-6" />
        </div>
        <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-[0.2em] opacity-60">
          [ {revealedIds.size} / {cards.length} UNITS_DECRYPTED ]
        </p>
      </div>

      {/* Main Grid area - Fit to one line */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        <div
          className="flex flex-row justify-center gap-2 sm:gap-4 md:gap-6 w-full"
          style={{ perspective: '1500px' }}
        >
          {error ? (
            <div className="flex flex-col items-center gap-4 bg-red-950/20 border border-red-500/50 p-6 max-w-md">
              <ShieldAlert className="size-12 text-red-500 animate-pulse" />
              <div className="text-center font-mono">
                <div className="text-sm font-black text-red-500 uppercase">CRITICAL_ERROR</div>
                <div className="text-[9px] text-red-400/80 mt-2">{getErrorMessage(error)}</div>
                <Button
                  onClick={onComplete}
                  variant="destructive"
                  className="mt-4 h-10 px-6 rounded-none border border-red-500 bg-black text-red-500 text-xs font-black"
                >
                  TERMINATE
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <motion.div key={`placeholder-${i}`} variants={itemVariants} className="flex-shrink-0">
                <div className="h-[22rem] w-48 border-2 border-primary/10 bg-black/40 p-3 flex flex-col items-center justify-center gap-4 opacity-30 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1/3 w-full animate-scan" />
                  <Loader2 className="size-10 animate-spin text-primary/40" />
                  <div className="text-[8px] font-mono text-primary uppercase tracking-widest animate-pulse">
                    [ FETCHING ]
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
                    size="sm"
                    className="shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden"
                  />

                  {!isRevealed && (
                    <div
                      className={cn(
                        'absolute -bottom-2 left-1/2 -translate-x-1/2 text-black text-[7px] font-black px-1.5 py-0.5 uppercase italic z-20 whitespace-nowrap',
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
                      {isManualRarity ? 'MANUAL_DECRYPT' : 'DECRYPTING'}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer / Complete Button */}
      <div className="h-16 flex items-center justify-center z-10 flex-shrink-0">
        <AnimatePresence>
          {isAllRevealed && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Button
                onClick={onComplete}
                variant="secondary"
                className="h-10 px-12 text-sm font-black rounded-none border-2 border-primary bg-black text-primary hover:bg-primary hover:text-black transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] uppercase italic"
              >
                CONFIRM_ACQUISITION
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default GachaReveal;
