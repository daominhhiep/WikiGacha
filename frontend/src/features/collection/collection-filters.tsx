import React from 'react';
import { Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rarity } from '@/components/card';

export type SortOption = 'NEWEST' | 'RARITY' | 'ALPHABETICAL';

interface CollectionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  rarityFilter: string | 'ALL';
  onRarityFilterChange: (rarity: string | 'ALL') => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
}

/**
 * CollectionFilters component provides the UI for searching, 
 * filtering by rarity, and sorting the card collection.
 */
const CollectionFilters: React.FC<CollectionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  rarityFilter,
  onRarityFilterChange,
  sortBy,
  onSortByChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input 
          type="text"
          placeholder="SEARCH_INDEX..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
            onClick={() => onRarityFilterChange(r)}
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
        onChange={(e) => onSortByChange(e.target.value as SortOption)}
        className="bg-black/40 border border-border-grid h-10 px-4 text-xs font-mono focus:border-primary outline-none cursor-pointer uppercase"
      >
        <option value="NEWEST">SORT: NEWEST</option>
        <option value="RARITY">SORT: RARITY</option>
        <option value="ALPHABETICAL">SORT: A-Z</option>
      </select>
    </div>
  );
};

export default CollectionFilters;
