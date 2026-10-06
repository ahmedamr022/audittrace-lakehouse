import React, { useId } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  title?: string;
}

/** Shield + radar sweep mark: protection (shield) meets real-time detection (radar). */
export function Logo({ size = 44, className, title = 'Risk & Fraud Intelligence' }: LogoProps) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={`lg-body-${id}`} x1="10" y1="4" x2="40" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
        <linearGradient id={`lg-shine-${id}`} x1="24" y1="4" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`lg-sweep-${id}`} cx="24" cy="24" r="11" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`lg-shadow-${id}`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#0369a1" floodOpacity="0.45" />
        </filter>
      </defs>

      <path
        d="M24 3.5 41 9.6v12.1c0 10.8-7.2 19.6-17 22.8C14.2 41.3 7 32.5 7 21.7V9.6L24 3.5Z"
        fill={`url(#lg-body-${id})`}
        filter={`url(#lg-shadow-${id})`} />
      
      <path d="M24 3.5 41 9.6v12.1c0 1.4-.1 2.8-.4 4.1C34 22 14 22 7.4 25.8 7.1 24.5 7 23.1 7 21.7V9.6L24 3.5Z" fill={`url(#lg-shine-${id})`} />
      <path d="M24 3.5 41 9.6v12.1c0 10.8-7.2 19.6-17 22.8C14.2 41.3 7 32.5 7 21.7V9.6L24 3.5Z" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" />

      {/* Radar */}
      <circle cx="24" cy="24" r="10" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="5.5" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2" />
      <path d="M24 24 L24 14 A10 10 0 0 1 33.2 20.1 Z" fill={`url(#lg-sweep-${id})`} />
      <line x1="24" y1="24" x2="33.2" y2="20.1" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2.2" fill="#ffffff" />
      <circle cx="30.4" cy="17.6" r="1.6" fill="#fecdd3" stroke="#ffffff" strokeWidth="0.8" />
      <circle cx="17.5" cy="28.4" r="1.2" fill="#ffffff" fillOpacity="0.85" />
    </svg>);

}