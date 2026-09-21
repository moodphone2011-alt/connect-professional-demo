import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type {
  AttendanceStatus,
  LeaveStatus,
  TaskPriority,
  TaskStatus,
} from "@/lib/demo/types";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-subtle text-muted ring-line",
  brand: "bg-brand-500/12 text-brand-600 ring-brand-500/25 dark:text-brand-300",
  success: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  warning: "bg-amber-500/14 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  danger: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  info: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  dot,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

const LEAVE_TONES: Record<LeaveStatus, { tone: BadgeTone; label: string }> = {
  draft: { tone: "neutral", label: "Draft" },
  pending: { tone: "warning", label: "Pending" },
  approved: { tone: "success", label: "Approved" },
  rejected: { tone: "danger", label: "Rejected" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

const TASK_TONES: Record<TaskStatus, { tone: BadgeTone; label: string }> = {
  todo: { tone: "neutral", label: "To do" },
  in_progress: { tone: "info", label: "In progress" },
  completed: { tone: "success", label: "Completed" },
};

const ATTENDANCE_TONES: Record<AttendanceStatus, { tone: BadgeTone; label: string }> = {
  present: { tone: "success", label: "Present" },
  remote: { tone: "brand", label: "Remote" },
  late: { tone: "warning", label: "Late" },
  absent: { tone: "danger", label: "Absent" },
  leave: { tone: "info", label: "On leave" },
  weekend: { tone: "neutral", label: "Weekend" },
};

const PRIORITY_TONES: Record<TaskPriority, { tone: BadgeTone; label: string }> = {
  high: { tone: "danger", label: "High" },
  medium: { tone: "warning", label: "Medium" },
  low: { tone: "neutral", label: "Low" },
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const config = LEAVE_TONES[status];
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = TASK_TONES[status];
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const config = ATTENDANCE_TONES[status];
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = PRIORITY_TONES[priority];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
