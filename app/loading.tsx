import { BrandMark } from "@/components/layout/brand";

export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="flex flex-col items-center gap-4">
        <BrandMark className="size-11 animate-pulse text-lg" />
        <p className="text-sm font-medium text-muted">Loading…</p>
      </div>
    </div>
  );
}
