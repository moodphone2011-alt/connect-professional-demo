import { createId, delay, getDatabase, mutate } from "@/lib/demo/store";
import type { AppNotification, DemoDatabase, NotificationTone } from "@/lib/demo/types";

export interface NewNotification {
  employeeId: string | null;
  title: string;
  body: string;
  tone?: NotificationTone;
  href?: string;
}

/** Pure helper — lets a data change and its notification land together. */
export function withNotification(
  database: DemoDatabase,
  notification: NewNotification,
): DemoDatabase {
  const record: AppNotification = {
    id: createId("ntf"),
    createdAt: new Date().toISOString(),
    read: false,
    tone: notification.tone ?? "info",
    employeeId: notification.employeeId,
    title: notification.title,
    body: notification.body,
    href: notification.href,
  };
  return { ...database, notifications: [record, ...database.notifications] };
}

function visibleTo(notification: AppNotification, employeeId: string): boolean {
  return notification.employeeId === null || notification.employeeId === employeeId;
}

export const notificationsRepository = {
  listFor(employeeId: string): AppNotification[] {
    return getDatabase()
      .notifications.filter((notification) => visibleTo(notification, employeeId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  unreadCount(employeeId: string): number {
    return notificationsRepository.listFor(employeeId).filter((n) => !n.read).length;
  },

  async markRead(id: string): Promise<void> {
    mutate((database) => ({
      ...database,
      notifications: database.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    }));
  },

  async markAllRead(employeeId: string): Promise<void> {
    await delay(120);
    mutate((database) => ({
      ...database,
      notifications: database.notifications.map((notification) =>
        visibleTo(notification, employeeId) ? { ...notification, read: true } : notification,
      ),
    }));
  },

  async dismiss(id: string): Promise<void> {
    mutate((database) => ({
      ...database,
      notifications: database.notifications.filter((notification) => notification.id !== id),
    }));
  },

  async push(notification: NewNotification): Promise<void> {
    mutate((database) => withNotification(database, notification));
  },
};
