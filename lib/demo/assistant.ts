/**
 * Connect AI — the local assistant engine.
 *
 * In earlier builds this was an HTTP call to an external automation webhook.
 * Here it is a local intent matcher that answers from the live demo database,
 * so the answers change as the user works: complete a task and the assistant's
 * next answer reflects it. Bilingual, English and Arabic.
 */

import {
  attendanceRepository,
  isOverdue,
  knowledgeRepository,
  leaveRepository,
  tasksRepository,
} from "@/lib/repositories";
import { analyticsRepository } from "@/lib/repositories/analytics";
import { eventsRepository } from "@/lib/repositories/events";
import type { Employee } from "./types";
import { formatDate, formatDateRange, formatHours, formatTime } from "@/lib/utils/date";

export interface AssistantReply {
  text: string;
  /** Optional follow-up prompts offered as chips under the answer. */
  followUps: string[];
}

type Intent =
  | "greeting"
  | "tasks"
  | "leave"
  | "attendance"
  | "schedule"
  | "policy"
  | "team"
  | "help"
  | "unknown";

const AR = /[؀-ۿ]/;

const INTENT_PATTERNS: Array<{ intent: Intent; patterns: RegExp[] }> = [
  { intent: "greeting", patterns: [/^(hi|hello|hey|salam|good (morning|afternoon))/i, /^(مرحبا|السلام|أهلا|هلا)/] },
  { intent: "tasks", patterns: [/task|todo|to-do|assignment|overdue|deadline/i, /مهام|مهمة|متأخر|تكليف/] },
  { intent: "leave", patterns: [/leave|holiday|vacation|time off|balance|absence/i, /إجاز|رصيد|عطل|غياب/] },
  { intent: "attendance", patterns: [/attendance|check ?in|check ?out|hours|late|present/i, /حضور|دوام|ساعات|تسجيل|انصراف|تأخير/] },
  { intent: "schedule", patterns: [/calendar|meeting|schedule|agenda|today|tomorrow|event/i, /اجتماع|جدول|موعد|تقويم|اليوم|غدا/] },
  { intent: "policy", patterns: [/polic|rule|handbook|remote|expense|security|conduct|onboarding|overtime/i, /سياس|لائح|قانون|عن ?بعد|مصاريف|أمن|سلوك/] },
  { intent: "team", patterns: [/team|report|analytic|approval|workload|headcount|performance/i, /فريق|تقرير|تحليل|موافق|أداء|عبء/] },
  { intent: "help", patterns: [/what can you|help|capabilit|how do i/i, /ماذا تستطيع|مساعد|كيف/] },
];

function detectIntent(message: string): Intent {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(message))) return intent;
  }
  return "unknown";
}

function taskAnswer(employee: Employee, arabic: boolean): AssistantReply {
  const tasks = tasksRepository.listFor(employee.id);
  const open = tasks.filter((task) => task.status !== "completed");
  const overdue = open.filter(isOverdue);

  if (!open.length) {
    return {
      text: arabic
        ? "لا توجد مهام مفتوحة لديك حاليًا. عمل ممتاز."
        : "You have no open tasks right now — everything assigned to you is complete.",
      followUps: arabic ? ["ما هو رصيد إجازتي؟"] : ["What is my leave balance?", "What is on my calendar?"],
    };
  }

  const lines = open
    .slice(0, 4)
    .map(
      (task) =>
        `• ${task.title} — ${isOverdue(task) ? (arabic ? "متأخرة" : "overdue") : `${arabic ? "تستحق" : "due"} ${formatDate(task.dueDate)}`}`,
    )
    .join("\n");

  return {
    text: arabic
      ? `لديك ${open.length} مهمة مفتوحة${overdue.length ? ` منها ${overdue.length} متأخرة` : ""}:\n${lines}${open.length > 4 ? `\n… و${open.length - 4} مهام أخرى في صفحة المهام.` : ""}`
      : `You have ${open.length} open ${open.length === 1 ? "task" : "tasks"}${overdue.length ? `, ${overdue.length} of them overdue` : ""}:\n${lines}${open.length > 4 ? `\n…and ${open.length - 4} more on the Tasks page.` : ""}`,
    followUps: arabic
      ? ["اعرض مهامي المتأخرة", "ما هو رصيد إجازتي؟"]
      : ["Which tasks are overdue?", "What is on my calendar today?"],
  };
}

function leaveAnswer(employee: Employee, arabic: boolean): AssistantReply {
  const balance = leaveRepository.balanceFor(employee.id);
  const requests = leaveRepository.listFor(employee.id);
  const pending = requests.filter((request) => request.status === "pending");
  const upcoming = requests
    .filter((request) => request.status === "approved" && request.startDate >= new Date().toISOString().slice(0, 10))
    .slice(0, 1)[0];

  const parts: string[] = [];
  parts.push(
    arabic
      ? `رصيد إجازتك السنوية ${balance.annualRemaining} يومًا من أصل ${balance.annualTotal}، والإجازة المرضية ${balance.sickRemaining} من ${balance.sickTotal}.`
      : `Your annual leave balance is ${balance.annualRemaining} of ${balance.annualTotal} days, and sick leave is ${balance.sickRemaining} of ${balance.sickTotal}.`,
  );
  if (pending.length) {
    parts.push(
      arabic
        ? `لديك ${pending.length} طلب قيد المراجعة (${formatDateRange(pending[0].startDate, pending[0].endDate)}).`
        : `You have ${pending.length} request${pending.length === 1 ? "" : "s"} awaiting approval (${formatDateRange(pending[0].startDate, pending[0].endDate)}).`,
    );
  }
  if (upcoming) {
    parts.push(
      arabic
        ? `أقرب إجازة معتمدة: ${formatDateRange(upcoming.startDate, upcoming.endDate)}.`
        : `Your next approved leave is ${formatDateRange(upcoming.startDate, upcoming.endDate)}.`,
    );
  }

  return {
    text: parts.join(" "),
    followUps: arabic
      ? ["كيف أقدم طلب إجازة؟", "ما هي سياسة الإجازات؟"]
      : ["How do I request leave?", "What does the annual leave policy say?"],
  };
}

function attendanceAnswer(employee: Employee, arabic: boolean): AssistantReply {
  const summary = attendanceRepository.summaryFor(employee.id);
  const today = summary.today;

  const status = today?.checkIn
    ? arabic
      ? `سجلت الحضور اليوم الساعة ${formatTime(today.checkIn)}${today.checkOut ? ` وانصرفت الساعة ${formatTime(today.checkOut)}` : " ولم تسجل الانصراف بعد"}.`
      : `You checked in today at ${formatTime(today.checkIn)}${today.checkOut ? ` and checked out at ${formatTime(today.checkOut)}` : " and have not checked out yet"}.`
    : arabic
      ? "لم تسجل الحضور اليوم بعد. يمكنك ذلك من صفحة الحضور أو من لوحة المعلومات."
      : "You have not checked in today yet — you can do that from the dashboard or the Attendance page.";

  return {
    text: `${status} ${
      arabic
        ? `مجموع ساعاتك هذا الأسبوع ${formatHours(summary.weekHours)}، ونسبة الالتزام بالمواعيد ${summary.onTimeRate}%.`
        : `You have logged ${formatHours(summary.weekHours)} this week, with a ${summary.onTimeRate}% on-time rate.`
    }`,
    followUps: arabic ? ["اعرض سجل الحضور", "ما هي ساعات العمل الرسمية؟"] : ["Show my attendance history", "What are the official working hours?"],
  };
}

function scheduleAnswer(employee: Employee, arabic: boolean): AssistantReply {
  const upcoming = eventsRepository.listUpcoming(employee, 4);
  if (!upcoming.length) {
    return {
      text: arabic ? "لا توجد مواعيد قادمة في تقويمك." : "There is nothing upcoming on your calendar.",
      followUps: arabic ? ["اعرض مهامي"] : ["Show my tasks"],
    };
  }

  const lines = upcoming
    .map((event) => `• ${event.title} — ${formatDate(event.date)}, ${formatTime(event.startTime)} · ${event.location}`)
    .join("\n");

  return {
    text: arabic ? `أقرب المواعيد في تقويمك:\n${lines}` : `Here is what is coming up:\n${lines}`,
    followUps: arabic ? ["اعرض مهامي", "ما هو رصيد إجازتي؟"] : ["Show my tasks", "What is my leave balance?"],
  };
}

function policyAnswer(message: string, arabic: boolean): AssistantReply {
  const results = knowledgeRepository.search(
    message
      .replace(/what|does|the|policy|say|about|tell me|سياسة|ما هي|عن/gi, " ")
      .trim(),
  );
  const doc = results[0] ?? knowledgeRepository.list()[0];
  const section = doc.sections[0];

  return {
    text: arabic
      ? `من دليل الشركة — «${doc.title}»: ${section.body} يمكنك قراءة الوثيقة كاملة في صفحة معرفة الشركة.`
      : `From the company handbook — “${doc.title}”: ${section.body} You can read the full document in Company Knowledge.`,
    followUps: arabic
      ? ["ما هي سياسة العمل عن بعد؟", "ما هي سياسة المصاريف؟"]
      : ["What is the remote work policy?", "How do expense claims work?"],
  };
}

function teamAnswer(employee: Employee, arabic: boolean): AssistantReply {
  if (employee.role === "employee") {
    return {
      text: arabic
        ? "تحليلات الفريق متاحة للمديرين والمشرفين فقط. يمكنني مساعدتك في مهامك وحضورك وإجازاتك."
        : "Team analytics are available to managers and administrators. I can help you with your own tasks, attendance and leave instead.",
      followUps: arabic ? ["اعرض مهامي"] : ["Show my tasks", "What is my leave balance?"],
    };
  }

  const overview = analyticsRepository.teamOverview(employee);
  return {
    text: arabic
      ? `فريقك يضم ${overview.headcount} أشخاص. نسبة الحضور ${overview.attendanceRate}%، وإنجاز المهام ${overview.completionRate}%، ولديك ${overview.pendingApprovals} طلب بانتظار الموافقة و${overview.overdueTasks} مهمة متأخرة.`
      : `Your team is ${overview.headcount} people. Attendance is ${overview.attendanceRate}%, task completion is ${overview.completionRate}%, and there ${overview.pendingApprovals === 1 ? "is" : "are"} ${overview.pendingApprovals} approval${overview.pendingApprovals === 1 ? "" : "s"} waiting on you with ${overview.overdueTasks} overdue items across the team.`,
    followUps: arabic
      ? ["ما التوصيات الحالية؟", "اعرض الموافقات المعلقة"]
      : ["What should I look at first?", "Show pending approvals"],
  };
}

function helpAnswer(employee: Employee, arabic: boolean): AssistantReply {
  return {
    text: arabic
      ? `يمكنني الإجابة عن حضورك، رصيد إجازتك، مهامك، مواعيدك، وسياسات الشركة${employee.role !== "employee" ? "، بالإضافة إلى مؤشرات الفريق والموافقات" : ""}. جرّب أن تسألني بلغتك المفضلة.`
      : `I can answer questions about your attendance, leave balance, tasks, calendar and company policies${employee.role !== "employee" ? ", plus team signals and pending approvals" : ""}. Ask me in English or Arabic.`,
    followUps: arabic
      ? ["اعرض مهامي", "ما هو رصيد إجازتي؟", "ما هي سياسة العمل عن بعد؟"]
      : ["Show my tasks", "What is my leave balance?", "What is the remote work policy?"],
  };
}

/** Produces an answer for a message, using the current state of the demo data. */
export function answer(message: string, employee: Employee): AssistantReply {
  const arabic = AR.test(message);
  const intent = detectIntent(message);

  switch (intent) {
    case "greeting":
      return {
        text: arabic
          ? `أهلًا ${employee.name.split(" ")[0]}! كيف أستطيع مساعدتك اليوم؟`
          : `Hello ${employee.name.split(" ")[0]} — how can I help you today?`,
        followUps: arabic
          ? ["اعرض مهامي", "ما هو رصيد إجازتي؟"]
          : ["Show my tasks", "What is my leave balance?"],
      };
    case "tasks":
      return taskAnswer(employee, arabic);
    case "leave":
      return leaveAnswer(employee, arabic);
    case "attendance":
      return attendanceAnswer(employee, arabic);
    case "schedule":
      return scheduleAnswer(employee, arabic);
    case "policy":
      return policyAnswer(message, arabic);
    case "team":
      return teamAnswer(employee, arabic);
    case "help":
      return helpAnswer(employee, arabic);
    default:
      return {
        text: arabic
          ? "لم أفهم طلبك تمامًا. أستطيع مساعدتك في الحضور، الإجازات، المهام، التقويم وسياسات الشركة."
          : "I did not quite catch that. I can help with attendance, leave, tasks, your calendar and company policies.",
        followUps: arabic
          ? ["ماذا تستطيع أن تفعل؟", "اعرض مهامي"]
          : ["What can you do?", "Show my tasks"],
      };
  }
}

export const STARTER_PROMPTS = [
  "Show my tasks",
  "What is my leave balance?",
  "What is the remote work policy?",
  "What is on my calendar?",
  "اعرض مهامي المتأخرة",
];
