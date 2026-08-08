import { Task, GCalEvent } from "../types";

/**
 * Converts a time string "HH:MM" to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to a "HH:MM" string
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Checks if two time blocks overlap on the same day
 */
export function isOverlapping(
  s1: string,
  e1: string,
  s2: string,
  e2: string
): boolean {
  const start1 = timeToMinutes(s1);
  const end1 = timeToMinutes(e1);
  const start2 = timeToMinutes(s2);
  const end2 = timeToMinutes(e2);

  return Math.max(start1, start2) < Math.min(end1, end2);
}

/**
 * Extracts "YYYY-MM-DD" date and "HH:MM" time from an ISO date-time string
 */
export function parseIsoDateTime(isoStr?: string): { date: string; time: string } | null {
  if (!isoStr) return null;
  try {
    const dateObj = new Date(isoStr);
    if (isNaN(dateObj.getTime())) return null;

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");

    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");

    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`
    };
  } catch (e) {
    return null;
  }
}

/**
 * Detects conflicts between local scheduled tasks and GCal events on a given date
 */
export function detectConflicts(
  tasks: Task[],
  gCalEvents: GCalEvent[],
  dateStr: string
): { taskId: string; conflictWith: string }[] {
  const conflicts: { taskId: string; conflictWith: string }[] = [];

  // Filter tasks scheduled on this specific date that have start and end times
  const scheduledTasks = tasks.filter(
    (t) => t.dueDate === dateStr && t.startTime && t.endTime && t.status !== "Completed"
  );

  // Map GCal events to a simpler schedule block on this date
  const dayGCalBlocks = gCalEvents
    .map((event) => {
      const parsedStart = parseIsoDateTime(event.start.dateTime || event.start.date);
      const parsedEnd = parseIsoDateTime(event.end.dateTime || event.end.date);

      if (parsedStart && parsedEnd && parsedStart.date === dateStr) {
        return {
          id: event.id,
          summary: event.summary,
          start: parsedStart.time,
          end: parsedEnd.time
        };
      }
      return null;
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  for (const t of scheduledTasks) {
    // 1. Check against other local tasks
    for (const otherT of scheduledTasks) {
      if (t.id === otherT.id) continue;
      if (isOverlapping(t.startTime!, t.endTime!, otherT.startTime!, otherT.endTime!)) {
        conflicts.push({
          taskId: t.id,
          conflictWith: `AI Task: "${otherT.title}"`
        });
      }
    }

    // 2. Check against GCal events
    for (const gcal of dayGCalBlocks) {
      if (isOverlapping(t.startTime!, t.endTime!, gcal.start, gcal.end)) {
        conflicts.push({
          taskId: t.id,
          conflictWith: `Google Calendar: "${gcal.summary}"`
        });
      }
    }
  }

  return conflicts;
}
