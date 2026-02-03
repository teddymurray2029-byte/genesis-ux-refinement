import { useState } from 'react';
import { Save, RefreshCw, Check, X, Moon, Sun, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useConfigStore } from '@/stores/configStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useHealthCheck } from '@/hooks/useApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function SettingsPage() {
  const { toast } = useToast();
  const { apiBaseUrl, wsBaseUrl, theme, setApiBaseUrl, setWsBaseUrl, setTheme } = useConfigStore();
  const { status } = useConnectionStore();

  const [tempApiUrl, setTempApiUrl] = useState(apiBaseUrl);
  const [tempWsUrl, setTempWsUrl] = useState(wsBaseUrl);

  const { data: health, isLoading: healthLoading, refetch: checkHealth } = useHealthCheck();

  const handleSave = () => {
    setApiBaseUrl(tempApiUrl);
    setWsBaseUrl(tempWsUrl);
    toast({ title: 'Settings saved', description: 'Your configuration has been updated' });
    checkHealth();
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${tempApiUrl}/health`);
      if (response.ok) {
        toast({ title: 'Connection successful', description: 'Backend is reachable' });
      } else {
        toast({ title: 'Connection failed', description: 'Backend returned an error', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Connection failed', description: 'Could not reach the backend', variant: 'destructive' });
    }
  };

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your Genesis Data Console</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>API Connection</CardTitle>
              <CardDescription>Configure the connection to your Genesis backend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API Base URL</Label>
                <Input
                  id="apiUrl"
                  value={tempApiUrl}
                  onChange={(e) => setTempApiUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wsUrl">WebSocket URL</Label>
                <Input
                  id="wsUrl"
                  value={tempWsUrl}
                  onChange={(e) => setTempWsUrl(e.target.value)}
                  placeholder="ws://localhost:8000/ws"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="mr-1 h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleTestConnection}>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Current connection state to the backend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">WebSocket</span>
                <div className="flex items-center gap-2">
                  {status === 'connected' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    status === 'connected' ? 'text-green-500' : 'text-destructive'
                  )}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">API Health</span>
                <div className="flex items-center gap-2">
                  {healthLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : health ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    health ? 'text-green-500' : 'text-destructive'
                  )}>
                    {healthLoading ? 'Checking...' : health ? 'Healthy' : 'Unreachable'}
                  </span>
                </div>
              </div>
              {health && (
                <div className="rounded-md bg-muted p-3 text-xs font-mono">
                  <pre>{JSON.stringify(health, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        variant={theme === option.value ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setTheme(option.value)}
                      >
                        <Icon className="mr-1 h-4 w-4" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>Genesis Data Console</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Version: 1.0.0</p>
              <p>A modern React-based UI for the Genesis Multi-Octave Hierarchical Memory System.</p>
              <p>Built with React, TypeScript, shadcn/ui, and React Three Fiber.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;
