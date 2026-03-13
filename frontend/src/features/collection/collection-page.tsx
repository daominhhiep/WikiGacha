import React, { useState } from 'react';
import { useCollection, useToggleFavorite, InventoryItem } from './use-collection';
import CollectionGrid from './collection-grid';
import { Database, Filter, ArrowUpDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rarity } from '@/components/card';

/**
 * CollectionPage component provides the main interface for browsing owned cards.
 * Includes filtering, sorting, and the card grid.
 */
const CollectionPage: React.FC = () => {
  const { data: collection, isLoading, error } = useCollection();
  const { mutate: toggleFavorite } = useToggleFavorite();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'RARITY' | 'ALPHABETICAL'>('NEWEST');

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          Accessing_Central_Database...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 border-2 border-red-500/20 bg-red-500/5">
        <Database className="size-16 text-red-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-black uppercase text-red-500 mb-2">Connection_Lost</h2>
        <p className="text-sm font-mono text-red-400/80 uppercase">Failed to retrieve inventory data from core terminal.</p>
      </div>
    );
  }

  // Filtering and Sorting Logic
  const filteredItems = (collection || [])
    .filter((item) => {
      const matchesSearch = item.card.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = rarityFilter === 'ALL' || item.card.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
      }
      if (sortBy === 'ALPHABETICAL') {
        return a.card.title.localeCompare(b.card.title);
      }
      if (sortBy === 'RARITY') {
        const rarityOrder = Object.keys(Rarity);
        return rarityOrder.indexOf(b.card.rarity) - rarityOrder.indexOf(a.card.rarity);
      }
      return 0;
    });

  return (
    <div className="space-y-10 py-10 animate-in fade-in duration-700">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-grid pb-8 relative">
        <div className="absolute top-0 left-0 text-[10px] font-mono text-primary/40 uppercase mb-2">
          [ USER_INVENTORY_TERMINAL_v1.0 ]
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic flex items-center gap-3">
            <Database className="text-primary size-10" />
            Collection
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Stored Article Assets: <span className="text-primary font-bold">{collection?.length || 0}</span> / 500
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input 
              type="text"
              placeholder="SEARCH_INDEX..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border border-border-grid h-10 pl-10 pr-4 text-xs font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none w-64 transition-all"
            />
          </div>

          {/* Rarity Filter */}
          <div className="flex items-center bg-black/40 border border-border-grid p-1">
            <div className="px-2 text-[10px] font-mono text-muted-foreground uppercase mr-1 flex items-center gap-1">
              <Filter className="size-3" />
            </div>
            {['ALL', ...Object.keys(Rarity)].map((r) => (
              <button
                key={r}
                onClick={() => setRarityFilter(r)}
                className={cn(
                  "px-3 py-1 text-[10px] font-black transition-all",
                  rarityFilter === r 
                    ? "bg-primary text-black" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/40 border border-border-grid h-10 px-4 text-xs font-mono focus:border-primary outline-none cursor-pointer uppercase"
          >
            <option value="NEWEST">SORT: NEWEST</option>
            <option value="RARITY">SORT: RARITY</option>
            <option value="ALPHABETICAL">SORT: A-Z</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <CollectionGrid 
        items={filteredItems} 
        onToggleFavorite={(id) => toggleFavorite(id)}
      />
    </div>
  );
};

export default CollectionPage;
