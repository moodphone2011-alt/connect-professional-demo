"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export interface Column<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: Row) => string | number;
  align?: "left" | "right";
  /** Hidden on small screens, where the card layout takes over. */
  hideBelow?: "sm" | "md" | "lg";
}

interface DataTableProps<Row> {
  rows: Row[];
  columns: Column<Row>[];
  getRowKey: (row: Row) => string;
  caption: string;
  pageSize?: number;
  empty?: ReactNode;
  /** Card body used instead of the table on narrow screens. */
  renderMobileCard?: (row: Row) => ReactNode;
  onRowClick?: (row: Row) => void;
}

const HIDE_CLASS: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export function DataTable<Row>({
  rows,
  columns,
  getRowKey,
  caption,
  pageSize = 8,
  empty,
  renderMobileCard,
  onRowClick,
}: DataTableProps<Row>) {
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  // Any change to the underlying rows (a filter, a new record) resets paging.
  // Adjusting during render rather than in an effect avoids a wasted pass.
  const [lastRowCount, setLastRowCount] = useState(rows.length);
  if (lastRowCount !== rows.length) {
    setLastRowCount(rows.length);
    setPage(0);
  }

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((entry) => entry.key === sort.key);
    if (!column?.sortValue) return rows;

    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      const comparison =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [rows, columns, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  if (!rows.length) {
    return <>{empty}</>;
  }

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  return (
    <div className="space-y-3">
      {/* Table on tablet and up. */}
      <div className={cn("scroll-slim overflow-x-auto", renderMobileCard && "hidden sm:block")}>
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {columns.map((column) => {
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      active ? (sort!.direction === "asc" ? "ascending" : "descending") : "none"
                    }
                    className={cn(
                      "bg-subtle/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted first:rounded-tl-lg last:rounded-tr-lg",
                      column.align === "right" && "text-right",
                      column.hideBelow && HIDE_CLASS[column.hideBelow],
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded transition-colors hover:text-ink focus-ring",
                          active && "text-ink",
                        )}
                      >
                        {column.header}
                        <svg
                          aria-hidden
                          viewBox="0 0 12 12"
                          className={cn("size-3 transition-opacity", active ? "opacity-100" : "opacity-40")}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          {active && sort!.direction === "desc" ? (
                            <path d="M3 5l3 3 3-3" strokeLinecap="round" />
                          ) : (
                            <path d="M3 7l3-3 3 3" strokeLinecap="round" />
                          )}
                        </svg>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-line/70 text-sm text-ink-soft last:border-0",
                  onRowClick && "cursor-pointer transition-colors hover:bg-subtle/70",
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3 align-middle",
                      column.align === "right" && "text-right",
                      column.hideBelow && HIDE_CLASS[column.hideBelow],
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards on phones — a shrunken table is not a mobile experience. */}
      {renderMobileCard ? (
        <ul className="space-y-2.5 sm:hidden">
          {visible.map((row) => (
            <li
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className="rounded-card border border-line bg-surface p-4"
            >
              {renderMobileCard(row)}
            </li>
          ))}
        </ul>
      ) : null}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted">
            Showing{" "}
            <span className="font-medium text-ink-soft tabular-nums">
              {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, sorted.length)}
            </span>{" "}
            of <span className="font-medium text-ink-soft tabular-nums">{sorted.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-xs text-muted tabular-nums">
              {currentPage + 1} / {pageCount}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
              disabled={currentPage >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
