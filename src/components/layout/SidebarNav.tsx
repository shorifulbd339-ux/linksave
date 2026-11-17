import { NavLink } from 'react-router-dom';
import type { User } from 'firebase/auth';
import {
  Clock,
  DatabaseBackup,
  LayoutDashboard,
  Link2,
  ListPlus,
  LogOut,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { PLATFORM_LIST } from '../../config/platforms';
import type { PlatformCategory } from '../../types/link';

interface SidebarNavProps {
  user: User;
  categoryCounts: Record<PlatformCategory, number>;
  totalCount: number;
  onSignOut: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/bulk-paste', label: 'Bulk Paste', icon: ListPlus, end: false },
  { to: '/search', label: 'Search Links', icon: Search, end: false },
  { to: '/history', label: 'Activity History', icon: Clock, end: false },
  { to: '/backup', label: 'Backup & Restore', icon: DatabaseBackup, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function SidebarNav({
  user,
  categoryCounts,
  totalCount,
  onSignOut,
  mobileOpen = false,
  onCloseMobile,
}: SidebarNavProps) {
  const navContent = (
    <div className="flex h-full flex-col bg-surface-elevated">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 text-content"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-base font-extrabold tracking-tight">LinkVault</span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-content-muted">
              Web & Android Sync
            </span>
          </div>
        </NavLink>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-content-muted hover:bg-surface-muted hover:text-content lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-content-secondary hover:bg-surface-muted hover:text-content'
                  }`
                }
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.to === '/' && (
                  <span className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-content-secondary">
                    {totalCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="space-y-1">
          <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
            Platforms
          </p>
          {PLATFORM_LIST.map((platform) => {
            const Icon = platform.icon;
            const count = categoryCounts[platform.id] ?? 0;
            return (
              <NavLink
                key={platform.id}
                to={`/category/${platform.id}`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-content-secondary hover:bg-surface-muted hover:text-content'
                  }`
                }
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{platform.label}</span>
                </span>
                <span className="font-mono text-xs text-content-muted">{count}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted/70 p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-content">
                {user.displayName ?? 'LinkVault User'}
              </p>
              <p className="truncate text-[11px] text-content-muted">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-1.5 text-content-muted transition-colors hover:bg-surface-elevated hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border lg:block">{navContent}</aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] border-r border-border shadow-card">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}

