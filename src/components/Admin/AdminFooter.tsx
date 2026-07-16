import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  Settings,
  ShieldCheck,
} from 'lucide-react';

// ─── AdminFooter ──────────────────────────────────────────────────────────────
// Minimal shared footer rendered inside AdminLayoutPage's <main> area.
// Intentionally lightweight — the sidebar already provides full navigation.

const AdminFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick links */}
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link
              to="/admin"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <LayoutDashboard className="w-3 h-3" /> Dashboard
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Users className="w-3 h-3" /> Users
            </Link>
            <Link
              to="/admin/workers"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Briefcase className="w-3 h-3" /> Workers
            </Link>
            <Link
              to="/admin/bookings"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <CalendarDays className="w-3 h-3" /> Bookings
            </Link>
            <Link
              to="/admin/settings"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Settings className="w-3 h-3" /> Settings
            </Link>
          </nav>

          {/* Copyright + version */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Admin Panel v1.0
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">© {year} RoozgaarSetu</span>
          </div>
        </div>

        {/* Bottom copyright for mobile */}
        <p className="mt-2 text-center text-[10px] text-muted-foreground sm:hidden">
          © {year} RoozgaarSetu. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default AdminFooter;
