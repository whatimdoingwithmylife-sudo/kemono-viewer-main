import { useState, useEffect } from 'react';

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
        id: 'codetabs',
        name: 'Codetabs',
        urlTemplate: 'https://api.codetabs.com/v1/proxy?quest={url}',
        requiresEncoding: true,
        description: 'Free CORS proxy by Codetabs',
    },
    {
        id: 'corsproxy-org',
        name: 'Corsproxy.org',
        urlTemplate: 'https://corsproxy.org/?url={url}',
        requiresEncoding: true,
        description: 'Reliable and fast CORS proxy service',
    },
    {
        id: 'yalies',
        name: 'Yalies',
        urlTemplate: 'https://cors.yalies.io/?url={url}',
        requiresEncoding: true,
        description: 'Keyless CORS proxy provided by Yalies',
    },
    {
        id: 'thingproxy',
        name: 'ThingProxy',
        urlTemplate: 'https://thingproxy.freeboard.io/fetch/{url}',
        requiresEncoding: true,
        description: 'Simple and reliable proxy for fetching small resources',
    },
    {
        id: 'cors-server',
        name: 'CORS-Server',
        urlTemplate: 'https://proxy-ibmasyzzya-uc.a.run.app/{url}',
        requiresEncoding: true,
        description: 'Community-run CORS proxy on Google Cloud Run',
    },
    {
        id: 'html-driven',
        name: 'HTML Driven',
        urlTemplate: 'https://cors-proxy.htmldriven.com/?url={url}',
        requiresEncoding: true,
        description: 'Keyless CORS proxy for developers',
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
    analyticsEnabled: boolean;
}

const defaultSettings: Settings = {
    corsProxyId: 'corsproxy-io',
    dynamicLoadingEnabled: true,
    dynamicLoadingThreshold: 49,
    analyticsEnabled: false, // Opt-in by default for privacy
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

    // Sync state when proxy is rotated from other sources (e.g. api.ts automatic rotation)
    useEffect(() => {
        const handleProxyRotation = (event: Event) => {
            const customEvent = event as CustomEvent<{ proxy: CorsProxy; manual: boolean }>;
            const nextID = customEvent.detail.proxy.id;
            setSettingsState(prev => {
                if (prev.corsProxyId === nextID) return prev;
                return { ...prev, corsProxyId: nextID };
            });
        };

        window.addEventListener('kemono-proxy-rotated', handleProxyRotation);
        return () => window.removeEventListener('kemono-proxy-rotated', handleProxyRotation);
    }, []);

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

    const switchToNextProxy = () => {
        const currentIndex = CORS_PROXIES.findIndex(p => p.id === settings.corsProxyId);
        // Don't include 'none' in the rotation if possible, but if we are at the end, go back to 0
        let nextIndex = (currentIndex + 1) % CORS_PROXIES.length;
        if (CORS_PROXIES[nextIndex].id === 'none') {
            nextIndex = (nextIndex + 1) % CORS_PROXIES.length;
        }
        const nextProxy = CORS_PROXIES[nextIndex];
        setSettings({ corsProxyId: nextProxy.id });
        console.log(`[Proxy] Switched to next proxy: ${nextProxy.name}`);

        // Dispatch event for UI feedback
        window.dispatchEvent(new CustomEvent('kemono-proxy-rotated', {
            detail: { proxy: nextProxy, manual: true }
        }));

        return nextProxy;
    };

    return {
        settings,
        setSettings,
        getCorsProxy,
        switchToNextProxy,
        corsProxies: CORS_PROXIES,
    };
}

// Standalone function to get current proxy (for use in api.ts)
export function getCurrentCorsProxy(): CorsProxy {
    const settings = loadSettings();
    return CORS_PROXIES.find(p => p.id === settings.corsProxyId) || CORS_PROXIES[0];
}

// Standalone function to rotate to next proxy (for use in api.ts)
export function rotateProxy(): CorsProxy {
    const settings = loadSettings();
    const currentIndex = CORS_PROXIES.findIndex(p => p.id === settings.corsProxyId);
    let nextIndex = (currentIndex + 1) % CORS_PROXIES.length;
    if (CORS_PROXIES[nextIndex].id === 'none') {
        nextIndex = (nextIndex + 1) % CORS_PROXIES.length;
    }
    const nextProxy = CORS_PROXIES[nextIndex];
    saveSettings({ ...settings, corsProxyId: nextProxy.id });
    console.log(`[Proxy] Automatically rotated to: ${nextProxy.name}`);

    // Dispatch event for UI feedback
    window.dispatchEvent(new CustomEvent('kemono-proxy-rotated', {
        detail: { proxy: nextProxy, manual: false }
    }));

    return nextProxy;
}

export function buildProxiedUrl(targetUrl: string): string {
    const proxy = getCurrentCorsProxy();
    const encodedUrl = proxy.requiresEncoding ? encodeURIComponent(targetUrl) : targetUrl;
    return proxy.urlTemplate.replace('{url}', encodedUrl);
}
