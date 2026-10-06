import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="panel mx-auto mt-10 max-w-md p-8 text-center">
      <p className="tabular text-4xl font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-lg font-semibold text-ink">Page not found</h1>
      <p className="mt-1 text-sm text-ink-muted">The page you're looking for doesn't exist.</p>
      <Button variant="primary" className="mt-5" onClick={() => navigate('/')}>
        Back to overview
      </Button>
    </div>);

}