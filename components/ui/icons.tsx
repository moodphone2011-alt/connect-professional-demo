import type { SVGProps } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * A single inline icon set. Bundled with the app so nothing is fetched at
 * runtime, and drawn on one grid so weights stay consistent across the product.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      // The default size is merged, never replaced: an icon given only
      // positioning classes must still come out icon-sized.
      className={cn("size-[1.15em]", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export const Icons = {
  dashboard: (props: IconProps) => (
    <Icon {...props}>
      <path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z" />
    </Icon>
  ),
  sparkles: (props: IconProps) => (
    <Icon {...props}>
      <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M18 15l.9 2.2L21 18l-2.1.8L18 21l-.9-2.2L15 18l2.1-.8z" />
    </Icon>
  ),
  clock: (props: IconProps) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </Icon>
  ),
  calendar: (props: IconProps) => (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </Icon>
  ),
  check: (props: IconProps) => (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  ),
  checkCircle: (props: IconProps) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.4 2.4 4.6-4.9" />
    </Icon>
  ),
  leave: (props: IconProps) => (
    <Icon {...props}>
      <path d="M4 20V9.5L12 4l8 5.5V20" />
      <path d="M9.5 20v-5h5v5" />
    </Icon>
  ),
  chart: (props: IconProps) => (
    <Icon {...props}>
      <path d="M4 19.5h16" />
      <path d="M7 16V9M12 16V5.5M17 16v-4" />
    </Icon>
  ),
  report: (props: IconProps) => (
    <Icon {...props}>
      <path d="M6.5 3.5h7L18.5 8v12.5h-12z" />
      <path d="M13.5 3.5V8h5M9.5 13h5M9.5 16.5h5" />
    </Icon>
  ),
  book: (props: IconProps) => (
    <Icon {...props}>
      <path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" />
      <path d="M17 7.5h2V20H8" />
    </Icon>
  ),
  users: (props: IconProps) => (
    <Icon {...props}>
      <circle cx="9.5" cy="8.5" r="3.2" />
      <path d="M3.8 19.5c.6-3.1 2.9-5 5.7-5s5.1 1.9 5.7 5" />
      <path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.9c2 .6 3.4 2.2 3.8 4.6" />
    </Icon>
  ),
  settings: (props: IconProps) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.5a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1A2 2 0 1 1 7.1 3.7l.1.1a1.7 1.7 0 0 0 2.9-1.2V2.4a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z" />
    </Icon>
  ),
  bell: (props: IconProps) => (
    <Icon {...props}>
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5z" />
      <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
    </Icon>
  ),
  activity: (props: IconProps) => (
    <Icon {...props}>
      <path d="M3.5 12.5h4l2.5-6 4 12 2.5-6h4" />
    </Icon>
  ),
  search: (props: IconProps) => (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </Icon>
  ),
  plus: (props: IconProps) => (
    <Icon {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Icon>
  ),
  logout: (props: IconProps) => (
    <Icon {...props}>
      <path d="M14.5 8V5.5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V16" />
      <path d="M9.5 12h11M17.5 8.5l3 3.5-3 3.5" />
    </Icon>
  ),
  menu: (props: IconProps) => (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  ),
  close: (props: IconProps) => (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  ),
  chevronRight: (props: IconProps) => (
    <Icon {...props}>
      <path d="M9.5 5.5l6.5 6.5-6.5 6.5" />
    </Icon>
  ),
  chevronLeft: (props: IconProps) => (
    <Icon {...props}>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </Icon>
  ),
  arrowRight: (props: IconProps) => (
    <Icon {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Icon>
  ),
  sun: (props: IconProps) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </Icon>
  ),
  moon: (props: IconProps) => (
    <Icon {...props}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2z" />
    </Icon>
  ),
  trash: (props: IconProps) => (
    <Icon {...props}>
      <path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.5 6.5l.9 12a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12" />
    </Icon>
  ),
  refresh: (props: IconProps) => (
    <Icon {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </Icon>
  ),
  download: (props: IconProps) => (
    <Icon {...props}>
      <path d="M12 4v10M8 10.5l4 4 4-4M4.5 19.5h15" />
    </Icon>
  ),
  send: (props: IconProps) => (
    <Icon {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Icon>
  ),
  warning: (props: IconProps) => (
    <Icon {...props}>
      <path d="M12 4.5l8.5 15h-17z" />
      <path d="M12 10v4M12 17v.5" />
    </Icon>
  ),
  location: (props: IconProps) => (
    <Icon {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  ),
  mail: (props: IconProps) => (
    <Icon {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M4 7.5l8 5.5 8-5.5" />
    </Icon>
  ),
  phone: (props: IconProps) => (
    <Icon {...props}>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
    </Icon>
  ),
};

export type IconName = keyof typeof Icons;
