import { createId, delay, getDatabase, mutate } from "@/lib/demo/store";
import type { CalendarEvent, Employee, EventType } from "@/lib/demo/types";
import { formatDate, toISODate } from "@/lib/utils/date";
import { withActivity } from "./activity";

export interface NewCalendarEvent {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: EventType;
  location: string;
  attendeeIds?: string[];
}

function byStart(a: CalendarEvent, b: CalendarEvent): number {
  return `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`);
}

export const eventsRepository = {
  listVisibleTo(viewer: Employee): CalendarEvent[] {
    const events = getDatabase().events;
    if (viewer.role === "admin") return [...events].sort(byStart);
    return events
      .filter(
        (event) =>
          event.attendeeIds.includes(viewer.id) ||
          event.ownerId === viewer.id ||
          event.type === "holiday",
      )
      .sort(byStart);
  },

  listForDate(viewer: Employee, date: string): CalendarEvent[] {
    return eventsRepository.listVisibleTo(viewer).filter((event) => event.date === date);
  },

  listUpcoming(viewer: Employee, limit = 5): CalendarEvent[] {
    const today = toISODate(new Date());
    return eventsRepository
      .listVisibleTo(viewer)
      .filter((event) => event.date >= today)
      .slice(0, limit);
  },

  async create(input: NewCalendarEvent, actor: Employee): Promise<CalendarEvent> {
    await delay();
    const event: CalendarEvent = {
      id: createId("evt"),
      title: input.title.trim(),
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime || input.startTime,
      type: input.type,
      location: input.location.trim() || "Not specified",
      ownerId: actor.id,
      attendeeIds: input.attendeeIds?.length ? input.attendeeIds : [actor.id],
    };

    mutate((database) =>
      withActivity({ ...database, events: [...database.events, event] }, {
        actorId: actor.id,
        action: "Created calendar event",
        entity: "Calendar",
        entityId: event.id,
        summary: `“${event.title}” on ${formatDate(event.date)}.`,
      }),
    );

    return event;
  },

  async remove(id: string, actor: Employee): Promise<void> {
    await delay();
    mutate((database) => {
      const target = database.events.find((event) => event.id === id);
      if (!target) return database;
      return withActivity(
        { ...database, events: database.events.filter((event) => event.id !== id) },
        {
          actorId: actor.id,
          action: "Removed calendar event",
          entity: "Calendar",
          entityId: id,
          summary: `“${target.title}” removed from ${formatDate(target.date)}.`,
          status: "warning",
        },
      );
    });
  },
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: "Meeting",
  deadline: "Deadline",
  holiday: "Holiday",
  leave: "Leave",
  training: "Training",
};
