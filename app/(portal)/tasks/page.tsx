"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, PriorityBadge, TaskStatusBadge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardHeader, StatsCard } from "@/components/ui/card";
import { Input, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Icons } from "@/components/ui/icons";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton, StatsSkeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import type { Task, TaskPriority, TaskStatus } from "@/lib/demo/types";
import { useAuth, useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import {
  employeesRepository,
  isOverdue,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_CATEGORIES,
  tasksRepository,
} from "@/lib/repositories";
import { formatDate, toISODate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

type Scope = "mine" | "team";
type Filter = "all" | TaskStatus | "overdue";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "completed"];

export default function TasksPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <TasksView />
    </Suspense>
  );
}

function TasksView() {
  const employee = useCurrentEmployee();
  const { can } = useAuth();
  const { toast } = useToast();
  const params = useSearchParams();

  const [scope, setScope] = useState<Scope>(can("assign_tasks") ? "team" : "mine");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [busy, setBusy] = useState(false);

  const focusId = params.get("focus");

  const { data, loading } = useDemoQuery(() => {
    const source =
      scope === "team" && can("assign_tasks")
        ? tasksRepository.listVisibleTo(employee)
        : tasksRepository.listFor(employee.id);

    const needle = query.trim().toLowerCase();
    const searched = needle
      ? source.filter(
          (task) =>
            task.title.toLowerCase().includes(needle) ||
            task.description.toLowerCase().includes(needle) ||
            task.category.toLowerCase().includes(needle),
        )
      : source;

    const filtered = searched.filter((task) => {
      if (filter === "all") return true;
      if (filter === "overdue") return isOverdue(task);
      return task.status === filter;
    });

    return {
      summary: tasksRepository.summarise(source),
      tasks: filtered.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      counts: {
        all: searched.length,
        todo: searched.filter((task) => task.status === "todo").length,
        in_progress: searched.filter((task) => task.status === "in_progress").length,
        completed: searched.filter((task) => task.status === "completed").length,
        overdue: searched.filter(isOverdue).length,
      },
    };
  }, [employee.id, scope, filter, query, can("assign_tasks")]);

  const focused = useMemo(() => (focusId ? tasksRepository.getById(focusId) : undefined), [focusId]);

  async function move(task: Task, status: TaskStatus) {
    await tasksRepository.setStatus(task.id, status, employee);
    toast({
      title: status === "completed" ? "Task completed" : `Moved to ${STATUS_LABELS[status]}`,
      description: `“${task.title}”`,
      tone: status === "completed" ? "success" : "info",
    });
  }

  async function remove() {
    if (!deleteTarget) return;
    setBusy(true);
    await tasksRepository.remove(deleteTarget.id, employee);
    toast({ title: "Task deleted", description: `“${deleteTarget.title}” removed.`, tone: "info" });
    setDeleteTarget(null);
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Work"
        title="Tasks"
        description="One board for everything assigned to you — and, if you lead a team, everything you have assigned."
        actions={
          <Button
            icon={<Icons.plus className="size-4" />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            {can("assign_tasks") ? "Assign task" : "New task"}
          </Button>
        }
      />

      {focused ? (
        <Card tone="accent">
          <CardHeader
            title={focused.title}
            subtitle={`${focused.category} · due ${formatDate(focused.dueDate)}`}
            action={<TaskStatusBadge status={focused.status} />}
          />
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{focused.description}</p>
        </Card>
      ) : null}

      {loading || !data ? (
        <StatsSkeleton />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Open"
            value={`${data.summary.todo + data.summary.inProgress}`}
            hint={`${data.summary.dueToday} due today`}
            icon={<Icons.checkCircle className="size-4" />}
          />
          <StatsCard
            label="In progress"
            value={`${data.summary.inProgress}`}
            hint="Actively being worked"
            tone="neutral"
          />
          <StatsCard
            label="Overdue"
            value={`${data.summary.overdue}`}
            hint={data.summary.overdue ? "Needs attention" : "Nothing overdue"}
            tone={data.summary.overdue ? "negative" : "positive"}
            icon={<Icons.warning className="size-4" />}
          />
          <StatsCard
            label="Completion"
            value={`${data.summary.completionRate}%`}
            hint={`${data.summary.completed} of ${data.summary.total} complete`}
            tone={data.summary.completionRate >= 70 ? "positive" : "warning"}
            icon={<Icons.chart className="size-4" />}
          />
        </section>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {can("assign_tasks") ? (
            <Tabs
              label="Scope"
              value={scope}
              onChange={setScope}
              options={[
                { value: "mine", label: "Assigned to me" },
                { value: "team", label: "My team" },
              ]}
            />
          ) : null}
          {data ? (
            <Tabs
              label="Task status"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: data.counts.all },
                { value: "todo", label: "To do", count: data.counts.todo },
                { value: "in_progress", label: "In progress", count: data.counts.in_progress },
                { value: "completed", label: "Completed", count: data.counts.completed },
                { value: "overdue", label: "Overdue", count: data.counts.overdue },
              ]}
            />
          ) : null}
        </div>
        <SearchInput
          label="Search tasks"
          value={query}
          onChange={setQuery}
          placeholder="Search tasks…"
          className="lg:w-72"
        />
      </div>

      {loading || !data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      ) : data.tasks.length === 0 ? (
        <EmptyState
          title={query ? "No tasks match your search" : "No tasks here yet"}
          description={
            query
              ? `Nothing matched “${query.trim()}”. Try a different word or clear the search.`
              : "When work is assigned to you it lands on this board, with due dates and priority."
          }
          icon={<Icons.checkCircle className="size-5" />}
          action={
            query ? (
              <Button size="sm" variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                Create a task
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnTasks = data.tasks.filter((task) => task.status === column);
            return (
              <section
                key={column}
                className="min-w-0 rounded-card border border-line bg-subtle/50 p-3.5"
                aria-label={STATUS_LABELS[column]}
              >
                <div className="flex items-center justify-between px-1 pb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {STATUS_LABELS[column]}
                  </h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted tabular-nums ring-1 ring-line">
                    {columnTasks.length}
                  </span>
                </div>

                {columnTasks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-xs text-muted">
                    Nothing here
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {columnTasks.map((task) => {
                      const assignee = employeesRepository.getById(task.assigneeId);
                      return (
                        <li
                          key={task.id}
                          className={cn(
                            "rounded-xl border border-line bg-surface p-3.5 shadow-soft transition hover:border-line-strong",
                            focusId === task.id && "ring-2 ring-brand-500",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <PriorityBadge priority={task.priority} />
                            <div className="flex gap-0.5">
                              <IconButton
                                label="Edit task"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditing(task);
                                  setFormOpen(true);
                                }}
                              >
                                <Icons.settings className="size-3.5" />
                              </IconButton>
                              <IconButton
                                label="Delete task"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(task)}
                              >
                                <Icons.trash className="size-3.5" />
                              </IconButton>
                            </div>
                          </div>

                          <h3 className="mt-2 text-sm font-medium leading-snug text-ink">
                            {task.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                            {task.description}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <Avatar name={assignee?.name ?? "Employee"} size="xs" />
                              <span className="truncate text-[11px] text-muted">
                                {assignee?.name.split(" ")[0]}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "flex-none text-[11px]",
                                isOverdue(task) ? "font-semibold text-rose-500" : "text-muted",
                              )}
                            >
                              {isOverdue(task) ? "Overdue" : formatDate(task.dueDate)}
                            </span>
                          </div>

                          <div className="mt-3 flex gap-1.5">
                            {column !== "todo" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1"
                                onClick={() =>
                                  move(task, column === "completed" ? "in_progress" : "todo")
                                }
                              >
                                {column === "completed" ? "Reopen" : "Move back"}
                              </Button>
                            ) : null}
                            {column !== "completed" ? (
                              <Button
                                size="sm"
                                variant={column === "in_progress" ? "primary" : "secondary"}
                                className="flex-1"
                                onClick={() =>
                                  move(task, column === "todo" ? "in_progress" : "completed")
                                }
                              >
                                {column === "todo" ? "Start" : "Complete"}
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <TaskFormModal
        open={formOpen}
        task={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={(title, isEdit) =>
          toast({
            title: isEdit ? "Task updated" : "Task created",
            description: `“${title}”`,
            tone: "success",
          })
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this task?"
        message={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed from the board. This cannot be undone in the demo.`
            : ""
        }
        confirmLabel="Delete task"
      />
    </div>
  );
}

function TaskFormModal({
  open,
  task,
  onClose,
  onSaved,
}: {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSaved: (title: string, isEdit: boolean) => void;
}) {
  const employee = useCurrentEmployee();
  const { can } = useAuth();
  const assignable = can("assign_tasks")
    ? employeesRepository.listVisibleTo(employee)
    : [employee];

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? employee.id);
  const [category, setCategory] = useState(task?.category ?? TASK_CATEGORIES[0]);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [hydratedFor, setHydratedFor] = useState<string | null>(task?.id ?? null);

  // Refill the form when a different task is opened for editing.
  if (open && (task?.id ?? null) !== hydratedFor) {
    setHydratedFor(task?.id ?? null);
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setAssigneeId(task?.assigneeId ?? employee.id);
    setCategory(task?.category ?? TASK_CATEGORIES[0]);
    setPriority(task?.priority ?? "medium");
    setDueDate(task?.dueDate ?? "");
    setErrors({});
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 4) next.title = "Give the task a clear title (at least 4 characters).";
    if (description.trim().length < 10)
      next.description = "Describe the work in a sentence so it is actionable.";
    if (!dueDate) next.dueDate = "Choose a due date.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      if (task) {
        await tasksRepository.update(
          task.id,
          { title, description, assigneeId, category, priority, dueDate },
          employee,
        );
      } else {
        await tasksRepository.create(
          { title, description, assigneeId, category, priority, dueDate },
          employee,
        );
      }
      onSaved(title.trim(), Boolean(task));
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Edit task" : "New task"}
      description={
        task
          ? "Changes are recorded in the activity log."
          : "The assignee is notified as soon as the task is created."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button form="task-form" type="submit" loading={busy}>
            {task ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} noValidate className="space-y-4">
        <Input
          label="Title"
          required
          value={title}
          error={errors.title}
          placeholder="Prepare the weekly operations report"
          onChange={(event) => {
            setTitle(event.target.value);
            setErrors((current) => ({ ...current, title: "" }));
          }}
        />
        <Textarea
          label="Description"
          required
          rows={3}
          value={description}
          error={errors.description}
          placeholder="What needs to happen, and what does done look like?"
          onChange={(event) => {
            setDescription(event.target.value);
            setErrors((current) => ({ ...current, description: "" }));
          }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Assignee"
            value={assigneeId}
            disabled={assignable.length === 1}
            hint={assignable.length === 1 ? "You can assign tasks to yourself." : undefined}
            options={assignable.map((person) => ({ value: person.id, label: person.name }))}
            onChange={(event) => setAssigneeId(event.target.value)}
          />
          <Select
            label="Category"
            value={category}
            options={TASK_CATEGORIES.map((value) => ({ value, label: value }))}
            onChange={(event) => setCategory(event.target.value)}
          />
          <Select
            label="Priority"
            value={priority}
            options={(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((value) => ({
              value,
              label: PRIORITY_LABELS[value],
            }))}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          />
          <Input
            label="Due date"
            type="date"
            required
            min={toISODate(new Date())}
            value={dueDate}
            error={errors.dueDate}
            onChange={(event) => {
              setDueDate(event.target.value);
              setErrors((current) => ({ ...current, dueDate: "" }));
            }}
          />
        </div>
        {task ? (
          <p className="text-xs text-muted">
            Status is changed from the board — use Start, Complete or Reopen.
          </p>
        ) : (
          <Badge tone="brand">Created tasks start in “To do”</Badge>
        )}
      </form>
    </Modal>
  );
}
