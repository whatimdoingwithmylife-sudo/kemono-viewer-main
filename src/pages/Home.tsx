import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
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

    const apiUrl = `/api/v1/posts?${query ? `q=${query}&` : ''}o=${offset}`;
    const { data: rawData, error, isLoading } = useSWR<any>(apiUrl, fetcher);
    const posts: KemonoPost[] | undefined = Array.isArray(rawData) ? rawData : rawData?.posts;

    const { filteredPosts, totalCount } = usePostFilters(posts, filters);

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
                    <span className="px-4 text-sm text-muted-foreground">Page {page + 1}</span>
                    <Button variant="outline" onClick={() => goToPage(page + 1)} disabled={posts.length < POSTS_PER_PAGE}>
                        Next →
                    </Button>
                </div>
            )}
        </div>
    );
}
