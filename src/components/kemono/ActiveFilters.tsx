import type { FilterState } from './FilterBar';

interface ActiveFiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    totalCount: number;
    filteredCount: number;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <button
            onClick={onRemove}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
            {label}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
        </button>
    );
}

export function ActiveFilters({ filters, onFilterChange, totalCount, filteredCount }: ActiveFiltersProps) {
    const hasActiveFilters = filters.service !== 'all' || 
        filters.contentType !== 'all' || 
        filters.hasAttachments || 
        filters.searchQuery;

    if (!hasActiveFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
                Showing {filteredCount} of {totalCount} posts
            </span>
            <span className="text-muted-foreground">•</span>
            
            {filters.service !== 'all' && (
                <FilterChip 
                    label={filters.service} 
                    onRemove={() => onFilterChange({ ...filters, service: 'all' })} 
                />
            )}
            {filters.contentType !== 'all' && (
                <FilterChip 
                    label={filters.contentType} 
                    onRemove={() => onFilterChange({ ...filters, contentType: 'all' })} 
                />
            )}
            {filters.hasAttachments && (
                <FilterChip 
                    label="Has attachments" 
                    onRemove={() => onFilterChange({ ...filters, hasAttachments: false })} 
                />
            )}
            {filters.searchQuery && (
                <FilterChip 
                    label={`"${filters.searchQuery}"`} 
                    onRemove={() => onFilterChange({ ...filters, searchQuery: '' })} 
                />
            )}
        </div>
    );
}
