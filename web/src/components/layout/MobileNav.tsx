import React from 'react';
import { NavLink } from 'react-router-dom';
import { navGroups } from '../../data/navigation';
import { cn } from '../../utils/cn';

/** Bottom tab bar for small screens (sidebar is hidden below md). */
export function MobileNav() {
  const items = navGroups.flatMap((g) => g.items);
  return (
    <nav aria-label="Primary mobile" className="panel fixed inset-x-3 bottom-3 z-40 flex justify-between overflow-x-auto p-1.5 md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            aria-label={item.label}
            className={({ isActive }) =>
            cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', isActive ? 'brand-chip text-white' : 'text-ink-muted')
            }>
            
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </NavLink>);

      })}
    </nav>);

}