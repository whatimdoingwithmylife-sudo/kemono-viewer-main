import useSWR from 'swr';
import type { KemonoPost, KemonoCreator } from '@/types';
import type { ViewMode } from './ViewToggle';
import { PostCard } from './PostCard';
import { PostListItem } from './PostListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { fetcher, getApiUrl } from '@/lib/api';

interface PostGridProps {
    posts: KemonoPost[];
    viewMode: ViewMode;
    isLoading?: boolean;
    emptyMessage?: string;
    keyPrefix?: string;
}

export function PostGrid({ posts, viewMode, isLoading, emptyMessage = 'No posts found.', keyPrefix = '' }: PostGridProps) {
    // Fetch all creators to get names
    const { data: creators } = useSWR<KemonoCreator[]>(getApiUrl('/creators'), fetcher);
    
    // Create a lookup map for quick access
    const creatorMap = new Map<string, KemonoCreator>();
    creators?.forEach(c => {
        creatorMap.set(`${c.service}-${c.id}`, c);
    });
    
    const getCreator = (post: KemonoPost) => creatorMap.get(`${post.service}-${post.user}`);
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col rounded-xl border bg-card overflow-hidden">
                        <Skeleton className="aspect-video w-full rounded-none" />
                        <div className="p-3 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                {emptyMessage}
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="flex flex-col gap-3">
                {posts.map((post) => (
                    <PostListItem key={`${keyPrefix}${post.service}-${post.user}-${post.id}`} post={post} creator={getCreator(post)} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {posts.map((post) => (
                <PostCard key={`${keyPrefix}${post.service}-${post.user}-${post.id}`} post={post} creator={getCreator(post)} />
            ))}
        </div>
    );
}
