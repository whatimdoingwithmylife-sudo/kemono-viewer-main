import { useState } from 'react';

const SETTINGS_KEY = 'kemono-viewer-settings';

export interface CorsProxy {
    id: string;
    name: string;
    urlTemplate: string; // Use {url} as placeholder for the target URL
    requiresEncoding: boolean;
    description: string;
}

export const CORS_PROXIES: CorsProxy[] = [
    {
        id: 'corsproxy-io',
        name: 'corsproxy.io',
        urlTemplate: 'https://corsproxy.io/?{url}',
        requiresEncoding: true,
        description: 'Popular free CORS proxy, reliable for most use cases',
    },
    {
        id: 'cors-lol',
        name: 'cors.lol',
        urlTemplate: 'https://api.cors.lol/?url={url}',
        requiresEncoding: true,
        description: 'Open source CORS proxy, free for non-commercial use',
    },
    {
        id: 'allorigins',
        name: 'AllOrigins',
        urlTemplate: 'https://api.allorigins.win/raw?url={url}',
        requiresEncoding: true,
        description: 'Simple and reliable proxy service',
    },
    {
        id: 'corsfix',
        name: 'Corsfix',
        urlTemplate: 'https://proxy.corsfix.com/?{url}',
        requiresEncoding: true,
        description: 'Modern CORS proxy, 60 req/min free tier',
    },
    {
        id: 'none',
        name: 'None (Direct)',
        urlTemplate: '{url}',
        requiresEncoding: false,
        description: 'No proxy - only works if API supports CORS',
    },
];

export interface Settings {
    corsProxyId: string;
    dynamicLoadingEnabled: boolean;
    dynamicLoadingThreshold: number;
}

const defaultSettings: Settings = {
    corsProxyId: 'corsproxy-io',
    dynamicLoadingEnabled: true,
    dynamicLoadingThreshold: 49,
};

function loadSettings(): Settings {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) };
        }
    } catch {
        // Ignore parse errors
    }
    return defaultSettings;
}

function saveSettings(settings: Settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function useSettings() {
    const [settings, setSettingsState] = useState<Settings>(loadSettings);

    const setSettings = (newSettings: Partial<Settings>) => {
        setSettingsState(prev => {
            const updated = { ...prev, ...newSettings };
            saveSettings(updated);
            return updated;
        });
    };

    const getCorsProxy = (): CorsProxy => {
        return CORS_PROXIES.find(p => p.id === settings.corsProxyId) || CORS_PROXIES[0];
    };

    return {
        settings,
        setSettings,
        getCorsProxy,
        corsProxies: CORS_PROXIES,
    };
}

// Standalone function to get current proxy (for use in api.ts)
export function getCurrentCorsProxy(): CorsProxy {
    const settings = loadSettings();
    return CORS_PROXIES.find(p => p.id === settings.corsProxyId) || CORS_PROXIES[0];
}

export function buildProxiedUrl(targetUrl: string): string {
    const proxy = getCurrentCorsProxy();
    const encodedUrl = proxy.requiresEncoding ? encodeURIComponent(targetUrl) : targetUrl;
    return proxy.urlTemplate.replace('{url}', encodedUrl);
}
