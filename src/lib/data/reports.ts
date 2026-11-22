import { createClient } from "@/lib/supabase/server";
import {
  DEMO_EMPLOYEES,
  DEMO_FEEDBACK,
  DEMO_MISSIONS,
  DEMO_POINTS,
  DEMO_REPORTS,
  DEMO_SESSIONS,
  isDemoMode,
} from "@/lib/demo/data";
import { getAnalytics } from "@/lib/data/analytics";
import { getLeaderboard } from "@/lib/data/leaderboard";
import type { WeeklyReport } from "@/types/database";
import { relationOne } from "@/lib/utils";

export type WeeklyReportPayload = {
  period_start: string;
  period_end: string;
  participation_rate: number;
  feedback_count: number;
  sessions_count: number;
  points_awarded: number;
  bugs_by_severity: Record<string, number>;
  top_contributors: { employee_id: string; full_name: string; points: number }[];
  active_missions: number;
  generated_at: string;
};

export async function listWeeklyReports(): Promise<WeeklyReport[]> {
  if (isDemoMode()) {
    return [...DEMO_REPORTS].sort((a, b) => (a.period_start < b.period_start ? 1 : -1));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_reports")
    .select("*")
    .order("period_start", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getWeeklyReport(id: string): Promise<WeeklyReport | null> {
  if (isDemoMode()) return DEMO_REPORTS.find((r) => r.id === id) ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

function countBugsBySeverity(
  items: { category: string; severity: string }[],
) {
  const bugs = items.filter((f) =>
    ["bug", "ui_ux", "performance"].includes(f.category),
  );
  const out: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  bugs.forEach((b) => {
    out[b.severity] = (out[b.severity] ?? 0) + 1;
  });
  return out;
}

export async function buildWeeklyReportPayload(
  periodStart: string,
  periodEnd: string,
): Promise<WeeklyReportPayload> {
  if (isDemoMode()) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const inRange = (iso: string) => {
      const d = new Date(iso);
      return d >= start && d <= end;
    };
    const feedbackInRange = DEMO_FEEDBACK.filter((f) => inRange(f.reported_at));
    const sessionsInRange = DEMO_SESSIONS.filter((s) => inRange(s.session_date));
    const pointsInRange = DEMO_POINTS.filter((p) => inRange(p.created_at));
    const activeEmployees = DEMO_EMPLOYEES.filter((e) => e.status === "active").length;
    const participants = new Set<string>();
    feedbackInRange.forEach((f) => {
      if (f.employee_id) participants.add(f.employee_id);
    });
    sessionsInRange.forEach((s) => participants.add(s.employee_id));

    const totals = new Map<string, number>();
    pointsInRange.forEach((p) => {
      totals.set(p.employee_id, (totals.get(p.employee_id) ?? 0) + p.amount);
    });
    const topContributors = [...totals.entries()]
      .map(([employee_id, points]) => ({
        employee_id,
        full_name: DEMO_EMPLOYEES.find((e) => e.id === employee_id)?.full_name ?? "Unknown",
        points,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    return {
      period_start: periodStart,
      period_end: periodEnd,
      participation_rate:
        activeEmployees > 0 ? Math.round((participants.size / activeEmployees) * 100) : 0,
      feedback_count: feedbackInRange.length,
      sessions_count: sessionsInRange.length,
      points_awarded: pointsInRange.reduce((s, p) => s + p.amount, 0),
      bugs_by_severity: countBugsBySeverity(feedbackInRange),
      top_contributors: topContributors,
      active_missions: DEMO_MISSIONS.filter((m) => m.status === "active").length,
      generated_at: new Date().toISOString(),
    };
  }

  const supabase = await createClient();
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);

  const [
    { count: activeEmployees },
    { data: feedback },
    { data: sessions },
    { data: points },
    { count: activeMissions },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("feedback")
      .select("category, severity, employee_id, reported_at")
      .gte("reported_at", start.toISOString())
      .lte("reported_at", end.toISOString()),
    supabase
      .from("testing_sessions")
      .select("employee_id, session_date")
      .gte("session_date", periodStart)
      .lte("session_date", periodEnd),
    supabase
      .from("points_transactions")
      .select("employee_id, amount, created_at, employees(full_name)")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("testing_missions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const participants = new Set<string>();
  feedback?.forEach((f) => {
    if (f.employee_id) participants.add(f.employee_id);
  });
  sessions?.forEach((s) => participants.add(s.employee_id));

  const totals = new Map<string, { points: number; full_name: string }>();
  points?.forEach((p) => {
    const current = totals.get(p.employee_id) ?? {
      points: 0,
      full_name: relationOne<{ full_name: string }>(p.employees)?.full_name ?? "Unknown",
    };
    current.points += p.amount;
    totals.set(p.employee_id, current);
  });

  const topContributors = [...totals.entries()]
    .map(([employee_id, row]) => ({
      employee_id,
      full_name: row.full_name,
      points: row.points,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const active = activeEmployees ?? 0;

  return {
    period_start: periodStart,
    period_end: periodEnd,
    participation_rate: active > 0 ? Math.round((participants.size / active) * 100) : 0,
    feedback_count: feedback?.length ?? 0,
    sessions_count: sessions?.length ?? 0,
    points_awarded: points?.reduce((s, p) => s + p.amount, 0) ?? 0,
    bugs_by_severity: countBugsBySeverity(feedback ?? []),
    top_contributors: topContributors,
    active_missions: activeMissions ?? 0,
    generated_at: new Date().toISOString(),
  };
}

export async function buildCustomRangeReport(
  periodStart: string,
  periodEnd: string,
) {
  const [payload, analytics, leaderboard] = await Promise.all([
    buildWeeklyReportPayload(periodStart, periodEnd),
    getAnalytics("custom", periodStart, periodEnd),
    getLeaderboard("all_time"),
  ]);

  return {
    payload,
    analytics,
    leaderboardPreview: leaderboard.entries.slice(0, 5),
  };
}