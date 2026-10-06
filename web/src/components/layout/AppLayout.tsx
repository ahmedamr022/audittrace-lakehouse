import React from 'react';
import { Outlet } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  return (
    <div className="min-h-screen w-full">
      <Sidebar />
      <div className="px-3 pb-20 pt-3 md:pb-4 md:pl-[92px] md:pr-4">
        <TopBar />
        <main className="mx-auto mt-5 max-w-[1600px] px-1">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>);

}