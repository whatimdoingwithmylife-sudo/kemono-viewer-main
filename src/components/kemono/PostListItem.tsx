import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import type { KemonoPost, KemonoCreator } from '@/types';
import { getThumbnailUrl } from '@/lib/api';

interface PostListItemProps {
    post: KemonoPost;
    creator?: KemonoCreator;
}

export function PostListItem({ post, creator }: PostListItemProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];

    const isImageFile = (path: string | undefined): boolean => {
        if (!path) return false;
        return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
    };

    const isVideoFile = (path: string | undefined): boolean => {
        if (!path) return false;
        return videoExtensions.some(ext => path.toLowerCase().endsWith(ext));
    };

    const hasVideoContent = (): boolean => {
        if (post.file?.path && isVideoFile(post.file.path)) return true;
        if (post.attachments?.some(att => isVideoFile(att.path))) return true;
        return false;
    };

    const formatRelativeTime = (dateValue: string | number | undefined): string => {
        if (!dateValue) return '';
        try {
            let date: Date;
            if (typeof dateValue === 'number') {
                date = new Date(dateValue > 9999999999 ? dateValue : dateValue * 1000);
            } else {
                date = new Date(dateValue);
            }
            if (isNaN(date.getTime())) return '';
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffDays < 1) return 'Today';
            if (diffDays < 7) return `${diffDays}d ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
            return `${Math.floor(diffDays / 365)}y ago`;
        } catch {
            return '';
        }
    };

    const getPreviewUrl = () => {
        if (post.file?.path && isImageFile(post.file.path)) return getThumbnailUrl(post.file.path);
        const firstImage = post.attachments?.find(att => isImageFile(att.path));
        if (firstImage) return getThumbnailUrl(firstImage.path);
        return null;
    };

    const thumbnailUrl = getPreviewUrl();
    const hasPreview = thumbnailUrl && !imageError;
    const textContent = post.content?.replace(/<[^>]*>?/gm, '').trim();

    return (
        <Link to={`/post/${post.service}/${post.user}/${post.id}`}>
            <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-primary/5">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {hasPreview ? (
                        <>
                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse" />
                            )}
                            <img
                                src={thumbnailUrl}
                                alt={post.title || 'Post preview'}
                                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                                loading="lazy"
                            />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                            {hasVideoContent() ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                                    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                                    <rect x="2" y="6" width="14" height="12" rx="2" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 sm:py-1">
                    <div>
                        <h3 className="font-medium leading-tight line-clamp-1 sm:line-clamp-2 group-hover:text-primary transition-colors text-sm sm:text-base">
                            {post.title || 'Untitled Post'}
                        </h3>
                        {textContent && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 hidden sm:block">{textContent}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                        <Link 
                            to={`/creator/${post.service}/${post.user}`} 
                            className="flex items-center gap-1.5 hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={`https://img.kemono.cr/icons/${post.service}/${post.user}`} />
                                <AvatarFallback className="text-[10px]">
                                    {creator?.name?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-[120px]">
                                {creator?.name || 'Unknown'}
                            </span>
                        </Link>
                        <Badge variant="secondary" className="text-xs capitalize">
                            {post.service}
                        </Badge>
                        {hasVideoContent() && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="6 3 20 12 6 21 6 3" />
                                </svg>
                                Video
                            </span>
                        )}
                        {post.attachments && post.attachments.length > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                                {post.attachments.length}
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(post.published)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
