import { useCallback, useEffect, useRef, useState } from 'react';

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  refetch: () => void;
  /** Optimistically replace local data (e.g. after a mutation) without refetching. */
  mutate: (updater: (prev: T | null) => T | null) => void;
}

interface Options {
  refreshInterval?: number;
  paused?: boolean;
  enabled?: boolean;
}

/**
 * Generic fetch + polling hook. `key` must change whenever the request params change.
 * Keeps previous data visible while refetching so widgets never flash empty.
 */
export function useLakehouseQuery<T>(
key: string,
fetcher: (signal: AbortSignal) => Promise<T>,
{ refreshInterval, paused = false, enabled = true }: Options = {})
: QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const abortRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(false);

  const run = useCallback(async (background: boolean) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (hasDataRef.current || background) setIsRefreshing(true);else
    setIsLoading(true);

    try {
      const result = await fetcherRef.current(controller.signal);
      if (controller.signal.aborted) return;
      hasDataRef.current = true;
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    run(false);
    return () => abortRef.current?.abort();
  }, [key, enabled, run]);

  useEffect(() => {
    if (!enabled || !refreshInterval || paused) return;
    const id = window.setInterval(() => run(true), refreshInterval);
    return () => window.clearInterval(id);
  }, [enabled, refreshInterval, paused, run, key]);

  const refetch = useCallback(() => {
    run(false);
  }, [run]);

  const mutate = useCallback((updater: (prev: T | null) => T | null) => {
    setData((prev) => updater(prev));
  }, []);

  return { data, error, isLoading, isRefreshing, lastUpdated, refetch, mutate };
}