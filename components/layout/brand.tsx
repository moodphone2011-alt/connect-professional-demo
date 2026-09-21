import { cn } from "@/lib/utils/cn";

/** The CONNECT mark. Inline SVG-free: a gradient tile with the wordmark beside it. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 flex-none place-items-center rounded-[9px] bg-gradient-to-br from-brand-500 to-teal-accent text-sm font-black text-white shadow-[0_6px_18px_-6px_rgba(108,92,231,0.7)]",
        className,
      )}
    >
      C
    </span>
  );
}

export function BrandLockup({
  subtitle,
  tone = "dark",
}: {
  subtitle?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="min-w-0">
        <span
          className={cn(
            "block text-[15px] font-bold tracking-[0.18em]",
            tone === "dark" ? "text-sidebar-ink" : "text-ink",
          )}
        >
          CONNECT
        </span>
        {subtitle ? (
          <span
            className={cn(
              "block truncate text-[10px] tracking-wide",
              tone === "dark" ? "text-sidebar-muted" : "text-muted",
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** The quiet "this is a demo" marker. Present everywhere, loud nowhere. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-500",
        className,
      )}
      title="All data in this build is local demo data. Nothing leaves your browser."
    >
      <span aria-hidden className="size-1.5 rounded-full bg-brand-500" />
      Demo mode
    </span>
  );
}
