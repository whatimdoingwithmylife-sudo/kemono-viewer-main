import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import useSWR from 'swr';
import { fetcher, buildUrl, buildThumbnailUrl, getImageUrl, getApiUrl } from '@/lib/api';
import type { KemonoPostResponse, KemonoAttachmentExtended, KemonoPreview, KemonoCreator, KemonoPost, KemonoRecommendedCreator } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MiniPostCard, MiniPostCardSkeleton } from '@/components/kemono/MiniPostCard';
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  FileText,
  Download as DownloadIcon,
  Calendar,
  Video,
  Music,
  Paperclip,
  Link as LinkIcon,
  X,
  ChevronLeft,
  ChevronRight,
  PanelBottom,
  PanelBottomClose,
} from 'lucide-react';
import { LazyLightbox } from '@/components/kemono/LazyLightbox';
import { DeferredSection } from '@/components/kemono/DeferredSection';

// Image extensions for checking file types
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];

const isImageFile = (path: string | undefined) => path ? IMAGE_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext)) : false;
const isVideoFile = (path: string | undefined) => path ? VIDEO_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext)) : false;
const isAudioFile = (path: string | undefined) => path ? AUDIO_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext)) : false;
const hasValidPath = (path: string | undefined) => path && path.trim().length > 0;

// Format date from various formats (ISO string, timestamp, etc.)
const formatDate = (dateValue: string | number | undefined): string => {
    if (!dateValue) return 'Unknown date';

    try {
        let date: Date;

        // If it's a number (Unix timestamp)
        if (typeof dateValue === 'number') {
            // Check if it's in seconds or milliseconds
            date = new Date(dateValue > 9999999999 ? dateValue : dateValue * 1000);
        } else {
            // Try parsing as ISO string or other string format
            date = new Date(dateValue);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Unknown date';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return 'Unknown date';
    }
};

// Image dimensions cache for masonry layout
interface ImageDimensions {
    width: number;
    height: number;
    aspectRatio: number;
}

// Module-level cache to persist dimensions across re-renders and component instances
const dimensionCache = new Map<string, ImageDimensions>();
// Track URLs currently being loaded to prevent duplicate requests
const loadingUrls = new Set<string>();

// Hook to load image dimensions with module-level caching
function useImageDimensions(urls: string[]) {
    const [dimensions, setDimensions] = useState<Record<string, ImageDimensions>>(() => {
        // Initialize from cache for already-loaded URLs
        const initial: Record<string, ImageDimensions> = {};
        urls.forEach(url => {
            const cached = dimensionCache.get(url);
            if (cached) {
                initial[url] = cached;
            }
        });
        return initial;
    });

    useEffect(() => {
        // Only process URLs that aren't cached and aren't currently loading
        const uncachedUrls = urls.filter(url => 
            !dimensionCache.has(url) && !loadingUrls.has(url)
        );

        uncachedUrls.forEach(url => {
            loadingUrls.add(url);
            
            const img = new window.Image();
            img.onload = () => {
                const dims: ImageDimensions = {
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    aspectRatio: img.naturalWidth / img.naturalHeight
                };
                // Store in module-level cache
                dimensionCache.set(url, dims);
                loadingUrls.delete(url);
                
                setDimensions(prev => ({
                    ...prev,
                    [url]: dims
                }));
            };
            img.onerror = () => {
                loadingUrls.delete(url);
            };
            img.src = url;
        });
    }, [urls]);

    return dimensions;
}

// Masonry-style Image Gallery Component
interface GalleryImage {
    src: string;
    thumbnail: string;
    name: string;
}

function ImageGallery({
    images,
    mainImage,
    onImageClick,
    imageLoadStates,
    onImageLoad
}: {
    images: GalleryImage[];
    mainImage?: GalleryImage;
    onImageClick: (index: number) => void;
    imageLoadStates: Record<number, boolean>;
    onImageLoad: (index: number) => void;
}) {
    const allImages = mainImage ? [mainImage, ...images] : images;
    const thumbnailUrls = allImages.map(img => img.thumbnail);
    const dimensions = useImageDimensions(thumbnailUrls);

    // Calculate span for CSS grid based on aspect ratio
    const getSpan = useCallback((aspectRatio: number): { colSpan: number; rowSpan: number } => {
        if (aspectRatio > 1.5) {
            // Wide/landscape image
            return { colSpan: 2, rowSpan: 1 };
        } else if (aspectRatio < 0.7) {
            // Tall/portrait image
            return { colSpan: 1, rowSpan: 2 };
        }
        // Square-ish
        return { colSpan: 1, rowSpan: 1 };
    }, []);

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Images ({allImages.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div 
                    className="grid gap-2 sm:gap-3"
                    style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(120px, 45vw), 1fr))',
                        gridAutoRows: 'minmax(100px, 150px)',
                        gridAutoFlow: 'dense'
                    }}
                >
                    {allImages.map((img, idx) => {
                        const dim = dimensions[img.thumbnail];
                        const span = dim ? getSpan(dim.aspectRatio) : { colSpan: 1, rowSpan: 1 };
                        
                        return (
                            <div
                                key={idx}
                                className="group relative cursor-pointer rounded-lg overflow-hidden border bg-muted"
                                style={{
                                    gridColumn: `span ${span.colSpan}`,
                                    gridRow: `span ${span.rowSpan}`
                                }}
                                onClick={() => onImageClick(idx)}
                            >
                                {!imageLoadStates[idx] && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse" />
                                )}
                                <img
                                    src={img.thumbnail}
                                    alt={img.name}
                                    className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                                        imageLoadStates[idx] ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    onLoad={() => onImageLoad(idx)}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                                        <ZoomIn className="h-7 w-7 text-white drop-shadow-lg" />
                                        {dim && (
                                            <span className="text-white text-xs font-medium drop-shadow-lg">
                                                {dim.width} × {dim.height}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {idx === 0 && mainImage && (
                                    <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                                        Main
                                    </Badge>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default function Post() {
    const { service, user, id } = useParams();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [imageLoadStates, setImageLoadStates] = useState<Record<number, boolean>>({});

    const { data: rawData, error, isLoading } = useSWR<KemonoPostResponse>(
        service && user && id ? getApiUrl(`/${service}/user/${user}/post/${id}`) : null,
        fetcher
    );

    // Fetch specific creator info (optimized - fetches only this creator, not all)
    const { data: creator } = useSWR<KemonoCreator>(
        service && user ? getApiUrl(`/${service}/user/${user}/profile`) : null,
        fetcher,
        { 
            // Don't fail the whole page if creator profile fails
            onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
                // Don't retry on 404
                if (error?.status === 404) return;
                // Only retry up to 2 times
                if (retryCount >= 2) return;
                setTimeout(() => revalidate({ retryCount }), 1000);
            }
        }
    );

    // Extract post and extended info from the response
    const post = rawData?.post;
    const extendedAttachments = rawData?.attachments || [];
    const previews = rawData?.previews || [];

    const handleImageLoad = (index: number) => {
        setImageLoadStates(prev => ({ ...prev, [index]: true }));
    };

    // Helper to find extended attachment info (with server)
    const findExtendedAttachment = (path: string): KemonoAttachmentExtended | undefined => {
        return extendedAttachments.find(att => att.path === path);
    };

    // Helper to find preview info
    const findPreview = (path: string): KemonoPreview | undefined => {
        return previews.find(p => p.path === path);
    };

    // Get any available server from the response (for fallback)
    const getDefaultServer = (): string | undefined => {
        // Try to get server from extended attachments first
        if (extendedAttachments.length > 0 && extendedAttachments[0].server) {
            return extendedAttachments[0].server;
        }
        // Then try previews
        if (previews.length > 0 && previews[0].server) {
            return previews[0].server;
        }
        return undefined;
    };

    // Get the best URL for an attachment (using server if available)
    const getAttachmentUrl = (path: string): string => {
        // First try to find exact match in extended attachments
        const extended = findExtendedAttachment(path);
        if (extended?.server) {
            return buildUrl(extended.server, path);
        }

        // Fallback: Use server from another attachment in the same post
        const defaultServer = getDefaultServer();
        if (defaultServer) {
            return buildUrl(defaultServer, path);
        }

        // Ultimate fallback: Use hardcoded server
        return getImageUrl(path);
    };

    // Get thumbnail URL (using preview server if available)
    const getPreviewThumbnailUrl = (path: string): string => {
        const preview = findPreview(path);
        if (preview?.server) {
            return buildThumbnailUrl(preview.server, path);
        }
        return buildThumbnailUrl('', path);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="text-6xl mb-4">😢</div>
                <h2 className="text-2xl font-bold text-red-500 mb-2">Failed to load post</h2>
                <p className="text-muted-foreground mb-4">The post could not be loaded. Please try again later.</p>
                <Button asChild variant="outline">
                    <Link to="/">Go Home</Link>
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 sm:h-10 w-3/4" />
                        <div className="flex gap-2 mt-2">
                            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                            <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                        <Skeleton className="h-16 sm:h-24 w-full" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className={`aspect-square w-full ${i >= 4 ? 'hidden sm:block' : ''}`} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold mb-2">Post not found</h2>
                <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist or has been removed.</p>
                <Button asChild variant="outline">
                    <Link to="/">Go Home</Link>
                </Button>
            </div>
        );
    }

    // Separate attachments by type (only include ones with valid paths)
    const imageAttachments = post.attachments?.filter(att => hasValidPath(att.path) && isImageFile(att.path)) || [];
    const videoAttachments = post.attachments?.filter(att => hasValidPath(att.path) && isVideoFile(att.path)) || [];
    const audioAttachments = post.attachments?.filter(att => hasValidPath(att.path) && isAudioFile(att.path)) || [];
    const otherAttachments = post.attachments?.filter(att =>
        hasValidPath(att.path) && !isImageFile(att.path) && !isVideoFile(att.path) && !isAudioFile(att.path)
    ) || [];

    // Check main file type (must have valid path)
    const mainFileIsImage = hasValidPath(post.file?.path) && isImageFile(post.file?.path);
    const mainFileIsVideo = hasValidPath(post.file?.path) && isVideoFile(post.file?.path);
    const mainFileIsAudio = hasValidPath(post.file?.path) && isAudioFile(post.file?.path);

    return (
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8 px-2 sm:px-4 py-4 sm:py-6">
            {/* Header Card */}
            <Card className="overflow-hidden border-2">
                <CardHeader className="pb-6">
                    {/* Creator Info Row */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <Link to={`/creator/${post.service}/${post.user}`}>
                            <Avatar className="h-10 w-10 sm:h-14 sm:w-14 ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
                                <AvatarImage
                                    src={`https://img.kemono.cr/icons/${post.service}/${post.user}`}
                                    alt={creator?.name || 'Creator'}
                                />
                                <AvatarFallback className="text-sm sm:text-lg font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                                    {creator?.name?.charAt(0).toUpperCase() || post.service.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <Link
                                to={`/creator/${post.service}/${post.user}`}
                                className="font-semibold text-base sm:text-lg hover:text-primary transition-colors line-clamp-1"
                            >
                                {creator?.name || 'Unknown Creator'}
                            </Link>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                                <Badge variant="default" className="capitalize text-xs">
                                    {post.service}
                                </Badge>
                                {creator?.updated && (
                                    <Badge variant="outline" className="text-muted-foreground text-xs hidden sm:inline-flex">
                                        Updated: {new Date(creator.updated * 1000).toLocaleDateString()}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground hidden md:block">
                            <div className="flex items-center gap-2 justify-end">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(post.published)}</span>
                            </div>
                            {post.edited && post.edited !== post.published && formatDate(post.edited) !== 'Unknown date' && (
                                <span className="text-xs">
                                    Edited: {formatDate(post.edited)}
                                </span>
                            )}
                        </div>
                    </div>

                    <Separator className="mb-4" />

                    {/* Post Title */}
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl leading-tight break-words">
                        {post.title || 'Untitled Post'}
                    </CardTitle>

                    {/* Mobile date display */}
                    <div className="text-sm text-muted-foreground mt-2 md:hidden">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(post.published)}</span>
                        </div>
                    </div>
                </CardHeader>

                {/* Post Content */}
                {post.content && (
                    <>
                        <Separator />
                        <CardContent className="pt-6">
                            <div
                                className="post-content text-sm md:text-base"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        </CardContent>
                    </>
                )}
            </Card>

            {/* Main File Video */}
            {post.file?.path && mainFileIsVideo && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Video className="h-5 w-5" />
                            Main Video
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg overflow-hidden border bg-black">
                            <video
                                controls
                                className="w-full max-h-[600px]"
                                preload="metadata"
                            >
                                <source src={getAttachmentUrl(post.file.path)} />
                                Your browser does not support the video tag.
                            </video>
                            <div className="p-3 bg-card border-t">
                                <p className="text-sm truncate">{post.file.name}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main File Audio */}
            {post.file?.path && mainFileIsAudio && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Music className="h-5 w-5" />
                            Main Audio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Music className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate mb-2">{post.file.name}</p>
                                <audio controls className="w-full h-8">
                                    <source src={getAttachmentUrl(post.file.path)} />
                                </audio>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main File (other types - download link) */}
            {post.file?.path && !mainFileIsImage && !mainFileIsVideo && !mainFileIsAudio && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Main File
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            href={getAttachmentUrl(post.file.path)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <DownloadIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{post.file.name}</p>
                                <p className="text-sm text-muted-foreground">Click to download</p>
                            </div>
                        </a>
                    </CardContent>
                </Card>
            )}

            {/* Image Gallery with Masonry Layout */}
            {(imageAttachments.length > 0 || mainFileIsImage) && (
                <ImageGallery
                    images={imageAttachments.map(att => ({
                        src: getAttachmentUrl(att.path),
                        thumbnail: getPreviewThumbnailUrl(att.path),
                        name: att.name
                    }))}
                    mainImage={mainFileIsImage && post?.file?.path ? {
                        src: getAttachmentUrl(post.file.path),
                        thumbnail: getPreviewThumbnailUrl(post.file.path),
                        name: post.file.name
                    } : undefined}
                    onImageClick={(index) => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                    }}
                    imageLoadStates={imageLoadStates}
                    onImageLoad={handleImageLoad}
                />
            )}

            {/* Video Attachments */}
            {videoAttachments.length > 0 && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Video className="h-5 w-5" />
                            Videos ({videoAttachments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            {videoAttachments.map((att, idx) => (
                                <div key={idx} className="rounded-lg overflow-hidden border bg-black">
                                    <video
                                        controls
                                        className="w-full max-h-[500px]"
                                        preload="metadata"
                                    >
                                        <source src={getAttachmentUrl(att.path)} />
                                        Your browser does not support the video tag.
                                    </video>
                                    <div className="p-3 bg-card border-t">
                                        <p className="text-sm truncate">{att.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Audio Attachments */}
            {audioAttachments.length > 0 && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Music className="h-5 w-5" />
                            Audio ({audioAttachments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {audioAttachments.map((att, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Music className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate mb-2">{att.name}</p>
                                        <audio controls className="w-full h-8">
                                            <source src={getAttachmentUrl(att.path)} />
                                        </audio>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Other Attachments */}
            {otherAttachments.length > 0 && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Paperclip className="h-5 w-5" />
                            Other Files ({otherAttachments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {otherAttachments.map((att, idx) => (
                                <a
                                    key={idx}
                                    href={getAttachmentUrl(att.path)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <FileText className="h-4.5 w-4.5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{att.name}</p>
                                        <p className="text-xs text-muted-foreground">Click to download</p>
                                    </div>
                                    <DownloadIcon className="h-4.5 w-4.5 text-muted-foreground" />
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Embed */}
            {post.embed?.url && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <LinkIcon className="h-5 w-5" />
                            Embedded Link
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            href={post.embed.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                        >
                            {post.embed.subject && (
                                <p className="font-semibold mb-1">{post.embed.subject}</p>
                            )}
                            {post.embed.description && (
                                <p className="text-sm text-muted-foreground mb-2">{post.embed.description}</p>
                            )}
                            <p className="text-sm text-primary truncate">{post.embed.url}</p>
                        </a>
                    </CardContent>
                </Card>
            )}

            {/* Lightbox Viewer - Lazy loaded for performance */}
            <LazyLightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                index={lightboxIndex}
                slides={(() => {
                    const slides: { src: string; alt?: string; download?: string }[] = [];
                    if (mainFileIsImage && post?.file?.path) {
                        slides.push({ 
                            src: getAttachmentUrl(post.file.path), 
                            alt: post.file.name,
                            download: post.file.name
                        });
                    }
                    imageAttachments.forEach(att => {
                        slides.push({ 
                            src: getAttachmentUrl(att.path), 
                            alt: att.name,
                            download: att.name
                        });
                    });
                    return slides;
                })()}
                zoom={{
                    maxZoomPixelRatio: 5,
                    zoomInMultiplier: 2,
                    doubleTapDelay: 300,
                    doubleClickDelay: 300,
                    doubleClickMaxStops: 2,
                    keyboardMoveDistance: 50,
                    wheelZoomDistanceFactor: 100,
                    pinchZoomDistanceFactor: 100,
                    scrollToZoom: true
                }}
                thumbnails={{
                    position: 'bottom',
                    width: 80,
                    height: 60,
                    border: 2,
                    borderRadius: 4,
                    padding: 4,
                    gap: 8,
                    showToggle: true
                }}
                carousel={{
                    finite: false,
                    preload: 2,
                    padding: '16px',
                    spacing: '30%'
                }}
                animation={{ fade: 250, swipe: 500 }}
                controller={{ closeOnBackdropClick: true }}
                styles={{
                    container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
                    thumbnailsContainer: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
                }}
                render={{
                    iconPrev: () => <ChevronLeft className="h-6 w-6" />,
                    iconNext: () => <ChevronRight className="h-6 w-6" />,
                    iconClose: () => <X className="h-5 w-5" />,
                    iconZoomIn: () => <ZoomIn className="h-5 w-5" />,
                    iconZoomOut: () => <ZoomOut className="h-5 w-5" />,
                    iconDownload: () => <DownloadIcon className="h-5 w-5" />,
                    iconThumbnailsVisible: () => <PanelBottom className="h-5 w-5" />,
                    iconThumbnailsHidden: () => <PanelBottomClose className="h-5 w-5" />,
                }}
            />

            {/* More from this creator - Deferred until scrolled into view */}
            <DeferredSection
                fallback={
                    <Card>
                        <CardHeader className="pb-4">
                            <Skeleton className="h-6 w-40 sm:w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className={`aspect-video w-full rounded-lg ${i >= 2 ? 'hidden sm:block' : ''}`} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                }
            >
                <MoreFromCreator service={post.service} userId={post.user} currentPostId={post.id} creatorName={creator?.name} />
            </DeferredSection>

            {/* Similar Creators - Deferred until scrolled into view */}
            <DeferredSection
                fallback={
                    <Card>
                        <CardHeader className="pb-4">
                            <Skeleton className="h-6 w-40 sm:w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-8 w-28 sm:w-32" />
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                            {[...Array(3)].map((_, j) => (
                                                <Skeleton key={j} className={`aspect-video w-full rounded-lg ${j >= 2 ? 'hidden sm:block' : ''}`} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                }
            >
                <SimilarCreators service={post.service} userId={post.user} />
            </DeferredSection>
        </div>
    );
}

// Component to show more posts from the same creator
const MoreFromCreator = memo(function MoreFromCreator({ service, userId, currentPostId, creatorName }: { 
    service: string; 
    userId: string; 
    currentPostId: string;
    creatorName?: string;
}) {
    const { data: rawData, isLoading } = useSWR<any>(
        service && userId ? getApiUrl(`/${service}/user/${userId}/posts?o=0`) : null,
        fetcher,
        { revalidateOnFocus: false }
    );
    
    const posts: KemonoPost[] | undefined = Array.isArray(rawData) ? rawData : rawData?.posts;
    
    // Filter out current post and limit to 6
    const otherPosts = posts?.filter(p => p.id !== currentPostId).slice(0, 6);
    
    // Show skeleton while loading
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="7" height="7" x="3" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="14" rx="1" />
                            <rect width="7" height="7" x="3" y="14" rx="1" />
                        </svg>
                        More from {creatorName || 'this creator'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                        {[...Array(6)].map((_, idx) => (
                            <MiniPostCardSkeleton key={idx} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (!otherPosts || otherPosts.length === 0) return null;
    
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="7" height="7" x="3" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="14" rx="1" />
                        <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                    More from {creatorName || 'this creator'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                    {otherPosts.map(post => (
                        <MiniPostCard key={post.id} post={post} />
                    ))}
                </div>
                <div className="mt-4 text-center">
                    <Link to={`/creator/${service}/${userId}`}>
                        <Button variant="outline" size="sm">
                            View all posts →
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
});

// Component to show posts from similar/recommended creators
function SimilarCreators({ service, userId }: { service: string; userId: string }) {
    const { data: recommended } = useSWR<KemonoRecommendedCreator[]>(
        service && userId ? getApiUrl(`/${service}/user/${userId}/recommended`) : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    // Get top 4 similar creators
    const topCreators = recommended?.slice(0, 4) || [];

    if (topCreators.length === 0) return null;

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Similar Creators
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {topCreators.map(creator => (
                    <SimilarCreatorPosts key={`${creator.service}-${creator.id}`} creator={creator} />
                ))}
            </CardContent>
        </Card>
    );
}

// Posts from a single similar creator - memoized to prevent re-renders
const SimilarCreatorPosts = memo(function SimilarCreatorPosts({ creator }: { creator: KemonoRecommendedCreator }) {
    const { data: rawData, isLoading } = useSWR<any>(
        creator.service && creator.id ? getApiUrl(`/${creator.service}/user/${creator.id}/posts?o=0`) : null,
        fetcher,
        { revalidateOnFocus: false } // Prevent refetch on window focus
    );
    
    const posts: KemonoPost[] | undefined = Array.isArray(rawData) ? rawData : rawData?.posts;
    const topPosts = posts?.slice(0, 4);
    
    // Show skeleton while loading
    if (isLoading) {
        return (
            <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
                {/* Creator header skeleton */}
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </div>
                {/* Posts grid skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[...Array(4)].map((_, idx) => (
                        <div key={idx} className={idx >= 2 ? 'hidden sm:block' : ''}>
                            <MiniPostCardSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    if (!topPosts || topPosts.length === 0) return null;
    
    return (
        <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
            {/* Creator header */}
            <Link 
                to={`/creator/${creator.service}/${creator.id}`} 
                className="flex items-center gap-3 group"
            >
                <Avatar className="h-10 w-10 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                    <AvatarImage
                        src={`https://img.kemono.cr/icons/${creator.service}/${creator.id}`}
                        alt={creator.name}
                        loading="lazy"
                    />
                    <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/20 to-primary/5">
                        {creator.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                        {creator.name}
                    </p>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                            {creator.service}
                        </Badge>
                    </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            
            {/* Posts grid - responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {topPosts.map((post, idx) => (
                    <div key={post.id} className={idx >= 2 ? 'hidden sm:block' : ''}>
                        <MiniPostCard post={post} />
                    </div>
                ))}
            </div>
        </div>
    );
});
