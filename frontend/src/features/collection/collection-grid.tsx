import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/card';
import type { InventoryItem } from './use-collection';
import { Star, Clock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectionGridProps {
  /** The list of items in the collection. */
  items: InventoryItem[];
  /** Optional callback when a card is clicked (e.g., to show details). */
  onCardClick?: (item: InventoryItem) => void;
  /** Optional callback to toggle favorite. */
  onToggleFavorite?: (inventoryId: string) => void;
}

/**
 * CollectionGrid component renders a responsive grid of collected Wikipedia cards.
 * Implements the Cyberpunk HUD style for the collection view.
 */
const CollectionGrid: React.FC<CollectionGridProps> = ({ 
  items, 
  onCardClick, 
  onToggleFavorite 
}) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border-grid bg-black/20">
        <div className="size-20 border border-primary/20 flex items-center justify-center mb-6">
          <Search className="size-10 text-primary/40 animate-pulse" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-widest text-primary mb-2">NO_DATA_DETECTED</h3>
        <p className="text-xs font-mono text-muted-foreground uppercase opacity-60">Your inventory is currently empty. Breach Wikipedia to acquire assets.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative group"
          >
            {/* Collection Metadata Overlay */}
            <div className="absolute top-2 left-2 z-30 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.(item.id);
                }}
                className={cn(
                  "size-8 flex items-center justify-center bg-black/80 border border-border-grid transition-all",
                  item.isFavorite ? "text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]" : "text-white/40 hover:text-white"
                )}
              >
                <Star className={cn("size-4", item.isFavorite && "fill-current")} />
              </button>
            </div>

            <div className="absolute bottom-2 right-2 z-30 pointer-events-none">
              <div className="px-2 py-1 bg-black/80 border border-border-grid text-[8px] font-mono text-primary/60 flex items-center gap-1.5 uppercase">
                <Clock className="size-2.5" />
                {new Date(item.acquiredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>

            {/* Interaction Layer */}
            <div 
              className="cursor-pointer"
              onClick={() => onCardClick?.(item)}
            >
              <Card 
                card={item.card} 
                isRevealed={true}
                className="transition-transform group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CollectionGrid;
