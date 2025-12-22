import { useEffect } from 'react';
import { toast } from 'sonner';
import type { CorsProxy } from '@/hooks/useSettings';

export function ProxyToast() {
    useEffect(() => {
        const handleProxyRotation = (event: Event) => {
            const customEvent = event as CustomEvent<{ proxy: CorsProxy; manual: boolean }>;
            const { proxy, manual } = customEvent.detail;

            if (manual) {
                toast.info(`Switched to ${proxy.name}`, {
                    description: proxy.description,
                });
            } else {
                toast.warning('Connection issue detected', {
                    description: `Automatically switched to ${proxy.name} to continue loading.`,
                    duration: 4000,
                });
            }
        };

        window.addEventListener('kemono-proxy-rotated', handleProxyRotation);
        return () => window.removeEventListener('kemono-proxy-rotated', handleProxyRotation);
    }, []);

    return null;
}
