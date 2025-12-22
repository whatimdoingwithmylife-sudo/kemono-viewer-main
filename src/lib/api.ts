import { buildProxiedUrl, rotateProxy } from '@/hooks/useSettings';

// Use Vite proxy in dev, CORS proxy in production (GitHub Pages)
const isDev = import.meta.env.DEV;
const KEMONO_BASE = 'https://kemono.cr';

// Dynamic API URL getter - returns raw target URL
export const getApiUrl = (endpoint: string): string => {
    return `${KEMONO_BASE}/api/v1${endpoint}`;
};

// Legacy export for backwards compatibility
export const KEMONO_API_URL = `${KEMONO_BASE}/api/v1`;

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // Minimum 500ms between requests

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetcher = async (url: string, retries = 3): Promise<any> => {
    // Resolve the actual URL to fetch (local in dev, proxied in prod)
    const requestUrl = isDev ? url.replace(KEMONO_BASE, '') : buildProxiedUrl(url);

    // Enforce minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    try {
        const res = await fetch(requestUrl, {
            headers: {
                'Accept': 'text/css',
            }
        });

        // Handle rate limiting (429)
        if (res.status === 429) {
            if (retries > 0) {
                const waitTime = (4 - retries) * 2000;
                console.log(`[API] Rate limited, waiting ${waitTime}ms before retry...`);
                await delay(waitTime);
                return fetcher(url, retries - 1);
            }
            const error = new Error('Too many requests. Please wait a moment and try again.');
            (error as any).status = 429;
            throw error;
        }

        // Handle other proxy/CORS errors that might be recoverable by switching proxy
        if (!res.ok) {
            // Some proxies return 403, 404, or 5xx when they are dead or blocked
            if (retries > 0 && !isDev && (res.status === 403 || res.status === 404 || res.status >= 500)) {
                console.log(`[API] Fetch failed with status ${res.status}, rotating proxy...`);
                rotateProxy();
                return fetcher(url, retries - 1);
            }

            const error = new Error('An error occurred while fetching the data.');
            try {
                (error as any).info = await res.json();
            } catch {
                (error as any).info = null;
            }
            (error as any).status = res.status;
            throw error;
        }

        return res.json();
    } catch (err: any) {
        // Network error - often happens when a proxy is down/dead (CORS issues)
        if (retries > 0 && !isDev && !err.status) {
            console.log('[API] Network error, rotating proxy...');
            rotateProxy();
            return fetcher(url, retries - 1);
        }

        if (err.status) throw err; // Re-throw API errors

        const error = new Error('Network error. Please check your connection.');
        (error as any).status = 0;
        throw error;
    }
};

// Fallback CDN servers if server info not provided in API response
const FALLBACK_CDN_SERVERS = [
    'https://n1.kemono.cr',
    'https://n2.kemono.cr',
    'https://n3.kemono.cr',
    'https://n4.kemono.cr',
    'https://c1.kemono.cr',
    'https://c2.kemono.cr',
];

// Thumbnail server
const THUMBNAIL_SERVER = 'https://img.kemono.cr';

/**
 * Build a full URL from server and path
 * Use when you have the server field from the API response
 */
export const buildUrl = (server: string, path: string): string => {
    if (!path) return '';
    if (!server) return getImageUrl(path);

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    // Server from API includes the base, just need to add /data and path
    return `${server}/data${normalizedPath}`;
};

/**
 * Build a thumbnail URL from server and path
 * Note: server param is kept for API consistency but thumbnails always use THUMBNAIL_SERVER
 */
export const buildThumbnailUrl = (_server: string, path: string): string => {
    if (!path) return '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    // Thumbnails always use img subdomain with /thumbnail/data/
    return `${THUMBNAIL_SERVER}/thumbnail/data${normalizedPath}`;
};

/**
 * Get the full image URL for Kemono files (legacy - when server not available)
 * @param path - The file path from the API (e.g., "/5c/98/hash.jpg")
 * @param thumbnail - Whether to get a thumbnail version
 */
export const getImageUrl = (path: string, thumbnail = false) => {
    if (!path) return '';

    // If already a full URL, return as-is
    if (path.startsWith('http')) return path;

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (thumbnail) {
        return `${THUMBNAIL_SERVER}/thumbnail/data${normalizedPath}`;
    }

    // Use first fallback server when no server info available
    return `${FALLBACK_CDN_SERVERS[0]}/data${normalizedPath}`;
};

/**
 * Get thumbnail URL specifically for preview cards
 */
export const getThumbnailUrl = (path: string) => getImageUrl(path, true);

/**
 * Get all possible URLs for an image (for fallback purposes)
 */
export const getAllImageUrls = (path: string): string[] => {
    if (!path) return [];
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return FALLBACK_CDN_SERVERS.map(server => `${server}/data${normalizedPath}`);
};

/**
 * Export fallback CDN servers for use in fallback components
 */
export const CDN_SERVERS = FALLBACK_CDN_SERVERS;
