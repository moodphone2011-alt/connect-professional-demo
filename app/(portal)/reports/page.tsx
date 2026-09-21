"use client";

import { useState } from "react";
import { AreaChart, BarChart, DonutChart } from "@/components/charts/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatsCard } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StatsSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useAuth, useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import {
  analyticsRepository,
  attendanceRepository,
  isOverdue,
  leaveRepository,
  tasksRepository,
} from "@/lib/repositories";
import { formatDate, formatHours, formatLongDate, startOfWeek, toISODate } from "@/lib/utils/date";

type ReportKind = "daily" | "weekly" | "monthly";

const REPORTS: Array<{ kind: ReportKind; title: string; description: string }> = [
  {
    kind: "daily",
    title: "Daily snapshot",
    description: "Today's attendance, the work in front of you, and anything that slipped.",
  },
  {
    kind: "weekly",
    title: "Weekly summary",
    description: "Hours logged, tasks closed and leave activity for the current week.",
  },
  {
    kind: "monthly",
    title: "Monthly review",
    description: "Attendance consistency and completion trends over the last six weeks.",
  },
];

export default function ReportsPage() {
  const employee = useCurrentEmployee();
  const { can } = useAuth();
  const { toast } = useToast();
  const [openReport, setOpenReport] = useState<ReportKind | null>(null);
  const [generating, setGenerating] = useState<ReportKind | null>(null);

  const { data, loading } = useDemoQuery(() => {
    const tasks = tasksRepository.listFor(employee.id);
    const summary = tasksRepository.summarise(tasks);
    const attendance = attendanceRepository.listFor(employee.id);
    const weekStart = toISODate(startOfWeek());
    const workdays = attendance.filter((record) => record.status !== "weekend");

    const monthHours = attendance
      .filter((record) => record.date >= toISODate(new Date(Date.now() - 30 * 86_400_000)))
      .reduce((total, record) => total + record.hours, 0);

    return {
      summary,
      tasks,
      attendanceRate: workdays.length
        ? Math.round(
            (workdays.filter((record) => record.status !== "absent" && record.status !== "leave")
              .length /
              workdays.length) *
              100,
          )
        : 0,
      weekHours: attendance
        .filter((record) => record.date >= weekStart)
        .reduce((total, record) => total + record.hours, 0),
      monthHours: Math.round(monthHours),
      weekly: attendanceRepository.weeklyHours(employee.id),
      trend: analyticsRepository.weeklyTrend(employee),
      mix: [
        { label: "On time", value: workdays.filter((r) => r.status === "present").length },
        { label: "Remote", value: workdays.filter((r) => r.status === "remote").length },
        { label: "Late", value: workdays.filter((r) => r.status === "late").length },
        {
          label: "Leave / absent",
          value: workdays.filter((r) => r.status === "absent" || r.status === "leave").length,
        },
      ],
      leave: leaveRepository.listFor(employee.id),
      overdue: tasks.filter(isOverdue),
    };
  }, [employee.id]);

  async function generate(kind: ReportKind) {
    setGenerating(kind);
    // The report is assembled from live data; the pause mirrors a real request.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setGenerating(null);
    setOpenReport(kind);
    toast({ title: "Report ready", description: "Generated from your live workspace data.", tone: "success" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insight"
        title="Reports"
        description="Summaries built from what actually happened — not from anything anyone had to type twice."
      />

      {loading || !data ? (
        <StatsSkeleton />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Attendance"
            value={`${data.attendanceRate}%`}
            hint="Days present or remote"
            tone={data.attendanceRate >= 90 ? "positive" : "warning"}
            icon={<Icons.clock className="size-4" />}
          />
          <StatsCard
            label="Task completion"
            value={`${data.summary.completionRate}%`}
            hint={`${data.summary.completed} of ${data.summary.total} tasks`}
            tone={data.summary.completionRate >= 70 ? "positive" : "warning"}
            icon={<Icons.checkCircle className="size-4" />}
          />
          <StatsCard
            label="Hours this week"
            value={formatHours(data.weekHours)}
            hint="Target 40h"
            icon={<Icons.chart className="size-4" />}
          />
          <StatsCard
            label="Hours (30 days)"
            value={`${data.monthHours}h`}
            hint="Recorded working time"
          />
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {REPORTS.map((report) => (
          <Card key={report.kind} className="flex flex-col">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-500/10 text-brand-500">
              <Icons.report className="size-4.5" />
            </span>
            <h2 className="mt-3.5 text-base font-semibold text-ink">{report.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{report.description}</p>
            <Button
              variant="secondary"
              className="mt-4"
              loading={generating === report.kind}
              onClick={() => generate(report.kind)}
            >
              Generate report
              <Icons.arrowRight className="size-4" />
            </Button>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Hours trend" subtitle="Recorded hours over the last six weeks" />
          <div className="mt-5">
            {loading || !data ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <AreaChart data={data.trend} caption="Hours recorded per week" unit="h" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Attendance mix" subtitle="How your days break down" />
          <div className="mt-5">
            {loading || !data ? (
              <Skeleton className="h-36 w-full" />
            ) : (
              <DonutChart
                data={data.mix}
                caption="Attendance status distribution"
                centerValue={`${data.attendanceRate}%`}
                centerLabel="present"
              />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="This week at a glance"
          subtitle={`Week beginning ${formatDate(toISODate(startOfWeek()), true)}`}
        />
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

      <Modal
        open={Boolean(openReport)}
        onClose={() => setOpenReport(null)}
        title={REPORTS.find((report) => report.kind === openReport)?.title ?? "Report"}
        description={`${employee.name} · generated ${formatLongDate(new Date())}`}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setOpenReport(null)}>
            Close
          </Button>
        }
      >
        {data ? (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{employee.department}</Badge>
              <Badge tone="neutral">{employee.jobTitle}</Badge>
              {can("view_analytics") ? <Badge tone="info">Manager view available</Badge> : null}
            </div>

            <section>
              <h3 className="text-sm font-semibold text-ink">Attendance</h3>
              <p className="mt-1.5 leading-relaxed text-muted">
                {openReport === "daily"
                  ? `Today you have logged ${formatHours(attendanceRepository.summaryFor(employee.id).todayHours)}. Your rolling attendance rate is ${data.attendanceRate}%.`
                  : openReport === "weekly"
                    ? `You logged ${formatHours(data.weekHours)} this week against a 40 hour target, with an attendance rate of ${data.attendanceRate}%.`
                    : `Over the last 30 days you recorded ${data.monthHours} hours, with an attendance rate of ${data.attendanceRate}%.`}
              </p>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-ink">Work</h3>
              <p className="mt-1.5 leading-relaxed text-muted">
                {data.summary.completed} of {data.summary.total} tasks are complete (
                {data.summary.completionRate}%). {data.summary.todo + data.summary.inProgress} remain
                open
                {data.overdue.length ? `, of which ${data.overdue.length} are overdue` : ""}.
              </p>
              {data.overdue.length ? (
                <ul className="mt-2.5 space-y-1.5">
                  {data.overdue.slice(0, 4).map((task) => (
                    <li key={task.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-ink-soft">{task.title}</span>
                      <span className="flex-none font-medium text-rose-500">
                        due {formatDate(task.dueDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-ink">Leave</h3>
              <p className="mt-1.5 leading-relaxed text-muted">
                {leaveRepository.balanceFor(employee.id).annualRemaining} annual days remaining.{" "}
                {data.leave.filter((request) => request.status === "pending").length} request(s)
                pending, {data.leave.filter((request) => request.status === "approved").length}{" "}
                approved this year.
              </p>
            </section>

            <p className="rounded-lg border border-line bg-subtle/60 px-3 py-2.5 text-xs text-muted">
              Generated locally from demo data. In a production deployment this report would be
              exportable to PDF and scheduled by email.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
