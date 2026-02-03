import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useHealth } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Server,
  Database,
  Wifi,
  RefreshCw,
  CheckCircle,
  XCircle,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { config, setConfig, connectionStatus } = useAppStore();
  const [apiUrl, setApiUrl] = useState(config.apiBaseUrl);
  const [wsUrl, setWsUrl] = useState(config.wsUrl);
  
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealth();
  const { connect, disconnect } = useWebSocket();

  const handleSaveConnection = () => {
    setConfig({ apiBaseUrl: apiUrl, wsUrl: wsUrl });
    toast.success('Connection settings saved');
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) {
        toast.success('Backend connection successful');
        refetchHealth();
      } else {
        toast.error('Backend returned an error');
      }
    } catch (error) {
      toast.error('Failed to connect to backend');
    }
  };

  const handleConnectWebSocket = () => {
    connect();
    toast.info('Connecting to WebSocket...');
  };

  const handleDisconnectWebSocket = () => {
    disconnect();
    toast.info('WebSocket disconnected');
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your Genesis Data Console
        </p>
      </div>

      {/* Connection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Backend Connection
          </CardTitle>
          <CardDescription>
            Configure the connection to your Genesis backend server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API Base URL</Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-url">WebSocket URL</Label>
            <Input
              id="ws-url"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://localhost:8000/ws"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveConnection}>
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleTestConnection}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current status of backend connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">REST API</p>
                <p className="text-sm text-muted-foreground">
                  {config.apiBaseUrl}
                </p>
              </div>
            </div>
            {healthLoading ? (
              <Badge variant="secondary">Checking...</Badge>
            ) : health?.status === 'healthy' ? (
              <Badge className="bg-green-600 gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">WebSocket</p>
                <p className="text-sm text-muted-foreground">
                  {config.wsUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  'gap-1',
                  connectionStatus === 'connected' && 'bg-green-600',
                  connectionStatus === 'connecting' && 'bg-yellow-600',
                  connectionStatus === 'error' && 'bg-destructive'
                )}
                variant={connectionStatus === 'disconnected' ? 'secondary' : 'default'}
              >
                {connectionStatus === 'connected' && <CheckCircle className="h-3 w-3" />}
                {connectionStatus === 'error' && <XCircle className="h-3 w-3" />}
                {connectionStatus}
              </Badge>
              {connectionStatus === 'connected' ? (
                <Button variant="outline" size="sm" onClick={handleDisconnectWebSocket}>
                  Disconnect
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleConnectWebSocket}>
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* Health Details */}
          {health && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Server Health</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Database</p>
                  <p className={health.database ? 'text-green-500' : 'text-destructive'}>
                    {health.database ? 'Healthy' : 'Unhealthy'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">WebSocket</p>
                  <p className={health.websocket ? 'text-green-500' : 'text-destructive'}>
                    {health.websocket ? 'Available' : 'Unavailable'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uptime</p>
                  <p>{Math.floor(health.uptime / 60)}m {health.uptime % 60}s</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={config.theme === option.value ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setConfig({ theme: option.value })}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Genesis Data Console v1.0.0</p>
          <p className="mt-1">
            A modern React interface for the Genesis Multi-Octave Hierarchical Memory System.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
