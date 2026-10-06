import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../utils/cn';

interface TiltCardProps {
  to: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}

const MotionLink = motion(Link);

/** Clickable card with subtle 3D tilt + light sheen that follows the cursor. */
export function TiltCard({ to, label, className, children }: TiltCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springX = useSpring(px, { stiffness: 260, damping: 22 });
  const springY = useSpring(py, { stiffness: 260, damping: 22 });
  const rotateX = useTransform(springY, [0, 1], [5, -5]);
  const rotateY = useTransform(springX, [0, 1], [-6, 6]);
  const sheenX = useTransform(springX, (v) => `${v * 100}%`);
  const sheenY = useTransform(springY, (v) => `${v * 100}%`);
  const sheen = useTransform([sheenX, sheenY], ([x, y]) => `radial-gradient(220px circle at ${x} ${y}, rgba(255,255,255,0.75), rgba(255,255,255,0) 60%)`);

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div style={{ perspective: 900 }} className="min-w-0">
      <MotionLink
        ref={ref}
        to={to}
        aria-label={label}
        onMouseMove={onMove}
        onMouseLeave={reset}
        whileHover={reduce ? undefined : { y: -3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={cn('panel-raised relative block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400', className)}>
        
        {!reduce && <motion.span aria-hidden className="pointer-events-none absolute inset-0 opacity-70" style={{ background: sheen }} />}
        <div className="relative" style={{ transform: 'translateZ(18px)' }}>
          {children}
        </div>
      </MotionLink>
    </div>);

}