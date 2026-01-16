'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Ticket, Users, LogOut, Home, User, ChevronLeft, ChevronRight, Building, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

// Helper function to get initial sidebar state from localStorage
function getInitialSidebarState(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
  return saved === 'true';
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarState);
  const [isMounted, setIsMounted] = useState(false);

  // Mark as mounted to prevent flicker
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Save sidebar state to localStorage when it changes
  const handleToggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/tickets', label: 'Tickets', icon: Ticket },
    ...(user && (user.role === 'ADMIN' || user.role === 'AGENT')
      ? [
          { href: '/analytics', label: 'Analytics', icon: BarChart3 },
          { href: '/users', label: 'Users', icon: Users },
        ]
      : []),
    ...(user && user.role === 'ADMIN'
      ? [
          { href: '/departments', label: 'Departments', icon: Building },
          { href: '/settings', label: 'Settings', icon: Settings },
        ]
      : []),
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col fixed left-0 top-0 h-screen z-40',
            isMounted && 'transition-all duration-300',
            sidebarCollapsed ? 'w-16' : 'w-64',
            'hidden md:flex' // Hide on mobile, show on medium screens and up
          )}
        >
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className="flex items-center justify-center w-full h-10 rounded-lg text-sm font-medium transition-colors"
                      >
                        <div className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                          isActive
                            ? 'bg-primary'
                            : 'bg-muted hover:bg-muted/80'
                        )}>
                          <Icon className={cn(
                            'h-5 w-5',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                          )} />
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="z-[60]">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    isActive
                      ? 'bg-primary-foreground/20'
                      : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                    )} />
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

        {/* Collapse Toggle */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            className={cn(
              'w-full',
              sidebarCollapsed ? 'justify-center' : ''
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

        {/* Main Content */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          isMounted && 'transition-all duration-300',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        )}>
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
            <div className="flex h-16 items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl min-w-0">
                <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Ticket className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent hidden sm:inline">
                    Tikket
                  </span>
                </Link>
                {tenant && (
                  <>
                    <div className="h-4 w-px bg-muted-foreground/40 hidden sm:block" />
                    <span className="text-primary font-semibold truncate">{tenant.name}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Badge variant="secondary" className="font-medium hidden sm:inline-flex">
                  {user?.role}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {(user?.name || user?.email)?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name || user?.email}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                        <p className="text-xs text-muted-foreground">{user?.role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
