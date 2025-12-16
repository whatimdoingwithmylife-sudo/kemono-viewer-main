import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import type { KemonoPost, KemonoCreator } from '@/types';
import { getThumbnailUrl } from '@/lib/api';

interface PostCardProps {
    post: KemonoPost;
    creator?: KemonoCreator;
}

export function PostCard({ post, creator }: PostCardProps) {
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

    // Relative time format (e.g., "2 days ago", "3 weeks ago")
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
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            const diffWeeks = Math.floor(diffDays / 7);
            const diffMonths = Math.floor(diffDays / 30);
            const diffYears = Math.floor(diffDays / 365);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            if (diffWeeks < 5) return `${diffWeeks}w ago`;
            if (diffMonths < 12) return `${diffMonths}mo ago`;
            return `${diffYears}y ago`;
        } catch {
            return '';
        }
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
    const textContent = post.content?.replace(/<[^>]*>?/gm, '').trim();

    return (
        <Link to={`/post/${post.service}/${post.user}/${post.id}`}>
            <Card className="h-full hover:bg-accent/50 transition-all duration-300 cursor-pointer overflow-hidden group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                {/* Image */}
                <div className="relative overflow-hidden">
                    <AspectRatio ratio={16 / 9} className="bg-muted">
                        {hasPreview ? (
                            <>
                                {!imageLoaded && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse" />
                                )}
                                <img
                                    src={thumbnailUrl}
                                    alt={post.title || 'Post preview'}
                                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageError(true)}
                                    loading="lazy"
                                />
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                                {hasVideoContent() ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                                        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                                        <rect x="2" y="6" width="14" height="12" rx="2" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                    </svg>
                                )}
                            </div>
                        )}
                    </AspectRatio>

                    {/* Badges overlay */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                        <Badge variant="secondary" className="text-xs capitalize bg-black/60 text-white border-0 backdrop-blur-sm">
                            {post.service}
                        </Badge>
                        <div className="flex items-center gap-1">
                            {hasVideoContent() && (
                                <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="6 3 20 12 6 21 6 3" />
                                    </svg>
                                </div>
                            )}
                            {post.attachments && post.attachments.length > 0 && (
                                <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                    </svg>
                                    {post.attachments.length}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-3">
                    <h3 className="font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title || 'Untitled Post'}
                    </h3>
                    
                    {textContent && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{textContent}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
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
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {creator?.name || 'Unknown'}
                            </span>
                        </Link>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(post.published)}</span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
