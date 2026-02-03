import { Database, Brain, FileText, Settings, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useConnectionStore } from '@/stores/connectionStore';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Data Console', url: '/', icon: Database },
  { title: 'Brain Visualization', url: '/brain', icon: Brain },
  { title: 'Logs', url: '/logs', icon: FileText },
  { title: 'Settings', url: '/settings', icon: Settings },
];

function ConnectionStatus() {
  const { status, lastSync } = useConnectionStore();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const statusConfig = {
    connected: { icon: Wifi, color: 'text-green-500', label: 'Connected' },
    disconnected: { icon: WifiOff, color: 'text-muted-foreground', label: 'Disconnected' },
    reconnecting: { icon: RefreshCw, color: 'text-yellow-500', label: 'Reconnecting' },
    error: { icon: AlertCircle, color: 'text-destructive', label: 'Error' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2 px-2 py-1', collapsed && 'justify-center')}>
      <Icon className={cn('h-4 w-4', config.color, status === 'reconnecting' && 'animate-spin')} />
      {!collapsed && (
        <div className="flex flex-col">
          <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
          {lastSync && (
            <span className="text-xs text-muted-foreground">
              {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn('flex items-center gap-2 px-2 py-3', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Genesis</span>
              <span className="text-xs text-muted-foreground">Data Console</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-2"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <ConnectionStatus />
      </SidebarFooter>
    </Sidebar>
  );
}
