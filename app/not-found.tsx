import Link from "next/link";
import { BrandMark } from "@/components/layout/brand";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md text-center">
        <BrandMark className="mx-auto size-11 text-lg" />
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-500">
          Error 404
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">This page does not exist</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The link may be out of date, or the page may have been renamed. Everything in CONNECT is
          reachable from your dashboard.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 focus-ring"
          >
            Back to dashboard
          </Link>
          <Link
            href="/knowledge"
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:bg-subtle focus-ring"
          >
            Company knowledge
          </Link>
        </div>
      </div>
    </div>
  );
}
