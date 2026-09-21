"use client";

import { cn } from "@/lib/utils/cn";

export interface TabOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

/** Segmented filter control. Behaves as a real tablist for assistive tech. */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("scroll-slim flex gap-1.5 overflow-x-auto pb-0.5", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex flex-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 focus-ring",
              selected
                ? "border-transparent bg-ink text-canvas"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  selected ? "bg-white/15" : "bg-subtle",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
