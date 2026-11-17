import { NavLink } from 'react-router-dom';
import { Clock, LayoutDashboard, ListPlus, Search, Settings } from 'lucide-react';

const MOBILE_TABS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/search', label: 'Search', icon: Search, end: false },
  { to: '/bulk-paste', label: 'Bulk Add', icon: ListPlus, end: false },
  { to: '/history', label: 'History', icon: Clock, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-surface-elevated/95 px-2 backdrop-blur-md lg:hidden"
    >
      {MOBILE_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-content-secondary hover:text-content'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

