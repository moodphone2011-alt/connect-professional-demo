"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BrandLockup, DemoBadge } from "@/components/layout/brand";
import { Avatar } from "@/components/ui/avatar";
import { Button, IconButton } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo/auth";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTheme } from "@/lib/hooks/use-theme";
import { ROLE_LABELS } from "@/lib/repositories";

const HIGHLIGHTS = [
  "Attendance, leave and tasks in one place",
  "Approvals and team signals for managers",
  "An assistant that answers from your own data",
];

export default function LoginPage() {
  const { employee, ready, signIn, impersonate } = useAuth();
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && employee) router.replace("/dashboard");
  }, [ready, employee, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextFieldErrors: typeof fieldErrors = {};
    if (!email.trim()) nextFieldErrors.email = "Enter your work email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      nextFieldErrors.email = "That does not look like a valid email address.";
    if (!password) nextFieldErrors.password = "Enter your password.";

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;

    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "We could not sign you in. Please try again.");
      return;
    }

    toast({ title: "Signed in", description: "Welcome back to CONNECT.", tone: "success" });
    router.replace("/dashboard");
  }

  function quickLogin(employeeId: string, name: string) {
    impersonate(employeeId);
    toast({ title: `Signed in as ${name}`, tone: "success" });
    router.replace("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Wrapped rather than positioned directly: the button keeps its own
          `relative` positioning, so the fixed placement lives on the wrapper. */}
      <div className="fixed right-4 top-4 z-20">
        <IconButton
          label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          variant="secondary"
          onClick={toggle}
        >
          {theme === "dark" ? <Icons.sun className="size-5" /> : <Icons.moon className="size-5" />}
        </IconButton>
      </div>

      {/* Brand panel — desktop only, so phones get straight to the form. */}
      <section className="relative hidden overflow-hidden bg-sidebar px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-40 size-[34rem] rounded-full bg-brand-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -right-24 size-[26rem] rounded-full bg-teal-accent/15 blur-3xl"
        />

        <div className="relative">
          <BrandLockup subtitle="Employee experience platform" />
        </div>

        <div className="relative max-w-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300">
            The workday, connected
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
            Everything your people need, in one calm workspace.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-muted">
            CONNECT replaces the scattered spreadsheets, group chats and paper forms that HR teams
            still run on — and gives managers evidence instead of guesswork.
          </p>
          <ul className="mt-7 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-sidebar-ink">
                <span className="grid size-6 flex-none place-items-center rounded-full bg-brand-500/20 text-brand-300">
                  <Icons.check className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-muted">
          Demo environment · all data is local to your browser
        </p>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <BrandLockup subtitle="Employee experience" tone="light" />
          </div>

          <div className="mt-8 lg:mt-0">
            <DemoBadge />
            <h1 className="mt-4 text-3xl font-semibold text-ink">Welcome back</h1>
            <p className="mt-2 text-sm text-muted">
              Sign in with a demo identity to explore the workspace.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
            <Input
              label="Work email"
              type="email"
              autoComplete="username"
              placeholder="name@connect.example"
              value={email}
              required
              error={fieldErrors.email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
                setError(null);
              }}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              required
              hint={`Demo password for every identity: ${DEMO_PASSWORD}`}
              error={fieldErrors.password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
                setError(null);
              }}
            />

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-300"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" fullWidth loading={submitting}>
              Sign in
            </Button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Demo accounts
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <ul className="mt-4 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.employeeId}>
                  <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-3 transition hover:border-brand-500/50">
                    <Avatar name={account.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{account.name}</p>
                      <p className="truncate text-xs text-muted">
                        {ROLE_LABELS[account.role]} · {account.jobTitle}
                      </p>
                      <p className="mt-1 hidden text-[11px] leading-relaxed text-muted sm:block">
                        {account.blurb}
                      </p>
                    </div>
                    <div className="flex flex-none flex-col gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickLogin(account.employeeId, account.name)}
                      >
                        Sign in
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEmail(account.email);
                          setPassword(DEMO_PASSWORD);
                          setError(null);
                          setFieldErrors({});
                        }}
                      >
                        Fill form
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">
              This is a demonstration build. Data is generated locally, stored in your browser, and
              can be reset from Settings. No external services are used.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
