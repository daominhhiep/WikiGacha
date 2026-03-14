import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/auth-store';
import { Button } from '@/components/ui/button';
import { X, Swords, Timer, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BattleResult } from '@/features/battle/use-battle';

interface MatchmakingOverlayProps {
  deckIds: string[];
  onCancel: () => void;
  onMatchFound: (battleResult: BattleResult) => void;
}

/**
 * MatchmakingOverlay component handles the PvP queuing process.
 * Connects to the 'pvp' namespace socket and waits for a match.
 */
const MatchmakingOverlay: React.FC<MatchmakingOverlayProps> = ({
  deckIds,
  onCancel,
  onMatchFound,
}) => {
  const { accessToken } = useAuthStore();
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const socketRef = React.useRef<any>(null);
 
  useEffect(() => {
    if (!accessToken) {
      setError('AUTHENTICATION_REQUIRED: Please login to join PvP.');
      return;
    }

    // Interval for search timer
    const interval = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);

    // Initialize socket connection with a small delay to ensure stable state
    const timer = setTimeout(() => {
      const socketUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
      const newSocket = io(`${socketUrl}/pvp`, {
        auth: { token: accessToken },
        path: '/socket.io/',
        reconnectionAttempts: 5,
        transports: ['polling', 'websocket'],
      });

      newSocket.on('connect', () => {
        console.log('[PvP] Connected to matchmaking server');
        newSocket.emit('join_queue', { deckIds });
      });

      newSocket.on('match_found', (data: any) => {
        console.log('[PvP] Match found!', data);
        onMatchFound(data);
      });

      newSocket.on('error', (err: { message: string }) => {
        console.error('[PvP] Socket error:', err);
        setError(err.message || 'CONNECTION_ERROR: Failed to join queue.');
      });

      newSocket.on('connect_error', (err) => {
        console.error('[PvP] Connection error:', err);
        setError(`CONNECTION_ERROR: ${err.message}`);
      });

      socketRef.current = newSocket;
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.emit('leave_queue');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [accessToken, deckIds, onMatchFound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
    >
      {/* Decorative background grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />

      <div className="relative w-full max-w-md bg-black border-2 border-primary/40 p-8 shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Animated scanning line */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/40 animate-scan pointer-events-none" />

        {/* Cyberpunk corner accents */}
        <div className="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-primary" />
        <div className="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-primary" />
        <div className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-primary" />
        <div className="absolute bottom-0 right-0 size-4 border-b-2 border-r-2 border-primary" />

        <div className="flex flex-col items-center text-center space-y-8 relative z-10">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 blur-xl animate-pulse rounded-full" />
            <div className="relative size-20 bg-primary/10 border-2 border-primary flex items-center justify-center">
              <Swords className="size-10 text-primary animate-bounce" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
              {error ? 'SYSTEM_FAILURE' : 'MATCHMAKING_ACTIVE'}
            </h2>
            <p className="font-mono text-xs text-primary/60 tracking-[0.2em] uppercase">
              {error ? '[ ERROR_DETECTED_IN_PROTOCOLS ]' : '[ SEARCHING_FOR_VIABLE_OPPONENT ]'}
            </p>
          </div>

          {error ? (
            <div className="bg-red-500/10 border border-red-500/40 p-4 w-full flex items-start gap-3 text-left">
              <ShieldAlert className="size-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-red-500 uppercase font-black">
                  CRITICAL_ERROR
                </p>
                <p className="text-xs text-red-400 font-mono leading-relaxed">{error}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-none">
                <Timer className="size-4 text-primary" />
                <span className="font-mono text-xl font-black text-primary tracking-widest">
                  {formatTime(searchTime)}
                </span>
              </div>

              <div className="w-full h-1 bg-primary/10 overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="size-1.5 bg-primary/40 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full h-12 rounded-none border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500 font-black uppercase tracking-[0.2em] transition-all group"
          >
            <X className="size-4 mr-2 group-hover:rotate-90 transition-transform" />
            ABORT_OPERATION
          </Button>

          <div className="pt-4 flex flex-col items-center gap-1 opacity-40">
            <span className="text-[8px] font-mono uppercase tracking-widest">
              ENCRYPTED_SIGNAL_STRENGTH: 98%
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-1 w-3 bg-primary" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchmakingOverlay;
