"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatsCard } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/field";
import { Icons } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton, StatsSkeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/charts/charts";
import type { Employee } from "@/lib/demo/types";
import { useAuth, useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import {
  analyticsRepository,
  attendanceRepository,
  employeesRepository,
  isOverdue,
  ROLE_LABELS,
  tasksRepository,
} from "@/lib/repositories";
import { formatDate, formatHours } from "@/lib/utils/date";

export default function TeamPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <TeamView />
    </Suspense>
  );
}

function TeamView() {
  const employee = useCurrentEmployee();
  const { can } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  // A `?person=` link opens a profile; an explicit choice overrides that default.
  const [choice, setChoice] = useState<{ person: Employee | null } | null>(null);

  useEffect(() => {
    if (!can("view_directory")) router.replace("/dashboard");
  }, [can, router]);

  const personParam = params.get("person");
  const selected = choice
    ? choice.person
    : personParam
      ? (employeesRepository.getById(personParam) ?? null)
      : null;
  const setSelected = (person: Employee | null) => setChoice({ person });

  const { data, loading } = useDemoQuery(
    () => {
      if (!can("view_directory")) return null;
      const people = employeesRepository.listVisibleTo(employee);
      const needle = query.trim().toLowerCase();

      return {
        overview: analyticsRepository.teamOverview(employee),
        departments: ["All", ...Array.from(new Set(people.map((person) => person.department)))],
        people: people
          .filter((person) => (department === "All" ? true : person.department === department))
          .filter(
            (person) =>
              !needle ||
              person.name.toLowerCase().includes(needle) ||
              person.jobTitle.toLowerCase().includes(needle) ||
              person.email.toLowerCase().includes(needle),
          ),
      };
    },
    [employee.id, employee.role, query, department],
  );

  if (!can("view_directory")) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Team"
        description="The directory of everyone you are responsible for, with the workload and attendance behind each name."
      />

      {loading || !data ? (
        <StatsSkeleton count={3} />
      ) : (
        <section className="grid gap-3 sm:grid-cols-3">
          <StatsCard
            label="Headcount"
            value={`${data.overview.headcount}`}
            hint={`${data.overview.onLeave} on leave`}
            icon={<Icons.users className="size-4" />}
          />
          <StatsCard
            label="Open work"
            value={`${data.overview.openTasks}`}
            hint={`${data.overview.overdueTasks} overdue`}
            tone={data.overview.overdueTasks ? "warning" : "positive"}
            icon={<Icons.checkCircle className="size-4" />}
          />
          <StatsCard
            label="Approvals waiting"
            value={`${data.overview.pendingApprovals}`}
            hint={data.overview.pendingApprovals ? "Leave requests" : "Queue clear"}
            tone={data.overview.pendingApprovals ? "warning" : "positive"}
            icon={<Icons.leave className="size-4" />}
          />
        </section>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {loading || !data ? (
          <Skeleton className="h-8 w-72" />
        ) : (
          <Tabs
            label="Department"
            value={department}
            onChange={setDepartment}
            options={data.departments.map((value) => ({ value, label: value }))}
          />
        )}
        <SearchInput
          label="Search people"
          value={query}
          onChange={setQuery}
          placeholder="Search by name, role or email…"
          className="lg:w-72"
        />
      </div>

      {loading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      ) : data.people.length === 0 ? (
        <EmptyState
          title="No one matches"
          description="Try another name, or clear the department filter."
          icon={<Icons.users className="size-5" />}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setDepartment("All");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.people.map((person) => {
            const tasks = tasksRepository.listFor(person.id);
            const open = tasks.filter((task) => task.status !== "completed").length;
            const overdue = tasks.filter(isOverdue).length;
            const attendance = attendanceRepository.summaryFor(person.id);

            return (
              <Card key={person.id} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <Avatar name={person.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-ink">{person.name}</h2>
                    <p className="truncate text-xs text-muted">{person.jobTitle}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="neutral">{person.department}</Badge>
                      {person.status === "on_leave" ? (
                        <Badge tone="info">On leave</Badge>
                      ) : person.status === "onboarding" ? (
                        <Badge tone="warning">Onboarding</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3.5 text-center">
                  <div>
                    <dt className="text-[11px] text-muted">Open</dt>
                    <dd className="text-sm font-semibold text-ink tabular-nums">{open}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">Overdue</dt>
                    <dd
                      className={`text-sm font-semibold tabular-nums ${overdue ? "text-rose-500" : "text-ink"}`}
                    >
                      {overdue}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">On time</dt>
                    <dd className="text-sm font-semibold text-ink tabular-nums">
                      {attendance.onTimeRate}%
                    </dd>
                  </div>
                </dl>

                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setSelected(person)}
                >
                  View profile
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.jobTitle} · ${selected.department}` : undefined}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? <PersonProfile person={selected} /> : null}
      </Modal>
    </div>
  );
}

function PersonProfile({ person }: { person: Employee }) {
  const tasks = tasksRepository.listFor(person.id);
  const summary = tasksRepository.summarise(tasks);
  const attendance = attendanceRepository.summaryFor(person.id);
  const manager = person.managerId ? employeesRepository.getById(person.managerId) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={person.name} size="xl" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{person.employeeNumber}</p>
          <p className="mt-0.5 text-xs text-muted">{ROLE_LABELS[person.role]}</p>
          <p className="mt-1 text-xs text-muted">Joined {formatDate(person.joinedOn, true)}</p>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <Detail icon={<Icons.mail className="size-4" />} label="Email" value={person.email} />
        <Detail icon={<Icons.phone className="size-4" />} label="Phone" value={person.phone} />
        <Detail
          icon={<Icons.location className="size-4" />}
          label="Location"
          value={person.location}
        />
        <Detail
          icon={<Icons.users className="size-4" />}
          label="Reports to"
          value={manager?.name ?? "—"}
        />
      </dl>

      <section className="rounded-xl border border-line bg-subtle/50 p-4">
        <h3 className="text-sm font-semibold text-ink">Current picture</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Task completion</span>
              <span className="tabular-nums">{summary.completionRate}%</span>
            </div>
            <ProgressBar
              label={`${person.name} completion rate`}
              value={summary.completionRate}
              tone={summary.completionRate >= 70 ? "success" : "warning"}
            />
            <p className="mt-1.5 text-[11px] text-muted">
              {summary.completed} of {summary.total} tasks · {summary.overdue} overdue
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>On-time rate</span>
              <span className="tabular-nums">{attendance.onTimeRate}%</span>
            </div>
            <ProgressBar
              label={`${person.name} on-time rate`}
              value={attendance.onTimeRate}
              tone={attendance.onTimeRate >= 90 ? "success" : "warning"}
            />
            <p className="mt-1.5 text-[11px] text-muted">
              {formatHours(attendance.weekHours)} logged this week
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-ink">Skills</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {person.skills.map((skill) => (
            <Badge key={skill} tone="neutral">
              {skill}
            </Badge>
          ))}
        </div>
      </section>

      <section>
        <CardHeader title="Open work" subtitle={`${summary.todo + summary.inProgress} items`} />
        {tasks.filter((task) => task.status !== "completed").length === 0 ? (
          <p className="mt-3 text-xs text-muted">Nothing open right now.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {tasks
              .filter((task) => task.status !== "completed")
              .slice(0, 5)
              .map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-ink-soft">{task.title}</span>
                  <span
                    className={`flex-none ${isOverdue(task) ? "font-medium text-rose-500" : "text-muted"}`}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
      <span className="text-muted">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] text-muted">{label}</dt>
        <dd className="truncate text-xs font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}
