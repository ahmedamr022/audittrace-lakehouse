import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50',
        checked ? 'brand-chip' : 'bg-slate-200 shadow-[inset_0_1px_2px_rgba(12,74,110,0.15)]'
      )}>
      
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 40 }}
        className={cn('h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(12,74,110,0.35)]', checked ? 'ml-auto' : 'ml-0')} />
      
    </button>);

}