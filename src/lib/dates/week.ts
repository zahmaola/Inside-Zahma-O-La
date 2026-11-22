import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subWeeks,
  subMonths,
} from "date-fns";

/** Saudi office week: Sunday–Thursday */
export const WEEK_OPTIONS = { weekStartsOn: 0 as const };

export function getCurrentWeekRange(date = new Date()) {
  const start = startOfDay(startOfWeek(date, WEEK_OPTIONS));
  // Thursday = Sunday + 4 (inclusive end-of-day)
  const end = endOfDay(addDays(start, 4));
  return { start, end };
}

export function getLastWeekRange(date = new Date()) {
  return getCurrentWeekRange(subWeeks(date, 1));
}

export function getMonthRange(date = new Date()) {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function getLastMonthRange(date = new Date()) {
  return getMonthRange(subMonths(date, 1));
}

export function getCalendarWeekRange(date = new Date()) {
  return {
    start: startOfWeek(date, WEEK_OPTIONS),
    end: endOfWeek(date, WEEK_OPTIONS),
  };
}

export function toISODate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function toISODateTime(date: Date) {
  return date.toISOString();
}

export type DateRangePreset =
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export function resolveDateRange(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
) {
  switch (preset) {
    case "this_week":
      return getCurrentWeekRange();
    case "last_week":
      return getLastWeekRange();
    case "this_month":
      return getMonthRange();
    case "last_month":
      return getLastMonthRange();
    case "custom":
      return {
        start: customStart ? new Date(customStart) : getCurrentWeekRange().start,
        end: customEnd ? new Date(customEnd) : getCurrentWeekRange().end,
      };
  }
}

export function formatRangeLabel(start: Date, end: Date) {
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}
