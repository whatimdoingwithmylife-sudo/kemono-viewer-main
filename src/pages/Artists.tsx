import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetcher, getApiUrl } from '@/lib/api';
import type { KemonoCreator } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { SERVICES } from '@/components/kemono/FilterBar';
import { useFavourites } from '@/hooks/useFavourites';

const ARTISTS_PER_PAGE = 48;

const SORT_OPTIONS = [
    { value: 'updated', label: 'Recently Updated' },
    { value: 'indexed', label: 'Recently Indexed' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
];

export default function Artists() {
    const [searchQuery, setSearchQuery] = useState('');
    const [service, setService] = useState('all');
    const [sort, setSort] = useState('updated');
    const [page, setPage] = useState(0);

    const { data: creators, error, isLoading } = useSWR<KemonoCreator[]>(
        getApiUrl('/creators'),
        fetcher
    );

    const { isFavourite, toggleFavourite } = useFavourites();

    // Filter and sort creators
    const processedCreators = useMemo(() => {
        if (!creators) return [];

        let filtered = creators.filter((creator) => {
            // Service filter
            if (service !== 'all' && creator.service !== service) return false;
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!creator.name.toLowerCase().includes(query)) return false;
            }
            return true;
        });

        // Sort
        switch (sort) {
            case 'indexed':
                filtered.sort((a, b) => b.indexed - a.indexed);
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name_desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'updated':
            default:
                filtered.sort((a, b) => b.updated - a.updated);
        }

        return filtered;
    }, [creators, service, searchQuery, sort]);

    // Pagination
    const totalPages = Math.ceil(processedCreators.length / ARTISTS_PER_PAGE);
    const paginatedCreators = processedCreators.slice(
        page * ARTISTS_PER_PAGE,
        (page + 1) * ARTISTS_PER_PAGE
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
    };

    if (error) return <div className="text-center text-red-500 mt-10">Failed to load artists</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Artists</h1>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="relative flex-1 max-w-xs">
                        <Input
                            type="text"
                            placeholder="Search artists..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                            className="pr-8"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        </button>
                    </form>

                    <Select value={service} onValueChange={(v) => { setService(v); setPage(0); }}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Service" />
                        </SelectTrigger>
                        <SelectContent>
                            {SERVICES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sort} onValueChange={(v) => { setSort(v); setPage(0); }}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Results count */}
                {!isLoading && creators && (
                    <div className="text-sm text-muted-foreground">
                        Showing {paginatedCreators.length} of {processedCreators.length} artists
                        {processedCreators.length !== creators.length && ` (${creators.length} total)`}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="flex flex-col rounded-xl border bg-card overflow-hidden p-4 space-y-3">
                            <Skeleton className="h-5 w-3/4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : Array.isArray(creators) ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedCreators.map((creator) => (
                            <Card key={`${creator.service}-${creator.id}`} className="h-full hover:bg-accent/50 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 relative">
                                <Link to={`/creator/${creator.service}/${creator.id}`}>
                                    <CardHeader className="p-4 pr-12">
                                        <CardTitle className="text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                            {creator.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="flex gap-2 flex-wrap">
                                            <Badge variant="secondary" className="text-xs capitalize">
                                                {creator.service}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Updated: {new Date(creator.updated * 1000).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFavourite({ id: creator.id, service: creator.service, name: creator.name });
                                    }}
                                    title={isFavourite(creator.service, creator.id) ? 'Remove from favourites' : 'Add to favourites'}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill={isFavourite(creator.service, creator.id) ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={isFavourite(creator.service, creator.id) ? 'text-red-500' : ''}
                                    >
                                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                    </svg>
                                </Button>
                            </Card>
                        ))}
                        {paginatedCreators.length === 0 && (
                            <div className="col-span-full text-center text-muted-foreground py-10">
                                No artists found matching your criteria.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                                disabled={page === 0}
                            >
                                ← Previous
                            </Button>
                            <span className="px-4 text-sm text-muted-foreground">
                                Page {page + 1} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                                disabled={page >= totalPages - 1}
                            >
                                Next →
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="col-span-full text-center text-red-500">
                    <p>Unexpected API response format.</p>
                </div>
            )}
        </div>
    );
}
