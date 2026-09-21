import { delay, getDatabase, mutate } from "@/lib/demo/store";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/demo/types";
import { addDays, hoursBetween, startOfWeek, toISODate } from "@/lib/utils/date";
import { withActivity } from "./activity";

const OFFICE_START_MINUTES = 8 * 60 + 15;

function nowClock(): string {
  const now = new Date();
  return `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
}

function minutesOf(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}

export interface AttendanceSummary {
  todayHours: number;
  weekHours: number;
  onTimeRate: number;
  lateCount: number;
  isCheckedIn: boolean;
  today: AttendanceRecord | undefined;
}

export const attendanceRepository = {
  listFor(employeeId: string): AttendanceRecord[] {
    return getDatabase()
      .attendance.filter((record) => record.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  listAll(): AttendanceRecord[] {
    return [...getDatabase().attendance].sort((a, b) => b.date.localeCompare(a.date));
  },

  getToday(employeeId: string): AttendanceRecord | undefined {
    const today = toISODate(new Date());
    return getDatabase().attendance.find(
      (record) => record.employeeId === employeeId && record.date === today,
    );
  },

  summaryFor(employeeId: string): AttendanceSummary {
    const records = attendanceRepository.listFor(employeeId);
    const today = attendanceRepository.getToday(employeeId);
    const weekStart = toISODate(startOfWeek());

    const weekHours = records
      .filter((record) => record.date >= weekStart)
      .reduce((total, record) => total + record.hours, 0);

    const workdays = records.filter(
      (record) => record.status !== "weekend" && record.status !== "leave",
    );
    const onTime = workdays.filter(
      (record) => record.status === "present" || record.status === "remote",
    ).length;

    return {
      todayHours: today?.hours ?? 0,
      weekHours: Math.round(weekHours * 10) / 10,
      onTimeRate: workdays.length ? Math.round((onTime / workdays.length) * 100) : 0,
      lateCount: workdays.filter((record) => record.status === "late").length,
      isCheckedIn: Boolean(today?.checkIn && !today.checkOut),
      today,
    };
  },

  /** Hours worked per day for the current week, Sunday first. */
  weeklyHours(employeeId: string): Array<{ label: string; date: string; hours: number }> {
    const start = startOfWeek();
    const records = getDatabase().attendance.filter(
      (record) => record.employeeId === employeeId,
    );

    return Array.from({ length: 5 }, (_, index) => {
      const day = addDays(start, index);
      const date = toISODate(day);
      const record = records.find((entry) => entry.date === date);
      return {
        label: day.toLocaleDateString("en-GB", { weekday: "short" }),
        date,
        hours: record?.hours ?? 0,
      };
    });
  },

  async checkIn(employeeId: string, employeeName: string, remote = false): Promise<AttendanceRecord> {
    await delay();
    const date = toISODate(new Date());
    const checkIn = nowClock();
    const status: AttendanceStatus = remote
      ? "remote"
      : minutesOf(checkIn) > OFFICE_START_MINUTES
        ? "late"
        : "present";

    let record: AttendanceRecord | undefined;
    mutate((database) => {
      const existing = database.attendance.find(
        (entry) => entry.employeeId === employeeId && entry.date === date,
      );
      record = existing
        ? { ...existing, checkIn, checkOut: null, status, hours: 0 }
        : {
            id: `att-${employeeId}-${date}`,
            employeeId,
            date,
            checkIn,
            checkOut: null,
            status,
            hours: 0,
          };

      const attendance = existing
        ? database.attendance.map((entry) => (entry.id === existing.id ? record! : entry))
        : [record!, ...database.attendance];

      return withActivity({ ...database, attendance }, {
        actorId: employeeId,
        action: "Checked in",
        entity: "Attendance",
        entityId: record!.id,
        summary: `${employeeName} checked in at ${checkIn}${remote ? " (remote)" : ""}.`,
      });
    });

    return record!;
  },

  async checkOut(employeeId: string, employeeName: string): Promise<AttendanceRecord> {
    await delay();
    const date = toISODate(new Date());
    const checkOut = nowClock();

    let record: AttendanceRecord | undefined;
    mutate((database) => {
      const existing = database.attendance.find(
        (entry) => entry.employeeId === employeeId && entry.date === date,
      );
      if (!existing?.checkIn) return database;

      record = {
        ...existing,
        checkOut,
        hours: hoursBetween(existing.checkIn, checkOut),
      };

      const attendance = database.attendance.map((entry) =>
        entry.id === existing.id ? record! : entry,
      );

      return withActivity({ ...database, attendance }, {
        actorId: employeeId,
        action: "Checked out",
        entity: "Attendance",
        entityId: record!.id,
        summary: `${employeeName} checked out at ${checkOut} after ${record!.hours}h.`,
      });
    });

    if (!record) throw new Error("You need to check in before checking out.");
    return record;
  },
};
