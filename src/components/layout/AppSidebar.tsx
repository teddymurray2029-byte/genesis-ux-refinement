import { Database, Brain, ScrollText, Settings, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAppStore, type ConnectionStatus } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { title: 'Data Console', url: '/', icon: Database },
  { title: 'Brain Visualization', url: '/brain', icon: Brain },
  { title: 'Logs', url: '/logs', icon: ScrollText },
  { title: 'Settings', url: '/settings', icon: Settings },
];

function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const statusConfig = {
    connected: { icon: Wifi, color: 'text-green-500', label: 'Connected' },
    connecting: { icon: Loader2, color: 'text-yellow-500', label: 'Connecting...' },
    disconnected: { icon: WifiOff, color: 'text-muted-foreground', label: 'Disconnected' },
    error: { icon: WifiOff, color: 'text-destructive', label: 'Connection Error' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-2', config.color)}>
          <Icon className={cn('h-4 w-4', status === 'connecting' && 'animate-spin')} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{config.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const { connectionStatus, lastSyncTime } = useAppStore();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">Genesis</span>
              <span className="text-xs text-sidebar-foreground/60">Data Console</span>
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
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <ConnectionIndicator status={connectionStatus} />
          {!collapsed && lastSyncTime && (
            <span className="text-xs text-sidebar-foreground/60">
              {format(lastSyncTime, 'HH:mm:ss')}
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
