import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ActivityIcon, CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useStream } from '../../contexts/StreamContext';
import { useStreamStatus } from '../../hooks/useDashboardQueries';
import { cn } from '../../utils/cn';

/** "Live Stream / Paused" switch — pauses every polling query across the app. */
export function StreamControl() {
  const { isLive, setIsLive } = useStream();
  const status = useStreamStatus();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const connected = status.data?.connected ?? false;
  const live = isLive && connected;
  const latency = status.data ? `${status.data.latencyMs.toFixed(2)} ms` : '— ms';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="panel flex h-10 items-center gap-3 !rounded-xl px-4 text-[13px] transition-colors duration-150 hover:border-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
        
        <span className="relative flex h-2.5 w-2.5">
          {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60 motion-reduce:hidden" />}
          <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', live ? 'bg-brand-500' : status.error ? 'bg-declined' : 'bg-ink-soft')} />
        </span>
        <span className={cn('font-medium', live ? 'text-brand-700' : 'text-ink-muted')}>
          {status.error && !status.data ? 'Disconnected' : isLive ? 'Live Stream' : 'Paused'}
        </span>
        <ActivityIcon className={cn('h-4 w-4', live ? 'text-brand-500' : 'text-ink-soft')} aria-hidden />
        <span className="h-5 w-px bg-line" aria-hidden />
        <span className="tabular font-medium text-ink">{latency}</span>
        <ChevronDownIcon className={cn('h-4 w-4 text-ink-soft transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>

      <AnimatePresence>
        {open &&
        <motion.ul
          role="listbox"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-float">
          
            {[
          { value: true, label: 'Live Stream', hint: 'Auto-refresh every widget' },
          { value: false, label: 'Paused', hint: 'Freeze data on screen' }].
          map((opt) =>
          <li key={opt.label}>
                <button
              type="button"
              role="option"
              aria-selected={isLive === opt.value}
              onClick={() => {
                setIsLive(opt.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-150 hover:bg-brand-50">
              
                  <span>
                    <span className="block text-[13px] font-medium text-ink">{opt.label}</span>
                    <span className="block text-[11px] text-ink-soft">{opt.hint}</span>
                  </span>
                  {isLive === opt.value && <CheckIcon className="h-4 w-4 text-brand-600" aria-hidden />}
                </button>
              </li>
          )}
          </motion.ul>
        }
      </AnimatePresence>
    </div>);

}