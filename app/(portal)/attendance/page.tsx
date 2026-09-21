"use client";

import { useState } from "react";
import { BarChart, DonutChart } from "@/components/charts/charts";
import { CheckInWidget } from "@/components/portal/check-in-widget";
import { AttendanceStatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, StatsCard } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Icons } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton, StatsSkeleton, TableSkeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import { attendanceRepository } from "@/lib/repositories";
import type { AttendanceRecord } from "@/lib/demo/types";
import { formatDate, formatHours, formatTime } from "@/lib/utils/date";

type RangeFilter = "30" | "60";
type StatusFilter = "all" | "present" | "remote" | "late" | "absent";

export default function AttendancePage() {
  const employee = useCurrentEmployee();
  const [range, setRange] = useState<RangeFilter>("30");
  const [status, setStatus] = useState<StatusFilter>("all");

  const { data, loading } = useDemoQuery(() => {
    const all = attendanceRepository
      .listFor(employee.id)
      .filter((record) => record.status !== "weekend");
    const limited = all.slice(0, Number(range));

    return {
      summary: attendanceRepository.summaryFor(employee.id),
      weekly: attendanceRepository.weeklyHours(employee.id),
      records: limited.filter((record) => (status === "all" ? true : record.status === status)),
      counts: {
        all: limited.length,
        present: limited.filter((record) => record.status === "present").length,
        remote: limited.filter((record) => record.status === "remote").length,
        late: limited.filter((record) => record.status === "late").length,
        absent: limited.filter((record) => record.status === "absent" || record.status === "leave")
          .length,
      },
      mix: [
        { label: "On time", value: limited.filter((r) => r.status === "present").length },
        { label: "Remote", value: limited.filter((r) => r.status === "remote").length },
        { label: "Late", value: limited.filter((r) => r.status === "late").length },
        {
          label: "Leave / absent",
          value: limited.filter((r) => r.status === "absent" || r.status === "leave").length,
        },
      ],
    };
  }, [employee.id, range, status]);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "date",
      header: "Date",
      sortValue: (row) => row.date,
      render: (row) => <span className="font-medium text-ink">{formatDate(row.date, true)}</span>,
    },
    {
      key: "checkIn",
      header: "Check in",
      sortValue: (row) => row.checkIn ?? "",
      render: (row) => formatTime(row.checkIn),
    },
    {
      key: "checkOut",
      header: "Check out",
      sortValue: (row) => row.checkOut ?? "",
      render: (row) => formatTime(row.checkOut),
      hideBelow: "md",
    },
    {
      key: "hours",
      header: "Hours",
      sortValue: (row) => row.hours,
      render: (row) => <span className="tabular-nums">{formatHours(row.hours)}</span>,
      hideBelow: "sm",
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      sortValue: (row) => row.status,
      render: (row) => <AttendanceStatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Time"
        title="Attendance"
        description="Your working rhythm, recorded as it happens. Check in from here or the dashboard."
      />

      <CheckInWidget variant="inline" />

      {loading || !data ? (
        <StatsSkeleton />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Today"
            value={data.summary.todayHours ? formatHours(data.summary.todayHours) : "—"}
            hint={
              data.summary.today?.checkIn
                ? `Started at ${formatTime(data.summary.today.checkIn)}`
                : "Not checked in"
            }
            icon={<Icons.clock className="size-4" />}
          />
          <StatsCard
            label="This week"
            value={formatHours(data.summary.weekHours)}
            hint="Target 40h"
            tone={data.summary.weekHours >= 32 ? "positive" : "neutral"}
          />
          <StatsCard
            label="On-time rate"
            value={`${data.summary.onTimeRate}%`}
            hint={data.summary.onTimeRate >= 90 ? "Strong consistency" : "Room to improve"}
            tone={data.summary.onTimeRate >= 90 ? "positive" : "warning"}
          />
          <StatsCard
            label="Late arrivals"
            value={`${data.summary.lateCount}`}
            hint="Across recorded history"
            tone={data.summary.lateCount > 5 ? "warning" : "neutral"}
          />
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="This week" subtitle="Hours logged each working day" />
          <div className="mt-5">
            {loading || !data ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <BarChart
                data={data.weekly.map((day) => ({ label: day.label, value: day.hours }))}
                caption="Hours logged each day this week"
                unit="h"
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Attendance mix" subtitle={`Last ${range} recorded days`} />
          <div className="mt-5">
            {loading || !data ? (
              <Skeleton className="h-36 w-full" />
            ) : (
              <DonutChart
                data={data.mix}
                caption="Distribution of attendance statuses"
                centerValue={`${data.summary.onTimeRate}%`}
                centerLabel="on time"
              />
            )}
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <CardHeader title="Attendance history" subtitle="Every recorded working day" />
          <Tabs
            label="Date range"
            value={range}
            onChange={setRange}
            options={[
              { value: "30", label: "Last 30 days" },
              { value: "60", label: "Last 60 days" },
            ]}
          />
        </div>

        <div className="border-t border-line px-5 py-4">
          {loading || !data ? (
            <TableSkeleton />
          ) : (
            <>
              <Tabs
                label="Attendance status"
                className="mb-4"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All", count: data.counts.all },
                  { value: "present", label: "On time", count: data.counts.present },
                  { value: "remote", label: "Remote", count: data.counts.remote },
                  { value: "late", label: "Late", count: data.counts.late },
                  { value: "absent", label: "Leave / absent", count: data.counts.absent },
                ]}
              />
              <DataTable
                rows={data.records}
                columns={columns}
                getRowKey={(row) => row.id}
                caption="Attendance history"
                pageSize={10}
                empty={
                  <EmptyState
                    title="No records match this filter"
                    description="Try a different status or widen the date range."
                    icon={<Icons.clock className="size-5" />}
                  />
                }
                renderMobileCard={(row) => (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{formatDate(row.date, true)}</p>
                      <AttendanceStatusBadge status={row.status} />
                    </div>
                    <dl className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <dt className="text-muted">In</dt>
                        <dd className="font-medium text-ink-soft">{formatTime(row.checkIn)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Out</dt>
                        <dd className="font-medium text-ink-soft">{formatTime(row.checkOut)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Hours</dt>
                        <dd className="font-medium text-ink-soft">{formatHours(row.hours)}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
