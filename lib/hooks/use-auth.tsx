"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getServerSession,
  getSession,
  signIn as resolveSignIn,
  setSession,
  subscribeToSession,
} from "@/lib/demo/auth";
import type { Employee, Role } from "@/lib/demo/types";
import { employeesRepository } from "@/lib/repositories";
import { useDatabase, useMounted } from "./use-demo-data";

interface AuthContextValue {
  employee: Employee | null;
  /** False until the stored session has been read from the browser. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  /** Switches identity without credentials — the demo's quick-login path. */
  impersonate: (employeeId: string) => void;
  can: (permission: Permission) => boolean;
}

export type Permission =
  | "view_analytics"
  | "approve_leave"
  | "assign_tasks"
  | "view_directory"
  | "view_audit_trail";

const PERMISSIONS: Record<Role, Permission[]> = {
  employee: [],
  manager: ["view_analytics", "approve_leave", "assign_tasks", "view_directory"],
  admin: [
    "view_analytics",
    "approve_leave",
    "assign_tasks",
    "view_directory",
    "view_audit_trail",
  ],
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const database = useDatabase();
  const employeeId = useSyncExternalStore(subscribeToSession, getSession, getServerSession);
  // The session lives in the browser, so nothing is decided until we are mounted.
  const ready = useMounted();

  const employee = useMemo(
    () => (employeeId ? (database.employees.find((entry) => entry.id === employeeId) ?? null) : null),
    [database, employeeId],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    // Mirrors the latency of a real credential check so the button's pending
    // state is visible rather than theoretical.
    await new Promise((resolve) => setTimeout(resolve, 420));
    const result = resolveSignIn(email, password);
    if (!result.ok || !result.employee) return { ok: false, error: result.error };
    setSession(result.employee.id);
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
  }, []);

  const impersonate = useCallback((id: string) => {
    if (!employeesRepository.getById(id)) return;
    setSession(id);
  }, []);

  const can = useCallback(
    (permission: Permission) =>
      Boolean(employee && PERMISSIONS[employee.role].includes(permission)),
    [employee],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ employee, ready, signIn, signOut, impersonate, can }),
    [employee, ready, signIn, signOut, impersonate, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}

/**
 * Auth for screens that only render behind the portal guard, where an employee
 * is always present. Throws rather than returning null so callers stay simple.
 */
export function useCurrentEmployee(): Employee {
  const { employee } = useAuth();
  if (!employee) throw new Error("No signed-in employee in this part of the app.");
  return employee;
}
