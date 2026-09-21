"use client";

import { useState, type FormEvent } from "react";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Icons } from "@/components/ui/icons";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import type { BadgeTone } from "@/components/ui/badge";
import type { CalendarEvent, EventType } from "@/lib/demo/types";
import { useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import { employeesRepository, eventsRepository, EVENT_TYPE_LABELS } from "@/lib/repositories";
import { addDays, formatDate, formatTime, monthLabel, toISODate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const TYPE_TONES: Record<EventType, BadgeTone> = {
  meeting: "brand",
  deadline: "danger",
  holiday: "success",
  leave: "info",
  training: "warning",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const employee = useCurrentEmployee();
  const { toast } = useToast();

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => toISODate(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, loading } = useDemoQuery(
    () => ({
      events: eventsRepository.listVisibleTo(employee),
      selectedEvents: eventsRepository.listForDate(employee, selected),
      upcoming: eventsRepository.listUpcoming(employee, 5),
    }),
    [employee.id, selected, cursor.getTime()],
  );

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const cells = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const today = toISODate(new Date());

  async function removeEvent() {
    if (!deleteTarget) return;
    setBusy(true);
    await eventsRepository.remove(deleteTarget.id, employee);
    toast({ title: "Event removed", description: `“${deleteTarget.title}”`, tone: "info" });
    setDeleteTarget(null);
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description="Meetings, deadlines, training and time away — the whole month at a glance."
        actions={
          <Button icon={<Icons.plus className="size-4" />} onClick={() => setFormOpen(true)}>
            Add event
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-1.5">
              <IconButton
                label="Previous month"
                variant="ghost"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
              >
                <Icons.chevronLeft className="size-4" />
              </IconButton>
              <h2 className="min-w-40 text-center text-sm font-semibold text-ink">
                {monthLabel(cursor)}
              </h2>
              <IconButton
                label="Next month"
                variant="ghost"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
              >
                <Icons.chevronRight className="size-4" />
              </IconButton>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const now = new Date();
                setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                setSelected(toISODate(now));
              }}
            >
              Today
            </Button>
          </div>

          <div className="grid grid-cols-7 border-t border-line bg-subtle/60">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day[0]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell) => {
              const iso = toISODate(cell);
              const inMonth = cell.getMonth() === cursor.getMonth();
              const dayEvents = data?.events.filter((event) => event.date === iso) ?? [];
              const isToday = iso === today;
              const isSelected = iso === selected;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(iso)}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={`${formatDate(iso, true)}, ${dayEvents.length} events`}
                  className={cn(
                    "relative min-h-16 border-b border-r border-line p-1.5 text-left transition-colors sm:min-h-24 sm:p-2",
                    !inMonth && "bg-subtle/40",
                    isSelected ? "bg-brand-500/[0.08] ring-1 ring-inset ring-brand-500" : "hover:bg-subtle/70",
                  )}
                >
                  <span
                    className={cn(
                      "inline-grid size-6 place-items-center rounded-full text-xs tabular-nums",
                      isToday
                        ? "bg-brand-500 font-semibold text-white"
                        : inMonth
                          ? "text-ink"
                          : "text-muted",
                    )}
                  >
                    {cell.getDate()}
                  </span>

                  <span className="mt-1 hidden space-y-1 sm:block">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight"
                        style={{
                          background: "color-mix(in srgb, var(--color-brand-500) 12%, transparent)",
                          color: "var(--color-brand-600)",
                        }}
                      >
                        {event.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 ? (
                      <span className="block px-1 text-[10px] text-muted">
                        +{dayEvents.length - 2} more
                      </span>
                    ) : null}
                  </span>

                  {dayEvents.length > 0 ? (
                    <span
                      aria-hidden
                      className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5 sm:hidden"
                    >
                      {dayEvents.slice(0, 3).map((event) => (
                        <span key={event.id} className="size-1 rounded-full bg-brand-500" />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title={formatDate(selected, true)}
              subtitle={
                loading
                  ? "Loading…"
                  : `${data?.selectedEvents.length ?? 0} ${(data?.selectedEvents.length ?? 0) === 1 ? "event" : "events"}`
              }
            />
            <div className="mt-4 space-y-2.5">
              {loading || !data ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : data.selectedEvents.length === 0 ? (
                <EmptyState
                  title="Nothing on this day"
                  description="Select another day, or add an event to this date."
                  icon={<Icons.calendar className="size-5" />}
                  compact
                  action={
                    <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
                      Add event
                    </Button>
                  }
                />
              ) : (
                data.selectedEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-xl border border-line bg-subtle/50 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge tone={TYPE_TONES[event.type]}>{EVENT_TYPE_LABELS[event.type]}</Badge>
                      {event.ownerId === employee.id ? (
                        <IconButton
                          label="Remove event"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(event)}
                        >
                          <Icons.trash className="size-3.5" />
                        </IconButton>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-ink">{event.title}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {event.startTime === event.endTime
                        ? formatTime(event.startTime)
                        : `${formatTime(event.startTime)} — ${formatTime(event.endTime)}`}{" "}
                      · {event.location}
                    </p>
                    {event.attendeeIds.length > 1 ? (
                      <div className="mt-3 border-t border-line pt-3">
                        <AvatarGroup
                          names={event.attendeeIds
                            .map((id) => employeesRepository.getById(id)?.name)
                            .filter((name): name is string => Boolean(name))}
                        />
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Coming up" subtitle="Your next five entries" />
            <ul className="mt-3 space-y-2">
              {loading || !data
                ? [0, 1, 2].map((index) => <Skeleton key={index} className="h-10 w-full" />)
                : data.upcoming.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(event.date);
                          const date = new Date(event.date);
                          setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-subtle focus-ring"
                      >
                        <span className="w-14 flex-none text-[11px] font-medium text-muted">
                          {formatDate(event.date)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink">{event.title}</span>
                          <span className="block text-[11px] text-muted">
                            {formatTime(event.startTime)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
            </ul>
          </Card>
        </div>
      </div>

      <EventFormModal
        open={formOpen}
        defaultDate={selected}
        onClose={() => setFormOpen(false)}
        onCreated={(title) =>
          toast({ title: "Event added", description: `“${title}”`, tone: "success" })
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeEvent}
        loading={busy}
        title="Remove this event?"
        message={deleteTarget ? `“${deleteTarget.title}” will be removed from the calendar.` : ""}
        confirmLabel="Remove event"
      />
    </div>
  );
}

function EventFormModal({
  open,
  defaultDate,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onCreated: (title: string) => void;
}) {
  const employee = useCurrentEmployee();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [type, setType] = useState<EventType>("meeting");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [seededFor, setSeededFor] = useState(defaultDate);

  if (open && seededFor !== defaultDate) {
    setSeededFor(defaultDate);
    setDate(defaultDate);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Give the event a title.";
    if (!date) next.date = "Choose a date.";
    if (endTime < startTime) next.endTime = "The end time cannot be before the start time.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await eventsRepository.create({ title, date, startTime, endTime, type, location }, employee);
      onCreated(title.trim());
      setTitle("");
      setLocation("");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add calendar event"
      description="Events you create appear on your calendar and in the activity log."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button form="event-form" type="submit" loading={busy}>
            Add event
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit} noValidate className="space-y-4">
        <Input
          label="Title"
          required
          value={title}
          error={errors.title}
          placeholder="Team stand-up"
          onChange={(event) => {
            setTitle(event.target.value);
            setErrors((current) => ({ ...current, title: "" }));
          }}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Date"
            type="date"
            required
            value={date}
            error={errors.date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Input
            label="Start"
            type="time"
            required
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
          <Input
            label="End"
            type="time"
            required
            value={endTime}
            error={errors.endTime}
            onChange={(event) => {
              setEndTime(event.target.value);
              setErrors((current) => ({ ...current, endTime: "" }));
            }}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            value={type}
            options={(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((value) => ({
              value,
              label: EVENT_TYPE_LABELS[value],
            }))}
            onChange={(event) => setType(event.target.value as EventType)}
          />
          <Input
            label="Location"
            value={location}
            placeholder="Meeting room 2"
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
