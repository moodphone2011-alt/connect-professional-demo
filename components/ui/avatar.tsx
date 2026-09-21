import { cn } from "@/lib/utils/cn";
import { avatarTone } from "@/lib/utils/format";
import { initialsOf } from "@/lib/repositories/employees";

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

/**
 * Initials avatar with a deterministic gradient. There are no uploaded photos in
 * the demo, so the fallback *is* the avatar — and it stays stable per person.
 */
export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid flex-none place-items-center rounded-full bg-gradient-to-br font-semibold text-white",
        avatarTone(name),
        SIZES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export function AvatarGroup({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const remaining = names.length - shown.length;

  return (
    <div className="flex items-center -space-x-2" aria-label={`${names.length} attendees`}>
      {shown.map((name) => (
        <Avatar key={name} name={name} size="xs" className="ring-2 ring-surface" />
      ))}
      {remaining > 0 ? (
        <span className="grid size-6 place-items-center rounded-full bg-subtle text-[10px] font-semibold text-muted ring-2 ring-surface">
          +{remaining}
        </span>
      ) : null}
    </div>
  );
}
