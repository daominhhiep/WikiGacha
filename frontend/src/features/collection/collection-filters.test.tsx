import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import CollectionFilters from './collection-filters';

describe('CollectionFilters', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    rarityFilter: 'ALL',
    onRarityFilterChange: vi.fn(),
    sortBy: 'NEWEST' as const,
    onSortByChange: vi.fn(),
  };

  it('calls onSearchChange when typing in search input', () => {
    render(<CollectionFilters {...defaultProps} />);
    const input = screen.getByPlaceholderText('SEARCH_INDEX...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test');
  });

  it('calls onRarityFilterChange when clicking a rarity button', () => {
    render(<CollectionFilters {...defaultProps} />);
    const ssrButton = screen.getByText('SSR');
    fireEvent.click(ssrButton);
    expect(defaultProps.onRarityFilterChange).toHaveBeenCalledWith('SSR');
  });

  it('calls onSortByChange when changing the sort select', () => {
    render(<CollectionFilters {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ALPHABETICAL' } });
    expect(defaultProps.onSortByChange).toHaveBeenCalledWith('ALPHABETICAL');
  });

  it('highlights the active rarity filter', () => {
    render(<CollectionFilters {...defaultProps} rarityFilter="SSR" />);
    const ssrButton = screen.getByText('SSR');
    expect(ssrButton).toHaveClass('bg-primary');
    expect(ssrButton).toHaveClass('text-black');
  });
});
