import { createClient } from "@/lib/supabase/server";
import {
  DEMO_EMPLOYEES,
  DEMO_FEEDBACK,
  DEMO_POINTS,
  DEMO_SESSIONS,
  isDemoMode,
} from "@/lib/demo/data";
import {
  type DateRangePreset,
  resolveDateRange,
  toISODate,
} from "@/lib/dates/week";
import type { FeedbackCategory, FeedbackSeverity } from "@/types/database";
import { eachDayOfInterval, format, isWithinInterval } from "date-fns";

export type AnalyticsParticipation = {
  activeEmployees: number;
  participatingEmployees: number;
  participationRate: number;
  sessionsCount: number;
  feedbackCount: number;
};

export type BreakdownItem = { name: string; value: number };

export type EngagementPoint = {
  date: string;
  label: string;
  sessions: number;
  feedback: number;
  points: number;
};

export type AnalyticsResult = {
  preset: DateRangePreset;
  range: { start: string; end: string };
  participation: AnalyticsParticipation;
  feedbackByCategory: BreakdownItem[];
  feedbackBySeverity: BreakdownItem[];
  feedbackByStatus: BreakdownItem[];
  engagementSeries: EngagementPoint[];
};

function inInterval(iso: string, start: Date, end: Date) {
  return isWithinInterval(new Date(iso), { start, end });
}

function buildDemoAnalytics(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
): AnalyticsResult {
  const { start, end } = resolveDateRange(preset, customStart, customEnd);
  const activeEmployees = DEMO_EMPLOYEES.filter((e) => e.status === "active").length;

  const feedbackInRange = DEMO_FEEDBACK.filter((f) => inInterval(f.reported_at, start, end));
  const sessionsInRange = DEMO_SESSIONS.filter((s) =>
    inInterval(s.session_date, start, end),
  );
  const pointsInRange = DEMO_POINTS.filter((p) => inInterval(p.created_at, start, end));

  const participantIds = new Set<string>();
  feedbackInRange.forEach((f) => {
    if (f.employee_id) participantIds.add(f.employee_id);
  });
  sessionsInRange.forEach((s) => participantIds.add(s.employee_id));

  const categoryCounts = new Map<FeedbackCategory, number>();
  const severityCounts = new Map<FeedbackSeverity, number>();
  const statusCounts = new Map<string, number>();

  feedbackInRange.forEach((f) => {
    categoryCounts.set(f.category, (categoryCounts.get(f.category) ?? 0) + 1);
    severityCounts.set(f.severity, (severityCounts.get(f.severity) ?? 0) + 1);
    statusCounts.set(f.status, (statusCounts.get(f.status) ?? 0) + 1);
  });

  const days = eachDayOfInterval({ start, end });
  const engagementSeries: EngagementPoint[] = days.map((day) => {
    const label = format(day, "EEE");
    const dayIso = toISODate(day);
    return {
      date: dayIso,
      label,
      sessions: sessionsInRange.filter((s) => s.session_date.slice(0, 10) === dayIso).length,
      feedback: feedbackInRange.filter((f) => toISODate(new Date(f.reported_at)) === dayIso).length,
      points: pointsInRange
        .filter((p) => toISODate(new Date(p.created_at)) === dayIso)
        .reduce((sum, p) => sum + p.amount, 0),
    };
  });

  return {
    preset,
    range: { start: toISODate(start), end: toISODate(end) },
    participation: {
      activeEmployees,
      participatingEmployees: participantIds.size,
      participationRate:
        activeEmployees > 0 ? Math.round((participantIds.size / activeEmployees) * 100) : 0,
      sessionsCount: sessionsInRange.length,
      feedbackCount: feedbackInRange.length,
    },
    feedbackByCategory: [...categoryCounts.entries()].map(([name, value]) => ({ name, value })),
    feedbackBySeverity: [...severityCounts.entries()].map(([name, value]) => ({ name, value })),
    feedbackByStatus: [...statusCounts.entries()].map(([name, value]) => ({ name, value })),
    engagementSeries,
  };
}

export async function getAnalytics(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
): Promise<AnalyticsResult> {
  if (isDemoMode()) return buildDemoAnalytics(preset, customStart, customEnd);

  const { start, end } = resolveDateRange(preset, customStart, customEnd);
  const startIso = toISODate(start);
  const endIso = toISODate(end);

  const supabase = await createClient();

  const [
    { count: activeEmployees },
    { data: feedback },
    { data: sessions },
    { data: points },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("feedback")
      .select("category, severity, status, reported_at, employee_id")
      .gte("reported_at", start.toISOString())
      .lte("reported_at", end.toISOString()),
    supabase
      .from("testing_sessions")
      .select("employee_id, session_date")
      .gte("session_date", startIso)
      .lte("session_date", endIso),
    supabase
      .from("points_transactions")
      .select("amount, created_at")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
  ]);

  const participantIds = new Set<string>();
  feedback?.forEach((f) => {
    if (f.employee_id) participantIds.add(f.employee_id);
  });
  sessions?.forEach((s) => participantIds.add(s.employee_id));

  const categoryCounts = new Map<string, number>();
  const severityCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();

  feedback?.forEach((f) => {
    categoryCounts.set(f.category, (categoryCounts.get(f.category) ?? 0) + 1);
    severityCounts.set(f.severity, (severityCounts.get(f.severity) ?? 0) + 1);
    statusCounts.set(f.status, (statusCounts.get(f.status) ?? 0) + 1);
  });

  const days = eachDayOfInterval({ start, end });
  const engagementSeries: EngagementPoint[] = days.map((day) => {
    const dayIso = toISODate(day);
    return {
      date: dayIso,
      label: format(day, "EEE"),
      sessions: sessions?.filter((s) => s.session_date === dayIso).length ?? 0,
      feedback:
        feedback?.filter((f) => toISODate(new Date(f.reported_at)) === dayIso).length ?? 0,
      points:
        points
          ?.filter((p) => toISODate(new Date(p.created_at)) === dayIso)
          .reduce((sum, p) => sum + p.amount, 0) ?? 0,
    };
  });

  const active = activeEmployees ?? 0;

  return {
    preset,
    range: { start: startIso, end: endIso },
    participation: {
      activeEmployees: active,
      participatingEmployees: participantIds.size,
      participationRate: active > 0 ? Math.round((participantIds.size / active) * 100) : 0,
      sessionsCount: sessions?.length ?? 0,
      feedbackCount: feedback?.length ?? 0,
    },
    feedbackByCategory: [...categoryCounts.entries()].map(([name, value]) => ({ name, value })),
    feedbackBySeverity: [...severityCounts.entries()].map(([name, value]) => ({ name, value })),
    feedbackByStatus: [...statusCounts.entries()].map(([name, value]) => ({ name, value })),
    engagementSeries,
  };
}