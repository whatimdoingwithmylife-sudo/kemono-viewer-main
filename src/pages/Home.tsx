import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher, getApiUrl } from '@/lib/api';
import type { KemonoPost } from '@/types';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';
import { FilterBar } from '@/components/kemono/FilterBar';
import type { FilterState } from '@/components/kemono/FilterBar';
import { ViewToggle } from '@/components/kemono/ViewToggle';
import type { ViewMode } from '@/components/kemono/ViewToggle';
import { ActiveFilters } from '@/components/kemono/ActiveFilters';
import { PostGrid } from '@/components/kemono/PostGrid';
import { usePostFilters } from '@/hooks/usePostFilters';
import { useDynamicLoading } from '@/hooks/useDynamicLoading';
import { useSettings } from '@/hooks/useSettings';
import { Spinner } from '@/components/ui/spinner';

const POSTS_PER_PAGE = 50;

export default function Home() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '0', 10);
    const offset = page * POSTS_PER_PAGE;

    const [filters, setFilters] = useState<FilterState>(() => ({
        service: searchParams.get('service') || 'all',
        sort: searchParams.get('sort') || 'published',
        hasAttachments: searchParams.get('attachments') === 'true',
        contentType: searchParams.get('type') || 'all',
        searchQuery: '',
    }));

    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return (localStorage.getItem('postsViewMode') as ViewMode) || 'grid';
    });

    const handleViewChange = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('postsViewMode', mode);
    };

    const { settings } = useSettings();
    const isDynamicEnabled = settings.dynamicLoadingEnabled;

    // Dynamic loading hook for global posts
    const dynamicState = useDynamicLoading({
        searchQuery: query,
        filters,
        page,
        enabled: isDynamicEnabled,
        threshold: settings.dynamicLoadingThreshold,
    });

    // Fallback to standard SWR when dynamic loading is disabled
    const apiUrl = getApiUrl(`/posts?${query ? `q=${query}&` : ''}o=${offset}`);
    const { data: rawData, error: swrError, isLoading: swrLoading } = useSWR<any>(
        !isDynamicEnabled ? apiUrl : null,
        fetcher
    );
    const swrPosts: KemonoPost[] | undefined = Array.isArray(rawData) ? rawData : rawData?.posts;
    const { filteredPosts: swrFilteredPosts, totalCount: swrTotalCount } = usePostFilters(swrPosts, filters);

    // Use dynamic or standard loading based on setting
    const posts = isDynamicEnabled ? dynamicState.posts : swrPosts;
    const filteredPosts = isDynamicEnabled ? dynamicState.filteredPosts : swrFilteredPosts;
    const totalCount = isDynamicEnabled ? dynamicState.posts.length : swrTotalCount;
    const isLoading = isDynamicEnabled ? dynamicState.isLoading : swrLoading;
    const error = isDynamicEnabled ? dynamicState.error : swrError;

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        filters.service !== 'all' ? params.set('service', filters.service) : params.delete('service');
        filters.sort !== 'published' ? params.set('sort', filters.sort) : params.delete('sort');
        filters.hasAttachments ? params.set('attachments', 'true') : params.delete('attachments');
        filters.contentType !== 'all' ? params.set('type', filters.contentType) : params.delete('type');
        setSearchParams(params, { replace: true });
    }, [filters]);

    const goToPage = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        newPage === 0 ? params.delete('page') : params.set('page', newPage.toString());
        setSearchParams(params);
        window.scrollTo(0, 0);
    };

    if (error) return <div className="text-center text-red-500 mt-10">Failed to load posts</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {query ? `Search: ${query}` : 'Recent Posts'}
                    </h1>
                    {page > 0 && <span className="text-sm text-muted-foreground">Page {page + 1}</span>}
                </div>
                <div className="flex items-center gap-2 justify-between">
                    <FilterBar filters={filters} onFilterChange={setFilters} />
                    <ViewToggle view={viewMode} onViewChange={handleViewChange} />
                </div>
                <ActiveFilters 
                    filters={filters} 
                    onFilterChange={setFilters} 
                    totalCount={totalCount} 
                    filteredCount={filteredPosts.length} 
                />
                
                {/* Dynamic loading indicator */}
                {isDynamicEnabled && dynamicState.isDynamicLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                        <Spinner className="h-4 w-4" />
                        <span>Loading more pages... ({dynamicState.pagesLoaded} pages loaded, {dynamicState.totalFiltered} matches found)</span>
                    </div>
                )}
                {isDynamicEnabled && !dynamicState.isLoading && dynamicState.pagesLoaded > 1 && (
                    <div className="text-xs text-muted-foreground">
                        Loaded {dynamicState.pagesLoaded} API pages to find {filteredPosts.length} matching posts
                    </div>
                )}
            </div>

            <PostGrid
                posts={filteredPosts}
                viewMode={viewMode}
                isLoading={isLoading}
                emptyMessage={totalCount === 0 ? 'No posts found.' : 'No posts match your filters.'}
            />

            {posts && (posts.length > 0 || page > 0) && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" onClick={() => goToPage(page - 1)} disabled={page === 0}>
                        ← Previous
                    </Button>
                    <span className="px-4 text-sm text-muted-foreground">
                        Page {page + 1}
                        {isDynamicEnabled && dynamicState.pagesLoaded > 1 && (
                            <span className="text-xs ml-1">(API pages {page + 1}-{page + dynamicState.pagesLoaded})</span>
                        )}
                    </span>
                    <Button 
                        variant="outline" 
                        onClick={() => goToPage(page + dynamicState.pagesLoaded)} 
                        disabled={!dynamicState.hasMore && isDynamicEnabled ? true : posts.length < POSTS_PER_PAGE}
                    >
                        Next →
                    </Button>
                </div>
            )}
        </div>
    );
}
