import { delay, getDatabase, mutate } from "@/lib/demo/store";
import type { WorkspacePreferences } from "@/lib/demo/types";

export const DEFAULT_PREFERENCES: WorkspacePreferences = {
  emailNotifications: true,
  weeklyDigest: true,
  desktopAlerts: false,
  compactDensity: false,
  language: "en",
};

export const preferencesRepository = {
  get(employeeId: string): WorkspacePreferences {
    return { ...DEFAULT_PREFERENCES, ...getDatabase().preferences[employeeId] };
  },

  async update(
    employeeId: string,
    patch: Partial<WorkspacePreferences>,
  ): Promise<WorkspacePreferences> {
    await delay(140);
    const next = { ...preferencesRepository.get(employeeId), ...patch };
    mutate((database) => ({
      ...database,
      preferences: { ...database.preferences, [employeeId]: next },
    }));
    return next;
  },
};
