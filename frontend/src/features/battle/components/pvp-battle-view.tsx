import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { type BattleResult, type BattleCard, type BattleLogEntry } from '../use-battle';
import { useAuthStore } from '@/features/auth/auth-store';
import { Button } from '@/components/ui/button';
import { ChevronRight, ShieldAlert, Swords, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PvPBattleViewProps {
  matchId: string;
  initialResult: BattleResult;
  onComplete: () => void;
  onResult: (result: BattleResult) => void;
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

/**
 * PvPBattleView handles real-time PvP battles via WebSockets.
 */
const PvPBattleView: React.FC<PvPBattleViewProps> = ({ 
  matchId, 
  initialResult, 
  onComplete,
  onResult 
}) => {
  const { accessToken } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentEntry, setCurrentEntry] = useState<BattleLogEntry | null>(null);
  const [cardHps, setCardHps] = useState<Record<string, number>>(() => {
    const initialHps: Record<string, number> = {};
    const pts = initialResult?.participants;
    if (pts) {
      pts.p1?.cards?.forEach((c) => (initialHps[c.instanceId] = c.hp));
      pts.p2?.cards?.forEach((c) => (initialHps[c.instanceId] = c.hp));
    }
    return initialHps;
  });
  const [visibleLogs, setVisibleLogs] = useState<BattleLogEntry[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;

    // If match is already finished, don't connect, just notify parent
    if ((initialResult as any).status === 'COMPLETED') {
      onResult(initialResult);
      setIsFinished(true);
      return;
    }

    const realMatchId = matchId || (initialResult as any).id;
    if (!realMatchId) return;

    const socketUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
    const newSocket = io(`${socketUrl}/pvp`, {
      auth: { token: accessToken },
      transports: ['polling', 'websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[PvP Battle] Connected to battle room', realMatchId);
      newSocket.emit('join_match', { matchId: realMatchId });
    });

    newSocket.on('battle_step', (entry: BattleLogEntry) => {
      console.log('[PvP Battle] Step received:', entry);
      setCurrentEntry(entry);
      setCardHps((prev) => ({
        ...prev,
        [entry.defenderId]: entry.hpRemaining,
      }));
      setVisibleLogs((prev) => [...prev, entry]);
    });

    newSocket.on('battle_finished', (finalResult: BattleResult) => {
      console.log('[PvP Battle] Finished!', finalResult);
      onResult(finalResult);
      setIsFinished(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, matchId, initialResult, onResult]);

  // Scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleLogs]);

  // Screen Shake logic based on damage
  const getShakeAnimation = () => {
    if (!currentEntry) return {};
    if (currentEntry.damage >= 50) {
      return {
        x: [0, -20, 20, -20, 20, -10, 10, 0],
        y: [0, 10, -10, 10, -10, 5, -5, 0],
        transition: { duration: 0.4 },
      };
    }
    return {
      x: [0, -4, 4, -4, 4, 0],
      transition: { duration: 0.2 },
    };
  };

  const p1 = initialResult?.participants?.p1;
  const p2 = initialResult?.participants?.p2;

  if (!p1 || !p2) {
    return (
      <div className="flex h-full items-center justify-center bg-black font-mono text-primary animate-pulse">
        [ INITIALIZING_COMBAT_CORE... ]
      </div>
    );
  }

  return (
    <motion.div
      animate={currentEntry ? getShakeAnimation() : {}}
      className="relative w-full h-[calc(100vh-180px)] min-h-[600px] bg-black border-2 border-primary/10 overflow-hidden flex flex-col md:flex-row"
    >
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
      
      {/* Main Arena */}
      <div className="flex-1 relative flex flex-col items-center justify-between p-4 py-8">
        
        {/* Opponent Info & Cards */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-2 skew-x-[-12deg]">
            {p2.avatarUrl ? (
              <img src={p2.avatarUrl} alt={p2.username} className="size-8 rounded-full border border-red-500/40 skew-x-[12deg]" />
            ) : (
              <div className="size-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40 skew-x-[12deg]">
                <User className="size-4 text-red-500" />
              </div>
            )}
            <span className="font-black text-red-500 uppercase tracking-widest skew-x-[12deg]">
              {p2.username || 'OPPONENT'}
            </span>
          </div>

          <div className="flex flex-row justify-center gap-2 sm:gap-6 w-full overflow-visible">
            {p2.cards?.map((card) => (
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
        </div>

        {/* Combat Stats Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-50 pointer-events-none w-full">
          <AnimatePresence mode='wait'>
            {currentEntry && (
              <motion.div
                key={currentEntry.turn}
                initial={{ opacity: 0, scale: 0.5, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.5, y: -40 }}
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

            {!currentEntry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-primary font-mono text-xs uppercase animate-pulse"
              >
                [ WAITING_FOR_COMBAT_SEQUENCE... ]
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Info & Cards */}
        <div className="flex flex-col-reverse items-center gap-4 w-full">
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2 skew-x-[-12deg]">
            {p1.avatarUrl ? (
              <img src={p1.avatarUrl} alt={p1.username} className="size-8 rounded-full border border-primary/40 skew-x-[12deg]" />
            ) : (
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 skew-x-[12deg]">
                <User className="size-4 text-primary" />
              </div>
            )}
            <span className="font-black text-primary uppercase tracking-widest skew-x-[12deg]">
              {p1.username || 'PLAYER'}
            </span>
          </div>

          <div className="flex flex-row justify-center gap-2 sm:gap-6 w-full overflow-visible">
            {p1.cards?.map((card) => (
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
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 right-4">
          {isFinished && (
            <Button
              onClick={onComplete}
              className="rounded-none bg-primary text-black font-black uppercase text-sm h-10 px-8 animate-bounce shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              VIEW_RESULTS <ChevronRight className="size-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Combat Log Sidebar */}
      <div className="w-full md:w-72 bg-black/80 border-l border-primary/10 flex flex-col font-mono">
        <div className="p-4 border-b border-primary/10 bg-primary/5">
          <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
            <Heart className="size-3 text-red-500" /> REALTIME_LOG
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[9px] scrollbar-hide">
          {visibleLogs.map((entry, idx) => (
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
          ))}
          <div ref={logEndRef} />
        </div>
        
        {/* Connection Status */}
        <div className="p-4 bg-primary/5 border-t border-primary/10">
          <div className="flex items-center gap-2">
            <div className={cn("size-2 rounded-full animate-pulse", socket?.connected ? "bg-green-500" : "bg-red-500")} />
            <span className="text-[8px] uppercase tracking-widest text-primary/60">
              {socket?.connected ? "ENCRYPTED_LINK_ACTIVE" : "ESTABLISHING_SIGNAL..."}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PvPBattleView;
