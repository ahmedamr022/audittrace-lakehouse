import React from 'react';
import { LoaderCircleIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary text-white hover:brightness-105 active:brightness-95',
  secondary: 'border border-line bg-white text-ink shadow-[inset_0_1px_0_#fff,0_2px_6px_-3px_rgba(12,74,110,0.25)] hover:bg-brand-50 hover:text-brand-800',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[13px] gap-2 rounded-xl'
};

export function Button({ variant = 'secondary', size = 'md', loading = false, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-[background-color,color,filter,transform] duration-150 ease-out active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}>
      
      {loading ? <LoaderCircleIcon className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>);

}