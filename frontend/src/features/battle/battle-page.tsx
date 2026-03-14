import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DeckSelector from './DeckSelector';
import BattleArena from './BattleArena';
import PvPBattleView from './components/pvp-battle-view';
import { useBattle, type BattleResult } from './use-battle';
import { Button } from '@/components/ui/button';
import { Swords, History, Trophy, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import MatchmakingOverlay from '../pvp/components/matchmaking-overlay';

type BattlePhase = 'DECK_SELECTION' | 'IN_BATTLE' | 'RESULTS' | 'HISTORY';

/**
 * BattlePage component manages the overall battle flow.
 * Switches between deck selection, the battle arena, and battle history.
 */
const BattlePage: React.FC = () => {
  const { id: urlMatchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<BattlePhase>('DECK_SELECTION');
  const { startBattle, isStartingBattle, battleHistory, isLoadingHistory, getMatch } = useBattle();
  const [lastResult, setLastResult] = useState<BattleResult | null>(null);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [pendingDeckIds, setPendingDeckIds] = useState<string[]>([]);
  const [isPvP, setIsPvP] = useState(false);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);

  const handleStartBattle = async (deckIds: string[]) => {
    try {
      const result = await startBattle(deckIds);
      setLastResult(result);
      setIsPvP(false);
      setPhase('IN_BATTLE');
    } catch (error) {
      console.error('Failed to start battle:', error);
    }
  };

  // Reconnection & History logic
  useEffect(() => {
    if (urlMatchId && !lastResult) {
      const fetchMatch = async () => {
        setIsLoadingMatch(true);
        try {
          const result = await getMatch(urlMatchId);
          setLastResult(result);
          
          // Detect if it is PvP (not AI)
          const isActuallyPvP = result.participants.p2.id !== 'AI_BOT' || (result as any).type === 'PVP';
          setIsPvP(isActuallyPvP);
          
          // If match is already finished, show results phase
          if (result.status === 'COMPLETED') {
            setPhase('RESULTS');
          } else {
            setPhase('IN_BATTLE');
          }
        } catch (error) {
          console.error('[BattlePage] Failed to load match from URL:', error);
          navigate('/battle'); 
        } finally {
          setIsLoadingMatch(false);
        }
      };
      fetchMatch();
    }
  }, [urlMatchId, lastResult, getMatch, navigate]);

  const handleJoinQueue = (deckIds: string[]) => {
    setPendingDeckIds(deckIds);
    setIsSearchingMatch(true);
  };

  const handleMatchFound = (result: BattleResult) => {
    setIsSearchingMatch(false);
    setLastResult(result);
    setIsPvP(true);
    setPhase('IN_BATTLE');
    
    // Update URL
    const matchId = result.battleId || result.id;
    if (matchId) {
      navigate(`/battle/${matchId}`, { replace: true });
    }
  };

  const handleBattleComplete = () => {
    setPhase('RESULTS');
  };

  if (isLoadingMatch) {
    return (
      <div className="flex h-full items-center justify-center bg-black font-mono text-primary animate-pulse">
        [ SYNCHRONIZING_BATTLE_DATA... ]
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sub-Navigation (Hidden during active battle) */}
      {phase !== 'IN_BATTLE' && phase !== 'RESULTS' && (
        <div className="flex items-center justify-center gap-4 mb-4 border-b border-primary/10 pb-4 flex-shrink-0">
          <button
            onClick={() => {
              setPhase('DECK_SELECTION');
              navigate('/battle');
            }}
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
            onClick={() => {
              setPhase('HISTORY');
              navigate('/battle');
            }}
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
            <DeckSelector
              onStartBattle={handleStartBattle}
              onJoinQueue={handleJoinQueue}
              isStarting={isStartingBattle}
            />
          </div>
        )}

        {isSearchingMatch && (
          <MatchmakingOverlay
            deckIds={pendingDeckIds}
            onCancel={() => setIsSearchingMatch(false)}
            onMatchFound={handleMatchFound}
          />
        )}

        {phase === 'IN_BATTLE' && lastResult && (
          <div className="h-full w-full">
            {isPvP ? (
              <PvPBattleView
                matchId={lastResult.battleId || lastResult.id || ''}
                initialResult={lastResult}
                onComplete={handleBattleComplete}
                onResult={setLastResult}
              />
            ) : (
              <BattleArena result={lastResult} onComplete={handleBattleComplete} />
            )}
          </div>
        )}

        {phase === 'RESULTS' && lastResult && (
          <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-6xl mx-auto flex flex-col items-center gap-12 py-10">
              
              {/* Outcome Header */}
              <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
                <div className="relative inline-block">
                  <div className="absolute -inset-10 bg-primary/20 blur-3xl animate-pulse rounded-full" />
                  <Trophy
                    className={cn(
                      'size-32 relative mx-auto',
                      lastResult.winnerId === lastResult.participants.p1.id
                        ? 'text-primary'
                        : 'text-red-500',
                    )}
                  />
                </div>
                <h2 className="text-6xl font-black uppercase italic tracking-tighter">
                  {lastResult.winnerId === lastResult.participants.p1.id
                    ? 'VICTORY_ACHIEVED'
                    : 'CONNECTION_SEVERED'}
                </h2>
                <p className="font-mono text-xs text-primary/60 tracking-[0.5em] uppercase">
                  [ SIMULATION_ID: {lastResult.id || lastResult.battleId} ]
                </p>
              </div>

              {/* Rewards Summary */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                <div className="bg-primary/5 border border-primary/20 p-6 flex flex-col items-center gap-2 relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">
                    CREDITS_RECOVERED
                  </span>
                  <span className="text-4xl font-black text-primary italic">
                    +{lastResult.rewards.credits}
                  </span>
                </div>
                <div className="bg-primary/5 border border-primary/20 p-6 flex flex-col items-center gap-2 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">
                    XP_DATA_STREAMS
                  </span>
                  <span className="text-4xl font-black text-primary italic">+{lastResult.rewards.xp}</span>
                </div>
              </div>

              {/* Deployment Overview (Decks) */}
              <div className="w-full space-y-8 mt-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-primary/10" />
                  <h3 className="font-black font-mono text-xs uppercase tracking-[0.4em] text-primary/60">
                    BATTLE_UNIT_STATUS
                  </h3>
                  <div className="h-px flex-1 bg-primary/10" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* P1 Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-black uppercase text-sm text-primary">
                      <div className="size-2 bg-primary animate-pulse" />
                      {lastResult.participants.p1.username || 'PLAYER'}
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                      {lastResult.participants.p1.cards.map((card) => (
                        <div key={card.instanceId} className="relative group">
                          <div className="w-24 aspect-[3/4] border border-primary/20 bg-black/40 p-1 flex flex-col overflow-hidden">
                            <div className="flex-1 min-h-0 relative">
                              {card.imageUrl ? (
                                <img src={card.imageUrl} className="absolute inset-0 w-full h-full object-cover grayscale opacity-50" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                                  <Swords className="size-8 text-primary/20" />
                                </div>
                              )}
                            </div>
                            <div className="p-1 shrink-0">
                              <div className="text-[10px] font-black uppercase truncate mb-1">{card.title}</div>
                              <div className="flex justify-between font-mono text-[8px] opacity-60">
                                <span>A:{card.atk}</span>
                                <span>D:{card.def}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* P2 Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-black uppercase text-sm text-red-500 lg:justify-end">
                      {lastResult.participants.p2.username || 'OPPONENT'}
                      <div className="size-2 bg-red-500 animate-pulse" />
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center lg:justify-end">
                      {lastResult.participants.p2.cards.map((card) => (
                        <div key={card.instanceId} className="relative group">
                          <div className="w-24 aspect-[3/4] border border-red-500/20 bg-black/40 p-1 flex flex-col overflow-hidden">
                            <div className="flex-1 min-h-0 relative">
                              {card.imageUrl ? (
                                <img src={card.imageUrl} className="absolute inset-0 w-full h-full object-cover grayscale opacity-50" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-500/5">
                                  <Swords className="size-8 text-red-500/20" />
                                </div>
                              )}
                            </div>
                            <div className="p-1 shrink-0">
                              <div className="text-[10px] font-black uppercase truncate mb-1">{card.title}</div>
                              <div className="flex justify-between font-mono text-[8px] opacity-60">
                                <span>A:{card.atk}</span>
                                <span>D:{card.def}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Combat Logs Transcript */}
              <div className="w-full space-y-4 mt-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-primary/10" />
                  <h3 className="font-black font-mono text-xs uppercase tracking-[0.4em] text-primary/60">
                    SIMULATION_LOG_TRANSCRIPT
                  </h3>
                  <div className="h-px flex-1 bg-primary/10" />
                </div>

                <div className="bg-black/80 border border-primary/10 font-mono text-[11px] p-6 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {lastResult.log.map((entry, idx) => (
                    <div key={idx} className="flex gap-4 border-b border-white/5 pb-2 transition-colors hover:bg-white/5 group">
                      <span className="text-primary opacity-40 shrink-0">[{entry.turn.toString().padStart(3, '0')}]</span>
                      <span className="flex-1">
                        <span className="text-primary font-bold">{entry.attackerName}</span>
                        <span className="opacity-60 mx-2">STRIKES</span>
                        <span className="text-red-400 font-bold">{entry.defenderName}</span>
                        <span className="opacity-60 mx-2">FOR</span>
                        <span className="text-yellow-500 font-black">{entry.damage} DAMAGE</span>
                        <span className="opacity-40 italic ml-2">({entry.hpRemaining} HP LEFT)</span>
                        {entry.isDefeated && <span className="ml-2 text-red-600 font-black">[OBLITERATED]</span>}
                      </span>
                    </div>
                  ))}
                  {lastResult.log.length === 0 && (
                    <div className="text-center opacity-40 py-8 italic tracking-widest uppercase">
                      [ NO_DETAILED_LOG_FOR_RECOVERY ]
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-md">
                <Button
                  size="lg"
                  onClick={() => {
                    setPhase('DECK_SELECTION');
                    navigate('/battle');
                  }}
                  className="flex-1 rounded-none h-14 font-black uppercase tracking-widest border-2 border-primary bg-primary text-black hover:bg-black hover:text-primary transition-all group"
                >
                  <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                  RETURN_TO_HUB
                </Button>
              </div>

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
                  {battleHistory.map((battle: any) => {
                    const Content = (
                      <div className="flex items-center justify-between w-full">
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
                              {battle.player1.username}{' '}
                              <span className="text-primary/40 mx-2">VS</span>{' '}
                              {battle.player2?.username || 'AI_BOT'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded-none border shrink-0",
                              battle.type === 'PVP' ? "border-primary text-primary" : "border-white/20 text-white/40"
                            )}>
                              {battle.type}
                            </span>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-primary/60">
                              STATUS: {battle.status}
                            </p>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-primary/60 font-black">
                              ID: {battle.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </div>
                    );

                    const commonClasses = "bg-black/40 border border-primary/10 p-4 flex items-center justify-between group transition-colors";

                    return (
                      <Link
                        key={battle.id}
                        to={`/battle/${battle.id}`}
                        className={cn(commonClasses, "hover:border-primary/40 cursor-pointer")}
                      >
                        {Content}
                      </Link>
                    );
                  })}
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
