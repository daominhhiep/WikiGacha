import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type BattleResult, type BattleCard } from './use-battle';
import { Button } from '@/components/ui/button';
import { Play, Pause, FastForward, ChevronRight, ShieldAlert, Swords, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BattleArenaProps {
  result: BattleResult;
  onComplete: () => void;
}

/**
 * Compact version of the card for the arena.
 */
const ArenaCard: React.FC<{
  card: BattleCard;
  currentHp: number;
  isAttacking?: boolean;
  isDefending?: boolean;
  side: 'p1' | 'p2';
}> = ({ card, currentHp, isAttacking, isDefending, side }) => {
  const hpPercentage = (currentHp / card.maxHp) * 100;

  return (
    <motion.div
      layout
      animate={
        isAttacking
          ? { y: side === 'p1' ? -80 : 80, scale: 1.3, zIndex: 50 }
          : isDefending
            ? { x: [0, -10, 10, -10, 10, 0], scale: 0.95 }
            : { y: 0, scale: 1, zIndex: 10 }
      }
      className={cn(
        'relative w-28 sm:w-36 aspect-[3/4] border-2 bg-black/60 overflow-hidden transition-colors duration-300',
        currentHp <= 0 ? 'border-red-900 grayscale opacity-40' : 'border-primary/20',
        isAttacking && 'border-primary shadow-[0_0_30px_rgba(0,240,255,0.6)]',
        isDefending && 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]',
      )}
    >
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.title}
          className="w-full h-full object-cover opacity-60"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/5">
          <Swords className="size-10 text-primary/20" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

      {/* Title & Stats */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-[10px] font-black uppercase truncate text-white leading-none mb-1">
          {card.title}
        </p>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[6px] font-mono text-primary/80 uppercase">{card.rarity}</span>
          <span className="text-[10px] font-mono font-bold text-white">
            {currentHp}/{card.maxHp}
          </span>
        </div>

        {/* ATK & DEF mini bar */}
        <div className="flex items-center justify-between font-mono text-[8px] bg-black/40 px-1 py-0.5 border border-white/10">
          <div className="flex items-center gap-1">
            <span className="text-orange-500 font-black">A</span>
            <span className="text-white/80">{card.atk}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-blue-500 font-black">D</span>
            <span className="text-white/80">{card.def}</span>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/40">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${hpPercentage}%` }}
          className={cn(
            'h-full transition-all duration-500',
            hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500',
          )}
        />
      </div>

      {/* Defeated Overlay */}
      {currentHp <= 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/40">
          <ShieldAlert className="size-10 text-red-500" />
        </div>
      )}
    </motion.div>
  );
};

const BattleArena: React.FC<BattleArenaProps> = ({ result, onComplete }) => {
  const [turnIndex, setTurnIndex] = useState(-1);
  const [isPlaying, setIsPaused] = useState(false); // Start paused then play
  const [speed, setSpeed] = useState(1000); // ms per turn
  const [cardHps, setCardHps] = useState<Record<string, number>>(() => {
    const initialHps: Record<string, number> = {};
    result.participants.p1.cards.forEach((c) => (initialHps[c.instanceId] = c.hp));
    result.participants.p2.cards.forEach((c) => (initialHps[c.instanceId] = c.hp));
    return initialHps;
  });
  const [visibleLogs, setVisibleLogs] = useState<number[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto start after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setIsPaused(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Game Loop
  useEffect(() => {
    if (!isPlaying || turnIndex >= result.log.length - 1) return;

    const timer = setTimeout(() => {
      const nextIndex = turnIndex + 1;
      const entry = result.log[nextIndex];

      // Update HP and Turn together to ensure sync
      setCardHps((prev) => ({
        ...prev,
        [entry.defenderId]: entry.hpRemaining,
      }));

      setVisibleLogs((prev) => [...prev, nextIndex]);
      setTurnIndex(nextIndex);
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, turnIndex, result.log, speed]);

  // Scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleLogs]);

  const currentEntry = turnIndex >= 0 ? result.log[turnIndex] : null;
  const isFinished = turnIndex >= result.log.length - 1;

  const handleSkip = () => {
    // Immediate finish
    const finalHps: Record<string, number> = {};
    result.participants.p1.cards.forEach((c) => (finalHps[c.instanceId] = 0)); // Temporary then override
    result.participants.p2.cards.forEach((c) => (finalHps[c.instanceId] = 0));

    // Last entry for each defender gives their final HP
    result.log.forEach((entry) => {
      finalHps[entry.defenderId] = entry.hpRemaining;
    });

    // For cards never attacked, use initial HP
    result.participants.p1.cards.forEach((c) => {
      if (finalHps[c.instanceId] === undefined) finalHps[c.instanceId] = c.hp;
    });
    result.participants.p2.cards.forEach((c) => {
      if (finalHps[c.instanceId] === undefined) finalHps[c.instanceId] = c.hp;
    });

    setCardHps(finalHps);
    setVisibleLogs(result.log.map((_, i) => i));
    setTurnIndex(result.log.length - 1);
    setIsPaused(false);
  };

  return (
    <div className="relative w-full h-[calc(100vh-180px)] min-h-[600px] bg-black border-2 border-primary/10 overflow-hidden flex flex-col md:flex-row">
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.2)_0%,transparent_70%)]" />

      {/* Main Arena */}
      <div className="flex-1 relative flex flex-col items-center justify-between p-4 py-12">
        {/* Opponent Side */}
        <div className="flex flex-row justify-center gap-2 sm:gap-6 w-full overflow-visible">
          {result.participants.p2.cards.map((card) => (
            <ArenaCard
              key={card.instanceId}
              card={card}
              currentHp={cardHps[card.instanceId] ?? card.hp}
              side="p2"
              isAttacking={currentEntry?.attackerId === card.instanceId}
              isDefending={currentEntry?.defenderId === card.instanceId}
            />
          ))}
        </div>

        {/* Combat Stats Center - Absolutely Centered */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-50 pointer-events-none w-full">
          <AnimatePresence>
            {currentEntry && (
              <motion.div
                key={turnIndex}
                initial={{ opacity: 0, scale: 0.5, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.5, y: -40 }}
                transition={{ duration: Math.min(0.3, speed / 1000) }}
                className="flex flex-col items-center"
              >
                <div className="bg-red-500 text-white font-black px-12 py-3 skew-x-[-12deg] text-5xl shadow-[0_0_50px_rgba(220,38,38,0.8)] border-y-4 border-white/20">
                  -{currentEntry.damage} DMG
                </div>
                <div className="text-[16px] font-mono text-primary mt-6 uppercase tracking-[0.5em] font-black whitespace-nowrap bg-black/80 px-4 py-1 border border-primary/30 backdrop-blur-sm">
                  [ {currentEntry.attackerName} ] ⚔️ [ {currentEntry.defenderName} ]
                </div>
              </motion.div>
            )}

            {!currentEntry && turnIndex === -1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-primary font-mono text-xs uppercase animate-pulse"
              >
                [ INITIALIZING_COMBAT_SEQUENCE... ]
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Side */}
        <div className="flex flex-row justify-center gap-2 sm:gap-6 w-full overflow-visible">
          {result.participants.p1.cards.map((card) => (
            <ArenaCard
              key={card.instanceId}
              card={card}
              currentHp={cardHps[card.instanceId] ?? card.hp}
              side="p1"
              isAttacking={currentEntry?.attackerId === card.instanceId}
              isDefending={currentEntry?.defenderId === card.instanceId}
            />
          ))}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-none border-primary/20 h-10 w-10"
              onClick={() => setIsPaused(!isPlaying)}
              disabled={isFinished}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'rounded-none border-primary/20 h-10 w-10',
                speed < 500 && 'bg-primary/20',
              )}
              onClick={() => setSpeed((prev) => (prev === 1000 ? 300 : 1000))}
            >
              <FastForward className="size-4" />
            </Button>
          </div>

          {isFinished ? (
            <Button
              onClick={onComplete}
              className="rounded-none bg-primary text-black font-black uppercase text-sm h-10 px-8"
            >
              VIEW_RESULTS <ChevronRight className="size-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="rounded-none text-[10px] font-mono text-primary/40 hover:text-primary h-10"
              onClick={handleSkip}
            >
              [ SKIP_SIMULATION ]
            </Button>
          )}
        </div>
      </div>

      {/* Combat Log Sidebar */}
      <div className="w-full md:w-72 bg-black/80 border-l border-primary/10 flex flex-col font-mono">
        <div className="p-4 border-b border-primary/10 bg-primary/5">
          <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Heart className="size-3 text-red-500" /> COMBAT_LOG
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[9px] scrollbar-hide">
          {visibleLogs.map((idx) => {
            const entry = result.log[idx];
            return (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={idx}
                className="border-l-2 border-primary/20 pl-2 py-1"
              >
                <p className="text-primary/40 mb-1">
                  TURN_{entry.turn.toString().padStart(3, '0')}
                </p>
                <p>
                  <span className="text-white font-bold">{entry.attackerName}</span>
                  <span className="text-primary/60 mx-1">DEALT</span>
                  <span className="text-red-500 font-black">{entry.damage} DMG</span>
                  <span className="text-primary/60 mx-1">TO</span>
                  <span className="text-white font-bold">{entry.defenderName}</span>
                </p>
                {entry.isDefeated && (
                  <p className="text-red-500 font-black mt-1 uppercase">[ UNIT_DEFEATED ]</p>
                )}
              </motion.div>
            );
          })}
          <div ref={logEndRef} />
        </div>

        {/* Turn Progress */}
        <div className="p-4 bg-primary/5 border-t border-primary/10">
          <div className="flex justify-between text-[10px] mb-2">
            <span className="text-primary/60 uppercase">SIM_PROGRESS</span>
            <span className="text-primary font-black">
              {Math.round(((turnIndex + 1) / result.log.length) * 100)}%
            </span>
          </div>
          <div className="h-1 bg-black/40 w-full overflow-hidden">
            <motion.div
              animate={{ width: `${((turnIndex + 1) / result.log.length) * 100}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleArena;
