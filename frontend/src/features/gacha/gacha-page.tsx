import axios from 'axios';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOpenPack, useGachaStore } from './use-gacha';
import GachaReveal from './gacha-reveal';
import { Terminal, ShieldAlert, Database, Network, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '../auth/auth-store';

/**
 * GachaPage component providing the Cyberpunk "Data Breach" gacha interface.
 * Optimized for single-frame layout (no scrolling).
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
    if (!accessToken || isOpening || !!lastOpenedCards) return;

    setShowReveal(true);
    openPack('BASIC');
  };

  const handleRevealComplete = () => {
    setShowReveal(false);
    reset();
  };

  // If we are showing the reveal animation, render the GachaReveal component
  if (showReveal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full w-full flex flex-col items-center justify-center p-2 overflow-hidden"
      >
        <GachaReveal
          cards={lastOpenedCards}
          onComplete={handleRevealComplete}
          isLoading={isOpening}
          error={apiError}
        />
      </motion.div>
    );
  }

  const isProcessing = isOpening || !!lastOpenedCards;

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-6 py-2 animate-in fade-in duration-700 overflow-hidden">
      {/* Header (Terminal HUD Style) */}
      <div className="text-center max-w-2xl space-y-1 border-b border-border-grid pb-2 relative flex-shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[8px] font-mono text-primary/40 uppercase mb-1 whitespace-nowrap">
          [ DEEP_DATA_BREACH_PROTOCOL_v4.2 ]
        </div>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center justify-center gap-3">
          <Network className="text-primary size-6" />
          Wikipedia Pack
        </h1>
        <p className="text-[10px] font-mono text-muted-foreground max-w-lg mx-auto opacity-80 uppercase leading-tight">
          Accessing the infinite multiverse library. Extract article data and convert to combat-ready
          assets.
        </p>
      </div>

      {/* Error display (System Alert) */}
      {apiError && (
        <div className="w-full max-w-md p-3 bg-red-950/20 border-l-4 border-red-500 text-red-400 flex items-start gap-3 animate-in slide-in-from-left-4 font-mono flex-shrink-0">
          <ShieldAlert className="shrink-0 mt-0.5 size-5" />
          <div>
            <div className="text-[10px] font-black uppercase mb-0.5">CRITICAL_ERROR</div>
            <div className="text-[9px] opacity-80">{getErrorMessage(apiError)}</div>
          </div>
        </div>
      )}

      {/* Main Gacha Interaction (Data Core) */}
      <motion.div
        className="relative group perspective-1000 p-4 border border-border-grid bg-bg-surface/30 backdrop-blur-sm flex-shrink-0"
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
        <div className="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-primary/40" />
        <div className="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-primary/40" />
        <div className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-primary/40" />
        <div className="absolute bottom-0 right-0 size-4 border-b-2 border-r-2 border-primary/40" />

        <div
          className={cn(
            'w-48 h-64 bg-black/80 border-2 border-border-grid flex items-center justify-center overflow-hidden transition-all duration-500 relative',
            isOpening
              ? 'border-primary shadow-[0_0_20px_rgba(0,240,255,0.3)] scale-105'
              : 'group-hover:border-primary group-hover:bg-primary/5',
          )}
        >
          {/* Scanning Line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-1/3 w-full animate-scan" />

          <div className="flex flex-col items-center gap-3 relative z-10">
            <div
              className={cn(
                'size-16 bg-black border border-border-grid flex items-center justify-center relative',
                isOpening && 'animate-spin-slow',
              )}
            >
              <Database
                className={cn(
                  'size-8 transition-colors',
                  isOpening ? 'text-primary' : 'text-primary/40',
                )}
              />
              <div className="absolute -inset-1.5 border-2 border-dashed border-primary/20 rounded-full animate-spin-slow" />
            </div>
            <div className="text-center font-mono">
              <div className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <span className="text-primary">&gt;</span> CORE_DATA
              </div>
              <div className="text-[7px] opacity-40 uppercase mt-0.5">Status: Ready</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col items-center gap-3 flex-shrink-0">
        <motion.button
          whileHover={accessToken && !isProcessing ? { scale: 1.05 } : {}}
          whileTap={accessToken && !isProcessing ? { scale: 0.95 } : {}}
          onClick={handleOpenPack}
          disabled={isProcessing || !accessToken}
          className={cn(
            'h-12 px-8 text-base font-black rounded-none border-2 transition-all duration-300 flex items-center gap-3 uppercase italic',
            !accessToken || isProcessing
              ? 'border-muted-foreground/40 bg-muted/10 text-muted-foreground cursor-not-allowed opacity-50'
              : 'border-primary bg-primary text-black hover:bg-black hover:text-primary shadow-[0_0_20px_rgba(0,240,255,0.2)]',
          )}
        >
          {isProcessing ? (
            <>
              <Terminal className="size-4 animate-pulse" />
              {isOpening ? 'BREACHING...' : 'EXTRACTED...'}
            </>
          ) : !accessToken ? (
            <>
              <Lock className="size-4" />
              LOGIN_REQUIRED
            </>
          ) : (
            <>INITIATE_BREACH</>
          )}
        </motion.button>
        <div className="flex flex-col items-center gap-1 font-mono text-[9px] opacity-60 text-center">
          {!accessToken ? (
            <span className="text-red-500/80 font-bold uppercase animate-pulse">
              [ IDENTITY_VERIFICATION_REQUIRED ]
            </span>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">COST:</span>
                <span>10_CREDITS</span>
                <span className="mx-1 text-border-grid">|</span>
                <span className="text-primary font-bold">RETURN:</span>
                <span>5_DATA_UNITS</span>
              </div>
              {player && (
                <div
                  className={cn(
                    'mt-0.5 font-bold transition-colors',
                    player.pityCounter >= 9 ? 'text-rarity-ssr animate-pulse' : 'text-primary/40',
                  )}
                >
                  [ PITY: {player.pityCounter}/10 ]
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
