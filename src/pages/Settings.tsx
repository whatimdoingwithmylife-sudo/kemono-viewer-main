import { useSettings, CORS_PROXIES } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
                        Select a CORS proxy to use for API requests. If one proxy isn't working, try another.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cors-proxy">Proxy Service</Label>
                        <Select
                            value={settings.corsProxyId}
                            onValueChange={(value) => setSettings({ corsProxyId: value })}
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
        </div>
    );
}
