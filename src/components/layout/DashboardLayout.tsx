import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const queryClient = useQueryClient();

  // Connect to WebSocket and handle live updates
  useWebSocket((message) => {
    if (message.type === 'data_update') {
      queryClient.invalidateQueries({ queryKey: ['query'] });
    }
    if (message.type === 'log') {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    }
    if (message.type === 'brain_update') {
      queryClient.invalidateQueries({ queryKey: ['brain'] });
    }
  });

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
