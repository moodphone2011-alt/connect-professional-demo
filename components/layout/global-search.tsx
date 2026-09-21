"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Icons } from "@/components/ui/icons";
import { useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDatabase } from "@/lib/hooks/use-demo-data";
import {
  employeesRepository,
  knowledgeRepository,
  leaveRepository,
  tasksRepository,
} from "@/lib/repositories";
import { formatDate, formatDateRange } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

interface Result {
  id: string;
  group: string;
  title: string;
  detail: string;
  href: string;
}

/** Cross-cutting search over the data the signed-in person is allowed to see. */
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const employee = useCurrentEmployee();
  const database = useDatabase();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  // Clear the field each time the palette is opened.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }

  const results = useMemo<Result[]>(() => {
    // Reading the database here keeps results in step with live changes.
    void database;
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];

    const tasks = tasksRepository
      .listVisibleTo(employee)
      .filter(
        (task) =>
          task.title.toLowerCase().includes(needle) ||
          task.description.toLowerCase().includes(needle) ||
          task.category.toLowerCase().includes(needle),
      )
      .slice(0, 4)
      .map<Result>((task) => ({
        id: task.id,
        group: "Tasks",
        title: task.title,
        detail: `${task.category} · due ${formatDate(task.dueDate)}`,
        href: `/tasks?focus=${task.id}`,
      }));

    const docs = knowledgeRepository
      .search(needle)
      .slice(0, 4)
      .map<Result>((doc) => ({
        id: doc.id,
        group: "Company knowledge",
        title: doc.title,
        detail: doc.category,
        href: `/knowledge?doc=${doc.id}`,
      }));

    const people = employeesRepository
      .listVisibleTo(employee)
      .filter(
        (person) =>
          person.name.toLowerCase().includes(needle) ||
          person.jobTitle.toLowerCase().includes(needle) ||
          person.department.toLowerCase().includes(needle),
      )
      .slice(0, 4)
      .map<Result>((person) => ({
        id: person.id,
        group: "People",
        title: person.name,
        detail: `${person.jobTitle} · ${person.department}`,
        href: employee.role === "employee" ? "/settings" : `/team?person=${person.id}`,
      }));

    const leave = leaveRepository
      .listVisibleTo(employee)
      .filter((request) => request.reason.toLowerCase().includes(needle) || request.type.includes(needle))
      .slice(0, 3)
      .map<Result>((request) => ({
        id: request.id,
        group: "Leave",
        title: `${request.type} leave — ${formatDateRange(request.startDate, request.endDate)}`,
        detail: request.reason,
        href: `/leave?focus=${request.id}`,
      }));

    return [...tasks, ...people, ...docs, ...leave];
  }, [query, employee, database]);

  function go(result: Result) {
    onClose();
    router.push(result.href);
  }

  return (
    <Modal open={open} onClose={onClose} title="Search CONNECT" size="lg">
      <div className="space-y-4">
        <div className="relative">
          <Icons.search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((index) => Math.min(index + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter" && results[active]) {
                event.preventDefault();
                go(results[active]);
              }
            }}
            placeholder="Search tasks, people, policies and leave…"
            aria-label="Search CONNECT"
            className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-muted/70 focus-ring"
          />
        </div>

        {query.trim().length < 2 ? (
          <p className="px-1 py-6 text-center text-xs text-muted">
            Type at least two characters. Search covers your tasks, the people directory,
            company policies and leave requests.
          </p>
        ) : results.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted">
            No matches for “{query.trim()}”. Try a different word.
          </p>
        ) : (
          <ul className="space-y-1">
            {results.map((result, index) => (
              <li key={`${result.group}-${result.id}`}>
                <button
                  type="button"
                  onClick={() => go(result)}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-ring",
                    index === active ? "bg-subtle" : "hover:bg-subtle/70",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {result.title}
                    </span>
                    <span className="block truncate text-xs text-muted">{result.detail}</span>
                  </span>
                  <span className="flex-none rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted ring-1 ring-line">
                    {result.group}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
