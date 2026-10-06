import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '../../hooks/useDashboardQueries';
import { lakehouseApi } from '../../utils/lakehouseClient';
import { lakehouseConfig } from '../../utils/lakehouseConfig';
import { Logo } from '../brand/Logo';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { NotificationsMenu } from './NotificationsMenu';
import { SearchBox } from './SearchBox';

export function TopBar() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await lakehouseApi.logout();
      if (lakehouseConfig.logoutUrl) {
        window.location.assign(lakehouseConfig.logoutUrl);
        return;
      }
      setConfirmOpen(false);
      navigate('/signed-out');
    } catch (e) {
      toast.error('Sign out failed', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="panel flex items-center gap-3 px-4 py-3">
      <Logo size={36} className="md:hidden" />
      <SearchBox />
      <div className="ml-auto flex items-center gap-2.5">
        <NotificationsMenu />
        {user.data ?
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label={`${user.data.name}, ${user.data.role} — open settings`}
          title={`${user.data.name} · ${user.data.role}`}
          className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          
            <img
            src={user.data.avatarUrl}
            alt=""
            className="h-10 w-10 rounded-xl object-cover shadow-[0_4px_10px_-4px_rgba(12,74,110,0.45)] ring-2 ring-white" />
          
          </button> :

        <span className="h-10 w-10 animate-pulse rounded-xl bg-brand-50" aria-hidden />
        }
        <button
          type="button"
          aria-label="Sign out"
          onClick={() => setConfirmOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink-muted shadow-[inset_0_1px_0_#fff,0_2px_6px_-3px_rgba(12,74,110,0.25)] transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          
          <LogOutIcon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Sign out?"
        description="Live monitoring stops on this device until you sign in again."
        footer={
        <>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={signingOut} onClick={handleLogout}>
              Sign out
            </Button>
          </>
        }>
        
        {user.data &&
        <div className="inset-well flex items-center gap-3 rounded-xl border border-line p-3">
            <img src={user.data.avatarUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-medium text-ink">{user.data.name}</p>
              <p className="text-xs text-ink-muted">{user.data.role}</p>
            </div>
          </div>
        }
      </Modal>
    </header>);

}