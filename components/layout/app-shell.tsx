"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useAuth, useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDatabase } from "@/lib/hooks/use-demo-data";
import { useTheme } from "@/lib/hooks/use-theme";
import { NAV_ITEMS, titleForPath, type NavItem } from "@/lib/navigation";
import { notificationsRepository, ROLE_LABELS } from "@/lib/repositories";
import { formatRelative } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { BrandLockup, DemoBadge } from "./brand";
import { GlobalSearch } from "./global-search";

function useVisibleNav(): NavItem[] {
  const { can } = useAuth();
  return NAV_ITEMS.filter((item) => !item.permission || can(item.permission));
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const items = useVisibleNav();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close the mobile drawer whenever navigation happens.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[248px_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow-lifted"
      >
        Skip to content
      </a>

      <Sidebar items={items} pathname={pathname} className="hidden lg:flex" />

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50"
          />
          <Sidebar
            items={items}
            pathname={pathname}
            className="relative z-10 h-full w-[264px] animate-rise"
            onNavigate={() => setDrawerOpen(false)}
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <TopBar
          title={titleForPath(pathname)}
          onOpenNav={() => setDrawerOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main id="main" className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>

      <MobileTabBar items={items} pathname={pathname} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function Sidebar({
  items,
  pathname,
  className,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const employee = useCurrentEmployee();
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-dvh flex-col border-r border-sidebar-line bg-sidebar px-3 py-5",
        className,
      )}
    >
      <div className="px-2">
        <BrandLockup subtitle="Employee experience" />
      </div>

      <div className="mx-2 mt-6 rounded-xl border border-sidebar-line bg-white/[0.03] px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
          Workspace
        </p>
        <p className="mt-1 truncate text-xs text-sidebar-ink">CONNECT · Muscat</p>
      </div>

      <nav aria-label="Main" className="scroll-slim mt-5 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {items.map((item) => {
          const Icon = Icons[item.icon];
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 focus-ring",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-sidebar-muted hover:bg-white/[0.05] hover:text-sidebar-ink",
              )}
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-brand-400"
                />
              ) : null}
              <Icon className="size-[18px] flex-none" />
              <span className="truncate">{item.label}</span>
              {item.badge === "ai" ? (
                <span className="ml-auto rounded border border-brand-400/50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-brand-300">
                  AI
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-3 border-t border-sidebar-line pt-4">
        <DemoBadge className="mx-2" />
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <Avatar name={employee.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-ink">{employee.name}</p>
            <p className="truncate text-[10px] text-sidebar-muted">
              {ROLE_LABELS[employee.role]} · {employee.employeeNumber}
            </p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              signOut();
              router.push("/login");
            }}
            className="rounded-md p-1.5 text-sidebar-muted transition hover:bg-white/[0.06] hover:text-white focus-ring"
          >
            <Icons.logout className="size-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  title,
  onOpenNav,
  onOpenSearch,
}: {
  title: string;
  onOpenNav: () => void;
  onOpenSearch: () => void;
}) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <IconButton label="Open navigation" variant="ghost" onClick={onOpenNav} className="lg:hidden">
        <Icons.menu className="size-5" />
      </IconButton>

      <div className="min-w-0 flex-1">
        <p className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:block">
          CONNECT / {title}
        </p>
        <h1 className="truncate text-base font-semibold text-ink sm:text-lg">{title}</h1>
      </div>

      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-subtle px-3 text-xs text-muted transition hover:border-line-strong hover:text-ink focus-ring md:flex"
      >
        <Icons.search className="size-4" />
        <span>Search…</span>
        <kbd className="ml-2 rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[10px] text-muted">
          ⌘K
        </kbd>
      </button>

      <IconButton label="Search" variant="ghost" onClick={onOpenSearch} className="md:hidden">
        <Icons.search className="size-5" />
      </IconButton>

      <NotificationBell />

      <IconButton
        label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        variant="ghost"
        onClick={toggle}
      >
        {theme === "dark" ? <Icons.sun className="size-5" /> : <Icons.moon className="size-5" />}
      </IconButton>

      <ProfileMenu />
    </header>
  );
}

function NotificationBell() {
  const employee = useCurrentEmployee();
  const database = useDatabase();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = notificationsRepository.listFor(employee.id).slice(0, 6);
  const unread = notifications.filter((notification) => !notification.read).length;
  void database;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        variant="ghost"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Icons.bell className="size-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </IconButton>

      {open ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-11 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-card border border-line bg-surface shadow-lifted animate-rise"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => notificationsRepository.markAllRead(employee.id)}
                className="rounded text-xs font-medium text-brand-500 hover:underline focus-ring"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted">You are all caught up.</p>
          ) : (
            <ul className="scroll-slim max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-line/70 last:border-0">
                  <Link
                    href={notification.href ?? "/notifications"}
                    onClick={() => {
                      notificationsRepository.markRead(notification.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-subtle/70 focus-ring",
                      !notification.read && "bg-brand-500/[0.05]",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2 flex-none rounded-full",
                        notification.read ? "bg-line-strong" : "bg-brand-500",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-ink">
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted">
                        {formatRelative(notification.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-2.5 text-center text-xs font-medium text-brand-500 hover:bg-subtle focus-ring"
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ProfileMenu() {
  const employee = useCurrentEmployee();
  const { signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-subtle focus-ring"
      >
        <Avatar name={employee.name} size="sm" />
        <Icons.chevronRight className="hidden size-4 rotate-90 text-muted sm:block" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-card border border-line bg-surface shadow-lifted animate-rise"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <Avatar name={employee.name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{employee.name}</p>
              <p className="truncate text-xs text-muted">{employee.email}</p>
            </div>
          </div>
          <div className="px-4 py-2.5">
            <Badge tone="brand">{ROLE_LABELS[employee.role]}</Badge>
          </div>
          <div className="border-t border-line py-1">
            <MenuLink href="/settings" onClick={() => setOpen(false)}>
              <Icons.settings className="size-4" /> Account settings
            </MenuLink>
            <MenuLink href="/notifications" onClick={() => setOpen(false)}>
              <Icons.bell className="size-4" /> Notifications
            </MenuLink>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
                router.push("/login");
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-500/10 focus-ring dark:text-rose-400"
            >
              <Icons.logout className="size-4" /> Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition hover:bg-subtle focus-ring"
    >
      {children}
    </Link>
  );
}

function MobileTabBar({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const primary = items.filter((item) => item.primary).slice(0, 5);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      {primary.map((item) => {
        const Icon = Icons[item.icon];
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors focus-ring",
              active ? "text-brand-500" : "text-muted",
            )}
          >
            <Icon className="size-5" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
