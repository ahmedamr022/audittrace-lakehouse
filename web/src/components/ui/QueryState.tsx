import React from 'react';
import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react';
import type { QueryResult } from '../../hooks/useLakehouseQuery';

interface QueryStateProps<T> {
  query: QueryResult<T>;
  skeleton: React.ReactNode;
  children: (data: T) => React.ReactNode;
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
}

/** Renders loading skeleton, error-with-retry, empty, or content for a lakehouse query. */
export function QueryState<T>({ query, skeleton, children, isEmpty, emptyMessage = 'No data for this period.' }: QueryStateProps<T>) {
  if (query.isLoading && query.data === null) {
    return (
      <div role="status" aria-label="Loading" className="flex-1">
        {skeleton}
      </div>);

  }

  if (query.error && query.data === null) {
    return (
      <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-declined">
          <TriangleAlertIcon className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-sm font-medium text-ink">Couldn't load data</p>
        <p className="max-w-[240px] text-xs text-ink-soft">{query.error.message}</p>
        <button
          type="button"
          onClick={query.refetch}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          
          <RefreshCwIcon className="h-3.5 w-3.5" aria-hidden />
          Retry
        </button>
      </div>);

  }

  if (query.data === null) return null;

  if (isEmpty?.(query.data)) {
    return <p className="flex flex-1 items-center justify-center py-6 text-sm text-ink-soft">{emptyMessage}</p>;
  }

  return <>{children(query.data)}</>;
}