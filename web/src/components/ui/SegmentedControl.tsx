import React from 'react';
import { cn } from '../../utils/cn';

interface SegmentedControlProps<T extends string> {
  options: {value: T;label: string;count?: number;}[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="inset-well flex rounded-xl border border-line p-1">
      {options.map((o) =>
      <button
        key={o.value}
        type="button"
        role="tab"
        aria-selected={o.value === value}
        onClick={() => onChange(o.value)}
        className={cn(
          'flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          o.value === value ? 'brand-chip text-white' : 'text-ink-muted hover:text-ink'
        )}>
        
          {o.label}
          {o.count !== undefined &&
        <span className={cn('tabular rounded-full px-1.5 text-[10px]', o.value === value ? 'bg-white/25' : 'bg-brand-50 text-brand-700')}>
              {o.count}
            </span>
        }
        </button>
      )}
    </div>);

}