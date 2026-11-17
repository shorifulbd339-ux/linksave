import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Plus, Search, Sun, X } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';

interface TopSearchBarProps {
  isOnline: boolean;
  fromCache: boolean;
  hasPendingWrites: boolean;
  onOpenMobileMenu: () => void;
  onOpenQuickAdd: () => void;
  onToggleTheme: () => void;
}

export function TopSearchBar({
  isOnline,
  fromCache,
  hasPendingWrites,
  onOpenMobileMenu,
  onOpenQuickAdd,
  onToggleTheme,
}: TopSearchBarProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface-elevated/85 px-4 backdrop-blur-md lg:px-6">
      <div className="flex flex-1 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-content-secondary hover:text-content lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search links, titles, platforms..."
            aria-label="Search links"
            className="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-sm text-content placeholder:text-content-muted focus:border-accent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </div>

      <div className="flex items-center gap-2">
        <SyncStatusBadge
          isOnline={isOnline}
          fromCache={fromCache}
          hasPendingWrites={hasPendingWrites}
        />

        <button
          type="button"
          onClick={onToggleTheme}
          title="Toggle dark/light theme"
          aria-label="Toggle theme"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-content-secondary transition-colors hover:border-border-strong hover:text-content"
        >
          <Sun className="hidden h-4 w-4 dark:block" />
          <Moon className="block h-4 w-4 dark:hidden" />
        </button>

        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Paste Links</span>
        </button>
      </div>
    </header>
  );
}

