import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteCollection, useToggleFavorite, type InventoryItem } from './use-collection';
import CollectionGrid from './collection-grid';
import CardDetail from './card-detail';
import CollectionFilters, { type SortOption } from './collection-filters';
import { Database, Loader2, ArrowDownCircle } from 'lucide-react';

/**
 * CollectionPage component provides the main interface for browsing owned cards.
 * Includes filtering, sorting, and infinite scroll grid.
 */
const CollectionPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteCollection({
    search: searchQuery,
    rarity: rarityFilter,
    sortBy
  });

  const { mutate: toggleFavorite } = useToggleFavorite();
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { 
        threshold: 0,
        rootMargin: '600px', // Pre-fetch data 600px before user reaches the bottom
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  // Flatten items from all pages
  const allItems = data?.pages.flatMap((page) => page.items) || [];
  const totalCount = data?.pages[0]?.meta.total || 0;

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
            Stored Article Assets: <span className="text-primary font-bold">{totalCount}</span> / 500
          </p>
        </div>

        {/* Toolbar */}
        <CollectionFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          rarityFilter={rarityFilter}
          onRarityFilterChange={setRarityFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />
      </div>

      {/* Main Grid */}
      <CollectionGrid 
        items={allItems} 
        isLoadingMore={isFetchingNextPage}
        onToggleFavorite={(id) => toggleFavorite(id)}
        onCardClick={(item) => setSelectedItem(item)}
      />

      {/* Infinite Scroll Trigger */}
      <div 
        ref={loadMoreRef} 
        className="h-20 flex flex-col items-center justify-center gap-2 mt-10"
      >
        {isFetchingNextPage ? (
          <>
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-[10px] font-mono text-primary uppercase animate-pulse">DECRYPTING_MORE_RECORDS...</span>
          </>
        ) : hasNextPage ? (
          <>
            <ArrowDownCircle className="size-6 text-primary/40 animate-bounce" />
            <span className="text-[10px] font-mono text-primary/40 uppercase tracking-widest">SCROLL_FOR_RECORDS</span>
          </>
        ) : allItems.length > 0 ? (
          <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">— END_OF_DATABASE —</span>
        ) : null}
      </div>

      {/* Detail Modal */}
      <CardDetail 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />
    </div>
  );
};

export default CollectionPage;
