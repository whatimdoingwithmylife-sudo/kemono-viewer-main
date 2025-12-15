import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { fetcher, getApiUrl } from '@/lib/api';
import type { KemonoPost, KemonoCreator } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FilterBar, defaultFilters } from '@/components/kemono/FilterBar';
import type { FilterState } from '@/components/kemono/FilterBar';
import { ViewToggle } from '@/components/kemono/ViewToggle';
import type { ViewMode } from '@/components/kemono/ViewToggle';
import { ActiveFilters } from '@/components/kemono/ActiveFilters';
import { PostGrid } from '@/components/kemono/PostGrid';
import { usePostFilters } from '@/hooks/usePostFilters';
import { FavouriteButton } from '@/components/kemono/FavouriteButton';
import { useFavourites } from '@/hooks/useFavourites';

const POSTS_PER_PAGE = 50;

export default function Creator() {
    const { service, id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '0', 10);
    const offset = page * POSTS_PER_PAGE;

    const [filters, setFilters] = useState<FilterState>({ ...defaultFilters });
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return (localStorage.getItem('postsViewMode') as ViewMode) || 'grid';
    });

    const handleViewChange = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('postsViewMode', mode);
    };

    const { data: creatorInfo } = useSWR<KemonoCreator[]>(getApiUrl('/creators'), fetcher);
    const creator = creatorInfo?.find(c => c.service === service && c.id === id);

    const { isFavourite, toggleFavourite } = useFavourites();
    const isCreatorFavourite = service && id ? isFavourite(service, id) : false;

    const { data: rawData, error, isLoading } = useSWR<any>(
        service && id ? getApiUrl(`/${service}/user/${id}/posts?o=${offset}`) : null,
        fetcher
    );
    const posts: KemonoPost[] | undefined = Array.isArray(rawData) ? rawData : rawData?.posts;

    const { filteredPosts, totalCount } = usePostFilters(posts, filters);

    const goToPage = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        newPage === 0 ? params.delete('page') : params.set('page', newPage.toString());
        setSearchParams(params);
        window.scrollTo(0, 0);
    };

    if (error) return <div className="text-center text-red-500 mt-10">Failed to load posts</div>;

    return (
        <div className="space-y-6">
            {/* Creator Header */}
            <div className="flex items-start gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={`https://img.kemono.su/icons/${service}/${id}`} />
                    <AvatarFallback className="text-lg">
                        {creator?.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight truncate">
                        {creator?.name || 'Creator'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="capitalize">{service}</Badge>
                        {creator && (
                            <span className="text-sm text-muted-foreground">
                                Last updated: {new Date(creator.updated * 1000).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
                {service && id && creator && (
                    <FavouriteButton
                        isFavourite={isCreatorFavourite}
                        onClick={() => toggleFavourite({ id, service, name: creator.name })}
                    />
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 justify-between">
                    <FilterBar filters={filters} onFilterChange={setFilters} showService={false} />
                    <ViewToggle view={viewMode} onViewChange={handleViewChange} />
                </div>
                <ActiveFilters filters={filters} onFilterChange={setFilters} totalCount={totalCount} filteredCount={filteredPosts.length} />
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
