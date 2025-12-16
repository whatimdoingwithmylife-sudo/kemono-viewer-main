import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { KemonoPost } from '@/types';
import { getThumbnailUrl } from '@/lib/api';

interface MiniPostCardProps {
    post: KemonoPost;
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

// Shared icon components for consistency
const VideoIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
);

const ImageIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
);

const VideoPlaceholderIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
);

export function MiniPostCard({ post }: MiniPostCardProps) {
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
            <div className="group rounded-lg overflow-hidden border bg-card hover:bg-accent/50 transition-all">
                <div className="aspect-video bg-muted relative overflow-hidden">
                    {hasPreview ? (
                        <>
                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse" />
                            )}
                            <img
                                src={thumbnailUrl}
                                alt={post.title || 'Post'}
                                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                                loading="lazy"
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                            {hasVideo ? (
                                <VideoPlaceholderIcon className="h-8 w-8 text-muted-foreground/40" />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                            )}
                        </div>
                    )}
                    {/* Badges overlay */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                        {hasVideo && (
                            <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <VideoIcon className="h-3 w-3" />
                            </div>
                        )}
                        {attachmentCount > 0 && (
                            <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" />
                                {attachmentCount}
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-2">
                    <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {post.title || 'Untitled'}
                    </p>
                </div>
            </div>
        </Link>
    );
}
