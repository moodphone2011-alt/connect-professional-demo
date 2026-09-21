/** Small formatting helpers shared across the portal. */

export function percent(value: number): string {
  return `${Math.round(value)}%`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function truncate(value: string, max = 90): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

/** Deterministic avatar tint so a person keeps the same colour everywhere. */
export function avatarTone(seed: string): string {
  const tones = [
    "from-violet-500 to-indigo-500",
    "from-teal-500 to-cyan-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-sky-500 to-blue-500",
    "from-emerald-500 to-teal-500",
  ];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return tones[hash % tones.length];
}
