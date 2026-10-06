import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { navGroups } from '../../data/navigation';
import { cn } from '../../utils/cn';
import { Logo } from '../brand/Logo';

export function Sidebar() {
  const top = navGroups.filter((g) => g.position === 'top');
  const bottom = navGroups.filter((g) => g.position === 'bottom');

  const renderGroup = (group: (typeof navGroups)[number]) =>
  <ul key={group.id} className="brand-gradient flex flex-col items-center gap-1.5 rounded-2xl p-1.5">
      {group.items.map((item) => {
      const Icon = item.icon;
      return (
        <li key={item.id} className="group relative">
            <NavLink
            to={item.path}
            end={item.path === '/'}
            aria-label={item.label}
            className={({ isActive }) =>
            cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
              isActive ?
              'bg-white text-brand-700 shadow-[inset_0_-2px_0_rgba(14,165,233,0.18),0_4px_10px_-3px_rgba(3,105,161,0.6)]' :
              'text-white hover:bg-white/20'
            )
            }>
            
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
            </NavLink>
            <span
            role="tooltip"
            className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-float transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
            
              {item.label}
            </span>
          </li>);

    })}
    </ul>;


  return (
    <aside
      aria-label="Primary"
      className="panel fixed bottom-3 left-3 top-3 z-40 hidden w-16 flex-col items-center py-4 md:flex">
      
      <Link to="/" aria-label="Go to overview" className="mb-5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
        <Logo size={42} />
      </Link>
      <nav className="flex flex-1 flex-col items-center justify-between">
        <div className="flex flex-col items-center gap-3">{top.map(renderGroup)}</div>
        <div className="flex flex-col items-center gap-3">{bottom.map(renderGroup)}</div>
      </nav>
    </aside>);

}