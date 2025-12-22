import { useSettings, CORS_PROXIES } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function Settings() {
    const { settings, setSettings, getCorsProxy } = useSettings();
    const currentProxy = getCorsProxy();

    return (
        <div className="container mx-auto px-4 py-6 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>CORS Proxy</CardTitle>
                    <CardDescription>
                        Select a CORS proxy to use for API requests. The system will automatically try different proxies if the selected one fails.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cors-proxy">Proxy Service</Label>
                        <Select
                            value={settings.corsProxyId}
                            onValueChange={(value) => {
                                setSettings({ corsProxyId: value });
                                const proxy = CORS_PROXIES.find(p => p.id === value);
                                if (proxy) {
                                    window.dispatchEvent(new CustomEvent('kemono-proxy-rotated', {
                                        detail: { proxy, manual: true }
                                    }));
                                }
                            }}
                        >
                            <SelectTrigger id="cors-proxy">
                                <SelectValue placeholder="Select a proxy" />
                            </SelectTrigger>
                            <SelectContent>
                                {CORS_PROXIES.map((proxy) => (
                                    <SelectItem key={proxy.id} value={proxy.id}>
                                        {proxy.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium">{currentProxy.name}</p>
                        <p className="text-muted-foreground mt-1">{currentProxy.description}</p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Note: Changes take effect immediately. Refresh the page after changing if posts still fail to load.
                    </p>
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Dynamic Content Loading
                        <span className="text-xs font-normal bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded">
                            Experimental
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Automatically load more pages when filters result in few matches. Useful when browsing specific content types like videos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="dynamic-loading"
                            checked={settings.dynamicLoadingEnabled}
                            onCheckedChange={(checked) =>
                                setSettings({ dynamicLoadingEnabled: checked === true })
                            }
                        />
                        <Label htmlFor="dynamic-loading" className="cursor-pointer">
                            Enable dynamic content loading
                        </Label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="threshold">Minimum posts threshold</Label>
                        <Select
                            value={settings.dynamicLoadingThreshold.toString()}
                            onValueChange={(value) => setSettings({ dynamicLoadingThreshold: parseInt(value, 10) })}
                            disabled={!settings.dynamicLoadingEnabled}
                        >
                            <SelectTrigger id="threshold">
                                <SelectValue placeholder="Select threshold" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="25">25 posts</SelectItem>
                                <SelectItem value="49">49 posts (default)</SelectItem>
                                <SelectItem value="75">75 posts</SelectItem>
                                <SelectItem value="100">100 posts</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Load more pages until this many filtered posts are found
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="text-muted-foreground">
                            When enabled, if your filters (e.g., "videos only") result in fewer than {settings.dynamicLoadingThreshold} posts,
                            the system will automatically fetch additional pages to find more matching content.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Privacy</CardTitle>
                    <CardDescription>
                        Control how your usage data is collected to help improve the app.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="analytics"
                            checked={settings.analyticsEnabled}
                            onCheckedChange={(checked) => {
                                setSettings({ analyticsEnabled: checked === true });
                                // Reload to apply analytics change
                                window.location.reload();
                            }}
                        />
                        <Label htmlFor="analytics" className="cursor-pointer">
                            Enable anonymous analytics
                        </Label>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="text-muted-foreground">
                            When enabled, anonymous usage data (page views, basic interactions) is collected to help improve the app.
                            No personal information is tracked. This is completely optional.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
