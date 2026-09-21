import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Surface tones live here rather than in caller class names: Tailwind resolves
 * conflicting utilities by stylesheet order, not by the order they appear in a
 * class attribute, so a caller passing `bg-…` cannot reliably override the base
 * background. Choosing a tone is explicit and always wins.
 */
export type CardTone = "surface" | "accent" | "dark" | "plain";

const TONES: Record<CardTone, string> = {
  surface: "border-line bg-surface shadow-soft",
  accent: "border-brand-500/40 bg-brand-500/[0.05]",
  dark: "border-transparent bg-sidebar text-white shadow-soft",
  plain: "",
};

export function Card({
  children,
  className,
  padded = true,
  tone = "surface",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  tone?: CardTone;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={cn(
        // `min-w-0` matters: as a grid or flex child a card must be allowed to
        // shrink below its content's intrinsic width, or it overflows on phones.
        "min-w-0 rounded-card border",
        TONES[tone],
        padded && "p-5",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-none items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function StatsCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "warning" | "negative";
  icon?: ReactNode;
}) {
  const toneClass = {
    neutral: "text-muted",
    positive: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    negative: "text-rose-600 dark:text-rose-400",
  }[tone];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon ? (
          <span className="grid size-8 flex-none place-items-center rounded-lg bg-brand-500/10 text-brand-500">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {hint ? <p className={cn("text-xs font-medium", toneClass)}>{hint}</p> : null}
    </Card>
  );
}
