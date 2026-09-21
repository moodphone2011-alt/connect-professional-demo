"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/demo/store";
import type { DemoDatabase } from "@/lib/demo/types";

/** Live view of the demo database. Re-renders whenever a repository mutates it. */
export function useDatabase(): DemoDatabase {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Reads data through a selector and reports a short loading phase on first
 * render, so screens show skeletons instead of snapping into place — and so the
 * server-rendered HTML never disagrees with the persisted client data.
 *
 * `deps` are the values the selector closes over; they are serialised into a
 * single stable key so the dependency list stays a literal.
 */
export function useDemoQuery<T>(
  select: (database: DemoDatabase) => T,
  deps: readonly unknown[] = [],
  latency = 220,
): { data: T | null; loading: boolean } {
  const database = useDatabase();
  const [ready, setReady] = useState(false);
  const depKey = JSON.stringify(deps);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), latency);
    return () => window.clearTimeout(timer);
  }, [latency]);

  const data = useMemo(
    () => (ready ? select(database) : null),
    // `select` is intentionally excluded: callers pass inline closures whose
    // inputs are declared in `deps` and folded into `depKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, database, depKey],
  );

  return { data, loading: !ready };
}

const noopSubscribe = () => () => {};

/** True once the component has mounted in the browser. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
