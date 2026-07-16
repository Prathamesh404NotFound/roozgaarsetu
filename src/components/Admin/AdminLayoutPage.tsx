import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  LayoutDashboard as ClientDash,
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/Logo';
import AdminFooter from './AdminFooter';

// ─── Nav items ────────────────────────────────────────────────────────────────

const adminNavigation = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Marketplace overview and operations hub',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage registered user accounts',
  },
  {
    title: 'Workers',
    href: '/admin/workers',
    icon: Briefcase,
    description: 'Manage worker profiles and verification',
  },
  {
    title: 'Bookings',
    href: '/admin/bookings',
    icon: CalendarDays,
    description: 'Inspect bookings and escrow settlements',
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Platform performance metrics',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configure platform-wide settings',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AdminLayoutPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, logout } = useAuth();
  const location = useLocation();

  // Open sidebar by default on desktop
  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 1024);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /** Exact match for /admin index, prefix match for sub-routes */
  const isActiveRoute = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const initials =
    (profile?.displayName ?? user?.displayName ?? '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'A';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header — RoozgaarSetu branding */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
              <Logo className="h-8 w-8 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span
                  className="font-heading font-bold text-sm leading-tight text-primary truncate"
                  style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
                >
                  RoozgaarSetu
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Admin Panel
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden h-8 w-8 p-0"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {adminNavigation.map((item) => {
              const active = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={item.description}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer — admin identity block */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">
                  {profile?.displayName ?? user?.displayName ?? 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email ?? user?.email ?? ''}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* Sticky top header */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden h-8 w-8 p-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </Button>

            {/* Page title breadcrumb area — kept minimal for content space */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-muted-foreground hidden sm:block">
                {adminNavigation.find((n) => isActiveRoute(n.href))?.title ?? 'Admin'}
              </span>
            </div>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full outline-none ring-primary/20 hover:ring-4 focus-visible:ring-4"
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-elevated mt-1">
                {/* Identity block */}
                <div className="flex items-center gap-2.5 p-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">
                      {profile?.displayName ?? user?.displayName ?? 'Admin'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.email ?? user?.email ?? ''}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                        Administrator
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {/* Link back to client dashboard */}
                <DropdownMenuItem asChild>
                  <Link
                    to="/dashboard/client"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ClientDash className="w-4 h-4 text-muted-foreground" />
                    <span>Client Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content rendered by nested route */}
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Admin-only footer */}
        <AdminFooter />
      </div>

      {/* Mobile overlay — clicking it closes the sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default AdminLayoutPage;
