import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavouriteButtonProps {
    isFavourite: boolean;
    onClick: (e: React.MouseEvent) => void;
    size?: 'sm' | 'default' | 'icon';
    className?: string;
}

export function FavouriteButton({ isFavourite, onClick, size = 'default', className }: FavouriteButtonProps) {
    return (
        <Button
            variant={isFavourite ? 'default' : 'outline'}
            size={size}
            onClick={onClick}
            className={cn('gap-2', className)}
            title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={isFavourite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            {size !== 'icon' && (isFavourite ? 'Favourited' : 'Favourite')}
        </Button>
    );
}
