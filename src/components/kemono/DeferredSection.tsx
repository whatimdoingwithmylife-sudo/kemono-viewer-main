import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DeferredSectionProps {
    children: ReactNode;
    fallback?: ReactNode;
    rootMargin?: string;
}

/**
 * DeferredSection - Defers rendering of children until the section is near the viewport.
 * Uses Intersection Observer to detect when the section becomes visible.
 * This improves initial page load by not rendering heavy content until needed.
 */
export function DeferredSection({ 
    children, 
    fallback = null,
    rootMargin = '200px' // Start loading 200px before visible
}: DeferredSectionProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            // Fallback: render immediately if not supported
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Once visible, stop observing
                    observer.disconnect();
                }
            },
            {
                rootMargin,
                threshold: 0
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [rootMargin]);

    return (
        <div ref={ref}>
            {isVisible ? children : fallback}
        </div>
    );
}
