import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export const SERVICES = [
    { value: 'all', label: 'All Services' },
    { value: 'patreon', label: 'Patreon' },
    { value: 'fanbox', label: 'Fanbox' },
    { value: 'discord', label: 'Discord' },
    { value: 'fantia', label: 'Fantia' },
    { value: 'boosty', label: 'Boosty' },
    { value: 'gumroad', label: 'Gumroad' },
    { value: 'subscribestar', label: 'SubscribeStar' },
    { value: 'dlsite', label: 'DLsite' },
];

export const SORT_OPTIONS = [
    { value: 'published', label: 'Newest First' },
    { value: 'published_asc', label: 'Oldest First' },
    { value: 'indexed', label: 'Recently Added' },
];

export const CONTENT_TYPE_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'images', label: 'Images' },
    { value: 'videos', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'files', label: 'Other Files' },
];

// File extension helpers
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];
export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];

export const isImageFile = (path: string | undefined) =>
    path ? IMAGE_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext)) : false;
export const isVideoFile = (path: string | undefined) =>
    path ? VIDEO_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext)) : false;
export const isAudioFile = (path: string | undefined) =>
    path ? AUDIO_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext)) : false;

export interface FilterState {
    service: string;
    sort: string;
    hasAttachments: boolean;
    contentType: string;
    searchQuery: string;
}

interface FilterBarProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    showSort?: boolean;
    showService?: boolean;
    showContentType?: boolean;
}

export function FilterBar({
    filters,
    onFilterChange,
    showSort = true,
    showService = true,
    showContentType = true,
}: FilterBarProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);

    const activeFilterCount = [
        showService && filters.service !== 'all',
        filters.sort !== 'published',
        filters.hasAttachments,
        showContentType && filters.contentType !== 'all',
    ].filter(Boolean).length;

    return (
        <>
            {/* Mobile: Single filter button */}
            <div className="sm:hidden">
                <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="default" className="gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" align="start">
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm">Filters</h4>
                            
                            {showService && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Service</Label>
                                    <Select value={filters.service} onValueChange={(value) => onFilterChange({ ...filters, service: value })}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Service" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SERVICES.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {showContentType && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Content Type</Label>
                                    <Select value={filters.contentType} onValueChange={(value) => onFilterChange({ ...filters, contentType: value })}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Content" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CONTENT_TYPE_OPTIONS.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {showSort && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Sort By</Label>
                                    <Select value={filters.sort} onValueChange={(value) => onFilterChange({ ...filters, sort: value })}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SORT_OPTIONS.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="hasAttachmentsMobile"
                                    checked={filters.hasAttachments}
                                    onCheckedChange={(checked) => onFilterChange({ ...filters, hasAttachments: checked === true })}
                                />
                                <Label htmlFor="hasAttachmentsMobile" className="text-sm cursor-pointer">
                                    Has attachments only
                                </Label>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => onFilterChange(defaultFilters)}
                            >
                                Reset All Filters
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Desktop: Inline dropdowns */}
            <div className="hidden sm:flex gap-2 flex-wrap">
                {showService && (
                    <Select value={filters.service} onValueChange={(value) => onFilterChange({ ...filters, service: value })}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Service" />
                        </SelectTrigger>
                        <SelectContent>
                            {SERVICES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {showContentType && (
                    <Select value={filters.contentType} onValueChange={(value) => onFilterChange({ ...filters, contentType: value })}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Content" />
                        </SelectTrigger>
                        <SelectContent>
                            {CONTENT_TYPE_OPTIONS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {showSort && (
                    <Select value={filters.sort} onValueChange={(value) => onFilterChange({ ...filters, sort: value })}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="default" className="gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            More
                            {filters.hasAttachments && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    1
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="end">
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm">More Filters</h4>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hasAttachments"
                                    checked={filters.hasAttachments}
                                    onCheckedChange={(checked) => onFilterChange({ ...filters, hasAttachments: checked === true })}
                                />
                                <Label htmlFor="hasAttachments" className="text-sm cursor-pointer">
                                    Has attachments only
                                </Label>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => onFilterChange(defaultFilters)}
                            >
                                Reset All Filters
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </>
    );
}

export const defaultFilters: FilterState = {
    service: 'all',
    sort: 'published',
    hasAttachments: false,
    contentType: 'all',
    searchQuery: '',
};
