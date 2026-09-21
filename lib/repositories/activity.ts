import { createId, delay, getDatabase, mutate } from "@/lib/demo/store";
import type { ActivityEntry, ActivityStatus, DemoDatabase } from "@/lib/demo/types";

export interface NewActivity {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
  status?: ActivityStatus;
}

/**
 * Pure helper so other repositories can record an audit entry as part of the
 * same atomic mutation that changed the data.
 */
export function withActivity(database: DemoDatabase, entry: NewActivity): DemoDatabase {
  const record: ActivityEntry = {
    id: createId("act"),
    at: new Date().toISOString(),
    status: entry.status ?? "success",
    actorId: entry.actorId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    summary: entry.summary,
  };
  return { ...database, activity: [record, ...database.activity] };
}

export const activityRepository = {
  list(): ActivityEntry[] {
    return [...getDatabase().activity].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  },

  listForActor(actorId: string): ActivityEntry[] {
    return activityRepository.list().filter((entry) => entry.actorId === actorId);
  },

  async record(entry: NewActivity): Promise<void> {
    await delay(80);
    mutate((database) => withActivity(database, entry));
  },
};
