import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { getErrorMessage } from '../../lib/api';

/** Grey shimmering placeholder block. */
export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** A few skeleton rows, announced to screen readers as loading. */
export function SkeletonRows({ rows = 4, className = 'h-10' }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={`${className} w-full`} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Empty state with an optional call to action. */
export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon size={22} aria-hidden="true" />
      </div>
      <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      {message && <p className="muted mt-1 max-w-sm text-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Error state with a retry button. */
export function ErrorState({ error, onRetry, title = 'Could not load this data', compact = false }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center ${compact ? 'py-4' : 'px-4 py-10'}`}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-loss-soft text-loss dark:bg-loss-dark-soft dark:text-loss-dark">
        <AlertTriangle size={20} aria-hidden="true" />
      </div>
      <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="muted mt-1 max-w-sm text-sm">{getErrorMessage(error)}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          <RefreshCw size={15} aria-hidden="true" /> Retry
        </button>
      )}
    </div>
  );
}

export function Spinner({ size = 16, label = 'Loading' }) {
  return (
    <span role="status" className="inline-flex items-center">
      <span
        className="animate-spin rounded-full border-2 border-current border-t-transparent"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Shown wherever data is NOT real (e.g. no NewsAPI key). Required by the
 * "no fake data presented as real" rule.
 */
export function DemoBadge({ reason }) {
  return (
    <span className="badge-warn" title={reason || 'Sample data, not live'}>
      Demo data
    </span>
  );
}
