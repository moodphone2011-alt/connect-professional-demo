import { delay, getDatabase, mutate } from "@/lib/demo/store";
import type { Employee, Role } from "@/lib/demo/types";
import { withActivity } from "./activity";

export interface EmployeeRepository {
  list(): Employee[];
  getById(id: string): Employee | undefined;
  getByEmail(email: string): Employee | undefined;
  listReports(managerId: string): Employee[];
  listVisibleTo(employee: Employee): Employee[];
  update(id: string, patch: Partial<Employee>, actorId: string): Promise<Employee>;
}

/** Employees a given viewer is allowed to see, following the role model. */
function visibleTo(employee: Employee, all: Employee[]): Employee[] {
  if (employee.role === "admin") return all;
  if (employee.role === "manager") {
    return all.filter(
      (candidate) => candidate.managerId === employee.id || candidate.id === employee.id,
    );
  }
  return all.filter((candidate) => candidate.id === employee.id);
}

export const employeesRepository: EmployeeRepository = {
  list() {
    return [...getDatabase().employees];
  },

  getById(id) {
    return getDatabase().employees.find((employee) => employee.id === id);
  },

  getByEmail(email) {
    const needle = email.trim().toLowerCase();
    return getDatabase().employees.find(
      (employee) => employee.email.toLowerCase() === needle,
    );
  },

  listReports(managerId) {
    return getDatabase().employees.filter((employee) => employee.managerId === managerId);
  },

  listVisibleTo(employee) {
    return visibleTo(employee, getDatabase().employees);
  },

  async update(id, patch, actorId) {
    await delay();
    let updated: Employee | undefined;
    mutate((database) => {
      const employees = database.employees.map((employee) => {
        if (employee.id !== id) return employee;
        updated = { ...employee, ...patch, id: employee.id };
        return updated;
      });
      const next = { ...database, employees };
      return withActivity(next, {
        actorId,
        action: actorId === id ? "Updated profile" : "Updated employee record",
        entity: "People",
        entityId: id,
        summary: `${updated?.name ?? "Employee"} details updated.`,
      });
    });

    if (!updated) throw new Error("That employee could not be found.");
    return updated;
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "Administrator",
};

/** Two-letter initials for avatars. */
export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
