import React, { createContext, useContext, useMemo, useState } from 'react';

interface StreamContextValue {
  /** When false, all polling pauses (data stays on screen). */
  isLive: boolean;
  setIsLive: (live: boolean) => void;
}

const StreamContext = createContext<StreamContextValue | null>(null);

export function StreamProvider({ children }: {children: React.ReactNode;}) {
  const [isLive, setIsLive] = useState(true);
  const value = useMemo(() => ({ isLive, setIsLive }), [isLive]);
  return <StreamContext.Provider value={value}>{children}</StreamContext.Provider>;
}

export function useStream(): StreamContextValue {
  const ctx = useContext(StreamContext);
  if (!ctx) throw new Error('useStream must be used inside <StreamProvider>');
  return ctx;
}