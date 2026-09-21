"use client";

import Link from "next/link";
import { BarChart } from "@/components/charts/charts";
import { CheckInWidget } from "@/components/portal/check-in-widget";
import { Avatar } from "@/components/ui/avatar";
import { Badge, PriorityBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, StatsCard } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { EmptyState, Skeleton, StatsSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useAuth, useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import {
  activityRepository,
  analyticsRepository,
  attendanceRepository,
  employeesRepository,
  eventsRepository,
  isOverdue,
  leaveRepository,
  tasksRepository,
} from "@/lib/repositories";
import {
  formatDate,
  formatHours,
  formatLongDate,
  formatRelative,
  formatTime,
  toISODate,
} from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const ASSISTANT_PROMPTS = [
  "Show my tasks",
  "What is my leave balance?",
  "What is on my calendar?",
];

export default function DashboardPage() {
  const employee = useCurrentEmployee();
  const { can } = useAuth();
  const { toast } = useToast();

  const { data, loading } = useDemoQuery(
    () => {
      const tasks = tasksRepository.listFor(employee.id);
      const summary = tasksRepository.summarise(tasks);
      const attendance = attendanceRepository.summaryFor(employee.id);
      const balance = leaveRepository.balanceFor(employee.id);
      const today = toISODate(new Date());

      return {
        tasks,
        summary,
        attendance,
        balance,
        weekly: attendanceRepository.weeklyHours(employee.id),
        todayEvents: eventsRepository.listForDate(employee, today),
        upcoming: eventsRepository.listUpcoming(employee, 4),
        approvals: leaveRepository.listPendingApprovals(employee),
        team: can("view_analytics") ? analyticsRepository.teamOverview(employee) : null,
        activity: activityRepository.list().slice(0, 6),
      };
    },
    [employee.id, employee.role],
  );

  const firstName = employee.name.split(" ")[0];

  async function completeTask(id: string, title: string) {
    await tasksRepository.setStatus(id, "completed", employee);
    toast({ title: "Task completed", description: `“${title}” is done.`, tone: "success" });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-500">
            {formatLongDate(new Date())}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Good day, {firstName}.</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Here is the pulse of your workday — hours, requests, and the work that needs you next.
          </p>
        </div>
        <div className="w-full lg:max-w-md">
          <CheckInWidget />
        </div>
      </section>

      {loading || !data ? (
        <StatsSkeleton />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Hours this week"
            value={formatHours(data.attendance.weekHours)}
            hint={`Target 40h · ${Math.round((data.attendance.weekHours / 40) * 100)}% logged`}
            tone={data.attendance.weekHours >= 32 ? "positive" : "neutral"}
            icon={<Icons.clock className="size-4" />}
          />
          <StatsCard
            label="Leave balance"
            value={`${data.balance.annualRemaining} days`}
            hint={
              data.balance.pending
                ? `${data.balance.pending} request awaiting approval`
                : `of ${data.balance.annualTotal} annual days`
            }
            tone={data.balance.pending ? "warning" : "neutral"}
            icon={<Icons.leave className="size-4" />}
          />
          <StatsCard
            label="Open tasks"
            value={`${data.summary.todo + data.summary.inProgress}`}
            hint={
              data.summary.overdue
                ? `${data.summary.overdue} overdue`
                : data.summary.dueToday
                  ? `${data.summary.dueToday} due today`
                  : "Nothing overdue"
            }
            tone={data.summary.overdue ? "negative" : "positive"}
            icon={<Icons.checkCircle className="size-4" />}
          />
          <StatsCard
            label={can("view_analytics") ? "Awaiting your approval" : "On-time rate"}
            value={
              can("view_analytics")
                ? `${data.approvals.length}`
                : `${data.attendance.onTimeRate}%`
            }
            hint={
              can("view_analytics")
                ? data.approvals.length
                  ? "Leave requests to review"
                  : "Nothing waiting on you"
                : "Last 60 working days"
            }
            tone={
              can("view_analytics")
                ? data.approvals.length
                  ? "warning"
                  : "positive"
                : data.attendance.onTimeRate >= 90
                  ? "positive"
                  : "warning"
            }
            icon={<Icons.chart className="size-4" />}
          />
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Weekly rhythm"
            subtitle="Hours logged, Sunday to Thursday"
            action={
              <ButtonLink href="/attendance" size="sm" variant="ghost">
                Attendance
                <Icons.arrowRight className="size-4" />
              </ButtonLink>
            }
          />
          <div className="mt-5">
            {loading || !data ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <BarChart data={data.weekly.map((day) => ({ label: day.label, value: day.hours }))} caption="Hours logged each day this week" unit="h" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Today"
            subtitle="Your schedule"
            action={
              <ButtonLink href="/calendar" size="sm" variant="ghost">
                Calendar
              </ButtonLink>
            }
          />
          <div className="mt-4">
            {loading || !data ? (
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : data.todayEvents.length === 0 ? (
              <EmptyState
                title="Nothing scheduled today"
                description="Your calendar is clear. A good day for focused work."
                icon={<Icons.calendar className="size-5" />}
                compact
              />
            ) : (
              <ol className="space-y-1">
                {data.todayEvents.map((event) => (
                  <li key={event.id} className="flex gap-3 py-2.5">
                    <div className="flex flex-col items-center">
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 size-2 flex-none rounded-full",
                          event.type === "deadline" ? "bg-rose-500" : "bg-brand-500",
                        )}
                      />
                      <span aria-hidden className="mt-1 w-px flex-1 bg-line" />
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatTime(event.startTime)} · {event.location}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" padded={false}>
          <div className="p-5">
            <CardHeader
              title="Work in motion"
              subtitle={
                data
                  ? `${data.summary.todo + data.summary.inProgress} open · ${data.summary.overdue} overdue`
                  : "Loading…"
              }
              action={
                <ButtonLink href="/tasks" size="sm" variant="ghost">
                  All tasks
                  <Icons.arrowRight className="size-4" />
                </ButtonLink>
              }
            />
          </div>

          {loading || !data ? (
            <div className="space-y-3 px-5 pb-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : data.tasks.filter((task) => task.status !== "completed").length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                title="No open tasks"
                description="Everything assigned to you is complete. New work will appear here."
                icon={<Icons.checkCircle className="size-5" />}
                action={
                  <ButtonLink href="/tasks" size="sm" variant="secondary">
                    Create a task
                  </ButtonLink>
                }
              />
            </div>
          ) : (
            <ul className="border-t border-line">
              {data.tasks
                .filter((task) => task.status !== "completed")
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .slice(0, 4)
                .map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 border-b border-line/70 px-5 py-3.5 last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => completeTask(task.id, task.title)}
                      aria-label={`Mark “${task.title}” complete`}
                      className="grid size-5 flex-none place-items-center rounded-full border-2 border-line-strong text-transparent transition hover:border-brand-500 hover:text-brand-500 focus-ring"
                    >
                      <Icons.check className="size-3" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{task.category}</p>
                    </div>
                    <PriorityBadge priority={task.priority} />
                    <span
                      className={cn(
                        "hidden flex-none text-xs sm:block",
                        isOverdue(task) ? "font-medium text-rose-500" : "text-muted",
                      )}
                    >
                      {isOverdue(task) ? "Overdue" : formatDate(task.dueDate)}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card tone="dark" className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand-500/30 blur-3xl"
          />
          <div className="relative">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-accent">
              <Icons.sparkles className="size-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">Ask Connect AI</h3>
            <p className="mt-2 text-xs leading-relaxed text-sidebar-muted">
              Answers come from your live workspace data — tasks, leave, attendance and the company
              handbook. English or Arabic.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ASSISTANT_PROMPTS.map((prompt) => (
                <Link
                  key={prompt}
                  href={`/assistant?q=${encodeURIComponent(prompt)}`}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] text-sidebar-ink transition hover:bg-white/[0.12] focus-ring"
                >
                  {prompt}
                </Link>
              ))}
            </div>
            <ButtonLink href="/assistant" variant="primary" className="mt-5 w-full">
              Open the assistant
              <Icons.arrowRight className="size-4" />
            </ButtonLink>
          </div>
        </Card>
      </div>

      {can("approve_leave") ? (
        <Card padded={false}>
          <div className="p-5">
            <CardHeader
              title="Approvals waiting on you"
              subtitle="Leave requests from your team"
              action={
                <ButtonLink href="/leave" size="sm" variant="ghost">
                  Open leave
                  <Icons.arrowRight className="size-4" />
                </ButtonLink>
              }
            />
          </div>
          {loading || !data ? (
            <div className="space-y-3 px-5 pb-5">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : data.approvals.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                title="No approvals pending"
                description="Every request from your team has a decision. New ones will appear here."
                icon={<Icons.checkCircle className="size-5" />}
              />
            </div>
          ) : (
            <ul className="border-t border-line">
              {data.approvals.slice(0, 4).map((request) => {
                const applicant = employeesRepository.getById(request.employeeId);
                return (
                  <li
                    key={request.id}
                    className="flex flex-wrap items-center gap-3 border-b border-line/70 px-5 py-3.5 last:border-0"
                  >
                    <Avatar name={applicant?.name ?? "Employee"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {applicant?.name ?? "Employee"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {request.days} {request.days === 1 ? "day" : "days"} ·{" "}
                        {formatDate(request.startDate)} → {formatDate(request.endDate)}
                      </p>
                    </div>
                    <Badge tone="warning">{request.type}</Badge>
                    <ButtonLink href={`/leave?focus=${request.id}`} size="sm" variant="secondary">
                      Review
                    </ButtonLink>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Recent activity" subtitle="What has moved across the workspace" />
          {loading || !data ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line/70">
              {data.activity.map((entry) => {
                const actor = employeesRepository.getById(entry.actorId);
                return (
                  <li key={entry.id} className="flex items-start gap-3 py-3">
                    <Avatar name={actor?.name ?? "System"} size="xs" className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">
                        <span className="font-medium">{actor?.name ?? "System"}</span>{" "}
                        <span className="text-muted">{entry.action.toLowerCase()}</span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">{entry.summary}</p>
                    </div>
                    <span className="flex-none text-[11px] text-muted">
                      {formatRelative(entry.at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Coming up" subtitle="Next on your calendar" />
          {loading || !data ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : data.upcoming.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              description="No upcoming events on your calendar."
              icon={<Icons.calendar className="size-5" />}
              compact
              className="mt-4"
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {data.upcoming.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-subtle/50 p-3"
                >
                  <div className="grid size-10 flex-none place-items-center rounded-lg bg-surface text-center">
                    <span className="text-[10px] font-semibold uppercase text-muted">
                      {formatDate(event.date).split(" ")[1]}
                    </span>
                    <span className="-mt-1 text-sm font-semibold text-ink">
                      {formatDate(event.date).split(" ")[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {formatTime(event.startTime)} · {event.location}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ButtonLink href="/calendar" variant="secondary" className="mt-4 w-full">
            Open calendar
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}
