import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PanelProps {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  /** Renders a small "open" link in the header that navigates to a detail page */
  to?: string;
  toLabel?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  labelledBy?: string;
}

export function Panel({ title, actions, to, toLabel = 'Open', children, className, headerClassName, labelledBy }: PanelProps) {
  return (
    <section aria-labelledby={labelledBy} className={cn('panel flex min-w-0 flex-col p-4', className)}>
      {(title || actions || to) &&
      <header className={cn('mb-3 flex items-start justify-between gap-3', headerClassName)}>
          {title &&
        <h2 id={labelledBy} className="text-[15px] font-semibold leading-6 text-ink">
              {title}
            </h2>
        }
          <div className="flex items-center gap-2">
            {actions}
            {to &&
          <Link
            to={to}
            aria-label={`${toLabel}${typeof title === 'string' ? `: ${title}` : ''}`}
            className="icon-soft flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
            
                <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
              </Link>
          }
          </div>
        </header>
      }
      {children}
    </section>);

}