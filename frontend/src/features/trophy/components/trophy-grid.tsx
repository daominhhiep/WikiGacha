import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy as TrophyIcon, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Trophy } from '../use-trophies';

interface TrophyGridProps {
  /** The list of trophies to display. */
  trophies: Trophy[];
  /** Whether the data is currently loading. */
  isLoading?: boolean;
}

/**
 * Individual Trophy card component with HUD style and glow effects.
 */
const TrophyCard: React.FC<{ trophy: Trophy; index: number }> = ({ trophy, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine glow color based on rarity
  const glowClass = trophy.rarity === 'GOLD' 
    ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)]'
    : 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]';
  
  const textGlowClass = trophy.rarity === 'GOLD'
    ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]'
    : 'text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]';

  const bgGradient = trophy.rarity === 'GOLD'
    ? 'from-yellow-500/5 to-transparent'
    : 'from-purple-500/5 to-transparent';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative group aspect-square flex flex-col items-center justify-center p-4',
        'bg-black/40 border-2 backdrop-blur-sm overflow-hidden',
        'transition-all duration-300 ease-out cursor-default',
        glowClass
      )}
    >
      {/* HUD Corners */}
      <div className="absolute top-0 left-0 size-2 border-t-2 border-l-2 border-current opacity-40" />
      <div className="absolute top-0 right-0 size-2 border-t-2 border-r-2 border-current opacity-40" />
      <div className="absolute bottom-0 left-0 size-2 border-b-2 border-l-2 border-current opacity-40" />
      <div className="absolute bottom-0 right-0 size-2 border-b-2 border-r-2 border-current opacity-40" />

      {/* Background scanline effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b opacity-20 pointer-events-none",
        bgGradient
      )} />

      {/* Icon Area */}
      <div className="relative z-10 mb-3">
        <motion.div
          animate={isHovered ? { rotate: [0, -10, 10, 0], scale: 1.1 } : {}}
          transition={{ duration: 0.5 }}
          className={cn("size-12 flex items-center justify-center", textGlowClass)}
        >
          {/* Use the provided icon URL if available, otherwise default icon */}
          {trophy.icon && trophy.icon.startsWith('http') ? (
            <img src={trophy.icon} alt={trophy.name} className="size-full object-contain" />
          ) : (
            <TrophyIcon className="size-10" />
          )}
        </motion.div>
        
        {trophy.rarity === 'GOLD' && (
          <Sparkles className="absolute -top-1 -right-1 size-4 text-yellow-400 animate-pulse" />
        )}
      </div>

      {/* Trophy Name */}
      <h3 className={cn(
        "relative z-10 text-xs font-black uppercase tracking-[0.2em] text-center font-mono",
        textGlowClass
      )}>
        {trophy.name}
      </h3>

      {/* Description Overlay on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute inset-0 z-20 bg-black/90 p-4 flex flex-col items-center justify-center text-center"
          >
            <div className={cn("text-[10px] font-mono uppercase mb-2 opacity-50", textGlowClass)}>
              DATA_EXTRACTED
            </div>
            <p className="text-[11px] font-mono leading-relaxed text-white/90 uppercase tracking-tight">
              {trophy.description}
            </p>
            <div className="mt-3 text-[9px] font-mono text-muted-foreground">
              ACQUIRED: {new Date(trophy.unlockedAt).toLocaleDateString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover decoration */}
      <div className={cn(
        "absolute inset-0 border border-white/0 transition-colors group-hover:border-white/10 pointer-events-none"
      )} />
    </motion.div>
  );
};

/**
 * TrophyGrid component displays a grid of unlocked trophies in a cyberpunk style.
 */
const TrophyGrid: React.FC<TrophyGridProps> = ({ trophies, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader2 className="size-12 text-primary animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest animate-pulse">
          Syncing_Trophies...
        </span>
      </div>
    );
  }

  if (trophies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 bg-black/20">
        <TrophyIcon className="size-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground/50">
          NO_TROPHIES_UNLOCKED
        </h3>
        <p className="text-[10px] font-mono text-muted-foreground/40 mt-2">
          Complete missions and dominate the arena to acquire trophies.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {trophies.map((trophy, index) => (
        <TrophyCard key={trophy.id} trophy={trophy} index={index} />
      ))}
    </div>
  );
};

export default TrophyGrid;
