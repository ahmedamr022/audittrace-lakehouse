import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogInIcon } from 'lucide-react';
import { brand } from '../data/brand';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';

export function SignedOut() {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="panel w-full max-w-sm p-8 text-center">
        <Logo size={64} className="mx-auto" />
        <h1 className="mt-5 text-xl font-semibold text-ink">You've signed out</h1>
        <p className="mt-1 text-sm text-ink-muted">{brand.name} is no longer monitoring on this device.</p>
        <Button variant="primary" className="mt-6 w-full" icon={<LogInIcon className="h-4 w-4" aria-hidden />} onClick={() => navigate('/')}>
          Sign in again
        </Button>
      </div>
    </main>);

}