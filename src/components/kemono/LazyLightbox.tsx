import { lazy, Suspense, useEffect, useState } from 'react';
import type { LightboxExternalProps } from 'yet-another-react-lightbox';
import { Spinner } from '@/components/ui/spinner';

// Dynamically import Lightbox only when needed
const LightboxComponent = lazy(() => import('yet-another-react-lightbox'));

// Loading fallback component with shadcn Spinner
function LightboxLoading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/90">
            <Spinner className="size-8 text-white" />
            <span className="text-white text-sm">Loading viewer...</span>
        </div>
    );
}

interface LazyLightboxProps extends LightboxExternalProps {
    open: boolean;
}

export function LazyLightbox({ open, ...props }: LazyLightboxProps) {
    const [plugins, setPlugins] = useState<any[]>([]);
    const [cssLoaded, setCssLoaded] = useState(false);

    useEffect(() => {
        // Only load plugins and CSS when lightbox is opened
        if (open && plugins.length === 0) {
            Promise.all([
                import('yet-another-react-lightbox/plugins/zoom'),
                import('yet-another-react-lightbox/plugins/thumbnails'),
                import('yet-another-react-lightbox/plugins/counter'),
                import('yet-another-react-lightbox/plugins/download'),
            ]).then(([Zoom, Thumbnails, Counter, Download]) => {
                setPlugins([Zoom.default, Thumbnails.default, Counter.default, Download.default]);
            });

            // Load CSS
            import('yet-another-react-lightbox/styles.css');
            import('yet-another-react-lightbox/plugins/thumbnails.css');
            import('yet-another-react-lightbox/plugins/counter.css');
            setCssLoaded(true);
        }
    }, [open, plugins.length]);

    // Don't render anything if not open - this prevents loading the heavy library
    if (!open) return null;

    // Show loading while plugins are being loaded
    if (plugins.length === 0 || !cssLoaded) {
        return <LightboxLoading />;
    }

    return (
        <Suspense fallback={<LightboxLoading />}>
            <LightboxComponent
                open={open}
                plugins={plugins}
                {...props}
            />
        </Suspense>
    );
}
