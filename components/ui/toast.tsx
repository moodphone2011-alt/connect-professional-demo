"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

export type ToastTone = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { ring: string; icon: string; label: string }> = {
  success: { ring: "border-emerald-500/40", icon: "text-emerald-500", label: "✓" },
  error: { ring: "border-rose-500/40", icon: "text-rose-500", label: "!" },
  warning: { ring: "border-amber-500/40", icon: "text-amber-500", label: "!" },
  info: { ring: "border-brand-500/40", icon: "text-brand-500", label: "i" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ title, description, tone = "info" }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-2), { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((entry) => (
          <div
            key={entry.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-3.5 shadow-lifted",
              "animate-rise",
              TONE_STYLES[entry.tone].ring,
            )}
          >
            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid size-6 flex-none place-items-center rounded-full border border-current/25 text-xs font-bold",
                TONE_STYLES[entry.tone].icon,
              )}
            >
              {TONE_STYLES[entry.tone].label}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{entry.title}</p>
              {entry.description ? (
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{entry.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(entry.id)}
              aria-label="Dismiss notification"
              className="-m-1 rounded-md p-1 text-muted transition hover:bg-subtle hover:text-ink focus-ring"
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>.");
  return context;
}
