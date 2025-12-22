import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const CONSENT_SHOWN_KEY = 'kemono-viewer-analytics-consent-shown';
const SETTINGS_KEY = 'kemono-viewer-settings';

export function AnalyticsConsent() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Check if we've already shown the consent dialog
        const consentShown = localStorage.getItem(CONSENT_SHOWN_KEY);
        if (!consentShown) {
            setOpen(true);
        }
    }, []);

    const handleResponse = (enableAnalytics: boolean) => {
        // Mark consent as shown
        localStorage.setItem(CONSENT_SHOWN_KEY, 'true');
        
        // Update settings
        try {
            const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
            settings.analyticsEnabled = enableAnalytics;
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ analyticsEnabled: enableAnalytics }));
        }

        setOpen(false);

        // Reload to apply analytics setting
        if (enableAnalytics) {
            window.location.reload();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Help improve Kemono Viewer</DialogTitle>
                    <DialogDescription className="pt-2">
                        Would you like to enable anonymous analytics? This helps us understand how the app is used and improve it.
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground space-y-2">
                    <p>We collect:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Page views</li>
                        <li>Basic interactions</li>
                    </ul>
                    <p className="pt-1">We never collect personal information. You can change this anytime in Settings.</p>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => handleResponse(false)}>
                        No thanks
                    </Button>
                    <Button onClick={() => handleResponse(true)}>
                        Enable analytics
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
