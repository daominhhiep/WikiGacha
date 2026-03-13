import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/card';
import type { InventoryItem } from './use-collection';
import { Star, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CollectionGridProps {
  /** The list of items in the collection. */
  items: InventoryItem[];
  /** Whether more items are currently being fetched. */
  isLoadingMore?: boolean;
  /** Optional callback when a card is clicked (e.g., to show details). */
  onCardClick?: (item: InventoryItem) => void;
  /** Optional callback to toggle favorite. */
  onToggleFavorite?: (inventoryId: string) => void;
}

/**
 * Lightweight skeleton card for loading states.
 */
const CardSkeleton = () => (
  <div className="relative h-[30rem] w-72 flex flex-col rounded-none border-2 border-border-grid bg-black/40 p-4 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1/3 w-full animate-scan" />
    <Skeleton className="aspect-square w-full border border-border-grid" />
    <div className="mt-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="mt-auto pt-4 space-y-2">
        <Skeleton className="h-8 w-full bg-red-500/10 border-l-2 border-red-500/20" />
        <Skeleton className="h-8 w-full bg-orange-500/10 border-l-2 border-orange-500/20" />
        <Skeleton className="h-8 w-full bg-blue-500/10 border-l-2 border-blue-500/20" />
      </div>
    </div>
  </div>
);

/**
 * CollectionGrid component renders a responsive grid of collected Wikipedia cards.
 * Implements the Cyberpunk HUD style for the collection view.
 */
const CollectionGrid: React.FC<CollectionGridProps> = ({
  items,
  isLoadingMore,
  onCardClick,
  onToggleFavorite,
}) => {
  if (items.length === 0 && !isLoadingMore) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border-grid bg-black/20">
        <div className="size-20 border border-primary/20 flex items-center justify-center mb-6">
          <Search className="size-10 text-primary/40 animate-pulse" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-widest text-primary mb-2">
          NO_DATA_DETECTED
        </h3>
        <p className="text-xs font-mono text-muted-foreground uppercase opacity-60">
          Your inventory is currently empty. Breach Wikipedia to acquire assets.
        </p>
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
            transition={{ duration: 0.3, delay: (index % 20) * 0.05 }}
            className="relative group"
          >
            {/* Favorite button — top-left overlay on card image */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(item.id);
              }}
              title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'absolute top-2 left-2 z-30 size-8 flex items-center justify-center bg-black/70 border border-border-grid transition-all hover:scale-110',
                item.isFavorite
                  ? 'text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                  : 'text-white/30 hover:text-white hover:border-white/40',
              )}
            >
              <Star className={cn('size-4', item.isFavorite && 'fill-current')} />
            </button>

            {/* Card — acquiredAt passed so it shows in footer */}
            <div className="cursor-pointer" onClick={() => onCardClick?.(item)}>
              <Card
                card={item.card}
                isRevealed={true}
                acquiredAt={item.acquiredAt}
                className="transition-transform group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]"
              />
            </div>
          </motion.div>
        ))}

        {/* Loading Skeletons */}
        {isLoadingMore &&
          Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={`skeleton-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardSkeleton />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

export default CollectionGrid;
