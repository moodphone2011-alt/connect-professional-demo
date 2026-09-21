# CONNECT — Employee Experience Portal

**Professional demo build.** CONNECT brings attendance, leave, tasks, the company handbook and
team insight into one workspace, with an assistant that answers from the employee's own data.

This build runs **entirely in the browser**. There is no Firebase, no n8n, no Supabase, no external
API, no webhook, no database and no environment variable. Clone it, install, run — everything
works, offline included.

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # production build
```

Deploying to Vercel needs no configuration: import the repository, accept the detected Next.js
preset, deploy. No environment variables to set.

---

## Demo accounts

Password for every identity: **`connect2026`**

| Identity | Role | Sees |
| --- | --- | --- |
| `noor.alrashdi@connect.example` | Employee — HR Specialist | Their own attendance, leave, tasks, calendar, handbook and assistant |
| `ahmed.albalushi@connect.example` | Manager — People Manager | The above, plus leave approvals, the team directory and team analytics |
| `layla.alzadjali@connect.example` | Administrator — Workspace Administrator | Company-wide visibility plus the activity log / audit trail |

The sign-in screen lists all three with a one-click **Sign in** button, so nothing has to be typed
during a demo. Role-based UI is enforced everywhere: navigation hides what a role cannot use, and
navigating directly to a gated route redirects to the dashboard.

## What you can do (all of it works — nothing is a mock-up)

- **Check in and out.** Writes a real attendance record; the weekly chart, history table and team
  analytics all update from it.
- **Request leave** with validation, save a draft, submit or withdraw it. As a manager, **approve
  or decline** with a decision note — the balance is drawn down, the employee is notified and the
  activity log records it.
- **Create, edit, assign, start, complete and delete tasks** on a three-column board with search,
  status filters and an overdue view.
- **Add and remove calendar events** across a full month grid with a day detail panel.
- **Search the handbook** in full text and read any policy.
- **Generate daily, weekly and monthly reports** assembled from live data.
- **Ask Connect AI** — in English or Arabic — about your tasks, leave balance, attendance, calendar
  or a policy. Answers are computed locally from the current state of your workspace, so completing
  a task changes the next answer.
- **Global search** (⌘K / Ctrl-K) across tasks, people, policies and leave.
- **Notifications** with an unread count, a notification centre, mark-read and dismiss.
- **Activity log** (administrators) recording every state change with actor, action and timestamp.
- **Light and dark themes**, remembered per browser.

Everything you change persists in `localStorage` and survives a refresh. **Settings → Demo tools**
has **Reset demo data**, which restores the original seeded workspace, and identity switching so
you can compare the three roles without signing out.

## Architecture

```
app/
  (portal)/            Signed-in screens, guarded by a client-side session check
    dashboard  attendance  leave  tasks  calendar  knowledge  reports
    team  analytics  activity  assistant  notifications  settings
  login/               Credential form + one-click demo identities
  error.tsx  not-found.tsx  loading.tsx
components/
  ui/                  The design system: Button, Input, Select, Textarea, Toggle, Card,
                       StatsCard, Modal, ConfirmDialog, Badge/StatusBadge, Tabs, DataTable,
                       EmptyState, ErrorState, Skeleton, Toast, Avatar, PageHeader, Icons
  charts/              Bar, area, donut and progress charts — hand-drawn SVG, no chart library
  layout/              App shell: sidebar, top bar, notification menu, profile menu,
                       mobile tab bar, global search
  portal/              Cross-screen feature components (check-in widget)
lib/
  demo/                types.ts · seed.ts · store.ts · auth.ts · assistant.ts
  repositories/        employees · attendance · leave · tasks · events · knowledge ·
                       notifications · activity · analytics · preferences
  hooks/               use-auth · use-demo-data · use-theme
  utils/               date · format · cn
```

**The data layer is the point.** No screen touches storage. Every screen calls a repository:

```ts
leaveRepository.decide(id, "approved", reviewer, note);
tasksRepository.setStatus(id, "completed", actor);
attendanceRepository.checkIn(employeeId, name);
```

Repositories are the seam. Today they are backed by `lib/demo/store.ts` — an in-memory snapshot
persisted to `localStorage`, with a subscription so every open screen re-renders on a change.
Pointing CONNECT at a real backend means reimplementing those same methods against an API; no
component, screen or type has to change.

Writes are composed, not scattered: approving leave adjusts the balance, appends an audit entry and
pushes a notification in a single atomic mutation.

### Demo data

`lib/demo/seed.ts` generates a complete, self-consistent workspace anchored on *today*, so the demo
never looks stale: ten employees across five departments, 60 days of attendance history with
per-person punctuality profiles, 27 tasks across every status, leave requests in draft, pending,
approved and rejected states, a month of calendar entries, eight handbook documents, notifications
and an activity trail. Names, roles and figures are realistic for the target market — no
`Test User`, no `Lorem ipsum`.

### The assistant

`lib/demo/assistant.ts` replaces what used to be an external automation webhook. It matches intent
(tasks, leave, attendance, schedule, policy, team, help) in English and Arabic, then answers by
reading the live repositories. No key, no network call, no service to configure.

## Verification

| Check | Result |
| --- | --- |
| `npm run build` | passes — 16 static routes |
| `npm run lint` | clean, no warnings |
| `npx tsc --noEmit` | clean, `strict: true`, no `any` |
| External network requests at runtime | **none** (verified in a browser with request interception) |
| Horizontal overflow at 390 / 430 / 768 / 1024 / 1440 px | none |
| Console errors across every route | none |

## Notes for a production deployment

The demo layer is deliberately not production auth: sign-in resolves a local identity and stores
the selection in `localStorage`. Before real HR data goes anywhere near this, replace
`lib/demo/auth.ts` with a real identity provider, derive the employee server-side rather than from
the browser, and implement the repository interfaces against a real API with authorisation checked
on the server. The UI and its permission model are already built around exactly that shape.
