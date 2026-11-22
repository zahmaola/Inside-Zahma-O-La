import { createClient } from "@/lib/supabase/server";
import {
  DEMO_EMPLOYEES,
  DEMO_FEEDBACK,
  DEMO_MISSIONS,
  DEMO_POINTS,
  DEMO_SESSIONS,
  isDemoMode,
} from "@/lib/demo/data";
import { getCurrentWeekRange, toISODate } from "@/lib/dates/week";
import { getLeaderboard } from "@/lib/data/leaderboard";
import { relationOne } from "@/lib/utils";

export type OverviewStats = {
  totalEmployees: number;
  activeEmployees: number;
  activeTestersThisWeek: number;
  feedbackThisWeek: number;
  totalFeedback: number;
  totalBugs: number;
  openBugs: number;
  criticalHighBugs: number;
  resolvedIssues: number;
  activeMissions: number;
  participationRate: number;
  pointsThisWeek: number;
};

export type RecentActivityItem = {
  id: string;
  type: "feedback" | "session" | "mission" | "points";
  title: string;
  occurredAt: string;
  employeeName?: string | null;
  meta?: string;
};

export type DepartmentParticipationRow = {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  participatingCount: number;
  participationRate: number;
};

function isInWeek(iso: string, weekStart: Date, weekEnd: Date) {
  const d = new Date(iso);
  return d >= weekStart && d <= weekEnd;
}

function computeDemoOverviewStats(): OverviewStats {
  const { start, end } = getCurrentWeekRange();
  const totalEmployees = DEMO_EMPLOYEES.length;
  const activeEmployees = DEMO_EMPLOYEES.filter((e) => e.status === "active").length;
  const feedbackThisWeek = DEMO_FEEDBACK.filter((f) => isInWeek(f.reported_at, start, end)).length;
  const totalFeedback = DEMO_FEEDBACK.length;
  const totalBugs = DEMO_FEEDBACK.filter((f) => f.category === "bug").length;
  const openBugs = DEMO_FEEDBACK.filter(
    (f) =>
      (f.category === "bug" || f.category === "ui_ux" || f.category === "performance") &&
      !["resolved", "rejected"].includes(f.status),
  ).length;
  const criticalHighBugs = DEMO_FEEDBACK.filter(
    (f) =>
      f.category === "bug" &&
      (f.severity === "critical" || f.severity === "high") &&
      !["resolved", "rejected"].includes(f.status),
  ).length;
  const resolvedIssues = DEMO_FEEDBACK.filter((f) => f.status === "resolved").length;
  const activeMissions = DEMO_MISSIONS.filter((m) => m.status === "active").length;

  const participantIds = new Set<string>();
  DEMO_SESSIONS.forEach((s) => {
    if (s.validated && isInWeek(s.session_date, start, end)) participantIds.add(s.employee_id);
  });
  DEMO_FEEDBACK.forEach((f) => {
    if (f.validated && f.employee_id && isInWeek(f.reported_at, start, end)) {
      participantIds.add(f.employee_id);
    }
  });

  const participationRate =
    activeEmployees > 0 ? Math.round((participantIds.size / activeEmployees) * 100) : 0;

  const pointsThisWeek = DEMO_POINTS.filter((p) => isInWeek(p.created_at, start, end)).reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  return {
    totalEmployees,
    activeEmployees,
    activeTestersThisWeek: participantIds.size,
    feedbackThisWeek,
    totalFeedback,
    totalBugs,
    openBugs,
    criticalHighBugs,
    resolvedIssues,
    activeMissions,
    participationRate,
    pointsThisWeek,
  };
}

export async function getOverviewStats(): Promise<OverviewStats> {
  if (isDemoMode()) return computeDemoOverviewStats();

  const supabase = await createClient();
  const { start, end } = getCurrentWeekRange();
  const startIso = toISODate(start);
  const endIso = toISODate(end);

  const [
    { count: totalEmployees },
    { count: activeEmployees },
    { count: feedbackThisWeek },
    { count: totalFeedback },
    { count: totalBugs },
    { count: openBugs },
    { count: criticalHighBugs },
    { count: resolvedIssues },
    { count: activeMissions },
    { data: weekSessions },
    { data: weekFeedback },
    { data: weekMissions },
    { data: weekPoints },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .gte("reported_at", start.toISOString())
      .lte("reported_at", end.toISOString()),
    supabase.from("feedback").select("*", { count: "exact", head: true }),
    supabase.from("feedback").select("*", { count: "exact", head: true }).eq("category", "bug"),
    supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .in("category", ["bug", "ui_ux", "performance"])
      .not("status", "in", '("resolved","rejected")'),
    supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("category", "bug")
      .in("severity", ["critical", "high"])
      .not("status", "in", '("resolved","rejected")'),
    supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabase
      .from("testing_missions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("testing_sessions")
      .select("employee_id")
      .eq("validated", true)
      .gte("session_date", startIso)
      .lte("session_date", endIso),
    supabase
      .from("feedback")
      .select("employee_id")
      .eq("validated", true)
      .gte("reported_at", start.toISOString())
      .lte("reported_at", end.toISOString())
      .not("employee_id", "is", null),
    supabase
      .from("mission_participation")
      .select("employee_id")
      .eq("validated", true)
      .gte("completed_at", start.toISOString())
      .lte("completed_at", end.toISOString()),
    supabase
      .from("points_transactions")
      .select("amount")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
  ]);

  const participantIds = new Set<string>();
  weekSessions?.forEach((s) => participantIds.add(s.employee_id));
  weekFeedback?.forEach((f) => {
    if (f.employee_id) participantIds.add(f.employee_id);
  });
  weekMissions?.forEach((m) => participantIds.add(m.employee_id));

  const active = activeEmployees ?? 0;
  const participationRate = active > 0 ? Math.round((participantIds.size / active) * 100) : 0;
  const pointsThisWeek = weekPoints?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

  return {
    totalEmployees: totalEmployees ?? 0,
    activeEmployees: active,
    activeTestersThisWeek: participantIds.size,
    feedbackThisWeek: feedbackThisWeek ?? 0,
    totalFeedback: totalFeedback ?? 0,
    totalBugs: totalBugs ?? 0,
    openBugs: openBugs ?? 0,
    criticalHighBugs: criticalHighBugs ?? 0,
    resolvedIssues: resolvedIssues ?? 0,
    activeMissions: activeMissions ?? 0,
    participationRate,
    pointsThisWeek,
  };
}

export async function getRecentActivity(limit = 12): Promise<RecentActivityItem[]> {
  if (isDemoMode()) {
    const items: RecentActivityItem[] = [
      ...DEMO_FEEDBACK.map((f) => ({
        id: f.id,
        type: "feedback" as const,
        title: f.title,
        occurredAt: f.reported_at,
        employeeName: f.employees?.full_name ?? null,
        meta: f.status,
      })),
      ...DEMO_SESSIONS.map((s) => ({
        id: s.id,
        type: "session" as const,
        title: s.feature_module ? `Session: ${s.feature_module}` : "Testing session",
        occurredAt: s.created_at,
        employeeName: s.employees?.full_name ?? null,
      })),
      ...DEMO_POINTS.map((p) => ({
        id: p.id,
        type: "points" as const,
        title: p.reason,
        occurredAt: p.created_at,
        employeeName: p.employees?.full_name ?? null,
        meta: `+${p.amount}`,
      })),
    ];
    return items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)).slice(0, limit);
  }

  const supabase = await createClient();
  const [feedback, sessions, points] = await Promise.all([
    supabase
      .from("feedback")
      .select("id, title, reported_at, status, employees(full_name)")
      .order("reported_at", { ascending: false })
      .limit(limit),
    supabase
      .from("testing_sessions")
      .select("id, feature_module, created_at, employees(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("points_transactions")
      .select("id, reason, amount, created_at, employees(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: RecentActivityItem[] = [
    ...(feedback.data ?? []).map((f) => ({
      id: f.id,
      type: "feedback" as const,
      title: f.title,
      occurredAt: f.reported_at,
      employeeName: relationOne<{ full_name: string }>(f.employees)?.full_name ?? null,
      meta: f.status,
    })),
    ...(sessions.data ?? []).map((s) => ({
      id: s.id,
      type: "session" as const,
      title: s.feature_module ? `Session: ${s.feature_module}` : "Testing session",
      occurredAt: s.created_at,
      employeeName: relationOne<{ full_name: string }>(s.employees)?.full_name ?? null,
    })),
    ...(points.data ?? []).map((p) => ({
      id: p.id,
      type: "points" as const,
      title: p.reason,
      occurredAt: p.created_at,
      employeeName: relationOne<{ full_name: string }>(p.employees)?.full_name ?? null,
      meta: `+${p.amount}`,
    })),
  ];

  return items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)).slice(0, limit);
}

export async function getDepartmentParticipation(): Promise<DepartmentParticipationRow[]> {
  if (isDemoMode()) {
    const { start, end } = getCurrentWeekRange();
    const active = DEMO_EMPLOYEES.filter((e) => e.status === "active");
    const byDept = new Map<string, DepartmentParticipationRow>();

    for (const emp of active) {
      const deptId = emp.department_id ?? "unassigned";
      const deptName = emp.departments?.name ?? "Unassigned";
      if (!byDept.has(deptId)) {
        byDept.set(deptId, {
          departmentId: deptId,
          departmentName: deptName,
          employeeCount: 0,
          participatingCount: 0,
          participationRate: 0,
        });
      }
      const row = byDept.get(deptId)!;
      row.employeeCount += 1;

      const participated =
        DEMO_SESSIONS.some(
          (s) => s.employee_id === emp.id && isInWeek(s.session_date, start, end),
        ) ||
        DEMO_FEEDBACK.some(
          (f) => f.employee_id === emp.id && isInWeek(f.reported_at, start, end),
        );
      if (participated) row.participatingCount += 1;
    }

    return [...byDept.values()].map((r) => ({
      ...r,
      participationRate:
        r.employeeCount > 0 ? Math.round((r.participatingCount / r.employeeCount) * 100) : 0,
    }));
  }

  const supabase = await createClient();
  const { start, end } = getCurrentWeekRange();
  const startIso = toISODate(start);
  const endIso = toISODate(end);

  const { data: employees } = await supabase
    .from("employees")
    .select("id, department_id, departments(name)")
    .eq("status", "active");

  const { data: sessions } = await supabase
    .from("testing_sessions")
    .select("employee_id")
    .gte("session_date", startIso)
    .lte("session_date", endIso);

  const { data: feedback } = await supabase
    .from("feedback")
    .select("employee_id")
    .gte("reported_at", start.toISOString())
    .lte("reported_at", end.toISOString())
    .not("employee_id", "is", null);

  const participants = new Set<string>();
  sessions?.forEach((s) => participants.add(s.employee_id));
  feedback?.forEach((f) => {
    if (f.employee_id) participants.add(f.employee_id);
  });

  const byDept = new Map<string, DepartmentParticipationRow>();
  employees?.forEach((emp) => {
    const deptId = emp.department_id ?? "unassigned";
    const deptName =
      relationOne<{ name: string }>(emp.departments)?.name ?? "Unassigned";
    if (!byDept.has(deptId)) {
      byDept.set(deptId, {
        departmentId: deptId,
        departmentName: deptName,
        employeeCount: 0,
        participatingCount: 0,
        participationRate: 0,
      });
    }
    const row = byDept.get(deptId)!;
    row.employeeCount += 1;
    if (participants.has(emp.id)) row.participatingCount += 1;
  });

  return [...byDept.values()]
    .map((r) => ({
      ...r,
      participationRate:
        r.employeeCount > 0 ? Math.round((r.participatingCount / r.employeeCount) * 100) : 0,
    }))
    .sort((a, b) => b.participationRate - a.participationRate);
}

export async function getLeaderboardPreview(limit = 5) {
  const board = await getLeaderboard("weekly");
  return board.entries.slice(0, limit);
}