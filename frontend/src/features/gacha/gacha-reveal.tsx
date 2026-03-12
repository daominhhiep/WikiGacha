import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Variants, Variant } from 'framer-motion';
import { cn } from '@/lib/utils';
import Card, { Rarity } from '@/components/card';
import type { CardData } from '@/components/card';
import { Button } from '@/components/ui/button';

// External counter for unique IDs to satisfy strict purity rules
let particleBurstIdCounter = 0;

/**
 * Lightweight particle component for reveal effects.
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
  cards: CardData[];
  /** Callback function triggered when the user finishes viewing the revealed cards. */
  onComplete?: () => void;
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
 * GachaReveal displays a Cyberpunk-themed auto-reveal interface.
 * SR and SSR cards require manual action to reveal.
 */
const GachaReveal: React.FC<GachaRevealProps> = ({ cards: initialCards, onComplete }) => {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [activeBursts, setActiveBursts] = useState<BurstData[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sort cards: Move best card to the end
  const cards = useMemo(() => {
    const sorted = [...initialCards];
    let bestIndex = 0;
    const rarityPower = { [Rarity.N]: 0, [Rarity.R]: 1, [Rarity.SR]: 2, [Rarity.SSR]: 3 };

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

  const isAllRevealed = revealedIds.size === cards.length;

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

      if (card.rarity === Rarity.SSR || card.rarity === Rarity.SR || card.rarity === Rarity.R) {
        const color =
          card.rarity === Rarity.SSR
            ? '#FFD700'
            : card.rarity === Rarity.SR
              ? '#B026FF'
              : '#00F0FF';

        const burstId = `burst-${particleBurstIdCounter++}`;

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

        setTimeout(() => {
          setActiveBursts((prev) => prev.filter((p) => p.id !== burstId));
        }, 1000);
      }
    },
    [revealedIds],
  );

  // Auto-reveal sequence: Only for N and R cards
  useEffect(() => {
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    cards.forEach((card, index) => {
      // ONLY auto-reveal N and R cards. SR and SSR require manual click.
      const isManualRarity = card.rarity === Rarity.SR || card.rarity === Rarity.SSR;
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
  }, [cards, handleReveal]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center bg-black/60 p-8 backdrop-blur-xl border border-border-grid w-full min-h-[60vh] relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_100%)] opacity-5 pointer-events-none" />

      {/* Outer scroll container */}
      <div ref={scrollRef} className="w-full overflow-x-auto no-scrollbar py-20 z-10 scroll-smooth">
        <div
          className="flex flex-nowrap justify-start lg:justify-center gap-12 px-[25vw] min-w-max"
          style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}
        >
          {cards.map((card, index) => {
            const cardBurst = activeBursts.find((b) => b.cardId === card.id);
            const isRevealed = revealedIds.has(card.id);
            const isManualRarity = card.rarity === Rarity.SR || card.rarity === Rarity.SSR;

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
                  data-testid={`card-${index}`}
                  className="shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                />

                {!isRevealed && (
                  <div
                    className={cn(
                      'absolute -bottom-4 left-1/2 -translate-x-1/2 text-black text-[8px] font-black px-2 py-0.5 uppercase italic z-20 shadow-[0_0_10px_rgba(0,240,255,0.5)]',
                      isManualRarity ? 'bg-rarity-ssr animate-bounce' : 'bg-primary animate-pulse',
                    )}
                  >
                    {isManualRarity ? '[ MANUAL_DECRYPTION_REQUIRED ]' : 'DECRYPTING...'}
                  </div>
                )}
              </motion.div>
            );
          })}
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

      <div className="mt-4 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
        [ {revealedIds.size} / {cards.length} DATA_UNITS_DECRYPTED ]
      </div>
    </motion.div>
  );
};

export default GachaReveal;
