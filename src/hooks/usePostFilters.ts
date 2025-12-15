import { useMemo } from 'react';
import type { KemonoPost } from '@/types';
import type { FilterState } from '@/components/kemono/FilterBar';
import { isImageFile, isVideoFile, isAudioFile } from '@/components/kemono/FilterBar';

function postHasContentType(post: KemonoPost, type: string): boolean {
    const allPaths = [
        post.file?.path,
        ...(post.attachments?.map(a => a.path) || [])
    ].filter(Boolean) as string[];

    switch (type) {
        case 'images':
            return allPaths.some(isImageFile);
        case 'videos':
            return allPaths.some(isVideoFile);
        case 'audio':
            return allPaths.some(isAudioFile);
        case 'files':
            return allPaths.some(p => !isImageFile(p) && !isVideoFile(p) && !isAudioFile(p));
        default:
            return true;
    }
}

export function usePostFilters(posts: KemonoPost[] | undefined, filters: FilterState) {
    const filteredPosts = useMemo(() => {
        if (!posts) return [];

        return posts.filter((post) => {
            // Service filter
            if (filters.service !== 'all' && post.service !== filters.service) {
                return false;
            }
            // Attachments filter
            if (filters.hasAttachments && (!post.attachments || post.attachments.length === 0)) {
                return false;
            }
            // Content type filter
            if (filters.contentType !== 'all' && !postHasContentType(post, filters.contentType)) {
                return false;
            }
            // Local search filter
            if (filters.searchQuery) {
                const searchLower = filters.searchQuery.toLowerCase();
                const titleMatch = post.title?.toLowerCase().includes(searchLower);
                const contentMatch = post.content?.toLowerCase().includes(searchLower);
                if (!titleMatch && !contentMatch) return false;
            }
            return true;
        });
    }, [posts, filters]);

    const sortedPosts = useMemo(() => {
        const sorted = [...filteredPosts];
        switch (filters.sort) {
            case 'published_asc':
                sorted.sort((a, b) => new Date(a.published).getTime() - new Date(b.published).getTime());
                break;
            case 'indexed':
                sorted.sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime());
                break;
            case 'published':
            default:
                sorted.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
        }
        return sorted;
    }, [filteredPosts, filters.sort]);

    return { filteredPosts: sortedPosts, totalCount: posts?.length || 0 };
}
