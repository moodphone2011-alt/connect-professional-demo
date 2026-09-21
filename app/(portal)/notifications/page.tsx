"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import type { NotificationTone } from "@/lib/demo/types";
import { useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import { notificationsRepository } from "@/lib/repositories";
import { formatRelative } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const TONE_BADGE: Record<NotificationTone, BadgeTone> = {
  success: "success",
  info: "info",
  warning: "warning",
  error: "danger",
};

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const employee = useCurrentEmployee();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, loading } = useDemoQuery(
    () => {
      const all = notificationsRepository.listFor(employee.id);
      return {
        rows: filter === "unread" ? all.filter((entry) => !entry.read) : all,
        unread: all.filter((entry) => !entry.read).length,
        total: all.length,
      };
    },
    [employee.id, filter],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Everything the workspace wanted to tell you — approvals, assignments, decisions and announcements."
        actions={
          data && data.unread > 0 ? (
            <Button
              variant="secondary"
              onClick={async () => {
                await notificationsRepository.markAllRead(employee.id);
                toast({ title: "All notifications marked read", tone: "success" });
              }}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {loading || !data ? (
        <Skeleton className="h-8 w-56" />
      ) : (
        <Tabs
          label="Notification filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: data.total },
            { value: "unread", label: "Unread", count: data.unread },
          ]}
        />
      )}

      {loading || !data ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : data.rows.length === 0 ? (
        <EmptyState
          title={filter === "unread" ? "Nothing unread" : "No notifications yet"}
          description={
            filter === "unread"
              ? "You have read everything. New notifications will appear here as work moves."
              : "Approvals, task assignments and company announcements will arrive here."
          }
          icon={<Icons.bell className="size-5" />}
        />
      ) : (
        <ul className="space-y-2.5">
          {data.rows.map((notification) => (
            <li key={notification.id}>
              <Card
                tone={notification.read ? "surface" : "accent"}
                className="flex items-start gap-3.5 transition-colors"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid size-9 flex-none place-items-center rounded-lg",
                    notification.tone === "success"
                      ? "bg-emerald-500/12 text-emerald-600"
                      : notification.tone === "warning"
                        ? "bg-amber-500/12 text-amber-600"
                        : notification.tone === "error"
                          ? "bg-rose-500/12 text-rose-600"
                          : "bg-brand-500/12 text-brand-500",
                  )}
                >
                  <Icons.bell className="size-4.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{notification.title}</p>
                    <Badge tone={TONE_BADGE[notification.tone]}>{notification.tone}</Badge>
                    {notification.employeeId === null ? (
                      <Badge tone="neutral">Company-wide</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{notification.body}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                    <span className="text-[11px] text-muted">
                      {formatRelative(notification.createdAt)}
                    </span>
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        onClick={() => notificationsRepository.markRead(notification.id)}
                        className="rounded text-xs font-medium text-brand-500 hover:underline focus-ring"
                      >
                        Open
                      </Link>
                    ) : null}
                    {!notification.read ? (
                      <button
                        type="button"
                        onClick={() => notificationsRepository.markRead(notification.id)}
                        className="rounded text-xs font-medium text-muted hover:text-ink focus-ring"
                      >
                        Mark as read
                      </button>
                    ) : null}
                  </div>
                </div>

                <IconButton
                  label="Dismiss notification"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await notificationsRepository.dismiss(notification.id);
                    toast({ title: "Notification dismissed", tone: "info" });
                  }}
                >
                  <Icons.close className="size-4" />
                </IconButton>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
