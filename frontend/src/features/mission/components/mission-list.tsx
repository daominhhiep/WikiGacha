import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, Circle, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMissions, useClaimMissionReward, type UserMission } from '../use-missions';

/**
 * MissionItem component displays a single mission card with HUD styling.
 */
const MissionItem: React.FC<{ userMission: UserMission }> = ({ userMission }) => {
  const { mission, progress, isCompleted, isClaimed } = userMission;
  const target = mission.criteria.count || 1;
  const percentage = Math.min(Math.round((progress / target) * 100), 100);

  const { mutate: claimReward, isPending: isClaiming } = useClaimMissionReward();

  const handleClaim = () => {
    if (isCompleted && !isClaimed) {
      claimReward(userMission.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'group relative flex flex-col p-4 mb-4 rounded-none border-l-4 transition-all duration-300 bg-bg-surface/40 backdrop-blur-md',
        isClaimed
          ? 'border-muted opacity-60'
          : isCompleted
            ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
      )}
    >
      {/* Decorative HUD corners */}
      <div className="absolute top-0 right-0 size-2 border-t border-r border-white/20 opacity-30" />
      <div className="absolute bottom-0 right-0 size-2 border-b border-r border-white/20 opacity-30" />

      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'text-[10px] font-mono px-2 py-0.5 uppercase tracking-widest bg-black/40 border border-border-grid',
                mission.type === 'DAILY' ? 'text-cyan-400' : 'text-purple-400',
              )}
            >
              {mission.type}
            </span>
            <h3 className="font-bold text-lg tracking-tight uppercase group-hover:text-primary transition-colors">
              {mission.title}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 italic">
            {mission.description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Gift className="size-3 text-amber-500" />
            <span className="text-amber-500 font-bold">{mission.rewardCredits}</span>
            <span className="opacity-50 text-[10px]">CREDITS</span>
          </div>
          {isClaimed && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-green-500 uppercase mt-1">
              <CheckCircle2 className="size-3" /> Claimed
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-auto space-y-2">
        <div className="flex justify-between items-end font-mono text-[10px] tracking-tighter">
          <span className="opacity-70 uppercase">[ PROGRESS_SYNC ]</span>
          <span className={cn('font-bold', isCompleted ? 'text-amber-500' : 'text-cyan-400')}>
            {progress} / {target} ({percentage}%)
          </span>
        </div>

        {/* HUD Progress Bar */}
        <div className="h-2 w-full bg-black/60 border border-border-grid relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn('h-full relative', isCompleted ? 'bg-amber-500' : 'bg-cyan-500')}
          >
            {/* Glossy overlay for progress bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </motion.div>
        </div>
      </div>

      {/* Action Button */}
      {isCompleted && !isClaimed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full rounded-none bg-amber-500 hover:bg-amber-600 text-black font-black font-mono tracking-tighter uppercase border-none shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98]"
          >
            {isClaiming ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Trophy className="size-4 mr-2" />
            )}
            [ CLAIM_REWARD ]
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * MissionList component fetches and displays the user's active and completed missions.
 */
export const MissionList: React.FC = () => {
  const { data: missions, isLoading, error, refetch } = useMissions();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="size-8 text-primary animate-spin" />
        <div className="text-xs font-mono text-primary animate-pulse uppercase tracking-[0.3em]">
          Initializing Mission Terminal...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-500/50 bg-red-500/10 rounded-none flex flex-col items-center gap-4">
        <AlertCircle className="size-8 text-red-500" />
        <div className="text-center">
          <p className="text-red-500 font-bold font-mono">
            CONNECTION_ERROR: UNABLE TO FETCH MISSIONS
          </p>
          <p className="text-xs text-red-500/70 mt-1 uppercase">
            Please verify your neural link and try again.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="rounded-none border-red-500/50 text-red-500 hover:bg-red-500/20"
        >
          RETRY_CONNECTION
        </Button>
      </div>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <div className="p-12 border border-border-grid bg-bg-surface/20 text-center rounded-none italic opacity-60">
        <Circle className="size-12 mx-auto mb-4 opacity-20" />
        <p className="font-mono text-sm uppercase">[ NO_ACTIVE_MISSIONS_FOUND ]</p>
      </div>
    );
  }

  // Sort missions: Claimable first, then incomplete, then claimed
  const sortedMissions = [...missions].sort((a, b) => {
    if (a.isClaimed !== b.isClaimed) return a.isClaimed ? 1 : -1;
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
    return a.id - b.id;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <Trophy className="size-6 text-amber-500" />
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight font-heading">
              Mission Terminal
            </h2>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
              [ SECTOR_PROGRESS_STABLE ]
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono bg-black/40 px-3 py-1 border border-border-grid uppercase opacity-60">
          <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          SYSTEM_ONLINE
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {sortedMissions.map((um) => (
            <MissionItem key={um.id} userMission={um} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
