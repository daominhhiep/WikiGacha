import axios from 'axios';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOpenPack, useGachaStore } from './use-gacha';
import GachaReveal from './gacha-reveal';
import { Terminal, ShieldAlert, Cpu, Database, Network, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '../auth/auth-store';

/**
 * GachaPage component providing the Cyberpunk "Data Breach" gacha interface.
 * Implements the design system: dark mode, neon accents, and data terminal vibe.
 *
 * @returns A themed gacha page component.
 */
const GachaPage: React.FC = () => {
  const { mutate: openPack, isPending: isOpening, error: apiError } = useOpenPack();
  const { lastOpenedCards, reset } = useGachaStore();
  const { accessToken, player } = useAuthStore();
  const [showReveal, setShowReveal] = useState(false);

  const getErrorMessage = (error: Error | null) => {
    if (!error) return null;
    if (axios.isAxiosError(error)) {
      return (error.response?.data as any)?.error?.message || error.message || 'DATA_BREACH_FAILED';
    }
    return error.message;
  };

  const handleOpenPack = () => {
    if (!accessToken) return;

    openPack('BASIC', {
      onSuccess: (data) => {
        if (data.newCards && data.newCards.length > 0) {
          // Delay reveal slightly for effect
          setTimeout(() => {
            setShowReveal(true);
          }, 800);
        }
      },
    });
  };

  const handleRevealComplete = () => {
    setShowReveal(false);
    reset();
  };

  // If we are showing the reveal animation, render the GachaReveal component
  if (showReveal && lastOpenedCards) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex min-h-[70vh] flex-col items-center justify-center p-4"
      >
        <div className="mb-12 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-primary animate-pulse">
            <Cpu className="size-8" />
            <h2 className="text-4xl font-black tracking-widest uppercase font-mono italic">
              DATA_EXTRACTED
            </h2>
            <Cpu className="size-8" />
          </div>
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-2" />
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-4">
            Inventory synchronized with global data terminal.
          </p>
        </div>
        <GachaReveal cards={lastOpenedCards} onComplete={handleRevealComplete} />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12 animate-in fade-in duration-700">
      {/* Header (Terminal HUD Style) */}
      <div className="text-center max-w-2xl space-y-4 border-b border-border-grid pb-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-mono text-primary/40 uppercase mb-2">
          [ DEEP_DATA_BREACH_PROTOCOL_v4.2 ]
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic flex items-center justify-center gap-3">
          <Network className="text-primary size-10" />
          Wikipedia Pack
        </h1>
        <p className="text-sm font-mono text-muted-foreground max-lg mx-auto opacity-80 uppercase leading-relaxed">
          Accessing the infinite multiverse library. Extract article data and convert to
          combat-ready assets.
        </p>
      </div>

      {/* Error display (System Alert) */}
      {apiError && (
        <div className="w-full max-w-md p-4 bg-red-950/20 border-l-4 border-red-500 text-red-400 flex items-start gap-4 animate-in slide-in-from-left-4 font-mono">
          <ShieldAlert className="shrink-0 mt-0.5 size-6" />
          <div>
            <div className="text-xs font-black uppercase mb-1">CRITICAL_ERROR</div>
            <div className="text-[10px] opacity-80">{getErrorMessage(apiError)}</div>
          </div>
        </div>
      )}

      {/* Main Gacha Interaction (Data Core) */}
      <motion.div
        className="relative group perspective-1000 p-8 border border-border-grid bg-bg-surface/30 backdrop-blur-sm"
        animate={
          isOpening
            ? {
                x: [0, -2, 2, -2, 2, 0],
                y: [0, 1, -1, 1, -1, 0],
                transition: { repeat: Infinity, duration: 0.1 },
              }
            : {}
        }
      >
        {/* Flash Effect on opening */}
        <AnimatePresence>
          {isOpening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="absolute inset-0 bg-primary z-20 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* HUD Corners */}
        <div className="absolute top-0 left-0 size-8 border-t-2 border-l-2 border-primary/40" />
        <div className="absolute top-0 right-0 size-8 border-t-2 border-r-2 border-primary/40" />
        <div className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-primary/40" />
        <div className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-primary/40" />

        <div
          className={cn(
            'w-64 h-80 bg-black/80 border-2 border-border-grid flex items-center justify-center overflow-hidden transition-all duration-500 relative',
            isOpening
              ? 'border-primary shadow-[0_0_30px_rgba(0,240,255,0.3)] scale-105'
              : 'group-hover:border-primary group-hover:bg-primary/5',
          )}
        >
          {/* Scanning Line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-1/3 w-full animate-scan" />

          <div className="flex flex-col items-center gap-6 relative z-10">
            <div
              className={cn(
                'size-24 bg-black border border-border-grid flex items-center justify-center relative',
                isOpening && 'animate-spin-slow',
              )}
            >
              <Database
                className={cn(
                  'size-12 transition-colors',
                  isOpening ? 'text-primary' : 'text-primary/40',
                )}
              />
              {/* Spinning Ring */}
              <div className="absolute -inset-2 border-2 border-dashed border-primary/20 rounded-full animate-spin-slow" />
            </div>
            <div className="text-center font-mono">
              <div className="text-2xl font-black uppercase tracking-widest flex items-center gap-2">
                <span className="text-primary">&gt;</span> CORE_DATA
              </div>
              <div className="text-[8px] opacity-40 uppercase mt-1">Status: Ready to Extract</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col items-center gap-6">
        <motion.button
          whileHover={accessToken ? { scale: 1.05 } : {}}
          whileTap={accessToken ? { scale: 0.95 } : {}}
          onClick={handleOpenPack}
          disabled={isOpening || !accessToken}
          className={cn(
            'h-16 px-12 text-xl font-black rounded-none border-2 transition-all duration-300 flex items-center gap-3 uppercase italic',
            !accessToken
              ? 'border-muted-foreground/40 bg-muted/10 text-muted-foreground cursor-not-allowed opacity-50'
              : 'border-primary bg-primary text-black hover:bg-black hover:text-primary shadow-[0_0_20px_rgba(0,240,255,0.2)]',
          )}
        >
          {isOpening ? (
            <>
              <Terminal className="size-6 animate-pulse" />
              BREACHING_FIREWALL...
            </>
          ) : !accessToken ? (
            <>
              <Lock className="size-6" />
              LOGIN_REQUIRED
            </>
          ) : (
            <>INITIATE_BREACH</>
          )}
        </motion.button>
        <div className="flex flex-col items-center gap-2 font-mono text-[10px] opacity-60 text-center">
          {!accessToken ? (
            <span className="text-red-500/80 font-bold uppercase animate-pulse">
              [ IDENTITY_VERIFICATION_REQUIRED_FOR_DATA_EXTRACTION ]
            </span>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">COST:</span>
                <span>10_CREDITS</span>
                <span className="mx-2 text-border-grid">|</span>
                <span className="text-primary font-bold">RETURN:</span>
                <span>5_DATA_UNITS</span>
              </div>
              {player && (
                <div
                  className={cn(
                    'mt-2 font-bold transition-colors',
                    player.pityCounter >= 9 ? 'text-rarity-ssr animate-pulse' : 'text-primary/40',
                  )}
                >
                  [ PITY_TIMER: {player.pityCounter}/10 ]
                  {player.pityCounter >= 9 && ' - HIGH_VALUE_SIGNAL_DETECTED'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GachaPage;
