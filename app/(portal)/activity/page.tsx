"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/field";
import { Icons } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import type { ActivityEntry, ActivityStatus } from "@/lib/demo/types";
import { useAuth, useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import { activityRepository, employeesRepository } from "@/lib/repositories";
import { formatRelative } from "@/lib/utils/date";

const STATUS_TONES: Record<ActivityStatus, BadgeTone> = {
  success: "success",
  pending: "warning",
  warning: "danger",
};

type EntityFilter = "all" | "Leave" | "Task" | "Attendance" | "Knowledge" | "Workspace";

export default function ActivityPage() {
  const employee = useCurrentEmployee();
  const { can } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState<EntityFilter>("all");

  useEffect(() => {
    if (!can("view_audit_trail")) router.replace("/dashboard");
  }, [can, router]);

  const { data, loading } = useDemoQuery(
    () => {
      if (!can("view_audit_trail")) return null;
      const all = activityRepository.list();
      const needle = query.trim().toLowerCase();

      const searched = all.filter((entry) => {
        if (!needle) return true;
        const actor = employeesRepository.getById(entry.actorId)?.name ?? "";
        return `${entry.action} ${entry.summary} ${entry.entity} ${actor}`
          .toLowerCase()
          .includes(needle);
      });

      return {
        rows: searched.filter((entry) => (entity === "all" ? true : entry.entity === entity)),
        counts: {
          all: searched.length,
          Leave: searched.filter((entry) => entry.entity === "Leave").length,
          Task: searched.filter((entry) => entry.entity === "Task").length,
          Attendance: searched.filter((entry) => entry.entity === "Attendance").length,
          Knowledge: searched.filter((entry) => entry.entity === "Knowledge").length,
          Workspace: searched.filter((entry) => entry.entity === "Workspace").length,
        },
      };
    },
    [employee.role, query, entity],
  );

  if (!can("view_audit_trail")) return null;

  const columns: Column<ActivityEntry>[] = [
    {
      key: "actor",
      header: "Who",
      sortValue: (row) => employeesRepository.getById(row.actorId)?.name ?? "",
      render: (row) => {
        const actor = employeesRepository.getById(row.actorId);
        return (
          <span className="flex items-center gap-2.5">
            <Avatar name={actor?.name ?? "System"} size="xs" />
            <span className="truncate font-medium text-ink">{actor?.name ?? "System"}</span>
          </span>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      sortValue: (row) => row.action,
      render: (row) => <span className="text-ink-soft">{row.action}</span>,
    },
    {
      key: "summary",
      header: "Detail",
      render: (row) => <span className="text-muted">{row.summary}</span>,
      hideBelow: "lg",
    },
    {
      key: "entity",
      header: "Area",
      sortValue: (row) => row.entity,
      render: (row) => <Badge tone="neutral">{row.entity}</Badge>,
      hideBelow: "md",
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      render: (row) => <Badge tone={STATUS_TONES[row.status]}>{row.status}</Badge>,
    },
    {
      key: "at",
      header: "When",
      align: "right",
      sortValue: (row) => row.at,
      render: (row) => <span className="whitespace-nowrap text-muted">{formatRelative(row.at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Activity log"
        description="Every state change in the workspace, with who made it and when. Written by the same repositories that change the data."
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
          {data ? (
            <Tabs
              label="Area"
              value={entity}
              onChange={setEntity}
              options={[
                { value: "all", label: "All", count: data.counts.all },
                { value: "Leave", label: "Leave", count: data.counts.Leave },
                { value: "Task", label: "Tasks", count: data.counts.Task },
                { value: "Attendance", label: "Attendance", count: data.counts.Attendance },
                { value: "Knowledge", label: "Knowledge", count: data.counts.Knowledge },
                { value: "Workspace", label: "Workspace", count: data.counts.Workspace },
              ]}
            />
          ) : null}
          <SearchInput
            label="Search the activity log"
            value={query}
            onChange={setQuery}
            placeholder="Search actions, people or detail…"
            className="lg:w-72"
          />
        </div>

        <div className="border-t border-line px-5 py-4">
          {loading || !data ? (
            <TableSkeleton rows={8} />
          ) : (
            <DataTable
              rows={data.rows}
              columns={columns}
              getRowKey={(row) => row.id}
              caption="Workspace activity log"
              pageSize={12}
              empty={
                <EmptyState
                  title="Nothing recorded here"
                  description={
                    query
                      ? `No entries match “${query.trim()}”.`
                      : "Activity appears as people work in the portal."
                  }
                  icon={<Icons.activity className="size-5" />}
                  action={
                    query ? (
                      <Button size="sm" variant="secondary" onClick={() => setQuery("")}>
                        Clear search
                      </Button>
                    ) : undefined
                  }
                />
              }
              renderMobileCard={(row) => {
                const actor = employeesRepository.getById(row.actorId);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={actor?.name ?? "System"} size="xs" />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                        {actor?.name ?? "System"}
                      </p>
                      <Badge tone={STATUS_TONES[row.status]}>{row.status}</Badge>
                    </div>
                    <p className="text-xs font-medium text-ink-soft">{row.action}</p>
                    <p className="text-xs text-muted">{row.summary}</p>
                    <p className="text-[11px] text-muted">{formatRelative(row.at)}</p>
                  </div>
                );
              }}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
