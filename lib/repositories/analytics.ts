import { getDatabase } from "@/lib/demo/store";
import type { Employee } from "@/lib/demo/types";
import { addDays, startOfWeek, toISODate } from "@/lib/utils/date";
import { employeesRepository } from "./employees";
import { isOverdue, tasksRepository } from "./tasks";

export interface TeamMemberInsight {
  employee: Employee;
  attendanceRate: number;
  lateCount: number;
  openTasks: number;
  overdueTasks: number;
  completionRate: number;
  hoursThisWeek: number;
}

export interface TeamOverview {
  headcount: number;
  attendanceRate: number;
  completionRate: number;
  openTasks: number;
  overdueTasks: number;
  pendingApprovals: number;
  onLeave: number;
  members: TeamMemberInsight[];
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  confidence: "Low" | "Medium" | "High";
  tone: "warning" | "info" | "success";
}

/** Employees in scope for a viewer's analytics — a manager's reports, or all. */
function scopeFor(viewer: Employee): Employee[] {
  if (viewer.role === "admin") return employeesRepository.list();
  return employeesRepository
    .list()
    .filter((employee) => employee.managerId === viewer.id || employee.id === viewer.id);
}

export const analyticsRepository = {
  teamOverview(viewer: Employee): TeamOverview {
    const database = getDatabase();
    const scope = scopeFor(viewer);
    const weekStart = toISODate(startOfWeek());

    const members: TeamMemberInsight[] = scope.map((employee) => {
      const attendance = database.attendance.filter(
        (record) => record.employeeId === employee.id && record.status !== "weekend",
      );
      const workdays = attendance.filter((record) => record.status !== "leave");
      const attended = workdays.filter(
        (record) => record.status === "present" || record.status === "remote" || record.status === "late",
      ).length;
      const tasks = tasksRepository.listFor(employee.id);
      const completed = tasks.filter((task) => task.status === "completed").length;

      return {
        employee,
        attendanceRate: workdays.length ? Math.round((attended / workdays.length) * 100) : 0,
        lateCount: workdays.filter((record) => record.status === "late").length,
        openTasks: tasks.filter((task) => task.status !== "completed").length,
        overdueTasks: tasks.filter(isOverdue).length,
        completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
        hoursThisWeek:
          Math.round(
            attendance
              .filter((record) => record.date >= weekStart)
              .reduce((total, record) => total + record.hours, 0) * 10,
          ) / 10,
      };
    });

    const totals = members.reduce(
      (acc, member) => ({
        attendance: acc.attendance + member.attendanceRate,
        completion: acc.completion + member.completionRate,
        open: acc.open + member.openTasks,
        overdue: acc.overdue + member.overdueTasks,
      }),
      { attendance: 0, completion: 0, open: 0, overdue: 0 },
    );

    const scopeIds = new Set(scope.map((employee) => employee.id));

    return {
      headcount: members.length,
      attendanceRate: members.length ? Math.round(totals.attendance / members.length) : 0,
      completionRate: members.length ? Math.round(totals.completion / members.length) : 0,
      openTasks: totals.open,
      overdueTasks: totals.overdue,
      pendingApprovals: database.leaveRequests.filter(
        (request) =>
          request.status === "pending" &&
          scopeIds.has(request.employeeId) &&
          request.employeeId !== viewer.id,
      ).length,
      onLeave: members.filter((member) => member.employee.status === "on_leave").length,
      members,
    };
  },

  /** Team hours per week for the last six weeks. */
  weeklyTrend(viewer: Employee): Array<{ label: string; value: number }> {
    const database = getDatabase();
    const scopeIds = new Set(scopeFor(viewer).map((employee) => employee.id));
    const thisWeek = startOfWeek();

    return Array.from({ length: 6 }, (_, index) => {
      const weekStart = addDays(thisWeek, -7 * (5 - index));
      const weekEnd = addDays(weekStart, 6);
      const from = toISODate(weekStart);
      const to = toISODate(weekEnd);
      const hours = database.attendance
        .filter(
          (record) =>
            scopeIds.has(record.employeeId) && record.date >= from && record.date <= to,
        )
        .reduce((total, record) => total + record.hours, 0);

      return {
        label:
          index === 5
            ? "This week"
            : weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        value: Math.round(hours),
      };
    });
  },

  /** Distribution of attendance statuses across the scope, for the donut chart. */
  attendanceMix(viewer: Employee): Array<{ label: string; value: number }> {
    const database = getDatabase();
    const scopeIds = new Set(scopeFor(viewer).map((employee) => employee.id));
    const records = database.attendance.filter(
      (record) => scopeIds.has(record.employeeId) && record.status !== "weekend",
    );

    const buckets: Record<string, number> = {
      "On time": 0,
      Remote: 0,
      Late: 0,
      "Leave / absent": 0,
    };

    records.forEach((record) => {
      if (record.status === "present") buckets["On time"] += 1;
      else if (record.status === "remote") buckets.Remote += 1;
      else if (record.status === "late") buckets.Late += 1;
      else buckets["Leave / absent"] += 1;
    });

    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  },

  /** Task counts per department, for the workload bar chart. */
  workloadByDepartment(viewer: Employee): Array<{ label: string; value: number }> {
    const scope = scopeFor(viewer);
    const byDepartment = new Map<string, number>();

    scope.forEach((employee) => {
      const open = tasksRepository
        .listFor(employee.id)
        .filter((task) => task.status !== "completed").length;
      byDepartment.set(employee.department, (byDepartment.get(employee.department) ?? 0) + open);
    });

    return Array.from(byDepartment.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  },

  /**
   * Signals worth a conversation — deliberately framed as prompts for a manager,
   * never as automated judgements about a person.
   */
  recommendations(viewer: Employee): Recommendation[] {
    const overview = analyticsRepository.teamOverview(viewer);
    const others = overview.members.filter((member) => member.employee.id !== viewer.id);
    if (!others.length) return [];

    const averageOpen =
      others.reduce((total, member) => total + member.openTasks, 0) / others.length;
    const recommendations: Recommendation[] = [];

    const overloaded = others
      .filter((member) => averageOpen > 0 && member.openTasks > averageOpen * 1.3)
      .sort((a, b) => b.openTasks - a.openTasks)[0];
    if (overloaded) {
      const percent = Math.round((overloaded.openTasks / averageOpen - 1) * 100);
      recommendations.push({
        id: "workload",
        title: "Workload check-in",
        detail: `${overloaded.employee.name} is carrying ${percent}% more open work than the team average (${overloaded.openTasks} vs ${averageOpen.toFixed(1)}). Consider redistributing two items this week.`,
        confidence: "Medium",
        tone: "warning",
      });
    }

    const overdue = others
      .filter((member) => member.overdueTasks >= 2)
      .sort((a, b) => b.overdueTasks - a.overdueTasks)[0];
    if (overdue) {
      recommendations.push({
        id: "overdue",
        title: "Blocked work worth unblocking",
        detail: `${overdue.employee.name} has ${overdue.overdueTasks} overdue items. Ask what is blocking them before the next planning cycle.`,
        confidence: "High",
        tone: "warning",
      });
    }

    const late = others.filter((member) => member.lateCount >= 4).sort((a, b) => b.lateCount - a.lateCount)[0];
    if (late) {
      recommendations.push({
        id: "punctuality",
        title: "Attendance pattern",
        detail: `${late.employee.name} has ${late.lateCount} late starts in the last two months. A flexible-hours conversation may resolve it.`,
        confidence: "Low",
        tone: "info",
      });
    }

    if (overview.pendingApprovals > 0) {
      recommendations.push({
        id: "approvals",
        title: "Approvals waiting on you",
        detail: `${overview.pendingApprovals} leave ${overview.pendingApprovals === 1 ? "request is" : "requests are"} pending. Teams plan better when decisions arrive within 48 hours.`,
        confidence: "High",
        tone: "info",
      });
    }

    const strong = others
      .filter((member) => member.completionRate >= 80 && member.overdueTasks === 0)
      .sort((a, b) => b.completionRate - a.completionRate)[0];
    if (strong) {
      recommendations.push({
        id: "recognition",
        title: "Worth recognising",
        detail: `${strong.employee.name} is at ${strong.completionRate}% completion with nothing overdue. A note in the next team meeting goes a long way.`,
        confidence: "Medium",
        tone: "success",
      });
    }

    return recommendations;
  },
};
