/**
 * The demo persistence engine.
 *
 * This is the only module in the app that touches browser storage. Everything
 * else goes through the repositories in `lib/repositories`, so swapping this for
 * a real API later means replacing the repositories — not the UI.
 */

import { createSeedDatabase, DEMO_DB_VERSION } from "./seed";
import type { DemoDatabase } from "./types";

export const STORAGE_KEY = "connect.demo.database.v3";
export const SESSION_KEY = "connect.demo.session.v3";

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * The seed used for server rendering and for the first client render, so both
 * produce identical markup. Data-driven views render skeletons until mounted,
 * which keeps hydration stable even across a date boundary.
 */
let serverSnapshot: DemoDatabase | null = null;
let snapshot: DemoDatabase | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getServerSnapshot(): DemoDatabase {
  serverSnapshot ??= createSeedDatabase();
  return serverSnapshot;
}

function readFromStorage(): DemoDatabase | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoDatabase;
    if (!parsed || parsed.version !== DEMO_DB_VERSION || !Array.isArray(parsed.employees)) {
      return null;
    }
    return parsed;
  } catch {
    // Storage can be unavailable (private mode, disabled cookies) or corrupted.
    // Falling back to a fresh seed keeps the demo usable either way.
    return null;
  }
}

function writeToStorage(database: DemoDatabase): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch {
    // Persisting is a nicety; the in-memory snapshot still drives the session.
  }
}

/** Current database. Reads storage once per session, then serves from memory. */
export function getDatabase(): DemoDatabase {
  if (!isBrowser()) return getServerSnapshot();
  if (snapshot) return snapshot;

  const stored = readFromStorage();
  if (stored) {
    snapshot = stored;
  } else {
    snapshot = createSeedDatabase();
    writeToStorage(snapshot);
  }
  return snapshot;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Applies an immutable update to the database and notifies every subscriber.
 * The recipe receives the current database and returns the next one.
 */
export function mutate(recipe: (database: DemoDatabase) => DemoDatabase): DemoDatabase {
  const next = recipe(getDatabase());
  snapshot = next;
  writeToStorage(next);
  emit();
  return next;
}

/** Restores the pristine seed data. Used by "Reset demo data" in Settings. */
export function resetDatabase(): DemoDatabase {
  const fresh = createSeedDatabase();
  snapshot = fresh;
  writeToStorage(fresh);
  emit();
  return fresh;
}

export function getSnapshot(): DemoDatabase {
  return getDatabase();
}

export { getServerSnapshot };

/** Stable, collision-free ids for records created during a demo session. */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${random}`;
}

/**
 * Simulated network latency. Small enough to feel instant, large enough that
 * loading and disabled states are visible the way they would be in production.
 */
export function delay(ms = 260): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
