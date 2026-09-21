/**
 * Seed data for the CONNECT demo build.
 *
 * Everything the portal shows originates here. Records are generated relative to
 * *today* so the demo never looks stale, and a small deterministic PRNG keeps a
 * given day's data stable between reloads before it is persisted.
 */

import {
  addDays,
  hoursBetween,
  isWeekend,
  startOfDay,
  toISODate,
} from "@/lib/utils/date";
import type {
  ActivityEntry,
  AttendanceRecord,
  CalendarEvent,
  DemoDatabase,
  Employee,
  KnowledgeDoc,
  LeaveRequest,
  AppNotification,
  Task,
} from "./types";

export const DEMO_DB_VERSION = 3;

/** Mulberry32 — tiny deterministic PRNG so generated history is reproducible. */
function createRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const employees: Employee[] = [
  {
    id: "emp-001",
    employeeNumber: "EMP-001",
    name: "Ahmed Al Balushi",
    email: "ahmed.albalushi@connect.example",
    role: "manager",
    jobTitle: "People Manager",
    department: "People & Culture",
    managerId: null,
    location: "Muscat HQ",
    phone: "+968 9412 0011",
    joinedOn: "2019-03-10",
    status: "active",
    leaveBalance: { annual: { total: 30, used: 9 }, sick: { total: 12, used: 2 } },
    skills: ["Workforce planning", "Coaching", "Policy design"],
  },
  {
    id: "emp-002",
    employeeNumber: "EMP-006",
    name: "Noor Al Rashdi",
    email: "noor.alrashdi@connect.example",
    role: "employee",
    jobTitle: "HR Specialist",
    department: "People & Culture",
    managerId: "emp-001",
    location: "Muscat HQ",
    phone: "+968 9412 0064",
    joinedOn: "2022-09-04",
    status: "active",
    leaveBalance: { annual: { total: 25, used: 7 }, sick: { total: 10, used: 1 } },
    skills: ["Onboarding", "HRIS", "Employee relations"],
  },
  {
    id: "emp-003",
    employeeNumber: "EMP-002",
    name: "Layla Al Zadjali",
    email: "layla.alzadjali@connect.example",
    role: "admin",
    jobTitle: "Workspace Administrator",
    department: "Technology",
    managerId: null,
    location: "Muscat HQ",
    phone: "+968 9412 0022",
    joinedOn: "2018-01-15",
    status: "active",
    leaveBalance: { annual: { total: 30, used: 12 }, sick: { total: 12, used: 3 } },
    skills: ["Systems administration", "Access governance", "Automation"],
  },
  {
    id: "emp-004",
    employeeNumber: "EMP-011",
    name: "Salim Al Habsi",
    email: "salim.alhabsi@connect.example",
    role: "employee",
    jobTitle: "Operations Analyst",
    department: "Operations",
    managerId: "emp-001",
    location: "Muscat HQ",
    phone: "+968 9412 0113",
    joinedOn: "2021-06-20",
    status: "active",
    leaveBalance: { annual: { total: 25, used: 4 }, sick: { total: 10, used: 4 } },
    skills: ["Process mapping", "Reporting", "Vendor coordination"],
  },
  {
    id: "emp-005",
    employeeNumber: "EMP-014",
    name: "Reem Al Kindi",
    email: "reem.alkindi@connect.example",
    role: "employee",
    jobTitle: "Client Success Lead",
    department: "Commercial",
    managerId: "emp-001",
    location: "Sohar Office",
    phone: "+968 9412 0148",
    joinedOn: "2020-11-02",
    status: "active",
    leaveBalance: { annual: { total: 25, used: 11 }, sick: { total: 10, used: 0 } },
    skills: ["Account management", "Renewals", "Escalation handling"],
  },
  {
    id: "emp-006",
    employeeNumber: "EMP-017",
    name: "Yusuf Al Farsi",
    email: "yusuf.alfarsi@connect.example",
    role: "employee",
    jobTitle: "Finance Officer",
    department: "Finance",
    managerId: "emp-001",
    location: "Muscat HQ",
    phone: "+968 9412 0177",
    joinedOn: "2023-02-13",
    status: "active",
    leaveBalance: { annual: { total: 25, used: 3 }, sick: { total: 10, used: 2 } },
    skills: ["Payroll", "Expense control", "Reconciliation"],
  },
  {
    id: "emp-007",
    employeeNumber: "EMP-021",
    name: "Maryam Al Saadi",
    email: "maryam.alsaadi@connect.example",
    role: "employee",
    jobTitle: "Talent Partner",
    department: "People & Culture",
    managerId: "emp-001",
    location: "Muscat HQ",
    phone: "+968 9412 0210",
    joinedOn: "2024-04-08",
    status: "on_leave",
    leaveBalance: { annual: { total: 25, used: 15 }, sick: { total: 10, used: 1 } },
    skills: ["Sourcing", "Interviewing", "Employer brand"],
  },
  {
    id: "emp-008",
    employeeNumber: "EMP-024",
    name: "Khalid Al Amri",
    email: "khalid.alamri@connect.example",
    role: "employee",
    jobTitle: "Field Operations Supervisor",
    department: "Operations",
    managerId: "emp-001",
    location: "Sohar Office",
    phone: "+968 9412 0243",
    joinedOn: "2020-08-17",
    status: "active",
    leaveBalance: { annual: { total: 25, used: 8 }, sick: { total: 10, used: 3 } },
    skills: ["Site supervision", "Safety compliance", "Scheduling"],
  },
  {
    id: "emp-009",
    employeeNumber: "EMP-028",
    name: "Hind Al Lawati",
    email: "hind.allawati@connect.example",
    role: "employee",
    jobTitle: "Data Analyst",
    department: "Technology",
    managerId: "emp-001",
    location: "Remote — Muscat",
    phone: "+968 9412 0288",
    joinedOn: "2023-10-01",
    status: "active",
    leaveBalance: { annual: { total: 25, used: 6 }, sick: { total: 10, used: 0 } },
    skills: ["SQL", "Dashboards", "Forecasting"],
  },
  {
    id: "emp-010",
    employeeNumber: "EMP-031",
    name: "Tariq Al Maskari",
    email: "tariq.almaskari@connect.example",
    role: "employee",
    jobTitle: "IT Support Engineer",
    department: "Technology",
    managerId: "emp-003",
    location: "Muscat HQ",
    phone: "+968 9412 0319",
    joinedOn: "2025-01-06",
    status: "onboarding",
    leaveBalance: { annual: { total: 25, used: 1 }, sick: { total: 10, used: 0 } },
    skills: ["Endpoint support", "Networking", "Asset management"],
  },
];

/** Per-employee attendance personality, so the generated history reads as real. */
const attendanceProfiles: Record<string, { punctuality: number; remote: number; absence: number }> = {
  "emp-001": { punctuality: 0.96, remote: 0.1, absence: 0.02 },
  "emp-002": { punctuality: 0.94, remote: 0.15, absence: 0.03 },
  "emp-003": { punctuality: 0.98, remote: 0.2, absence: 0.01 },
  "emp-004": { punctuality: 0.78, remote: 0.08, absence: 0.06 },
  "emp-005": { punctuality: 0.88, remote: 0.25, absence: 0.03 },
  "emp-006": { punctuality: 0.93, remote: 0.05, absence: 0.02 },
  "emp-007": { punctuality: 0.9, remote: 0.12, absence: 0.04 },
  "emp-008": { punctuality: 0.85, remote: 0.02, absence: 0.05 },
  "emp-009": { punctuality: 0.92, remote: 0.55, absence: 0.02 },
  "emp-010": { punctuality: 0.95, remote: 0.05, absence: 0.01 },
};

const HISTORY_DAYS = 60;

function buildAttendance(today: Date): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const random = createRandom(20260723);

  employees.forEach((employee, employeeIndex) => {
    const profile = attendanceProfiles[employee.id];
    for (let offset = HISTORY_DAYS; offset >= 1; offset -= 1) {
      const day = addDays(today, -offset);
      const date = toISODate(day);
      const id = `att-${employee.id}-${date}`;

      if (isWeekend(day)) {
        records.push({
          id,
          employeeId: employee.id,
          date,
          checkIn: null,
          checkOut: null,
          status: "weekend",
          hours: 0,
        });
        continue;
      }

      const roll = random();
      if (roll < profile.absence) {
        records.push({
          id,
          employeeId: employee.id,
          date,
          checkIn: null,
          checkOut: null,
          status: offset % 7 === (employeeIndex % 5) + 1 ? "leave" : "absent",
          hours: 0,
          note: "No time recorded",
        });
        continue;
      }

      const late = random() > profile.punctuality;
      const remote = random() < profile.remote;
      const startMinutes = (late ? 8 * 60 + 20 : 7 * 60 + 50) + Math.floor(random() * (late ? 35 : 18));
      const workedMinutes = 8 * 60 + Math.floor(random() * 55) - 15;
      const checkIn = `${`${Math.floor(startMinutes / 60)}`.padStart(2, "0")}:${`${startMinutes % 60}`.padStart(2, "0")}`;
      const endMinutes = startMinutes + workedMinutes;
      const checkOut = `${`${Math.floor(endMinutes / 60)}`.padStart(2, "0")}:${`${endMinutes % 60}`.padStart(2, "0")}`;

      records.push({
        id,
        employeeId: employee.id,
        date,
        checkIn,
        checkOut,
        status: remote ? "remote" : late ? "late" : "present",
        hours: hoursBetween(checkIn, checkOut),
      });
    }
  });

  return records;
}

function buildLeaveRequests(today: Date): LeaveRequest[] {
  const iso = (offset: number) => toISODate(addDays(today, offset));
  const stamp = (offset: number, hour = 9) =>
    new Date(addDays(today, offset).setHours(hour, 15, 0, 0)).toISOString();

  return [
    {
      id: "lv-1001",
      employeeId: "emp-002",
      type: "annual",
      startDate: iso(10),
      endDate: iso(12),
      days: 3,
      reason: "Family trip to Salalah during the khareef season.",
      status: "pending",
      submittedAt: stamp(-2, 10),
    },
    {
      id: "lv-1002",
      employeeId: "emp-004",
      type: "sick",
      startDate: iso(-4),
      endDate: iso(-4),
      days: 1,
      reason: "Medical appointment, clinic note attached.",
      status: "approved",
      submittedAt: stamp(-5, 8),
      decidedBy: "emp-001",
      decidedAt: stamp(-4, 9),
      decisionNote: "Approved. Get well soon.",
    },
    {
      id: "lv-1003",
      employeeId: "emp-005",
      type: "annual",
      startDate: iso(21),
      endDate: iso(27),
      days: 7,
      reason: "Annual leave booked with family months in advance.",
      status: "pending",
      submittedAt: stamp(-1, 14),
    },
    {
      id: "lv-1004",
      employeeId: "emp-007",
      type: "parental",
      startDate: iso(-9),
      endDate: iso(14),
      days: 24,
      reason: "Parental leave as agreed with People & Culture.",
      status: "approved",
      submittedAt: stamp(-30, 11),
      decidedBy: "emp-001",
      decidedAt: stamp(-28, 12),
      decisionNote: "Approved, coverage plan in place with Maryam's team.",
    },
    {
      id: "lv-1005",
      employeeId: "emp-008",
      type: "unpaid",
      startDate: iso(5),
      endDate: iso(6),
      days: 2,
      reason: "Personal matter, no annual balance remaining this quarter.",
      status: "rejected",
      submittedAt: stamp(-3, 16),
      decidedBy: "emp-001",
      decidedAt: stamp(-2, 9),
      decisionNote: "Site coverage cannot be arranged for those dates — please re-submit for the following week.",
    },
    {
      id: "lv-1006",
      employeeId: "emp-009",
      type: "training",
      startDate: iso(3),
      endDate: iso(4),
      days: 2,
      reason: "Analytics certification workshop in Muscat.",
      status: "pending",
      submittedAt: stamp(-1, 9),
    },
    {
      id: "lv-1007",
      employeeId: "emp-006",
      type: "annual",
      startDate: iso(-22),
      endDate: iso(-20),
      days: 3,
      reason: "Short break after the quarterly close.",
      status: "approved",
      submittedAt: stamp(-30, 13),
      decidedBy: "emp-001",
      decidedAt: stamp(-29, 10),
      decisionNote: "Approved.",
    },
    {
      id: "lv-1008",
      employeeId: "emp-002",
      type: "sick",
      startDate: iso(-18),
      endDate: iso(-18),
      days: 1,
      reason: "Unwell, worked half a day then signed off.",
      status: "approved",
      submittedAt: stamp(-18, 8),
      decidedBy: "emp-001",
      decidedAt: stamp(-18, 11),
      decisionNote: "Approved.",
    },
    {
      id: "lv-1009",
      employeeId: "emp-010",
      type: "annual",
      startDate: iso(33),
      endDate: iso(34),
      days: 2,
      reason: "Draft request — dates still to be confirmed with the team.",
      status: "draft",
      submittedAt: stamp(0, 8),
    },
  ];
}

function buildTasks(today: Date): Task[] {
  const iso = (offset: number) => toISODate(addDays(today, offset));
  const stamp = (offset: number, hour = 9) =>
    new Date(addDays(today, offset).setHours(hour, 0, 0, 0)).toISOString();

  const rows: Array<Omit<Task, "id" | "createdAt">> = [
    {
      title: "Prepare the weekly operations report",
      description: "Consolidate attendance, task throughput and open escalations into the Thursday report.",
      assigneeId: "emp-002",
      createdById: "emp-001",
      category: "Operations",
      priority: "high",
      status: "in_progress",
      dueDate: iso(0),
    },
    {
      title: "Review the onboarding checklist for Tariq",
      description: "Confirm equipment, access requests and the 30-day plan before the next check-in.",
      assigneeId: "emp-002",
      createdById: "emp-001",
      category: "People",
      priority: "medium",
      status: "todo",
      dueDate: iso(2),
    },
    {
      title: "Update the client renewal pipeline",
      description: "Refresh renewal dates and risk flags for the Sohar accounts.",
      assigneeId: "emp-005",
      createdById: "emp-001",
      category: "Commercial",
      priority: "medium",
      status: "in_progress",
      dueDate: iso(4),
    },
    {
      title: "Submit August expense receipts",
      description: "Upload scanned receipts and match them against the corporate card statement.",
      assigneeId: "emp-002",
      createdById: "emp-006",
      category: "Finance",
      priority: "high",
      status: "todo",
      dueDate: iso(-2),
    },
    {
      title: "Publish the updated remote work policy",
      description: "Apply the legal review comments and publish to Company Knowledge.",
      assigneeId: "emp-002",
      createdById: "emp-001",
      category: "People",
      priority: "high",
      status: "completed",
      dueDate: iso(-5),
      completedAt: stamp(-5, 16),
    },
    {
      title: "Close out the Q3 vendor reconciliation",
      description: "Match invoices to purchase orders and flag the three open disputes.",
      assigneeId: "emp-006",
      createdById: "emp-001",
      category: "Finance",
      priority: "high",
      status: "in_progress",
      dueDate: iso(6),
    },
    {
      title: "Run the safety briefing for the Sohar site",
      description: "Deliver the quarterly briefing and record attendance for compliance.",
      assigneeId: "emp-008",
      createdById: "emp-001",
      category: "Operations",
      priority: "medium",
      status: "todo",
      dueDate: iso(3),
    },
    {
      title: "Rebuild the workforce dashboard",
      description: "Move the attendance dashboard onto the new data model and add department filters.",
      assigneeId: "emp-009",
      createdById: "emp-003",
      category: "Technology",
      priority: "medium",
      status: "in_progress",
      dueDate: iso(9),
    },
    {
      title: "Audit dormant workspace accounts",
      description: "List accounts inactive for 90+ days and prepare the deactivation batch.",
      assigneeId: "emp-010",
      createdById: "emp-003",
      category: "Technology",
      priority: "low",
      status: "todo",
      dueDate: iso(12),
    },
    {
      title: "Redistribute two tasks from Salim",
      description: "Salim is above the team workload average — move two Operations items this week.",
      assigneeId: "emp-001",
      createdById: "emp-001",
      category: "People",
      priority: "high",
      status: "todo",
      dueDate: iso(1),
    },
    {
      title: "Draft the October hiring plan",
      description: "Two operations roles and one analyst role, with budget assumptions.",
      assigneeId: "emp-007",
      createdById: "emp-001",
      category: "People",
      priority: "low",
      status: "todo",
      dueDate: iso(16),
    },
    {
      title: "Fix the overtime calculation in payroll export",
      description: "Overtime beyond 10 hours is rounding down by one minute per shift.",
      assigneeId: "emp-006",
      createdById: "emp-003",
      category: "Finance",
      priority: "high",
      status: "todo",
      dueDate: iso(-1),
    },
    {
      title: "Escalation review with the Al Nahda account",
      description: "Prepare the summary of the three open tickets ahead of the client call.",
      assigneeId: "emp-005",
      createdById: "emp-001",
      category: "Commercial",
      priority: "high",
      status: "completed",
      dueDate: iso(-3),
      completedAt: stamp(-3, 15),
    },
    {
      title: "Archive completed Q2 process maps",
      description: "Move superseded process maps into the archive space and update links.",
      assigneeId: "emp-004",
      createdById: "emp-001",
      category: "Operations",
      priority: "low",
      status: "completed",
      dueDate: iso(-7),
      completedAt: stamp(-7, 14),
    },
    {
      title: "Resolve five overdue Operations tickets",
      description: "Backlog cleanup across scheduling and vendor coordination.",
      assigneeId: "emp-004",
      createdById: "emp-001",
      category: "Operations",
      priority: "high",
      status: "in_progress",
      dueDate: iso(-4),
    },
    {
      title: "Verify the new starter access matrix",
      description: "Confirm role-based access for the three September starters.",
      assigneeId: "emp-010",
      createdById: "emp-003",
      category: "Technology",
      priority: "medium",
      status: "todo",
      dueDate: iso(5),
    },
    {
      title: "Sign off the September payroll run",
      description: "Review the payroll register and approve before the bank cut-off.",
      assigneeId: "emp-006",
      createdById: "emp-001",
      category: "Finance",
      priority: "high",
      status: "completed",
      dueDate: iso(-6),
      completedAt: stamp(-6, 15),
    },
    {
      title: "Refresh the Sohar shift rota",
      description: "Publish the next four weeks of site coverage.",
      assigneeId: "emp-008",
      createdById: "emp-001",
      category: "Operations",
      priority: "medium",
      status: "completed",
      dueDate: iso(-8),
      completedAt: stamp(-8, 12),
    },
    {
      title: "Quarterly attendance report for People & Culture",
      description: "Pull attendance and punctuality trends for the quarterly review.",
      assigneeId: "emp-009",
      createdById: "emp-001",
      category: "Technology",
      priority: "medium",
      status: "completed",
      dueDate: iso(-10),
      completedAt: stamp(-10, 16),
    },
    {
      title: "Onboard the two September starters",
      description: "Contracts, equipment and first-week plans issued.",
      assigneeId: "emp-007",
      createdById: "emp-001",
      category: "People",
      priority: "high",
      status: "completed",
      dueDate: iso(-12),
      completedAt: stamp(-12, 11),
    },
    {
      title: "Renew the Al Nahda service agreement",
      description: "Terms agreed and signed for another twelve months.",
      assigneeId: "emp-005",
      createdById: "emp-001",
      category: "Commercial",
      priority: "high",
      status: "completed",
      dueDate: iso(-9),
      completedAt: stamp(-9, 14),
    },
    {
      title: "Document the leave approval process",
      description: "Write up the end-to-end flow for the new HR handbook section.",
      assigneeId: "emp-002",
      createdById: "emp-001",
      category: "People",
      priority: "medium",
      status: "completed",
      dueDate: iso(-11),
      completedAt: stamp(-11, 13),
    },
    {
      title: "Patch the workspace access console",
      description: "Apply the September security update to the admin console.",
      assigneeId: "emp-010",
      createdById: "emp-003",
      category: "Technology",
      priority: "high",
      status: "completed",
      dueDate: iso(-4),
      completedAt: stamp(-4, 10),
    },
    {
      title: "Review Q3 team objectives with each report",
      description: "Hold the quarterly objective conversations and record outcomes.",
      assigneeId: "emp-001",
      createdById: "emp-001",
      category: "People",
      priority: "medium",
      status: "in_progress",
      dueDate: iso(5),
    },
    {
      title: "Approve the October hiring budget",
      description: "Confirm headcount and budget with Finance before the board pack.",
      assigneeId: "emp-001",
      createdById: "emp-003",
      category: "Finance",
      priority: "high",
      status: "todo",
      dueDate: iso(3),
    },
    {
      title: "Prepare the quarterly all-hands deck",
      description: "Pull together attendance, hiring and delivery highlights.",
      assigneeId: "emp-001",
      createdById: "emp-003",
      category: "People",
      priority: "medium",
      status: "in_progress",
      dueDate: iso(6),
    },
    {
      title: "Close the August operations review",
      description: "Summarise incidents, resolutions and follow-up actions.",
      assigneeId: "emp-004",
      createdById: "emp-001",
      category: "Operations",
      priority: "medium",
      status: "completed",
      dueDate: iso(-13),
      completedAt: stamp(-13, 15),
    },
  ];

  return rows.map((row, index) => ({
    ...row,
    id: `tsk-${2000 + index}`,
    createdAt: stamp(-10 + index, 9),
  }));
}

function buildEvents(today: Date): CalendarEvent[] {
  const iso = (offset: number) => toISODate(addDays(today, offset));

  const rows: Array<Omit<CalendarEvent, "id">> = [
    {
      title: "Team stand-up",
      date: iso(0),
      startTime: "10:00",
      endTime: "10:20",
      type: "meeting",
      location: "Meeting room 2",
      ownerId: "emp-001",
      attendeeIds: ["emp-001", "emp-002", "emp-004", "emp-005"],
    },
    {
      title: "Weekly report due",
      date: iso(0),
      startTime: "15:00",
      endTime: "15:00",
      type: "deadline",
      location: "Connect portal",
      ownerId: "emp-002",
      attendeeIds: ["emp-002"],
    },
    {
      title: "One-to-one with Ahmed",
      date: iso(1),
      startTime: "11:30",
      endTime: "12:00",
      type: "meeting",
      location: "Meeting room 1",
      ownerId: "emp-001",
      attendeeIds: ["emp-001", "emp-002"],
    },
    {
      title: "Payroll cut-off",
      date: iso(2),
      startTime: "12:00",
      endTime: "12:00",
      type: "deadline",
      location: "Finance",
      ownerId: "emp-006",
      attendeeIds: ["emp-006", "emp-001"],
    },
    {
      title: "Analytics certification workshop",
      date: iso(3),
      startTime: "09:00",
      endTime: "16:00",
      type: "training",
      location: "Knowledge Oasis Muscat",
      ownerId: "emp-009",
      attendeeIds: ["emp-009"],
    },
    {
      title: "Sohar site safety briefing",
      date: iso(3),
      startTime: "08:00",
      endTime: "09:30",
      type: "meeting",
      location: "Sohar Office",
      ownerId: "emp-008",
      attendeeIds: ["emp-008", "emp-004"],
    },
    {
      title: "Client review — Al Nahda",
      date: iso(4),
      startTime: "14:00",
      endTime: "15:00",
      type: "meeting",
      location: "Video call",
      ownerId: "emp-005",
      attendeeIds: ["emp-005", "emp-001"],
    },
    {
      title: "Quarterly all-hands",
      date: iso(7),
      startTime: "13:00",
      endTime: "14:15",
      type: "meeting",
      location: "Main auditorium",
      ownerId: "emp-003",
      attendeeIds: employees.map((employee) => employee.id),
    },
    {
      title: "Maryam — parental leave",
      date: iso(1),
      startTime: "00:00",
      endTime: "23:59",
      type: "leave",
      location: "Away",
      ownerId: "emp-007",
      attendeeIds: ["emp-007"],
    },
    {
      title: "National Day holiday",
      date: iso(9),
      startTime: "00:00",
      endTime: "23:59",
      type: "holiday",
      location: "Company-wide",
      ownerId: "emp-003",
      attendeeIds: employees.map((employee) => employee.id),
    },
    {
      title: "Onboarding check-in — Tariq",
      date: iso(2),
      startTime: "09:30",
      endTime: "10:00",
      type: "meeting",
      location: "Meeting room 3",
      ownerId: "emp-002",
      attendeeIds: ["emp-002", "emp-010"],
    },
    {
      title: "Operations backlog review",
      date: iso(-2),
      startTime: "11:00",
      endTime: "12:00",
      type: "meeting",
      location: "Meeting room 2",
      ownerId: "emp-001",
      attendeeIds: ["emp-001", "emp-004", "emp-008"],
    },
    {
      title: "Policy publication deadline",
      date: iso(5),
      startTime: "17:00",
      endTime: "17:00",
      type: "deadline",
      location: "Company Knowledge",
      ownerId: "emp-002",
      attendeeIds: ["emp-002"],
    },
  ];

  return rows.map((row, index) => ({ ...row, id: `evt-${3000 + index}` }));
}

function buildKnowledge(today: Date): KnowledgeDoc[] {
  const iso = (offset: number) => toISODate(addDays(today, offset));

  const rows: Array<Omit<KnowledgeDoc, "id">> = [
    {
      title: "Working Hours Policy",
      category: "Hours",
      summary: "Standard hours, flexible start windows, overtime approval and the rules for the regional working week.",
      updatedAt: iso(-38),
      ownerId: "emp-001",
      tags: ["hours", "overtime", "flexibility"],
      sections: [
        {
          heading: "Standard hours",
          body: "The standard working week is 40 hours across Sunday to Thursday, with a core presence window of 09:00 to 15:00.",
        },
        {
          heading: "Flexible start",
          body: "Employees may start between 07:30 and 09:00 provided the core window is covered and the team calendar reflects the pattern.",
        },
        {
          heading: "Overtime",
          body: "Overtime must be approved in advance by the line manager and is recorded against the attendance record for that day.",
        },
      ],
    },
    {
      title: "Annual Leave Policy",
      category: "Leave",
      summary: "Entitlement, accrual, carry-over limits and how requests are reviewed inside the portal.",
      updatedAt: iso(-38),
      ownerId: "emp-001",
      tags: ["leave", "annual", "carry-over"],
      sections: [
        {
          heading: "Entitlement",
          body: "Employees accrue 25 days of annual leave per year; managers and above accrue 30 days. Accrual starts on the join date.",
        },
        {
          heading: "Requesting leave",
          body: "Submit requests through Leave in the portal at least five working days in advance. Your manager reviews the request and the decision is recorded against it.",
        },
        {
          heading: "Carry-over",
          body: "Up to 10 unused days may be carried into the following year and must be taken before the end of March.",
        },
      ],
    },
    {
      title: "Remote Work Policy",
      category: "Workplace",
      summary: "Eligibility, the two-day weekly allowance, equipment and expectations for availability.",
      updatedAt: iso(-5),
      ownerId: "emp-002",
      tags: ["remote", "hybrid", "equipment"],
      sections: [
        {
          heading: "Eligibility",
          body: "Employees who have completed probation and whose role does not require a site presence may work remotely up to two days per week with manager approval.",
        },
        {
          heading: "Availability",
          body: "Remote days follow the same core hours. Keep your calendar current and mark your attendance as remote in the portal.",
        },
        {
          heading: "Equipment",
          body: "The company provides a laptop and headset. Requests for additional equipment go through IT Support in the portal.",
        },
      ],
    },
    {
      title: "Information Security Policy",
      category: "Security",
      summary: "Access control, device standards, incident reporting and acceptable use of company systems.",
      updatedAt: iso(-21),
      ownerId: "emp-003",
      tags: ["security", "access", "devices"],
      sections: [
        {
          heading: "Access",
          body: "Access is granted on a least-privilege basis and reviewed quarterly. Dormant accounts are deactivated after 90 days of inactivity.",
        },
        {
          heading: "Devices",
          body: "Company devices must have disk encryption and automatic screen lock enabled. Do not store customer data on personal devices.",
        },
        {
          heading: "Incidents",
          body: "Report any suspected incident to the Workspace Administrator within one hour of discovery, even if you are not certain it is a real incident.",
        },
      ],
    },
    {
      title: "Expense and Reimbursement Policy",
      category: "Finance",
      summary: "What is claimable, approval thresholds, receipt requirements and the monthly submission deadline.",
      updatedAt: iso(-14),
      ownerId: "emp-006",
      tags: ["expenses", "receipts", "travel"],
      sections: [
        {
          heading: "Claimable expenses",
          body: "Business travel, client hospitality within limits, and approved training costs are claimable. Personal expenses are not.",
        },
        {
          heading: "Receipts",
          body: "Every claim requires an itemised receipt. Claims above OMR 100 require manager approval before submission.",
        },
        {
          heading: "Deadlines",
          body: "Submit claims by the 25th of each month to be included in that month's payroll run.",
        },
      ],
    },
    {
      title: "Code of Conduct",
      category: "People",
      summary: "The behavioural standards expected across the company and how concerns are raised.",
      updatedAt: iso(-56),
      ownerId: "emp-001",
      tags: ["conduct", "ethics", "respect"],
      sections: [
        {
          heading: "Our standards",
          body: "Treat colleagues, clients and partners with respect. Discrimination and harassment of any kind are not tolerated.",
        },
        {
          heading: "Conflicts of interest",
          body: "Declare any outside interest that could reasonably influence your work to People & Culture.",
        },
        {
          heading: "Raising concerns",
          body: "Concerns can be raised with your manager, People & Culture, or anonymously through the confidential channel described in the appendix.",
        },
      ],
    },
    {
      title: "Onboarding Guide",
      category: "People",
      summary: "The first 30 days for a new joiner: access, equipment, training and check-in milestones.",
      updatedAt: iso(-9),
      ownerId: "emp-002",
      tags: ["onboarding", "new joiner", "training"],
      sections: [
        {
          heading: "Day one",
          body: "Collect your equipment from IT Support, sign in to the portal, and complete your profile and emergency contact details.",
        },
        {
          heading: "First week",
          body: "Complete the security and conduct training modules, and meet your buddy and your manager for the 30-day plan.",
        },
        {
          heading: "Day 30",
          body: "A structured check-in with your manager reviews progress, blockers and the objectives for the next quarter.",
        },
      ],
    },
    {
      title: "Performance and Feedback",
      category: "People",
      summary: "How objectives are set, how feedback is gathered and what happens in the quarterly review.",
      updatedAt: iso(-30),
      ownerId: "emp-001",
      tags: ["performance", "objectives", "reviews"],
      sections: [
        {
          heading: "Objectives",
          body: "Each employee sets three to five objectives per quarter with their manager, visible in the portal.",
        },
        {
          heading: "Continuous feedback",
          body: "Feedback is expected throughout the quarter rather than saved for the review. Portal activity and task data provide context, never a verdict.",
        },
        {
          heading: "Quarterly review",
          body: "A 45-minute conversation covering achievements, development areas and support needed for the next quarter.",
        },
      ],
    },
  ];

  return rows.map((row, index) => ({ ...row, id: `kb-${4000 + index}` }));
}

function buildNotifications(today: Date): AppNotification[] {
  const stamp = (hoursAgo: number) =>
    new Date(today.getTime() - hoursAgo * 3_600_000).toISOString();

  return [
    {
      id: "ntf-5001",
      employeeId: "emp-001",
      title: "Leave request awaiting your review",
      body: "Noor Al Rashdi requested 3 days of annual leave.",
      tone: "warning",
      createdAt: stamp(3),
      read: false,
      href: "/leave",
    },
    {
      id: "ntf-5002",
      employeeId: "emp-002",
      title: "Task due today",
      body: "“Prepare the weekly operations report” is due at 15:00.",
      tone: "warning",
      createdAt: stamp(5),
      read: false,
      href: "/tasks",
    },
    {
      id: "ntf-5003",
      employeeId: null,
      title: "Remote Work Policy updated",
      body: "The two-day weekly allowance is now confirmed for all post-probation employees.",
      tone: "info",
      createdAt: stamp(28),
      read: false,
      href: "/knowledge",
    },
    {
      id: "ntf-5004",
      employeeId: "emp-002",
      title: "Sick leave approved",
      body: "Your sick leave was approved by Ahmed Al Balushi.",
      tone: "success",
      createdAt: stamp(52),
      read: true,
      href: "/leave",
    },
    {
      id: "ntf-5005",
      employeeId: "emp-001",
      title: "Workload signal — Operations",
      body: "Salim Al Habsi is carrying 40% more assigned work than the team average.",
      tone: "warning",
      createdAt: stamp(30),
      read: false,
      href: "/analytics",
    },
    {
      id: "ntf-5006",
      employeeId: null,
      title: "Quarterly all-hands scheduled",
      body: "Next week, 13:00 in the main auditorium. The agenda is in the calendar entry.",
      tone: "info",
      createdAt: stamp(72),
      read: true,
      href: "/calendar",
    },
    {
      id: "ntf-5007",
      employeeId: "emp-003",
      title: "Access review due",
      body: "12 workspace accounts have been inactive for more than 90 days.",
      tone: "warning",
      createdAt: stamp(9),
      read: false,
      href: "/activity",
    },
  ];
}

function buildActivity(today: Date): ActivityEntry[] {
  const stamp = (hoursAgo: number) =>
    new Date(today.getTime() - hoursAgo * 3_600_000).toISOString();

  const rows: Array<Omit<ActivityEntry, "id">> = [
    {
      actorId: "emp-002",
      action: "Submitted leave request",
      entity: "Leave",
      entityId: "lv-1001",
      summary: "3 days of annual leave submitted for review.",
      at: stamp(3),
      status: "pending",
    },
    {
      actorId: "emp-001",
      action: "Rejected leave request",
      entity: "Leave",
      entityId: "lv-1005",
      summary: "Khalid Al Amri's unpaid leave declined — site coverage.",
      at: stamp(26),
      status: "warning",
    },
    {
      actorId: "emp-005",
      action: "Completed task",
      entity: "Task",
      entityId: "tsk-2012",
      summary: "“Escalation review with the Al Nahda account” marked complete.",
      at: stamp(48),
      status: "success",
    },
    {
      actorId: "emp-002",
      action: "Published document",
      entity: "Knowledge",
      entityId: "kb-4002",
      summary: "Remote Work Policy published to Company Knowledge.",
      at: stamp(120),
      status: "success",
    },
    {
      actorId: "emp-003",
      action: "Updated access matrix",
      entity: "Workspace",
      summary: "Role-based access refreshed for the Technology department.",
      at: stamp(96),
      status: "success",
    },
    {
      actorId: "emp-004",
      action: "Checked in",
      entity: "Attendance",
      summary: "Checked in at the Muscat HQ office.",
      at: stamp(7),
      status: "success",
    },
    {
      actorId: "emp-001",
      action: "Assigned task",
      entity: "Task",
      entityId: "tsk-2006",
      summary: "“Run the safety briefing for the Sohar site” assigned to Khalid Al Amri.",
      at: stamp(54),
      status: "success",
    },
    {
      actorId: "emp-006",
      action: "Flagged payroll issue",
      entity: "Task",
      entityId: "tsk-2011",
      summary: "Overtime rounding defect raised for the payroll export.",
      at: stamp(70),
      status: "warning",
    },
    {
      actorId: "emp-010",
      action: "Completed onboarding step",
      entity: "People",
      summary: "Security and conduct training modules completed.",
      at: stamp(140),
      status: "success",
    },
    {
      actorId: "emp-001",
      action: "Approved leave request",
      entity: "Leave",
      entityId: "lv-1002",
      summary: "Salim Al Habsi's sick leave approved.",
      at: stamp(100),
      status: "success",
    },
    {
      actorId: "emp-009",
      action: "Updated dashboard",
      entity: "Reports",
      summary: "Workforce dashboard moved to the new data model.",
      at: stamp(150),
      status: "pending",
    },
    {
      actorId: "emp-003",
      action: "Reviewed dormant accounts",
      entity: "Workspace",
      summary: "12 accounts flagged for deactivation review.",
      at: stamp(9),
      status: "warning",
    },
  ];

  return rows.map((row, index) => ({ ...row, id: `act-${6000 + index}` }));
}

/** Builds a complete, self-consistent demo database anchored on today. */
export function createSeedDatabase(now = new Date()): DemoDatabase {
  const today = startOfDay(now);

  return {
    version: DEMO_DB_VERSION,
    seededAt: new Date().toISOString(),
    employees: employees.map((employee) => ({ ...employee })),
    attendance: buildAttendance(today),
    leaveRequests: buildLeaveRequests(today),
    tasks: buildTasks(today),
    events: buildEvents(today),
    knowledge: buildKnowledge(today),
    notifications: buildNotifications(now),
    activity: buildActivity(now),
    preferences: {},
  };
}
