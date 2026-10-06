import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseZapIcon } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { NotificationsMenu } from './NotificationsMenu';
import { SearchBox } from './SearchBox';

export function TopBar() {
  const navigate = useNavigate();

  return (
    <header className="panel flex items-center gap-3 px-4 py-3">
      <Logo size={36} className="md:hidden" />
      <SearchBox />
      <div className="ml-auto flex items-center gap-2.5">
        <NotificationsMenu />

        {/* DuckDB OLAP Live Status Pill */}
        <button
          type="button"
          onClick={() => navigate('/lakehouse')}
          title="View Lakehouse tables"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 shadow-sm transition-colors duration-150 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <DatabaseZapIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          DuckDB OLAP: Online
        </button>
      </div>
    </header>
  );
}