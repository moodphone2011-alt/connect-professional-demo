"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BrandMark } from "@/components/layout/brand";
import { useAuth } from "@/lib/hooks/use-auth";

/**
 * Guard for every signed-in screen. The session lives in the browser, so the
 * check runs on the client and shows a short splash rather than a flash of an
 * empty shell.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
  const { employee, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !employee) router.replace("/login");
  }, [ready, employee, router]);

  if (!ready || !employee) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandMark className="size-11 text-lg" />
          <p className="text-sm font-medium text-muted">
            {ready ? "Redirecting to sign in…" : "Loading your workspace…"}
          </p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
