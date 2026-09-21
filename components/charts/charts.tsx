"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface DataPoint {
  label: string;
  value: number;
}

/** One categorical palette for every chart in the product. */
export const CHART_COLORS = ["#6c5ce7", "#18c4c9", "#e0a33f", "#e2637a", "#5b8def"];

function niceMax(values: number[]): number {
  const max = Math.max(...values, 1);
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / magnitude) * magnitude;
}

/** Values as a visually hidden table, so charts are not a dead end for screen readers. */
function DataFallback({ caption, data, unit }: { caption: string; data: DataPoint[]; unit: string }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <tbody>
        {data.map((point) => (
          <tr key={point.label}>
            <th scope="row">{point.label}</th>
            <td>
              {point.value} {unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function BarChart({
  data,
  caption,
  unit = "",
  height = 200,
  color = CHART_COLORS[0],
  className,
}: {
  data: DataPoint[];
  caption: string;
  unit?: string;
  height?: number;
  color?: string;
  className?: string;
}) {
  const max = niceMax(data.map((point) => point.value));

  return (
    <figure className={cn("w-full", className)}>
      <div
        className="flex items-end gap-2 sm:gap-3"
        style={{ height }}
        role="img"
        aria-label={caption}
      >
        {data.map((point) => {
          const ratio = max ? point.value / max : 0;
          return (
            <div key={point.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
              <p className="text-center text-[11px] font-semibold text-ink-soft tabular-nums">
                {point.value ? `${point.value}${unit}` : ""}
              </p>
              <div
                className="w-full rounded-t-md transition-[height] duration-500 ease-out"
                style={{
                  height: `${Math.max(ratio * 100, point.value ? 4 : 1.5)}%`,
                  background: point.value
                    ? `linear-gradient(180deg, ${color}, ${color}b0)`
                    : "var(--line)",
                }}
              />
              <p className="truncate text-center text-[11px] text-muted">{point.label}</p>
            </div>
          );
        })}
      </div>
      <DataFallback caption={caption} data={data} unit={unit} />
    </figure>
  );
}

export function AreaChart({
  data,
  caption,
  unit = "",
  height = 200,
  className,
}: {
  data: DataPoint[];
  caption: string;
  unit?: string;
  height?: number;
  className?: string;
}) {
  const gradientId = useId();
  const max = niceMax(data.map((point) => point.value));
  const width = 320;
  const inner = { top: 12, bottom: 24, left: 0, right: 0 };
  const plotHeight = height - inner.top - inner.bottom;

  const points = data.map((point, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * width : width / 2;
    const y = inner.top + plotHeight - (max ? (point.value / max) * plotHeight : 0);
    return { ...point, x, y };
  });

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const area = `${line} L${points[points.length - 1]?.x ?? 0},${inner.top + plotHeight} L${points[0]?.x ?? 0},${inner.top + plotHeight} Z`;

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={caption}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity="0.32" />
            <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={0}
            x2={width}
            y1={inner.top + plotHeight * ratio}
            y2={inner.top + plotHeight * ratio}
            stroke="var(--line)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={CHART_COLORS[0]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((point) => (
          <circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="var(--surface)"
            stroke={CHART_COLORS[0]}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        {data.map((point) => (
          <span key={point.label} className="flex-1 truncate text-center">
            {point.label}
          </span>
        ))}
      </div>
      <DataFallback caption={caption} data={data} unit={unit} />
    </figure>
  );
}

export function DonutChart({
  data,
  caption,
  centerLabel,
  centerValue,
  className,
}: {
  data: DataPoint[];
  caption: string;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Pre-compute each arc's length and start offset so the render stays pure.
  const arcs = data.reduce<Array<{ label: string; dash: number; offset: number }>>(
    (acc, point) => {
      const dash = (point.value / total) * circumference;
      const previous = acc[acc.length - 1];
      const offset = previous ? previous.offset + previous.dash : 0;
      return [...acc, { label: point.label, dash, offset }];
    },
    [],
  );

  return (
    <figure className={cn("flex flex-col items-center gap-5 sm:flex-row sm:gap-7", className)}>
      <div className="relative flex-none">
        <svg viewBox="0 0 140 140" className="size-36 -rotate-90" role="img" aria-label={caption}>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--subtle)" strokeWidth="16" />
          {arcs.map((arc, index) => (
            <circle
              key={arc.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth="16"
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {centerValue ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-xl font-semibold text-ink tabular-nums">{centerValue}</p>
              {centerLabel ? <p className="text-[11px] text-muted">{centerLabel}</p> : null}
            </div>
          </div>
        ) : null}
      </div>

      <ul className="w-full space-y-2">
        {data.map((point, index) => (
          <li key={point.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 flex-none rounded-sm"
                style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="truncate text-ink-soft">{point.label}</span>
            </span>
            <span className="flex-none font-medium text-muted tabular-nums">
              {Math.round((point.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
      <DataFallback caption={caption} data={data} unit="" />
    </figure>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = "brand",
}: {
  value: number;
  max?: number;
  label: string;
  tone?: "brand" | "success" | "warning" | "danger";
}) {
  const percentage = Math.min(100, Math.round((value / (max || 1)) * 100));
  const toneClass = {
    brand: "bg-brand-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
  }[tone];

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-subtle"
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", toneClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
