"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Select, Toggle } from "@/components/ui/field";
import { Icons } from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { DEMO_ACCOUNTS } from "@/lib/demo/auth";
import { resetDatabase } from "@/lib/demo/store";
import type { WorkspacePreferences } from "@/lib/demo/types";
import { useAuth, useCurrentEmployee } from "@/lib/hooks/use-auth";
import { useDatabase } from "@/lib/hooks/use-demo-data";
import { useTheme } from "@/lib/hooks/use-theme";
import { employeesRepository, preferencesRepository, ROLE_LABELS } from "@/lib/repositories";
import { formatDate } from "@/lib/utils/date";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export default function SettingsPage() {
  const employee = useCurrentEmployee();
  const { impersonate } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const database = useDatabase();

  const preferences = preferencesRepository.get(employee.id);
  void database;

  const [name, setName] = useState(employee.name);
  const [phone, setPhone] = useState(employee.phone);
  const [location, setLocation] = useState(employee.location);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const dirty =
    name !== employee.name || phone !== employee.phone || location !== employee.location;

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "Enter your full name.";
    if (phone.trim().length < 6) next.phone = "Enter a contact number.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSavingProfile(true);
    try {
      await employeesRepository.update(
        employee.id,
        { name: name.trim(), phone: phone.trim(), location: location.trim() },
        employee.id,
      );
      toast({ title: "Profile updated", description: "Your details are saved.", tone: "success" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function setPreference(key: keyof WorkspacePreferences, value: boolean | string) {
    await preferencesRepository.update(employee.id, { [key]: value } as Partial<WorkspacePreferences>);
    toast({ title: "Preference saved", tone: "success" });
  }

  function resetDemo() {
    setResetting(true);
    resetDatabase();
    setResetting(false);
    setResetOpen(false);
    toast({
      title: "Demo data reset",
      description: "Every record is back to its original state.",
      tone: "success",
    });
    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Your profile, how the portal notifies you, and the tools for running this demo."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Profile" subtitle="Visible to your manager and People & Culture" />

          <div className="mt-5 flex flex-wrap items-center gap-4 border-b border-line pb-5">
            <Avatar name={employee.name} size="xl" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-ink">{employee.name}</p>
              <p className="text-sm text-muted">
                {employee.jobTitle} · {employee.department}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="brand">{ROLE_LABELS[employee.role]}</Badge>
                <Badge tone="neutral">{employee.employeeNumber}</Badge>
                <Badge tone="neutral">Joined {formatDate(employee.joinedOn, true)}</Badge>
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile} noValidate className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                required
                value={name}
                error={errors.name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: "" }));
                }}
              />
              <Input
                label="Work email"
                value={employee.email}
                disabled
                hint="Email is managed by your administrator."
              />
              <Input
                label="Phone"
                required
                value={phone}
                error={errors.phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setErrors((current) => ({ ...current, phone: "" }));
                }}
              />
              <Input
                label="Location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                disabled={!dirty || savingProfile}
                onClick={() => {
                  setName(employee.name);
                  setPhone(employee.phone);
                  setLocation(employee.location);
                  setErrors({});
                }}
              >
                Discard
              </Button>
              <Button type="submit" loading={savingProfile} disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Appearance" subtitle="Applies to this browser" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={theme === option.value}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition focus-ring ${
                    theme === option.value
                      ? "border-brand-500 bg-brand-500/[0.06] text-ink"
                      : "border-line text-muted hover:border-line-strong"
                  }`}
                >
                  {option.value === "light" ? (
                    <Icons.sun className="size-5" />
                  ) : (
                    <Icons.moon className="size-5" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Notifications" subtitle="What reaches you, and how" />
            <div className="mt-2 divide-y divide-line">
              <Toggle
                label="Email notifications"
                description="Approvals, assignments and decisions."
                checked={preferences.emailNotifications}
                onChange={(value) => setPreference("emailNotifications", value)}
              />
              <Toggle
                label="Weekly digest"
                description="A Thursday summary of your week."
                checked={preferences.weeklyDigest}
                onChange={(value) => setPreference("weeklyDigest", value)}
              />
              <Toggle
                label="Desktop alerts"
                description="Show alerts while the portal is open."
                checked={preferences.desktopAlerts}
                onChange={(value) => setPreference("desktopAlerts", value)}
              />
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <Select
                label="Interface language"
                value={preferences.language}
                hint="The assistant already answers in both languages."
                options={[
                  { value: "en", label: "English" },
                  { value: "ar", label: "العربية (preview)" },
                ]}
                onChange={(event) => setPreference("language", event.target.value)}
              />
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Demo tools"
          subtitle="This build runs entirely in your browser — no backend, no accounts, no keys"
          action={<Badge tone="brand">Demo mode</Badge>}
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="min-w-0 rounded-xl border border-line bg-subtle/50 p-4">
            <h3 className="text-sm font-semibold text-ink">Switch identity</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Every role sees a different portal. Switch to compare what an employee, a manager and
              an administrator can each do.
            </p>
            <ul className="mt-3.5 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li
                  key={account.employeeId}
                  className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2.5"
                >
                  <Avatar name={account.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{account.name}</p>
                    <p className="truncate text-[11px] text-muted">
                      {ROLE_LABELS[account.role]} · {account.jobTitle}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={account.employeeId === employee.id ? "subtle" : "secondary"}
                    disabled={account.employeeId === employee.id}
                    onClick={() => {
                      impersonate(account.employeeId);
                      toast({ title: `Now signed in as ${account.name}`, tone: "success" });
                      router.push("/dashboard");
                    }}
                  >
                    {account.employeeId === employee.id ? "Current" : "Switch"}
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex min-w-0 flex-col rounded-xl border border-line bg-subtle/50 p-4">
            <h3 className="text-sm font-semibold text-ink">Reset demo data</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">
              Everything you change — check-ins, tasks, leave decisions, notifications — is saved in
              this browser and survives a refresh. Resetting restores the original seeded workspace
              so the next demo starts clean.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="danger"
                icon={<Icons.refresh className="size-4" />}
                onClick={() => setResetOpen(true)}
              >
                Reset demo data
              </Button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3.5 text-xs">
              <div>
                <dt className="text-muted">Storage</dt>
                <dd className="font-medium text-ink">Browser localStorage</dd>
              </div>
              <div>
                <dt className="text-muted">External services</dt>
                <dd className="font-medium text-ink">None</dd>
              </div>
            </dl>
          </section>
        </div>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={resetDemo}
        loading={resetting}
        title="Reset all demo data?"
        message="Every change made in this browser will be discarded and the original demo workspace restored. You will stay signed in."
        confirmLabel="Reset demo data"
      />
    </div>
  );
}
