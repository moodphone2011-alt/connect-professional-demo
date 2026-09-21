"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/layout/brand";
import { useAuth } from "@/lib/hooks/use-auth";

/** Entry point: sends the visitor to their workspace, or to sign-in. */
export default function RootPage() {
  const { employee, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(employee ? "/dashboard" : "/login");
  }, [ready, employee, router]);

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandMark className="size-11 text-lg" />
        <p className="text-sm font-medium text-muted">Opening your CONNECT workspace…</p>
      </div>
    </div>
  );
}
