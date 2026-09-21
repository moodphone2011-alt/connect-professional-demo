/**
 * Domain model for the CONNECT employee portal.
 *
 * These types describe the data the product works with. In this demo build they
 * are served by the local demo repositories (`lib/repositories`); a real backend
 * would implement the same shapes behind the same repository interfaces.
 */

export type Role = "employee" | "manager" | "admin";

export type EmployeeStatus = "active" | "on_leave" | "onboarding";

export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  role: Role;
  jobTitle: string;
  department: string;
  managerId: string | null;
  location: string;
  phone: string;
  joinedOn: string;
  status: EmployeeStatus;
  leaveBalance: {
    annual: { total: number; used: number };
    sick: { total: number; used: number };
  };
  skills: string[];
}

export type AttendanceStatus =
  | "present"
  | "late"
  | "remote"
  | "absent"
  | "leave"
  | "weekend";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm` in local office time, or null when not recorded. */
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  /** Worked hours, rounded to one decimal. */
  hours: number;
  note?: string;
}

export type LeaveType = "annual" | "sick" | "unpaid" | "parental" | "training";
export type LeaveStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  decidedBy?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
}

export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  createdById: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  completedAt?: string | null;
}

export type EventType = "meeting" | "deadline" | "holiday" | "leave" | "training";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: EventType;
  location: string;
  ownerId: string;
  attendeeIds: string[];
}

export interface KnowledgeSection {
  heading: string;
  body: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  summary: string;
  sections: KnowledgeSection[];
  updatedAt: string;
  ownerId: string;
  tags: string[];
}

export type NotificationTone = "success" | "info" | "warning" | "error";

export interface AppNotification {
  id: string;
  /** `null` means the notification is broadcast to the whole workspace. */
  employeeId: string | null;
  title: string;
  body: string;
  tone: NotificationTone;
  createdAt: string;
  read: boolean;
  href?: string;
}

export type ActivityStatus = "success" | "pending" | "warning";

export interface ActivityEntry {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
  at: string;
  status: ActivityStatus;
}

export interface DemoDatabase {
  version: number;
  seededAt: string;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  tasks: Task[];
  events: CalendarEvent[];
  knowledge: KnowledgeDoc[];
  notifications: AppNotification[];
  activity: ActivityEntry[];
  preferences: Record<string, WorkspacePreferences>;
}

export interface WorkspacePreferences {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  desktopAlerts: boolean;
  compactDensity: boolean;
  language: "en" | "ar";
}

export type CollectionName = Exclude<
  keyof DemoDatabase,
  "version" | "seededAt" | "preferences"
>;
