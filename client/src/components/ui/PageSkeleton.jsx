import { Skeleton } from './States';

/** Placeholder shown while a lazily-loaded page chunk downloads. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}

/** Full-screen splash while we check the session cookie. */
export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" aria-hidden="true" />
    </div>
  );
}
