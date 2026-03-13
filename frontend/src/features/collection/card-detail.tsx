import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Heart, Sword, Shield, Globe } from 'lucide-react';
import Card from '@/components/card';
import type { InventoryItem } from './use-collection';
import { Button } from '@/components/ui/button';

interface CardDetailProps {
  /** The item to display in the modal. If null, modal is hidden. */
  item: InventoryItem | null;
  /** Callback to close the modal. */
  onClose: () => void;
}

/**
 * CardDetail component renders a modal overlay with detailed card information,
 * including its Wikipedia summary and interactive elements.
 */
const CardDetail: React.FC<CardDetailProps> = ({ item, onClose }) => {
  const isOpen = !!item;
  const card = item?.card;

  return (
    <AnimatePresence>
      {isOpen && card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-bg-surface border-2 border-border-grid flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HUD Decorative Corners */}
            <div className="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 size-4 border-b-2 border-r-2 border-primary" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 size-10 flex items-center justify-center bg-black/50 border border-border-grid text-white/60 hover:text-primary transition-colors"
            >
              <X className="size-6" />
            </button>

            {/* Visual Side (The Card) */}
            <div className="p-8 md:p-12 bg-black/40 flex items-center justify-center border-b md:border-b-0 md:border-r border-border-grid">
              <div className="relative group">
                {/* Visual anchor for the card */}
                <Card card={card} isRevealed={true} className="scale-105 md:scale-110" />

                {/* Favorite badge if applicable */}
                {item.isFavorite && (
                  <div className="absolute -top-4 -left-4 z-20 bg-yellow-500 text-black p-2 shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-yellow-400 font-black italic text-[10px] uppercase">
                    FAVORITE_ASSET
                  </div>
                )}
              </div>
            </div>

            {/* Content Side (The Metadata) */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[60vh] md:max-h-none font-mono">
              <div className="mb-8">
                <div className="text-[10px] text-primary/60 uppercase tracking-[0.3em] mb-2">
                  [ DATA_ENTRY_DECRYPTED ]
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-4 leading-none">
                  {card.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-[10px]">
                  <div className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-black uppercase">
                    RARITY: {card.rarity}
                  </div>
                  <div className="text-muted-foreground uppercase flex items-center gap-2">
                    <Globe className="size-3" /> ID: {card.id}
                  </div>
                  <div className="text-muted-foreground uppercase">
                    ACQUIRED: {new Date(item.acquiredAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Stats HUD Display */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="border-l-4 border-red-500 pl-4 bg-red-500/5 py-2">
                  <div className="text-[10px] opacity-50 uppercase mb-1 flex items-center gap-2">
                    <Heart className="size-3" /> INTEGRITY
                  </div>
                  <div className="text-2xl font-black text-red-400">{card.hp}</div>
                </div>
                <div className="border-l-4 border-orange-500 pl-4 bg-orange-500/5 py-2">
                  <div className="text-[10px] opacity-50 uppercase mb-1 flex items-center gap-2">
                    <Sword className="size-3" /> OFFENSE
                  </div>
                  <div className="text-2xl font-black text-orange-400">{card.atk}</div>
                </div>
                <div className="border-l-4 border-blue-500 pl-4 bg-blue-500/5 py-2">
                  <div className="text-[10px] opacity-50 uppercase mb-1 flex items-center gap-2">
                    <Shield className="size-3" /> BARRIER
                  </div>
                  <div className="text-2xl font-black text-blue-400">{card.def}</div>
                </div>
              </div>

              {/* Wikipedia Summary Section */}
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-primary/80">
                  <div className="h-[1px] w-4 bg-primary" />
                  SUMMARY_ANALYSIS
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed text-justify italic">
                  "{card.summary}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-border-grid flex flex-wrap gap-4">
                <a
                  href={card.wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[240px]"
                >
                  <Button className="w-full h-12 rounded-none border-2 border-primary bg-primary text-black hover:bg-black hover:text-primary font-black uppercase italic transition-all duration-300 gap-2">
                    <ExternalLink className="size-4" /> ACCESS_FULL_ARCHIVE
                  </Button>
                </a>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="h-12 px-8 rounded-none border-2 border-border-grid hover:border-primary font-black uppercase italic transition-all"
                >
                  CLOSE
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CardDetail;
