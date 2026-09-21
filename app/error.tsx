"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/brand";

/** Root error boundary: a human message, never a stack trace. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real deployment this is where the error would be reported.
    console.error("CONNECT encountered an unexpected error:", error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md text-center">
        <BrandMark className="mx-auto size-11 text-lg" />
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-500">
          Something went wrong
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">We could not load this screen</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your data is safe — it is stored in this browser. Try again, and if the problem persists
          you can reset the demo workspace from Settings.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 focus-ring"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:bg-subtle focus-ring"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
