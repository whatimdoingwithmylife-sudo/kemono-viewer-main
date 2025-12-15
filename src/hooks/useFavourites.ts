import { useState, useEffect, useCallback } from 'react';

export interface FavouriteArtist {
    id: string;
    service: string;
    name: string;
    addedAt: number;
}

const STORAGE_KEY = 'kemono-favourite-artists';

function loadFavourites(): FavouriteArtist[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveFavourites(favourites: FavouriteArtist[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
}

export function useFavourites() {
    const [favourites, setFavourites] = useState<FavouriteArtist[]>(loadFavourites);

    // Sync across tabs
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                setFavourites(loadFavourites());
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const isFavourite = useCallback(
        (service: string, id: string) => favourites.some(f => f.service === service && f.id === id),
        [favourites]
    );

    const addFavourite = useCallback((artist: Omit<FavouriteArtist, 'addedAt'>) => {
        setFavourites(prev => {
            if (prev.some(f => f.service === artist.service && f.id === artist.id)) return prev;
            const updated = [...prev, { ...artist, addedAt: Date.now() }];
            saveFavourites(updated);
            return updated;
        });
    }, []);

    const removeFavourite = useCallback((service: string, id: string) => {
        setFavourites(prev => {
            const updated = prev.filter(f => !(f.service === service && f.id === id));
            saveFavourites(updated);
            return updated;
        });
    }, []);

    const toggleFavourite = useCallback((artist: Omit<FavouriteArtist, 'addedAt'>) => {
        if (isFavourite(artist.service, artist.id)) {
            removeFavourite(artist.service, artist.id);
        } else {
            addFavourite(artist);
        }
    }, [isFavourite, addFavourite, removeFavourite]);

    return { favourites, isFavourite, addFavourite, removeFavourite, toggleFavourite };
}
