"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, LeaveStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatsCard } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Icons } from "@/components/ui/icons";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton, StatsSkeleton, TableSkeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ProgressBar } from "@/components/charts/charts";
import type { LeaveRequest, LeaveType } from "@/lib/demo/types";
import { useAuth, useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import {
  employeesRepository,
  leaveRepository,
  LEAVE_TYPE_LABELS,
} from "@/lib/repositories";
import { daysBetween, formatDate, formatDateRange, toISODate } from "@/lib/utils/date";

type Scope = "mine" | "team";
type StatusFilter = "all" | "pending" | "approved" | "rejected" | "draft";

const TYPE_OPTIONS = (Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((value) => ({
  value,
  label: LEAVE_TYPE_LABELS[value],
}));

export default function LeavePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <LeaveView />
    </Suspense>
  );
}

function LeaveView() {
  const employee = useCurrentEmployee();
  const { can } = useAuth();
  const { toast } = useToast();
  const params = useSearchParams();
  const focusId = params.get("focus");

  const [scope, setScope] = useState<Scope>(can("approve_leave") ? "team" : "mine");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [decision, setDecision] = useState<{ request: LeaveRequest; approve: boolean } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const { data, loading } = useDemoQuery(() => {
    const mine = leaveRepository.listFor(employee.id);
    const team = can("approve_leave") ? leaveRepository.listVisibleTo(employee) : mine;
    const source = scope === "mine" ? mine : team;

    return {
      balance: leaveRepository.balanceFor(employee.id),
      approvals: leaveRepository.listPendingApprovals(employee),
      rows: source.filter((request) => (status === "all" ? true : request.status === status)),
      counts: {
        all: source.length,
        pending: source.filter((request) => request.status === "pending").length,
        approved: source.filter((request) => request.status === "approved").length,
        rejected: source.filter((request) => request.status === "rejected").length,
        draft: source.filter((request) => request.status === "draft").length,
      },
    };
  }, [employee.id, scope, status, can("approve_leave")]);

  const focused = useMemo(
    () => (focusId ? leaveRepository.getById(focusId) : undefined),
    [focusId],
  );

  async function decide() {
    if (!decision) return;
    setBusy(true);
    try {
      await leaveRepository.decide(
        decision.request.id,
        decision.approve ? "approved" : "rejected",
        employee,
        note,
      );
      toast({
        title: decision.approve ? "Leave approved" : "Leave declined",
        description: `${formatDateRange(decision.request.startDate, decision.request.endDate)} · the employee has been notified.`,
        tone: decision.approve ? "success" : "info",
      });
      setDecision(null);
      setNote("");
    } catch (error) {
      toast({
        title: "That decision did not save",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function cancelRequest() {
    if (!cancelTarget) return;
    setBusy(true);
    await leaveRepository.cancel(cancelTarget.id, employee.id);
    toast({ title: "Request withdrawn", tone: "info" });
    setCancelTarget(null);
    setBusy(false);
  }

  const columns: Column<LeaveRequest>[] = [
    ...(scope === "team"
      ? [
          {
            key: "employee",
            header: "Employee",
            sortValue: (row: LeaveRequest) =>
              employeesRepository.getById(row.employeeId)?.name ?? "",
            render: (row: LeaveRequest) => {
              const person = employeesRepository.getById(row.employeeId);
              return (
                <span className="flex items-center gap-2.5">
                  <Avatar name={person?.name ?? "Employee"} size="xs" />
                  <span className="truncate font-medium text-ink">{person?.name ?? "Employee"}</span>
                </span>
              );
            },
          } satisfies Column<LeaveRequest>,
        ]
      : []),
    {
      key: "type",
      header: "Type",
      sortValue: (row) => row.type,
      render: (row) => <Badge tone="neutral">{LEAVE_TYPE_LABELS[row.type]}</Badge>,
    },
    {
      key: "dates",
      header: "Dates",
      sortValue: (row) => row.startDate,
      render: (row) => (
        <span className="whitespace-nowrap text-ink-soft">
          {formatDateRange(row.startDate, row.endDate)}
        </span>
      ),
    },
    {
      key: "days",
      header: "Days",
      align: "right",
      sortValue: (row) => row.days,
      render: (row) => <span className="tabular-nums">{row.days}</span>,
      hideBelow: "md",
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      render: (row) => <LeaveStatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => <RowActions row={row} />,
    },
  ];

  function RowActions({ row }: { row: LeaveRequest }) {
    const isOwn = row.employeeId === employee.id;
    const canDecide = can("approve_leave") && !isOwn && row.status === "pending";

    if (canDecide) {
      return (
        <span className="flex justify-end gap-1.5">
          <Button size="sm" onClick={() => setDecision({ request: row, approve: true })}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDecision({ request: row, approve: false })}
          >
            Decline
          </Button>
        </span>
      );
    }

    if (isOwn && row.status === "draft") {
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await leaveRepository.submitDraft(row.id, employee.id, employee.name);
            toast({ title: "Draft submitted", description: "Your manager has been notified.", tone: "success" });
          }}
        >
          Submit
        </Button>
      );
    }

    if (isOwn && row.status === "pending") {
      return (
        <Button size="sm" variant="ghost" onClick={() => setCancelTarget(row)}>
          Withdraw
        </Button>
      );
    }

    return <span className="text-xs text-muted">{row.decisionNote ? "Reviewed" : "—"}</span>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Time away"
        title="Leave"
        description="Request time away, follow every decision, and — if you approve — clear your team's queue."
        actions={
          <Button icon={<Icons.plus className="size-4" />} onClick={() => setFormOpen(true)}>
            New request
          </Button>
        }
      />

      {focused ? (
        <Card tone="accent">
          <CardHeader
            title={`${LEAVE_TYPE_LABELS[focused.type]} · ${formatDateRange(focused.startDate, focused.endDate)}`}
            subtitle={
              employeesRepository.getById(focused.employeeId)?.name ?? "Employee"
            }
            action={<LeaveStatusBadge status={focused.status} />}
          />
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{focused.reason}</p>
          {focused.decisionNote ? (
            <p className="mt-2 text-xs text-muted">Decision note: {focused.decisionNote}</p>
          ) : null}
        </Card>
      ) : null}

      {loading || !data ? (
        <StatsSkeleton />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="space-y-3">
            <p className="text-xs font-medium text-muted">Annual leave</p>
            <p className="text-2xl font-semibold text-ink tabular-nums">
              {data.balance.annualRemaining} days
            </p>
            <ProgressBar
              label="Annual leave used"
              value={data.balance.annualTotal - data.balance.annualRemaining}
              max={data.balance.annualTotal}
            />
            <p className="text-xs text-muted">
              {data.balance.annualTotal - data.balance.annualRemaining} of {data.balance.annualTotal}{" "}
              days used
            </p>
          </Card>
          <Card className="space-y-3">
            <p className="text-xs font-medium text-muted">Sick leave</p>
            <p className="text-2xl font-semibold text-ink tabular-nums">
              {data.balance.sickRemaining} days
            </p>
            <ProgressBar
              label="Sick leave used"
              tone="warning"
              value={data.balance.sickTotal - data.balance.sickRemaining}
              max={data.balance.sickTotal}
            />
            <p className="text-xs text-muted">
              {data.balance.sickTotal - data.balance.sickRemaining} of {data.balance.sickTotal} days
              used
            </p>
          </Card>
          <StatsCard
            label="Your pending requests"
            value={`${data.balance.pending}`}
            hint={data.balance.pending ? "Awaiting a decision" : "Nothing outstanding"}
            tone={data.balance.pending ? "warning" : "positive"}
            icon={<Icons.clock className="size-4" />}
          />
          <StatsCard
            label={can("approve_leave") ? "Awaiting your approval" : "Days taken this year"}
            value={
              can("approve_leave") ? `${data.approvals.length}` : `${data.balance.usedThisYear}`
            }
            hint={
              can("approve_leave")
                ? data.approvals.length
                  ? "From your team"
                  : "Queue is clear"
                : "Approved leave"
            }
            tone={can("approve_leave") && data.approvals.length ? "warning" : "neutral"}
            icon={<Icons.leave className="size-4" />}
          />
        </section>
      )}

      <Card padded={false}>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <CardHeader
            title={scope === "mine" ? "Your requests" : "Team requests"}
            subtitle="Every request, with its decision trail"
          />
          {can("approve_leave") ? (
            <Tabs
              label="Scope"
              value={scope}
              onChange={setScope}
              options={[
                { value: "team", label: "Team" },
                { value: "mine", label: "Mine" },
              ]}
            />
          ) : null}
        </div>

        <div className="border-t border-line px-5 py-4">
          {loading || !data ? (
            <TableSkeleton />
          ) : (
            <>
              <Tabs
                label="Request status"
                className="mb-4"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All", count: data.counts.all },
                  { value: "pending", label: "Pending", count: data.counts.pending },
                  { value: "approved", label: "Approved", count: data.counts.approved },
                  { value: "rejected", label: "Rejected", count: data.counts.rejected },
                  { value: "draft", label: "Drafts", count: data.counts.draft },
                ]}
              />
              <DataTable
                rows={data.rows}
                columns={columns}
                getRowKey={(row) => row.id}
                caption="Leave requests"
                pageSize={8}
                empty={
                  <EmptyState
                    title="No leave requests here"
                    description={
                      status === "all"
                        ? "When a request is submitted it will appear in this list with its full decision trail."
                        : "No requests with this status. Try another filter."
                    }
                    icon={<Icons.leave className="size-5" />}
                    action={
                      status === "all" ? (
                        <Button size="sm" onClick={() => setFormOpen(true)}>
                          New request
                        </Button>
                      ) : undefined
                    }
                  />
                }
                renderMobileCard={(row) => (
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {LEAVE_TYPE_LABELS[row.type]}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatDateRange(row.startDate, row.endDate)} · {row.days}{" "}
                          {row.days === 1 ? "day" : "days"}
                        </p>
                      </div>
                      <LeaveStatusBadge status={row.status} />
                    </div>
                    {scope === "team" ? (
                      <p className="text-xs text-muted">
                        {employeesRepository.getById(row.employeeId)?.name}
                      </p>
                    ) : null}
                    <div className="flex justify-end">
                      <RowActions row={row} />
                    </div>
                  </div>
                )}
              />
            </>
          )}
        </div>
      </Card>

      <NewLeaveModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(days) =>
          toast({
            title: "Leave request submitted",
            description: `${days} ${days === 1 ? "day" : "days"} sent to your manager for review.`,
            tone: "success",
          })
        }
      />

      <Modal
        open={Boolean(decision)}
        onClose={() => {
          setDecision(null);
          setNote("");
        }}
        title={decision?.approve ? "Approve leave request" : "Decline leave request"}
        description={
          decision
            ? `${employeesRepository.getById(decision.request.employeeId)?.name} · ${formatDateRange(decision.request.startDate, decision.request.endDate)}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDecision(null);
                setNote("");
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant={decision?.approve ? "primary" : "danger"}
              loading={busy}
              onClick={decide}
            >
              {decision?.approve ? "Approve request" : "Decline request"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {decision ? (
            <div className="rounded-lg border border-line bg-subtle/60 p-3 text-sm">
              <p className="font-medium text-ink">
                {decision.request.days} {decision.request.days === 1 ? "day" : "days"} ·{" "}
                {LEAVE_TYPE_LABELS[decision.request.type]}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{decision.request.reason}</p>
            </div>
          ) : null}
          <Textarea
            label="Decision note"
            hint="Shared with the employee alongside the decision."
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              decision?.approve
                ? "Approved — enjoy the break."
                : "Explain what would make this workable."
            }
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelRequest}
        loading={busy}
        title="Withdraw this request?"
        message={
          cancelTarget
            ? `This removes ${formatDateRange(cancelTarget.startDate, cancelTarget.endDate)} from your manager's queue. You can submit a new request at any time.`
            : ""
        }
        confirmLabel="Withdraw request"
      />
    </div>
  );
}

function NewLeaveModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (days: number) => void;
}) {
  const employee = useCurrentEmployee();
  const today = toISODate(new Date());

  const [type, setType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const days = startDate && endDate && endDate >= startDate ? daysBetween(startDate, endDate) : 0;

  function reset() {
    setType("annual");
    setStartDate("");
    setEndDate("");
    setReason("");
    setErrors({});
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!startDate) next.startDate = "Choose the first day of leave.";
    if (!endDate) next.endDate = "Choose the last day of leave.";
    if (startDate && endDate && endDate < startDate)
      next.endDate = "The end date cannot be before the start date.";
    if (reason.trim().length < 10)
      next.reason = "Add a short reason (at least 10 characters) so your manager can decide.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: FormEvent, asDraft = false) {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      await leaveRepository.create(
        { employeeId: employee.id, type, startDate, endDate, reason, status: asDraft ? "draft" : "pending" },
        employee.name,
      );
      onCreated(days);
      reset();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="New leave request"
      description="Requests go to your line manager and appear in their approval queue immediately."
      footer={
        <>
          <Button
            variant="ghost"
            onClick={(event) => submit(event, true)}
            disabled={busy}
          >
            Save as draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button form="leave-form" type="submit" loading={busy}>
            Submit request
          </Button>
        </>
      }
    >
      <form id="leave-form" onSubmit={(event) => submit(event)} noValidate className="space-y-4">
        <Select
          label="Leave type"
          required
          options={TYPE_OPTIONS}
          value={type}
          onChange={(event) => setType(event.target.value as LeaveType)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First day"
            type="date"
            required
            min={today}
            value={startDate}
            error={errors.startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setErrors((current) => ({ ...current, startDate: "" }));
            }}
          />
          <Input
            label="Last day"
            type="date"
            required
            min={startDate || today}
            value={endDate}
            error={errors.endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setErrors((current) => ({ ...current, endDate: "" }));
            }}
          />
        </div>

        {days > 0 ? (
          <p className="rounded-lg border border-line bg-subtle/60 px-3 py-2 text-xs text-ink-soft">
            {formatDate(startDate)} → {formatDate(endDate)} ·{" "}
            <span className="font-semibold">{days} {days === 1 ? "day" : "days"}</span>
          </p>
        ) : null}

        <Textarea
          label="Reason"
          required
          rows={3}
          value={reason}
          error={errors.reason}
          placeholder="A sentence is enough — it helps your manager plan cover."
          onChange={(event) => {
            setReason(event.target.value);
            setErrors((current) => ({ ...current, reason: "" }));
          }}
        />
      </form>
    </Modal>
  );
}
