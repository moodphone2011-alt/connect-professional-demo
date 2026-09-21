import { createId, delay, getDatabase, mutate } from "@/lib/demo/store";
import type { Employee, LeaveRequest, LeaveStatus, LeaveType } from "@/lib/demo/types";
import { daysBetween, formatDateRange } from "@/lib/utils/date";
import { withActivity } from "./activity";
import { withNotification } from "./notifications";

export interface NewLeaveRequest {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status?: Extract<LeaveStatus, "draft" | "pending">;
}

export interface LeaveBalanceSummary {
  annualRemaining: number;
  annualTotal: number;
  sickRemaining: number;
  sickTotal: number;
  pending: number;
  usedThisYear: number;
}

function sortByRecency(requests: LeaveRequest[]): LeaveRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export const leaveRepository = {
  listFor(employeeId: string): LeaveRequest[] {
    return sortByRecency(
      getDatabase().leaveRequests.filter((request) => request.employeeId === employeeId),
    );
  },

  /** Everything the viewer may see: their own plus, for approvers, their team's. */
  listVisibleTo(viewer: Employee): LeaveRequest[] {
    const database = getDatabase();
    if (viewer.role === "admin") return sortByRecency(database.leaveRequests);
    if (viewer.role === "manager") {
      const teamIds = new Set(
        database.employees
          .filter((employee) => employee.managerId === viewer.id || employee.id === viewer.id)
          .map((employee) => employee.id),
      );
      return sortByRecency(
        database.leaveRequests.filter((request) => teamIds.has(request.employeeId)),
      );
    }
    return leaveRepository.listFor(viewer.id);
  },

  /** Requests a manager or admin still has to decide on. */
  listPendingApprovals(viewer: Employee): LeaveRequest[] {
    if (viewer.role === "employee") return [];
    return leaveRepository
      .listVisibleTo(viewer)
      .filter((request) => request.status === "pending" && request.employeeId !== viewer.id);
  },

  getById(id: string): LeaveRequest | undefined {
    return getDatabase().leaveRequests.find((request) => request.id === id);
  },

  balanceFor(employeeId: string): LeaveBalanceSummary {
    const employee = getDatabase().employees.find((entry) => entry.id === employeeId);
    const requests = leaveRepository.listFor(employeeId);
    const approved = requests.filter((request) => request.status === "approved");

    return {
      annualRemaining: employee
        ? employee.leaveBalance.annual.total - employee.leaveBalance.annual.used
        : 0,
      annualTotal: employee?.leaveBalance.annual.total ?? 0,
      sickRemaining: employee
        ? employee.leaveBalance.sick.total - employee.leaveBalance.sick.used
        : 0,
      sickTotal: employee?.leaveBalance.sick.total ?? 0,
      pending: requests.filter((request) => request.status === "pending").length,
      usedThisYear: approved.reduce((total, request) => total + request.days, 0),
    };
  },

  async create(input: NewLeaveRequest, employeeName: string): Promise<LeaveRequest> {
    await delay();
    const request: LeaveRequest = {
      id: createId("lv"),
      employeeId: input.employeeId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      days: daysBetween(input.startDate, input.endDate),
      reason: input.reason.trim(),
      status: input.status ?? "pending",
      submittedAt: new Date().toISOString(),
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
    };

    mutate((database) => {
      const employee = database.employees.find((entry) => entry.id === input.employeeId);
      let next = { ...database, leaveRequests: [request, ...database.leaveRequests] };

      next = withActivity(next, {
        actorId: input.employeeId,
        action: request.status === "draft" ? "Saved leave draft" : "Submitted leave request",
        entity: "Leave",
        entityId: request.id,
        summary: `${request.days} ${request.days === 1 ? "day" : "days"} of ${request.type} leave, ${formatDateRange(request.startDate, request.endDate)}.`,
        status: request.status === "draft" ? "pending" : "pending",
      });

      if (request.status === "pending" && employee?.managerId) {
        next = withNotification(next, {
          employeeId: employee.managerId,
          title: "Leave request awaiting your review",
          body: `${employeeName} requested ${request.days} ${request.days === 1 ? "day" : "days"} of ${request.type} leave.`,
          tone: "warning",
          href: "/leave",
        });
      }

      return next;
    });

    return request;
  },

  async decide(
    id: string,
    decision: Extract<LeaveStatus, "approved" | "rejected">,
    reviewer: Employee,
    note?: string,
  ): Promise<LeaveRequest> {
    await delay();
    let updated: LeaveRequest | undefined;

    mutate((database) => {
      const target = database.leaveRequests.find((request) => request.id === id);
      if (!target) return database;

      updated = {
        ...target,
        status: decision,
        decidedBy: reviewer.id,
        decidedAt: new Date().toISOString(),
        decisionNote: note?.trim() || (decision === "approved" ? "Approved." : "Declined."),
      };

      const leaveRequests = database.leaveRequests.map((request) =>
        request.id === id ? updated! : request,
      );

      // Approving annual or sick leave draws down the employee's balance.
      const employees = database.employees.map((employee) => {
        if (decision !== "approved" || employee.id !== target.employeeId) return employee;
        if (target.type !== "annual" && target.type !== "sick") return employee;
        const bucket = target.type;
        return {
          ...employee,
          leaveBalance: {
            ...employee.leaveBalance,
            [bucket]: {
              ...employee.leaveBalance[bucket],
              used: employee.leaveBalance[bucket].used + target.days,
            },
          },
        };
      });

      const applicant = database.employees.find((entry) => entry.id === target.employeeId);
      let next = withActivity({ ...database, leaveRequests, employees }, {
        actorId: reviewer.id,
        action: decision === "approved" ? "Approved leave request" : "Rejected leave request",
        entity: "Leave",
        entityId: id,
        summary: `${applicant?.name ?? "Employee"} · ${formatDateRange(target.startDate, target.endDate)}.`,
        status: decision === "approved" ? "success" : "warning",
      });

      next = withNotification(next, {
        employeeId: target.employeeId,
        title: decision === "approved" ? "Leave request approved" : "Leave request declined",
        body: `${formatDateRange(target.startDate, target.endDate)} — reviewed by ${reviewer.name}.`,
        tone: decision === "approved" ? "success" : "error",
        href: "/leave",
      });

      return next;
    });

    if (!updated) throw new Error("That leave request could not be found.");
    return updated;
  },

  async cancel(id: string, actorId: string): Promise<void> {
    await delay();
    mutate((database) => {
      const target = database.leaveRequests.find((request) => request.id === id);
      if (!target) return database;
      const leaveRequests = database.leaveRequests.map((request) =>
        request.id === id ? { ...request, status: "cancelled" as LeaveStatus } : request,
      );
      return withActivity({ ...database, leaveRequests }, {
        actorId,
        action: "Cancelled leave request",
        entity: "Leave",
        entityId: id,
        summary: `${formatDateRange(target.startDate, target.endDate)} withdrawn.`,
        status: "warning",
      });
    });
  },

  async submitDraft(id: string, actorId: string, employeeName: string): Promise<void> {
    await delay();
    mutate((database) => {
      const target = database.leaveRequests.find((request) => request.id === id);
      if (!target || target.status !== "draft") return database;

      const leaveRequests = database.leaveRequests.map((request) =>
        request.id === id
          ? { ...request, status: "pending" as LeaveStatus, submittedAt: new Date().toISOString() }
          : request,
      );
      const employee = database.employees.find((entry) => entry.id === target.employeeId);

      let next = withActivity({ ...database, leaveRequests }, {
        actorId,
        action: "Submitted leave request",
        entity: "Leave",
        entityId: id,
        summary: `Draft submitted for ${formatDateRange(target.startDate, target.endDate)}.`,
        status: "pending",
      });

      if (employee?.managerId) {
        next = withNotification(next, {
          employeeId: employee.managerId,
          title: "Leave request awaiting your review",
          body: `${employeeName} submitted ${target.days} ${target.days === 1 ? "day" : "days"} of ${target.type} leave.`,
          tone: "warning",
          href: "/leave",
        });
      }

      return next;
    });
  },

  async remove(id: string, actorId: string): Promise<void> {
    await delay();
    mutate((database) => {
      const target = database.leaveRequests.find((request) => request.id === id);
      if (!target) return database;
      return withActivity(
        {
          ...database,
          leaveRequests: database.leaveRequests.filter((request) => request.id !== id),
        },
        {
          actorId,
          action: "Deleted leave request",
          entity: "Leave",
          entityId: id,
          summary: `${formatDateRange(target.startDate, target.endDate)} removed.`,
          status: "warning",
        },
      );
    });
  },
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Annual leave",
  sick: "Sick leave",
  unpaid: "Unpaid leave",
  parental: "Parental leave",
  training: "Training leave",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};
