import type { IconName } from "@/components/ui/icons";
import type { Permission } from "@/lib/hooks/use-auth";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Only shown when the signed-in role holds this permission. */
  permission?: Permission;
  badge?: "ai";
  /** Included in the five-item mobile tab bar. */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "dashboard", primary: true },
  { href: "/assistant", label: "Connect AI", icon: "sparkles", badge: "ai", primary: true },
  { href: "/attendance", label: "Attendance", icon: "clock", primary: true },
  { href: "/leave", label: "Leave", icon: "leave", primary: true },
  { href: "/tasks", label: "Tasks", icon: "checkCircle", primary: true },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/knowledge", label: "Company knowledge", icon: "book" },
  { href: "/reports", label: "Reports", icon: "report" },
  { href: "/team", label: "Team", icon: "users", permission: "view_directory" },
  { href: "/analytics", label: "Team analytics", icon: "chart", permission: "view_analytics" },
  { href: "/activity", label: "Activity log", icon: "activity", permission: "view_audit_trail" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

/** Human-readable title for a pathname, used by the header and breadcrumbs. */
export function titleForPath(pathname: string): string {
  const match = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (match) return match.label;
  if (pathname.startsWith("/notifications")) return "Notifications";
  return "CONNECT";
}
