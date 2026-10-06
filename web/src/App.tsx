import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StreamProvider } from './contexts/StreamContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { FraudRules } from './pages/FraudRules';
import { Lakehouse } from './pages/Lakehouse';
import { FraudPatterns } from './pages/FraudPatterns';
import { GeoRisk } from './pages/GeoRisk';
import { Alerts } from './pages/Alerts';
import { Docs } from './pages/Docs';
import { Settings } from './pages/Settings';
import { CloudSync } from './pages/CloudSync';
import { SignedOut } from './pages/SignedOut';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <StreamProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/fraud-rules" element={<FraudRules />} />
              <Route path="/lakehouse" element={<Lakehouse />} />
              <Route path="/patterns" element={<FraudPatterns />} />
              <Route path="/geo-risk" element={<GeoRisk />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/sync" element={<CloudSync />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/signed-out" element={<SignedOut />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: 14, border: '1px solid #e2edf5', fontFamily: 'Inter, sans-serif' } }} />
    </StreamProvider>);

}