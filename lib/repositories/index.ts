/**
 * Repository layer.
 *
 * The UI only ever talks to these objects — never to storage directly. In this
 * demo build they are backed by `lib/demo/store` (localStorage + in-memory
 * snapshot). Pointing CONNECT at a real backend means reimplementing these same
 * methods against an API; no screen has to change.
 */

export { activityRepository, withActivity } from "./activity";
export { analyticsRepository } from "./analytics";
export { attendanceRepository } from "./attendance";
export { employeesRepository, initialsOf, ROLE_LABELS } from "./employees";
export { eventsRepository, EVENT_TYPE_LABELS } from "./events";
export { knowledgeRepository } from "./knowledge";
export { leaveRepository, LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from "./leave";
export { notificationsRepository, withNotification } from "./notifications";
export { preferencesRepository, DEFAULT_PREFERENCES } from "./preferences";
export {
  isOverdue,
  tasksRepository,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_CATEGORIES,
} from "./tasks";
