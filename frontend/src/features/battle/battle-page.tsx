import React, { useState } from 'react';
import DeckSelector from './DeckSelector';
import BattleArena from './BattleArena';
import { useBattle, type BattleResult } from './use-battle';
import { Button } from '@/components/ui/button';
import { Swords, History, Trophy, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type BattlePhase = 'DECK_SELECTION' | 'IN_BATTLE' | 'RESULTS' | 'HISTORY';

/**
 * BattlePage component manages the overall battle flow.
 * Switches between deck selection, the battle arena, and battle history.
 */
const BattlePage: React.FC = () => {
  const [phase, setPhase] = useState<BattlePhase>('DECK_SELECTION');
  const { startBattle, isStartingBattle, battleHistory, isLoadingHistory } = useBattle();
  const [lastResult, setLastResult] = useState<BattleResult | null>(null);

  const handleStartBattle = async (deckIds: string[]) => {
    try {
      const result = await startBattle(deckIds);
      setLastResult(result);
      setPhase('IN_BATTLE');
    } catch (error) {
      console.error('Failed to start battle:', error);
    }
  };

  const handleBattleComplete = () => {
    setPhase('RESULTS');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sub-Navigation (Hidden during active battle) */}
      {phase !== 'IN_BATTLE' && phase !== 'RESULTS' && (
        <div className="flex items-center justify-center gap-4 mb-4 border-b border-primary/10 pb-4 flex-shrink-0">
          <button
            onClick={() => setPhase('DECK_SELECTION')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-widest transition-all',
              phase === 'DECK_SELECTION'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-primary/60',
            )}
          >
            <Swords className="size-4" /> COMBAT_ZONE
          </button>
          <button
            onClick={() => setPhase('HISTORY')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-widest transition-all',
              phase === 'HISTORY'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-primary/60',
            )}
          >
            <History className="size-4" /> BATTLE_LOGS
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {phase === 'DECK_SELECTION' && (
          <div className="h-full overflow-y-auto custom-scrollbar pb-10">
            <DeckSelector onStartBattle={handleStartBattle} isStarting={isStartingBattle} />
          </div>
        )}

        {phase === 'IN_BATTLE' && lastResult && (
          <div className="h-full w-full">
            <BattleArena result={lastResult} onComplete={handleBattleComplete} />
          </div>
        )}

        {phase === 'RESULTS' && lastResult && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="flex flex-col items-center justify-center py-10 gap-8 animate-in zoom-in duration-500">
              <div className="relative">
                <div className="absolute -inset-10 bg-primary/20 blur-3xl animate-pulse rounded-full" />
                <Trophy
                  className={cn(
                    'size-32 relative',
                    lastResult.winnerId === lastResult.participants.p1.id
                      ? 'text-primary'
                      : 'text-red-500',
                  )}
                />
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-6xl font-black uppercase italic tracking-tighter">
                  {lastResult.winnerId === lastResult.participants.p1.id
                    ? 'VICTORY_ACHIEVED'
                    : 'CONNECTION_SEVERED'}
                </h2>
                <p className="font-mono text-sm text-primary/60 tracking-[0.4em]">
                  [ SIMULATION_TERMINATED_SUCCESSFULLY ]
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 w-full max-w-lg mt-8">
                <div className="bg-primary/10 border border-primary/20 p-6 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono text-primary/60 uppercase">
                    CREDITS_RECOVERY
                  </span>
                  <span className="text-3xl font-black text-primary">
                    +{lastResult.rewards.credits}
                  </span>
                </div>
                <div className="bg-primary/10 border border-primary/20 p-6 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono text-primary/60 uppercase">
                    XP_DATA_GATHERED
                  </span>
                  <span className="text-3xl font-black text-primary">+{lastResult.rewards.xp}</span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => setPhase('DECK_SELECTION')}
                className="rounded-none mt-8 h-12 px-12 font-black uppercase tracking-widest"
              >
                <ArrowLeft className="size-4 mr-2" /> RETURN_TO_TACTICAL_MAP
              </Button>
            </div>
          </div>
        )}

        {phase === 'HISTORY' && (
          <div className="h-full overflow-y-auto custom-scrollbar pb-10">
            <div className="max-w-4xl mx-auto space-y-6 px-4">
              <h3 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3 mb-8">
                <History className="size-6 text-primary" /> PAST_ENGAGEMENTS
              </h3>

              {isLoadingHistory ? (
                <div className="grid gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-black/40 border border-primary/10 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <Skeleton className="size-12 skew-x-[-12deg]" />
                        <div className="space-y-2">
                          <Skeleton className="h-2 w-24" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-2 w-20" />
                        <Skeleton className="h-2 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : battleHistory.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-primary/10 opacity-40 font-mono">
                  [ NO_BATTLE_DATA_FOUND_IN_LOGS ]
                </div>
              ) : (
                <div className="grid gap-4">
                  {battleHistory.map((battle) => (
                    <div
                      key={battle.id}
                      className="bg-black/40 border border-primary/10 p-4 flex items-center justify-between group hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={cn(
                            'size-12 flex items-center justify-center font-black text-xl italic skew-x-[-12deg]',
                            battle.winnerId === battle.player1Id
                              ? 'bg-primary text-black'
                              : 'bg-red-500/20 text-red-500',
                          )}
                        >
                          {battle.winnerId === battle.player1Id ? 'W' : 'L'}
                        </div>
                        <div>
                          <p className="text-[10px] font-mono text-primary/40 tracking-tighter uppercase mb-1">
                            {new Date(battle.createdAt).toLocaleString()}
                          </p>
                          <p className="text-sm font-black uppercase tracking-widest">
                            {battle.player1.username} <span className="text-primary/40 mx-2">VS</span>{' '}
                            {battle.player2?.username || 'AI_BOT'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-primary/60">
                          STATUS: {battle.status}
                        </p>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-primary/60 font-black">
                          ID: {battle.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattlePage;
