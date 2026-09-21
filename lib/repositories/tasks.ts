import { createId, delay, getDatabase, mutate } from "@/lib/demo/store";
import type { Employee, Task, TaskPriority, TaskStatus } from "@/lib/demo/types";
import { toISODate } from "@/lib/utils/date";
import { withActivity } from "./activity";
import { withNotification } from "./notifications";

export interface NewTask {
  title: string;
  description: string;
  assigneeId: string;
  category: string;
  priority: TaskPriority;
  dueDate: string;
  status?: TaskStatus;
}

export interface TaskSummary {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  completionRate: number;
}

export function isOverdue(task: Task): boolean {
  return task.status !== "completed" && task.dueDate < toISODate(new Date());
}

export const tasksRepository = {
  listFor(employeeId: string): Task[] {
    return getDatabase().tasks.filter((task) => task.assigneeId === employeeId);
  },

  listVisibleTo(viewer: Employee): Task[] {
    const database = getDatabase();
    if (viewer.role === "admin") return [...database.tasks];
    if (viewer.role === "manager") {
      const teamIds = new Set(
        database.employees
          .filter((employee) => employee.managerId === viewer.id || employee.id === viewer.id)
          .map((employee) => employee.id),
      );
      return database.tasks.filter(
        (task) => teamIds.has(task.assigneeId) || task.createdById === viewer.id,
      );
    }
    return tasksRepository.listFor(viewer.id);
  },

  getById(id: string): Task | undefined {
    return getDatabase().tasks.find((task) => task.id === id);
  },

  summarise(tasks: Task[]): TaskSummary {
    const today = toISODate(new Date());
    const completed = tasks.filter((task) => task.status === "completed").length;
    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      completed,
      overdue: tasks.filter(isOverdue).length,
      dueToday: tasks.filter((task) => task.dueDate === today && task.status !== "completed").length,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  },

  async create(input: NewTask, actor: Employee): Promise<Task> {
    await delay();
    const task: Task = {
      id: createId("tsk"),
      title: input.title.trim(),
      description: input.description.trim(),
      assigneeId: input.assigneeId,
      createdById: actor.id,
      category: input.category,
      priority: input.priority,
      status: input.status ?? "todo",
      dueDate: input.dueDate,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    mutate((database) => {
      const assignee = database.employees.find((employee) => employee.id === input.assigneeId);
      let next = withActivity({ ...database, tasks: [task, ...database.tasks] }, {
        actorId: actor.id,
        action: input.assigneeId === actor.id ? "Created task" : "Assigned task",
        entity: "Task",
        entityId: task.id,
        summary: `“${task.title}”${assignee && assignee.id !== actor.id ? ` assigned to ${assignee.name}` : ""}.`,
      });

      if (assignee && assignee.id !== actor.id) {
        next = withNotification(next, {
          employeeId: assignee.id,
          title: "New task assigned to you",
          body: `${actor.name} assigned “${task.title}”.`,
          tone: "info",
          href: "/tasks",
        });
      }

      return next;
    });

    return task;
  },

  async update(id: string, patch: Partial<NewTask>, actor: Employee): Promise<Task> {
    await delay();
    let updated: Task | undefined;
    mutate((database) => {
      const tasks = database.tasks.map((task) => {
        if (task.id !== id) return task;
        updated = { ...task, ...patch };
        return updated;
      });
      if (!updated) return database;
      return withActivity({ ...database, tasks }, {
        actorId: actor.id,
        action: "Updated task",
        entity: "Task",
        entityId: id,
        summary: `“${updated.title}” updated.`,
      });
    });

    if (!updated) throw new Error("That task could not be found.");
    return updated;
  },

  async setStatus(id: string, status: TaskStatus, actor: Employee): Promise<Task> {
    await delay(180);
    let updated: Task | undefined;

    mutate((database) => {
      const tasks = database.tasks.map((task) => {
        if (task.id !== id) return task;
        updated = {
          ...task,
          status,
          completedAt: status === "completed" ? new Date().toISOString() : null,
        };
        return updated;
      });
      if (!updated) return database;

      let next = withActivity({ ...database, tasks }, {
        actorId: actor.id,
        action:
          status === "completed"
            ? "Completed task"
            : status === "in_progress"
              ? "Started task"
              : "Reopened task",
        entity: "Task",
        entityId: id,
        summary: `“${updated.title}” moved to ${STATUS_LABELS[status]}.`,
        status: status === "completed" ? "success" : "pending",
      });

      // Let the person who assigned the work know it landed.
      if (status === "completed" && updated.createdById !== actor.id) {
        next = withNotification(next, {
          employeeId: updated.createdById,
          title: "Task completed",
          body: `${actor.name} completed “${updated.title}”.`,
          tone: "success",
          href: "/tasks",
        });
      }

      return next;
    });

    if (!updated) throw new Error("That task could not be found.");
    return updated;
  },

  async remove(id: string, actor: Employee): Promise<void> {
    await delay();
    mutate((database) => {
      const target = database.tasks.find((task) => task.id === id);
      if (!target) return database;
      return withActivity(
        { ...database, tasks: database.tasks.filter((task) => task.id !== id) },
        {
          actorId: actor.id,
          action: "Deleted task",
          entity: "Task",
          entityId: id,
          summary: `“${target.title}” removed.`,
          status: "warning",
        },
      );
    });
  },
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Completed",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const TASK_CATEGORIES = [
  "People",
  "Operations",
  "Commercial",
  "Finance",
  "Technology",
] as const;
