import React, { useState } from 'react';
import DeckSelector from './DeckSelector';
import { useBattle, type BattleResult } from './use-battle';
import { Button } from '@/components/ui/button';
import { Swords, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      // Error handling would go here (e.g., toast notification)
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Sub-Navigation */}
      <div className="flex items-center justify-center gap-4 mb-8 border-b border-primary/10 pb-4">
        <button
          onClick={() => setPhase('DECK_SELECTION')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-widest transition-all',
            phase === 'DECK_SELECTION' || phase === 'IN_BATTLE' || phase === 'RESULTS'
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

      <div className="container mx-auto">
        {phase === 'DECK_SELECTION' && (
          <DeckSelector onStartBattle={handleStartBattle} isStarting={isStartingBattle} />
        )}

        {phase === 'IN_BATTLE' && (
          <div className="flex flex-col items-center justify-center py-20 gap-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-xl animate-pulse rounded-full" />
              <Swords className="size-24 text-primary relative animate-bounce" />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                SIMULATION_ACTIVE
              </h2>
              <p className="font-mono text-sm text-primary/60 animate-pulse tracking-[0.3em]">
                [ DATA_CLASH_IN_PROGRESS... ]
              </p>
              <div className="mt-8 p-4 border border-primary/20 bg-black/40 font-mono text-[10px] text-left max-w-md mx-auto">
                <p className="text-primary/40 mb-2">// BATTLE_ID: {lastResult?.battleId}</p>
                <p className="text-green-500">
                  [ SUCCESS ] Simulation generated {lastResult?.log.length} interaction cycles.
                </p>
                <p className="text-primary/60 mt-4">
                  Note: Battle Visualizer (T034) is currently under development. Showing raw data
                  logs for now.
                </p>
              </div>
              <Button onClick={() => setPhase('DECK_SELECTION')} className="rounded-none mt-8">
                RETURN_TO_BASE
              </Button>
            </div>
          </div>
        )}

        {phase === 'HISTORY' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h3 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3 mb-8">
              <History className="size-6 text-primary" /> PAST_ENGAGEMENTS
            </h3>

            {isLoadingHistory ? (
              <div className="flex justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary/40" />
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
        )}
      </div>
    </div>
  );
};

export default BattlePage;
