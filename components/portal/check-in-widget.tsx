"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDatabase } from "@/lib/hooks/use-demo-data";
import { attendanceRepository } from "@/lib/repositories";
import { formatHours, formatTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

/**
 * Check in / check out. Writes a real attendance record through the repository,
 * so every other screen — history, weekly hours, analytics — updates with it.
 */
export function CheckInWidget({ variant = "hero" }: { variant?: "hero" | "inline" }) {
  const employee = useCurrentEmployee();
  const database = useDatabase();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const today = attendanceRepository.getToday(employee.id);
  void database;

  const checkedIn = Boolean(today?.checkIn && !today.checkOut);
  const finished = Boolean(today?.checkIn && today.checkOut);

  async function act(remote = false) {
    setPending(true);
    try {
      if (checkedIn) {
        const record = await attendanceRepository.checkOut(employee.id, employee.name);
        toast({
          title: "Checked out",
          description: `${formatHours(record.hours)} recorded for today.`,
          tone: "success",
        });
      } else {
        const record = await attendanceRepository.checkIn(employee.id, employee.name, remote);
        toast({
          title: remote ? "Checked in remotely" : "Checked in",
          description: `Started at ${formatTime(record.checkIn)}.`,
          tone: "success",
        });
      }
    } catch (error) {
      toast({
        title: "That did not go through",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setPending(false);
    }
  }

  const statusLine = finished
    ? `${formatTime(today?.checkIn ?? null)} — ${formatTime(today?.checkOut ?? null)} · ${formatHours(today?.hours ?? 0)}`
    : checkedIn
      ? `Working since ${formatTime(today?.checkIn ?? null)}`
      : "Not checked in yet";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-card border p-4",
        variant === "hero"
          ? "border-line bg-surface shadow-soft"
          : "border-line bg-subtle/60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-11 flex-none place-items-center rounded-xl",
          checkedIn ? "bg-emerald-500/12 text-emerald-600" : "bg-brand-500/12 text-brand-500",
        )}
      >
        <Icons.clock className="size-5" />
      </span>

      <div className="min-w-[8rem] flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {finished ? "Day complete" : checkedIn ? "Currently working" : "Ready to start"}
        </p>
        <p className="mt-0.5 text-sm font-medium text-ink">{statusLine}</p>
      </div>

      <div className="flex flex-none items-center gap-2">
        <Button
          onClick={() => act(false)}
          loading={pending}
          variant={checkedIn ? "secondary" : "primary"}
          disabled={finished}
        >
          {finished ? "Checked out" : checkedIn ? "Check out" : "Check in"}
        </Button>
        {!checkedIn && !finished ? (
          <Button variant="ghost" onClick={() => act(true)} disabled={pending}>
            Remote
          </Button>
        ) : null}
      </div>
    </div>
  );
}
