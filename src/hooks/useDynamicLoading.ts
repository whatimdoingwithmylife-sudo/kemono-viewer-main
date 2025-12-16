import { useState, useEffect, useCallback, useRef } from 'react';
import { fetcher, getApiUrl } from '@/lib/api';
import type { KemonoPost } from '@/types';
import type { FilterState } from '@/components/kemono/FilterBar';
import { isImageFile, isVideoFile, isAudioFile } from '@/components/kemono/FilterBar';

const POSTS_PER_PAGE = 50;
const MAX_ACCUMULATED_POSTS = 500;

function postMatchesFilters(post: KemonoPost, filters: FilterState): boolean {
    // Service filter
    if (filters.service !== 'all' && post.service !== filters.service) {
        return false;
    }
    // Attachments filter
    if (filters.hasAttachments && (!post.attachments || post.attachments.length === 0)) {
        return false;
    }
    // Content type filter
    if (filters.contentType !== 'all') {
        const allPaths = [
            post.file?.path,
            ...(post.attachments?.map(a => a.path) || [])
        ].filter(Boolean) as string[];

        const hasType = (() => {
            switch (filters.contentType) {
                case 'images': return allPaths.some(isImageFile);
                case 'videos': return allPaths.some(isVideoFile);
                case 'audio': return allPaths.some(isAudioFile);
                case 'files': return allPaths.some(p => !isImageFile(p) && !isVideoFile(p) && !isAudioFile(p));
                default: return true;
            }
        })();
        if (!hasType) return false;
    }
    // Search filter
    if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const titleMatch = post.title?.toLowerCase().includes(searchLower);
        const contentMatch = post.content?.toLowerCase().includes(searchLower);
        if (!titleMatch && !contentMatch) return false;
    }
    return true;
}

export interface DynamicLoadingState {
    posts: KemonoPost[];
    filteredPosts: KemonoPost[];
    isLoading: boolean;
    isDynamicLoading: boolean;
    error: Error | null;
    pagesLoaded: number;
    startPage: number;
    hasMore: boolean;
    totalFiltered: number;
}


interface UseDynamicLoadingOptions {
    // For creator page
    service?: string;
    userId?: string;
    // For home/recent page
    searchQuery?: string | null;
    // Common options
    filters: FilterState;
    page: number;
    enabled: boolean;
    threshold: number;
}

export function useDynamicLoading({
    service,
    userId,
    searchQuery,
    filters,
    page,
    enabled,
    threshold,
}: UseDynamicLoadingOptions): DynamicLoadingState & {
    loadMore: () => void;
} {
    const [state, setState] = useState<DynamicLoadingState>({
        posts: [],
        filteredPosts: [],
        isLoading: true,
        isDynamicLoading: false,
        error: null,
        pagesLoaded: 0,
        startPage: page,
        hasMore: true,
        totalFiltered: 0,
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const loadingRef = useRef(false);

    // Determine if this is creator mode or global mode
    const isCreatorMode = !!(service && userId);

    // Reset when key params change
    useEffect(() => {
        setState({
            posts: [],
            filteredPosts: [],
            isLoading: true,
            isDynamicLoading: false,
            error: null,
            pagesLoaded: 0,
            startPage: page,
            hasMore: true,
            totalFiltered: 0,
        });
    }, [service, userId, searchQuery, page]);

    const loadPage = useCallback(async (pageNum: number, accumulated: KemonoPost[]): Promise<{
        posts: KemonoPost[];
        hasMore: boolean;
    }> => {
        const offset = pageNum * POSTS_PER_PAGE;
        
        let url: string;
        if (isCreatorMode) {
            url = getApiUrl(`/${service}/user/${userId}/posts?o=${offset}`);
        } else {
            // Global posts endpoint
            url = getApiUrl(`/posts?${searchQuery ? `q=${searchQuery}&` : ''}o=${offset}`);
        }
        
        const rawData = await fetcher(url);
        const newPosts: KemonoPost[] = Array.isArray(rawData) ? rawData : rawData?.posts || [];
        
        return {
            posts: [...accumulated, ...newPosts],
            hasMore: newPosts.length >= POSTS_PER_PAGE,
        };
    }, [isCreatorMode, service, userId, searchQuery]);

    const loadDynamically = useCallback(async () => {
        if (loadingRef.current) return;
        // For creator mode, need service and userId
        if (isCreatorMode && (!service || !userId)) return;
        
        loadingRef.current = true;
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            let currentPage = page;
            let accumulated: KemonoPost[] = [];
            let hasMore = true;
            let pagesLoaded = 0;

            // Load first page
            const firstResult = await loadPage(currentPage, []);
            accumulated = firstResult.posts;
            hasMore = firstResult.hasMore;
            pagesLoaded = 1;

            // Filter posts
            let filtered = accumulated.filter(p => postMatchesFilters(p, filters));

            // If dynamic loading is enabled and we have few results, load more
            if (enabled && filtered.length < threshold && hasMore) {
                setState(prev => ({
                    ...prev,
                    isDynamicLoading: true,
                    posts: accumulated,
                    filteredPosts: filtered,
                    pagesLoaded,
                    hasMore,
                    totalFiltered: filtered.length,
                }));

                while (
                    filtered.length < threshold &&
                    hasMore &&
                    accumulated.length < MAX_ACCUMULATED_POSTS
                ) {
                    currentPage++;
                    const result = await loadPage(currentPage, accumulated);
                    accumulated = result.posts;
                    hasMore = result.hasMore;
                    pagesLoaded++;

                    filtered = accumulated.filter(p => postMatchesFilters(p, filters));

                    setState(prev => ({
                        ...prev,
                        posts: accumulated,
                        filteredPosts: filtered,
                        pagesLoaded,
                        hasMore,
                        totalFiltered: filtered.length,
                    }));
                }
            }

            setState(prev => ({
                ...prev,
                posts: accumulated,
                filteredPosts: filtered,
                isLoading: false,
                isDynamicLoading: false,
                pagesLoaded,
                hasMore,
                totalFiltered: filtered.length,
            }));
        } catch (err) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                isDynamicLoading: false,
                error: err as Error,
            }));
        } finally {
            loadingRef.current = false;
        }
    }, [isCreatorMode, service, userId, page, filters, enabled, threshold, loadPage]);

    // Trigger loading when dependencies change
    useEffect(() => {
        loadDynamically();
        
        return () => {
            abortControllerRef.current?.abort();
        };
    }, [loadDynamically]);

    const loadMore = useCallback(() => {
        // Manual load more - not implemented yet for this experimental feature
    }, []);

    return {
        ...state,
        loadMore,
    };
}
