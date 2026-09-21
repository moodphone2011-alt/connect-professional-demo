/**
 * Demo authentication.
 *
 * There is no auth provider, no token exchange and no network call: sign-in
 * resolves an employee from the local demo database and stores the selected
 * identity in localStorage. The shape of `signIn` mirrors what a real
 * credential-based endpoint would return, so replacing it later is a small,
 * contained change.
 */

import { employeesRepository } from "@/lib/repositories/employees";
import { SESSION_KEY } from "./store";
import type { Employee, Role } from "./types";

/** The shared password for every demo identity. Not a secret — it is printed on the sign-in screen. */
export const DEMO_PASSWORD = "connect2026";

export interface DemoAccount {
  employeeId: string;
  email: string;
  name: string;
  role: Role;
  jobTitle: string;
  blurb: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    employeeId: "emp-002",
    email: "noor.alrashdi@connect.example",
    name: "Noor Al Rashdi",
    role: "employee",
    jobTitle: "HR Specialist",
    blurb: "The everyday view: attendance, leave, tasks and policies.",
  },
  {
    employeeId: "emp-001",
    email: "ahmed.albalushi@connect.example",
    name: "Ahmed Al Balushi",
    role: "manager",
    jobTitle: "People Manager",
    blurb: "Approvals, team analytics and workload signals.",
  },
  {
    employeeId: "emp-003",
    email: "layla.alzadjali@connect.example",
    name: "Layla Al Zadjali",
    role: "admin",
    jobTitle: "Workspace Administrator",
    blurb: "Company-wide visibility, people directory and the audit trail.",
  },
];

export interface SignInResult {
  ok: boolean;
  employee?: Employee;
  error?: string;
}

export function signIn(email: string, password: string): SignInResult {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Enter your work email address." };
  if (!password) return { ok: false, error: "Enter your password." };

  const account = DEMO_ACCOUNTS.find((entry) => entry.email.toLowerCase() === trimmed);
  if (!account) {
    return {
      ok: false,
      error: "No demo identity matches that email. Pick one of the demo accounts below.",
    };
  }
  if (password !== DEMO_PASSWORD) {
    return { ok: false, error: "That password is not correct for this demo identity." };
  }

  const employee = employeesRepository.getById(account.employeeId);
  if (!employee) return { ok: false, error: "That employee record is unavailable." };

  return { ok: true, employee };
}

/**
 * The session is an external store: React subscribes to it rather than copying
 * it into state on mount, which keeps server and client renders consistent.
 */
type SessionListener = () => void;

const sessionListeners = new Set<SessionListener>();
let sessionSnapshot: string | null = null;
let sessionLoaded = false;

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function subscribeToSession(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

/** Signed-in employee id, or null. Reads storage once, then serves from memory. */
export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  if (!sessionLoaded) {
    sessionSnapshot = readStorage();
    sessionLoaded = true;
  }
  return sessionSnapshot;
}

/** Server snapshot: nobody is signed in until the browser says otherwise. */
export function getServerSession(): null {
  return null;
}

export function setSession(employeeId: string | null): void {
  sessionSnapshot = employeeId;
  sessionLoaded = true;
  try {
    if (employeeId) window.localStorage.setItem(SESSION_KEY, employeeId);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // A blocked storage API only means the session ends with the tab.
  }
  sessionListeners.forEach((listener) => listener());
}
