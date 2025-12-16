import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import useSWR from 'swr';
import { fetcher, getApiUrl } from '@/lib/api';
import type { KemonoPost, KemonoCreator, KemonoRecommendedCreator } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { FilterBar, defaultFilters } from '@/components/kemono/FilterBar';
import type { FilterState } from '@/components/kemono/FilterBar';
import { ViewToggle } from '@/components/kemono/ViewToggle';
import type { ViewMode } from '@/components/kemono/ViewToggle';
import { ActiveFilters } from '@/components/kemono/ActiveFilters';
import { PostGrid } from '@/components/kemono/PostGrid';
import { usePostFilters } from '@/hooks/usePostFilters';
import { FavouriteButton } from '@/components/kemono/FavouriteButton';
import { useFavourites } from '@/hooks/useFavourites';
import { useDynamicLoading } from '@/hooks/useDynamicLoading';
import { useSettings } from '@/hooks/useSettings';
import { Spinner } from '@/components/ui/spinner';

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

    const { settings } = useSettings();
    const isDynamicEnabled = settings.dynamicLoadingEnabled;

    // Dynamic loading hook
    const dynamicState = useDynamicLoading({
        service,
        userId: id,
        filters,
        page,
        enabled: isDynamicEnabled,
        threshold: settings.dynamicLoadingThreshold,
    });

    // Fallback to standard SWR when dynamic loading is disabled
    const { data: rawData, error: swrError, isLoading: swrLoading } = useSWR<any>(
        !isDynamicEnabled && service && id ? getApiUrl(`/${service}/user/${id}/posts?o=${offset}`) : null,
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
                    <AvatarImage src={`https://img.kemono.cr/icons/${service}/${id}`} />
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

            {/* Similar Creators - in header area */}
            {service && id && <SimilarCreators service={service} userId={id} />}

            {/* Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 justify-between">
                    <FilterBar filters={filters} onFilterChange={setFilters} showService={false} />
                    <ViewToggle view={viewMode} onViewChange={handleViewChange} />
                </div>
                <ActiveFilters filters={filters} onFilterChange={setFilters} totalCount={totalCount} filteredCount={filteredPosts.length} />
            
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

// Component to show similar/recommended creators with carousel
function SimilarCreators({ service, userId }: { service: string; userId: string }) {
    const { data: recommended } = useSWR<KemonoRecommendedCreator[]>(
        service && userId ? getApiUrl(`/${service}/user/${userId}/recommended`) : null,
        fetcher
    );

    if (!recommended || recommended.length === 0) return null;

    const topRecommended = recommended.slice(0, 12);

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Similar Creators
            </h3>
            <Carousel
                opts={{
                    align: 'start',
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {topRecommended.map(creator => (
                        <CarouselItem key={`${creator.service}-${creator.id}`} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                            <Link to={`/creator/${creator.service}/${creator.id}`}>
                                <Card className="hover:bg-accent/50 transition-all h-full">
                                    <CardContent className="flex flex-col items-center gap-2 p-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage
                                                src={`https://img.kemono.cr/icons/${creator.service}/${creator.id}`}
                                                alt={creator.name}
                                            />
                                            <AvatarFallback>
                                                {creator.name?.charAt(0).toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-center min-w-0 w-full">
                                            <p className="font-medium text-sm truncate">
                                                {creator.name}
                                            </p>
                                            <Badge variant="secondary" className="text-xs capitalize mt-1">
                                                {creator.service}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
            </Carousel>
        </div>
    );
}
