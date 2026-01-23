'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
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
import { Ticket, Users, LogOut, Home, User, ChevronLeft, ChevronRight, Building, BarChart3, Settings, Moon, Sun } from 'lucide-react';
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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarState);
  const [isMounted, setIsMounted] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mark as mounted to prevent flicker
  useEffect(() => {
    setIsMounted(true);
    setMounted(true);
  }, []);

  // Save sidebar state to localStorage when it changes
  const handleToggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  const navItems = [
    // 1. Overview
    { href: '/dashboard', label: 'Painel', icon: Home },
    // 2. Core Features
    { href: '/tickets', label: 'Tickets', icon: Ticket },
    // 3. Entity Management
    ...(user && (user.role === 'ADMIN' || user.role === 'AGENT')
      ? [
          { href: '/users', label: 'Usuários', icon: Users },
        ]
      : []),
    ...(user && user.role === 'ADMIN'
      ? [
          { href: '/departments', label: 'Departmentos', icon: Building },
        ]
      : []),
    // 4. Insights & Analytics
    ...(user && (user.role === 'ADMIN' || user.role === 'AGENT')
      ? [
          { href: '/analytics', label: 'Análises', icon: BarChart3 },
        ]
      : []),
    // 5. Configuration
    ...(user && user.role === 'ADMIN'
      ? [
          { href: '/settings', label: 'Configurações', icon: Settings },
        ]
      : []),
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex bg-grid-pattern">
        {/* Sidebar - Desktop/Tablet */}
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
                {mounted && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className="h-8 w-8"
                      >
                        {resolvedTheme === 'dark' ? (
                          <Sun className="h-4 w-4" />
                        ) : (
                          <Moon className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{resolvedTheme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
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
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-4 space-y-6 max-w-[1600px] mx-auto w-full overflow-auto">
            {children}
          </main>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-1 max-w-screen-sm mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-colors active:opacity-70',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      <div className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
                        isActive
                          ? 'bg-primary'
                          : 'bg-transparent hover:bg-muted/50'
                      )}>
                        <Icon className={cn(
                          'h-5 w-5',
                          isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                        )} />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[60] mb-2">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
