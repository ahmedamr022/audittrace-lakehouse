import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightIcon, BellIcon } from 'lucide-react';
import { useNotifications } from '../../hooks/useDashboardQueries';
import { lakehouseApi } from '../../utils/lakehouseClient';
import { formatRelative } from '../../utils/format';
import { SEVERITY_BADGE } from '../../utils/statusStyles';
import { cn } from '../../utils/cn';

export function NotificationsMenu() {
  const query = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const items = (query.data ?? []).map((n) => ({ ...n, read: n.read || readIds.has(n.id) }));
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const markAll = async () => {
    const previous = readIds;
    setReadIds(new Set(items.map((n) => n.id)));
    try {
      await lakehouseApi.markAllNotificationsRead();
    } catch {
      setReadIds(previous);
    }
  };

  const openItem = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
    setOpen(false);
    navigate('/alerts');
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink-muted shadow-[inset_0_1px_0_#fff,0_2px_6px_-3px_rgba(12,74,110,0.25)] transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
        
        <BellIcon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        {unread > 0 &&
        <span className="tabular absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-declined px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {unread}
          </span>
        }
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: 'top right' }}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-float">
          
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              <button
              type="button"
              onClick={markAll}
              disabled={unread === 0}
              className="text-xs font-medium text-brand-600 hover:text-brand-800 disabled:text-ink-soft">
              
                Mark all read
              </button>
            </div>
            {query.isLoading && items.length === 0 && <p className="px-4 py-4 text-xs text-ink-soft">Loading…</p>}
            {query.error && items.length === 0 && <p className="px-4 py-4 text-xs text-rose-600">Couldn't load notifications.</p>}
            {!query.isLoading && !query.error && items.length === 0 &&
          <p className="px-4 py-4 text-xs text-ink-soft">You're all caught up.</p>
          }
            <ul className="max-h-80 divide-y divide-line overflow-y-auto scrollbar-thin">
              {items.map((n) =>
            <li key={n.id}>
                  <button
                type="button"
                onClick={() => openItem(n.id)}
                className={cn('block w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-brand-50', !n.read && 'bg-brand-50/60')}>
                
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-medium text-ink">{n.title}</span>
                      <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1', SEVERITY_BADGE[n.severity])}>
                        {n.severity}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-ink-soft">{formatRelative(n.timestamp)}</span>
                  </button>
                </li>
            )}
            </ul>
            <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/alerts');
            }}
            className="flex w-full items-center justify-center gap-1.5 border-t border-line py-2.5 text-xs font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-50">
            
              View all alerts <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}