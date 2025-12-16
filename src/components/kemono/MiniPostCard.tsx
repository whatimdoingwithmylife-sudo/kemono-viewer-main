import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import type { KemonoPost } from '@/types';
import { getThumbnailUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Play, Image, Video } from 'lucide-react';

interface MiniPostCardProps {
    post: KemonoPost;
}

// Skeleton loading state for MiniPostCard
export function MiniPostCardSkeleton() {
    return (
        <Card className="overflow-hidden border">
            <AspectRatio ratio={16 / 9}>
                <Skeleton className="absolute inset-0 rounded-none" />
            </AspectRatio>
            <CardContent className="p-2">
                <Skeleton className="h-4 w-3/4" />
            </CardContent>
        </Card>
    );
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];

const isImageFile = (path: string | undefined): boolean => {
    if (!path) return false;
    return IMAGE_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext));
};

const isVideoFile = (path: string | undefined): boolean => {
    if (!path) return false;
    return VIDEO_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext));
};

export const MiniPostCard = memo(function MiniPostCard({ post }: MiniPostCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const hasVideoContent = (): boolean => {
        if (post.file?.path && isVideoFile(post.file.path)) return true;
        if (post.attachments?.some(att => isVideoFile(att.path))) return true;
        return false;
    };

    const getPreviewUrl = () => {
        if (post.file?.path && isImageFile(post.file.path)) {
            return getThumbnailUrl(post.file.path);
        }
        if (post.attachments && post.attachments.length > 0) {
            const firstImage = post.attachments.find(att => isImageFile(att.path));
            if (firstImage) return getThumbnailUrl(firstImage.path);
        }
        return null;
    };

    const thumbnailUrl = getPreviewUrl();
    const hasPreview = thumbnailUrl && !imageError;
    const hasVideo = hasVideoContent();
    const attachmentCount = post.attachments?.length || 0;

    return (
        <Link to={`/post/${post.service}/${post.user}/${post.id}`}>
            <Card className="group overflow-hidden hover:bg-accent/50 transition-colors border">
                <AspectRatio ratio={16 / 9} className="bg-muted relative overflow-hidden">
                    {hasPreview ? (
                        <>
                            {!imageLoaded && (
                                <Skeleton className="absolute inset-0 rounded-none" />
                            )}
                            <img
                                src={thumbnailUrl}
                                alt={post.title || 'Post'}
                                className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                                loading="lazy"
                                decoding="async"
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            {hasVideo ? (
                                <Video className="h-8 w-8 text-muted-foreground/40" />
                            ) : (
                                <Image className="h-8 w-8 text-muted-foreground/40" />
                            )}
                        </div>
                    )}
                    {/* Badges overlay */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                        {hasVideo && (
                            <Badge variant="secondary" className="bg-black/70 text-white border-0 px-1.5 py-0.5 h-auto">
                                <Play className="h-3 w-3" />
                            </Badge>
                        )}
                        {attachmentCount > 0 && (
                            <Badge variant="secondary" className="bg-black/70 text-white border-0 px-1.5 py-0.5 h-auto gap-1">
                                <Image className="h-3 w-3" />
                                <span className="text-xs">{attachmentCount}</span>
                            </Badge>
                        )}
                    </div>
                </AspectRatio>
                <CardContent className="p-2">
                    <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {post.title || 'Untitled'}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
});
