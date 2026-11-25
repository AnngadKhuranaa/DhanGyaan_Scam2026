import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Run an async loader and expose { data, error, loading, reload }.
 * Re-runs when `deps` change and ignores responses from stale runs, so a slow
 * old request can't overwrite newer data. Pass `enabled: false` to skip.
 */
export default function useAsync(loader, deps = [], { enabled = true, keepPreviousData = false } = {}) {
  const [state, setState] = useState({ data: undefined, error: null, loading: enabled });
  const runId = useRef(0);
  // Always call the latest loader without making it a dependency. This effect is
  // declared first, so it runs before the fetch effect below on every render.
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  const run = useCallback(async () => {
    const id = ++runId.current;
    setState((s) => ({ data: keepPreviousData ? s.data : undefined, error: null, loading: true }));
    try {
      const data = await loaderRef.current();
      if (id === runId.current) setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      if (id === runId.current) setState((s) => ({ data: keepPreviousData ? s.data : undefined, error, loading: false }));
      return undefined;
    }
  }, [keepPreviousData]);

  useEffect(() => {
    if (enabled) run();
    else setState({ data: undefined, error: null, loading: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  /** Update data locally (e.g. after a mutation) without refetching. */
  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: run, setData };
}
