import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteCollection, type InventoryItem } from '../collection/use-collection';
import { useBattleStore } from './use-battle';
import Card, { Rarity } from '@/components/card';
import { Button } from '@/components/ui/button';
import { Sword, Swords, Trash2, ShieldAlert, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeckSelectorProps {
  onStartBattle: (deckIds: string[]) => void;
  isStarting?: boolean;
}

/**
 * DeckSelector component allows players to select up to 5 cards from their collection for battle.
 * Follows the Cyberpunk/Anti-Softness design system.
 */
const DeckSelector: React.FC<DeckSelectorProps> = ({ onStartBattle, isStarting = false }) => {
  const { selectedCardIds, toggleCard, clearDeck, maxDeckSize } = useBattleStore();
  const [rarityFilter, setRarityFilter] = useState<string>('ALL');

  // Local registry to keep track of all card data seen so far
  // This ensures selected cards don't disappear from the top bar when filters change
  const [cardRegistry, setCardRegistry] = useState<Record<string, InventoryItem>>({});

  // Fetch collection
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteCollection(
    {
      rarity: rarityFilter === 'ALL' ? undefined : (rarityFilter as any),
    },
  );

  const allCards = React.useMemo(() => data?.pages.flatMap((page) => page.items) || [], [data]);

  // Update registry whenever new cards are loaded
  React.useEffect(() => {
    if (allCards.length > 0) {
      setCardRegistry((prev) => {
        const next = { ...prev };
        let hasNew = false;
        allCards.forEach((item) => {
          if (!next[item.cardId]) {
            next[item.cardId] = item;
            hasNew = true;
          }
        });
        return hasNew ? next : prev;
      });
    }
  }, [allCards]);

  // Find full card data for selected IDs to display in the top bar using the registry
  const selectedCards = React.useMemo(() => {
    return selectedCardIds
      .map((id) => cardRegistry[id])
      .filter((item): item is InventoryItem => !!item);
  }, [selectedCardIds, cardRegistry]);

  const handleStart = () => {
    if (selectedCardIds.length > 0) {
      onStartBattle(selectedCardIds);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-primary/20 pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
            <Sword className="size-8 text-primary" />
            DECK_CONFIGURATION
          </h2>
          <p className="text-xs font-mono text-primary/60 mt-1">
            [ STATUS: SELECT_UP_TO_{maxDeckSize}_UNITS_FOR_COMBAT_ENGAGEMENT ]
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={clearDeck}
            disabled={selectedCardIds.length === 0 || isStarting}
            className="rounded-none border-red-500/50 text-red-500 hover:bg-red-500/10 font-mono text-[10px]"
          >
            <Trash2 className="size-3 mr-2" /> CLEAR_ALL
          </Button>

          <Button
            size="lg"
            onClick={handleStart}
            disabled={selectedCardIds.length === 0 || isStarting}
            className="rounded-none bg-primary text-black font-black uppercase tracking-widest px-8 group relative overflow-hidden"
          >
            {isStarting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                START_ENGAGEMENT
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selected Deck Bar */}
      <div className="bg-black/40 border border-primary/10 p-6 relative overflow-hidden">
        {/* HUD Decorative background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px]" />

        <div className="flex items-center gap-2 mb-4">
          <div className="size-2 bg-primary" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary/80">
            ACTIVE_SLOTS ({selectedCardIds.length}/{maxDeckSize})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 min-h-[200px]">
          {Array.from({ length: maxDeckSize }).map((_, index) => {
            const cardItem = selectedCards[index];
            return (
              <div
                key={`slot-${index}`}
                className={cn(
                  'aspect-[3/4] border-2 border-dashed flex items-center justify-center relative transition-all duration-300',
                  cardItem ? 'border-primary/40 bg-primary/5' : 'border-primary/10 bg-black/20',
                )}
              >
                {cardItem ? (
                  <div
                    className="relative group cursor-pointer w-full h-full"
                    onClick={() => toggleCard(cardItem.cardId)}
                  >
                    {cardItem.card.imageUrl ? (
                      <img
                        src={cardItem.card.imageUrl}
                        alt={cardItem.card.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-surface/20 p-4">
                        {/* Cyberpunk abstract background for missing images */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)]" />
                        <div className="absolute inset-0 opacity-10 flex flex-wrap gap-1 p-1 pointer-events-none">
                          {Array.from({ length: 15 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-0.5 w-full bg-primary/20 animate-pulse"
                              style={{ animationDelay: `${i * 100}ms` }}
                            />
                          ))}
                        </div>
                        <Swords className="size-8 text-primary/20 mb-2 relative z-10" />
                        <div className="relative z-10 text-center">
                          <div className="line-clamp-3 font-mono text-[8px] font-black uppercase leading-tight text-white/40">
                            {cardItem.card.title}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-[10px] font-black uppercase truncate text-white">
                        {cardItem.card.title}
                      </p>
                      <p
                        className={cn(
                          'text-[8px] font-mono font-bold',
                          cardItem.card.rarity === Rarity.LR ? 'text-rarity-lr' : 'text-primary',
                        )}
                      >
                        {cardItem.card.rarity}
                      </p>
                    </div>
                    {/* Remove button overlay on hover */}
                    <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="bg-black px-2 py-1 text-[8px] font-mono text-red-500 border border-red-500">
                        REMOVE_UNIT
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <div className="size-8 border border-primary/40 flex items-center justify-center text-xl font-black">
                      {index + 1}
                    </div>
                    <span className="text-[8px] font-mono">EMPTY_SLOT</span>
                  </div>
                )}

                {/* Decorative corners for each slot */}
                <div className="absolute top-0 left-0 size-1.5 border-t border-l border-primary/40" />
                <div className="absolute top-0 right-0 size-1.5 border-t border-r border-primary/40" />
                <div className="absolute bottom-0 left-0 size-1.5 border-b border-l border-primary/40" />
                <div className="absolute bottom-0 right-0 size-1.5 border-b border-r border-primary/40" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Collection Selection Grid */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-2 bg-primary animate-pulse" />
            <h3 className="text-xl font-black uppercase italic tracking-tighter">
              DATA_REPOSITORY
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-primary/60 uppercase">
              FILTER_BY_RARITY:
            </span>
            <div className="flex gap-1">
              {['ALL', ...Object.values(Rarity)].map((r) => (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className={cn(
                    'px-2 py-1 text-[10px] font-mono border transition-all',
                    rarityFilter === r
                      ? 'bg-primary text-black border-primary font-bold'
                      : 'bg-black/40 text-primary/40 border-primary/20 hover:border-primary/40',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="font-mono text-xs animate-pulse tracking-[0.2em]">
              [ SCANNING_REPOSITORY... ]
            </p>
          </div>
        ) : allCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-primary/10 bg-black/20">
            <ShieldAlert className="size-12 text-primary/20" />
            <p className="font-mono text-sm text-primary/40 tracking-widest uppercase">
              NO_UNITS_DETECTED_IN_DATABASE
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center relative min-h-[400px]">
              <AnimatePresence>
                {allCards.map((item) => {
                  const isSelected = selectedCardIds.includes(item.cardId);
                  const isMaxReached = selectedCardIds.length >= maxDeckSize;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="relative w-full max-w-[224px]"
                      onClick={() => toggleCard(item.cardId)}
                    >
                      <Card
                        card={item.card}
                        size="sm"
                        className={cn(
                          'cursor-pointer transition-all duration-300 overflow-hidden',
                          isSelected &&
                            'ring-2 ring-primary ring-offset-2 ring-offset-black scale-[0.98] brightness-110',
                          !isSelected && isMaxReached && 'grayscale opacity-30',
                        )}
                      />

                      {isSelected && (
                        <div className="absolute top-0 left-0 w-full h-full border-2 border-primary pointer-events-none animate-in fade-in zoom-in duration-300">
                          <div className="absolute top-0 right-0 bg-primary text-black px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter">
                            ACTIVE_UNIT
                          </div>
                          {/* Corner accents for selection */}
                          <div className="absolute -top-1 -left-1 size-4 border-t-4 border-l-4 border-primary" />
                          <div className="absolute -bottom-1 -right-1 size-4 border-b-4 border-r-4 border-primary" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-none border-primary/40 text-primary hover:bg-primary/10 font-mono text-xs px-12"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <ChevronDown className="size-4 mr-2" />
                  )}
                  LOAD_MORE_DATA
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeckSelector;
