import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFavourites } from '@/hooks/useFavourites';
import { PostGrid } from '@/components/kemono/PostGrid';
import { ViewToggle } from '@/components/kemono/ViewToggle';
import type { ViewMode } from '@/components/kemono/ViewToggle';
import type { KemonoPost } from '@/types';

type TabType = 'feed' | 'artists';

export default function Favourites() {
    const { favourites, removeFavourite } = useFavourites();
    const [activeTab, setActiveTab] = useState<TabType>('feed');
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return (localStorage.getItem('postsViewMode') as ViewMode) || 'grid';
    });

    const handleViewChange = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('postsViewMode', mode);
    };

    const sortedFavourites = [...favourites].sort((a, b) => b.addedAt - a.addedAt);

    // Fetch posts for each favourited artist (limit to first 10 to avoid too many requests)
    const limitedFavourites = sortedFavourites.slice(0, 10);
    
    const { data: postsData, isLoading: postsLoading } = useSWR(
        limitedFavourites.length > 0 && activeTab === 'feed'
            ? limitedFavourites.map(f => `/api/v1/${f.service}/user/${f.id}/posts?o=0`)
            : null,
        async (urls: string[]) => {
            const results = await Promise.all(
                urls.map(url => fetcher(url).catch(() => []))
            );
            return results;
        },
        { revalidateOnFocus: false }
    );

    // Combine and sort all posts by published date
    const feedPosts = useMemo(() => {
        if (!postsData) return [];
        
        const allPosts: KemonoPost[] = [];
        postsData.forEach((data, index) => {
            const posts: KemonoPost[] = Array.isArray(data) ? data : data?.posts || [];
            // Add artist info to each post for context
            posts.forEach(post => {
                allPosts.push({
                    ...post,
                    // Ensure user field is set for linking
                    user: post.user || limitedFavourites[index]?.id,
                    service: post.service || limitedFavourites[index]?.service,
                });
            });
        });
        
        // Sort by published date (newest first)
        return allPosts.sort((a, b) => 
            new Date(b.published).getTime() - new Date(a.published).getTime()
        ).slice(0, 100); // Limit to 100 posts
    }, [postsData, limitedFavourites]);

    const EmptyState = () => (
        <div className="text-center py-16 space-y-4">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto text-muted-foreground"
            >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <p className="text-muted-foreground">No favourite artists yet</p>
            <Link to="/artists">
                <Button variant="outline">Browse Artists</Button>
            </Link>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Favourites</h1>
                
                {/* Tabs */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex gap-1 p-1 bg-muted rounded-lg w-full sm:w-auto">
                        <Button
                            variant={activeTab === 'feed' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('feed')}
                            className="gap-2 flex-1 sm:flex-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 11a9 9 0 0 1 9 9" />
                                <path d="M4 4a16 16 0 0 1 16 16" />
                                <circle cx="5" cy="19" r="1" />
                            </svg>
                            Feed
                        </Button>
                        <Button
                            variant={activeTab === 'artists' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('artists')}
                            className="gap-2 flex-1 sm:flex-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Artists ({favourites.length})
                        </Button>
                    </div>
                    
                    {activeTab === 'feed' && favourites.length > 0 && (
                        <ViewToggle view={viewMode} onViewChange={handleViewChange} />
                    )}
                </div>
            </div>

            {favourites.length === 0 ? (
                <EmptyState />
            ) : activeTab === 'feed' ? (
                <>
                    {favourites.length > 10 && (
                        <p className="text-sm text-muted-foreground">
                            Showing posts from your 10 most recently added artists
                        </p>
                    )}
                    <PostGrid
                        posts={feedPosts}
                        viewMode={viewMode}
                        isLoading={postsLoading}
                        emptyMessage="No posts found from your favourite artists."
                    />
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedFavourites.map((artist) => (
                        <Card key={`${artist.service}-${artist.id}`} className="group relative hover:bg-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                            <Link to={`/creator/${artist.service}/${artist.id}`}>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                        {artist.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="secondary" className="text-xs capitalize">
                                            {artist.service}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Added: {new Date(artist.addedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                    e.preventDefault();
                                    removeFavourite(artist.service, artist.id);
                                }}
                                title="Remove from favourites"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
