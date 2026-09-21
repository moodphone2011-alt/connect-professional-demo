"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, BarChart, DonutChart, ProgressBar } from "@/components/charts/charts";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, StatsCard } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton, StatsSkeleton } from "@/components/ui/states";
import { useAuth, useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import { analyticsRepository } from "@/lib/repositories";
import { formatHours } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

export default function AnalyticsPage() {
  const employee = useCurrentEmployee();
  const { can } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!can("view_analytics")) router.replace("/dashboard");
  }, [can, router]);

  const { data, loading } = useDemoQuery(
    () =>
      can("view_analytics")
        ? {
            overview: analyticsRepository.teamOverview(employee),
            trend: analyticsRepository.weeklyTrend(employee),
            mix: analyticsRepository.attendanceMix(employee),
            workload: analyticsRepository.workloadByDepartment(employee),
            recommendations: analyticsRepository.recommendations(employee),
          }
        : null,
    [employee.id, employee.role],
  );

  if (!can("view_analytics")) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Decision support"
        title="Team analytics"
        description="Evidence to open a conversation with — never a verdict on a person. Every signal links back to the record behind it."
      />

      {loading || !data ? (
        <StatsSkeleton />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Team members"
            value={`${data.overview.headcount}`}
            hint={
              data.overview.onLeave
                ? `${data.overview.onLeave} currently on leave`
                : "All available"
            }
            icon={<Icons.users className="size-4" />}
          />
          <StatsCard
            label="Attendance"
            value={`${data.overview.attendanceRate}%`}
            hint="Present or remote, recorded history"
            tone={data.overview.attendanceRate >= 90 ? "positive" : "warning"}
            icon={<Icons.clock className="size-4" />}
          />
          <StatsCard
            label="Task completion"
            value={`${data.overview.completionRate}%`}
            hint={`${data.overview.openTasks} tasks still open`}
            tone={data.overview.completionRate >= 70 ? "positive" : "warning"}
            icon={<Icons.checkCircle className="size-4" />}
          />
          <StatsCard
            label="Overdue work"
            value={`${data.overview.overdueTasks}`}
            hint={
              data.overview.pendingApprovals
                ? `${data.overview.pendingApprovals} approvals waiting on you`
                : "Approvals queue clear"
            }
            tone={data.overview.overdueTasks ? "negative" : "positive"}
            icon={<Icons.warning className="size-4" />}
          />
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Team hours" subtitle="Recorded hours per week, last six weeks" />
          <div className="mt-5">
            {loading || !data ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <AreaChart data={data.trend} caption="Team hours recorded per week" unit="h" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Attendance mix" subtitle="Across the whole team" />
          <div className="mt-5">
            {loading || !data ? (
              <Skeleton className="h-36 w-full" />
            ) : (
              <DonutChart
                data={data.mix}
                caption="Team attendance status distribution"
                centerValue={`${data.overview.attendanceRate}%`}
                centerLabel="present"
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Open work by department" subtitle="Where the load sits" />
          <div className="mt-5">
            {loading || !data ? (
              <Skeleton className="h-[200px] w-full" />
            ) : data.workload.length === 0 ? (
              <EmptyState
                title="No open work"
                description="Nothing is currently assigned across the team."
                icon={<Icons.checkCircle className="size-5" />}
                compact
              />
            ) : (
              <BarChart
                data={data.workload}
                caption="Open tasks by department"
                color="#18c4c9"
                height={180}
              />
            )}
          </div>
        </Card>

        <Card className="xl:col-span-2" padded={false}>
          <div className="p-5">
            <CardHeader
              title="Team detail"
              subtitle="Attendance, workload and completion, per person"
            />
          </div>
          {loading || !data ? (
            <div className="space-y-3 px-5 pb-5">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <ul className="border-t border-line">
              {data.overview.members.map((member) => (
                <li
                  key={member.employee.id}
                  className="flex flex-wrap items-center gap-3 border-b border-line/70 px-5 py-3.5 last:border-0"
                >
                  <Avatar name={member.employee.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{member.employee.name}</p>
                    <p className="truncate text-xs text-muted">
                      {member.employee.jobTitle} · {formatHours(member.hoursThisWeek)} this week
                    </p>
                  </div>

                  <div className="hidden w-36 sm:block">
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>Completion</span>
                      <span className="tabular-nums">{member.completionRate}%</span>
                    </div>
                    <ProgressBar
                      label={`${member.employee.name} task completion`}
                      value={member.completionRate}
                      tone={member.completionRate >= 70 ? "success" : "warning"}
                    />
                  </div>

                  <div className="flex flex-none items-center gap-1.5">
                    <Badge tone={member.attendanceRate >= 90 ? "success" : "warning"}>
                      {member.attendanceRate}% present
                    </Badge>
                    {member.overdueTasks ? (
                      <Badge tone="danger">{member.overdueTasks} overdue</Badge>
                    ) : (
                      <Badge tone="neutral">{member.openTasks} open</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recommended conversations"
          subtitle="Prompts for a manager — review the underlying records before acting"
        />
        <div className="mt-4 space-y-2.5">
          {loading || !data ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : data.recommendations.length === 0 ? (
            <EmptyState
              title="Nothing needs your attention"
              description="No workload imbalance, overdue backlog or pending approvals in your team right now."
              icon={<Icons.checkCircle className="size-5" />}
            />
          ) : (
            data.recommendations.map((recommendation) => (
              <article
                key={recommendation.id}
                className={cn(
                  "flex min-w-0 flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center",
                  recommendation.tone === "warning"
                    ? "border-amber-500/30 bg-amber-500/[0.06]"
                    : recommendation.tone === "success"
                      ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                      : "border-line bg-subtle/60",
                )}
              >
                <span
                  aria-hidden
                  className="grid size-9 flex-none place-items-center rounded-lg bg-surface text-brand-500"
                >
                  <Icons.sparkles className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{recommendation.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{recommendation.detail}</p>
                </div>
                <Badge tone="neutral">{recommendation.confidence} confidence</Badge>
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
