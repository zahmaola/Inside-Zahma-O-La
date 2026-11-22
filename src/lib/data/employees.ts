import { createClient } from "@/lib/supabase/server";
import {
  DEMO_EMPLOYEES,
  DEMO_FEEDBACK,
  DEMO_POINTS,
  DEMO_SESSIONS,
  isDemoMode,
} from "@/lib/demo/data";
import type {
  Employee,
  Feedback,
  MissionParticipation,
  PointsTransaction,
  TestingSession,
} from "@/types/database";

const employeeSelect = "*, departments(*)";

export type EmployeeStats = {
  totalPoints: number;
  feedbackCount: number;
  sessionsCount: number;
  missionsCompleted: number;
  rank: number | null;
};

export type EmployeeHistoryItem = {
  id: string;
  kind: "feedback" | "session" | "points" | "mission";
  title: string;
  occurredAt: string;
  points?: number;
};

export async function listEmployees(search?: string): Promise<Employee[]> {
  if (isDemoMode()) {
    let list = [...DEMO_EMPLOYEES];
    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.full_name.toLowerCase().includes(q) ||
          e.job_title?.toLowerCase().includes(q) ||
          e.departments?.name.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }

  const supabase = await createClient();
  let query = supabase.from("employees").select(employeeSelect).order("full_name");

  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(`full_name.ilike.${q},job_title.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getEmployee(id: string): Promise<Employee | null> {
  if (isDemoMode()) {
    return DEMO_EMPLOYEES.find((e) => e.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(employeeSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getEmployeeStats(id: string): Promise<EmployeeStats> {
  if (isDemoMode()) {
    const totalPoints = DEMO_POINTS.filter((p) => p.employee_id === id).reduce(
      (s, p) => s + p.amount,
      0,
    );
    const feedbackCount = DEMO_FEEDBACK.filter((f) => f.employee_id === id).length;
    const sessionsCount = DEMO_SESSIONS.filter((s) => s.employee_id === id).length;
    const totals = new Map<string, number>();
    DEMO_POINTS.forEach((p) => {
      totals.set(p.employee_id, (totals.get(p.employee_id) ?? 0) + p.amount);
    });
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const rankIndex = sorted.findIndex(([empId]) => empId === id);

    return {
      totalPoints,
      feedbackCount,
      sessionsCount,
      missionsCompleted: DEMO_POINTS.filter(
        (p) => p.employee_id === id && p.source_type === "mission",
      ).length,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
    };
  }

  const supabase = await createClient();
  const [pointsRes, feedbackRes, sessionsRes, missionsRes, allPointsRes] = await Promise.all([
    supabase.from("points_transactions").select("amount").eq("employee_id", id),
    supabase.from("feedback").select("*", { count: "exact", head: true }).eq("employee_id", id),
    supabase.from("testing_sessions").select("*", { count: "exact", head: true }).eq("employee_id", id),
    supabase
      .from("mission_participation")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", id)
      .eq("validated", true),
    supabase.from("points_transactions").select("employee_id, amount"),
  ]);

  const totalPoints = pointsRes.data?.reduce((s, p) => s + p.amount, 0) ?? 0;
  const totals = new Map<string, number>();
  allPointsRes.data?.forEach((p) => {
    totals.set(p.employee_id, (totals.get(p.employee_id) ?? 0) + p.amount);
  });
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const rankIndex = sorted.findIndex(([empId]) => empId === id);

  return {
    totalPoints,
    feedbackCount: feedbackRes.count ?? 0,
    sessionsCount: sessionsRes.count ?? 0,
    missionsCompleted: missionsRes.count ?? 0,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
  };
}

export async function getEmployeeHistory(id: string, limit = 30): Promise<EmployeeHistoryItem[]> {
  if (isDemoMode()) {
    const items: EmployeeHistoryItem[] = [
      ...DEMO_FEEDBACK.filter((f) => f.employee_id === id).map((f) => ({
        id: f.id,
        kind: "feedback" as const,
        title: f.title,
        occurredAt: f.reported_at,
      })),
      ...DEMO_SESSIONS.filter((s) => s.employee_id === id).map((s) => ({
        id: s.id,
        kind: "session" as const,
        title: s.feature_module ? `Session: ${s.feature_module}` : "Testing session",
        occurredAt: s.created_at,
      })),
      ...DEMO_POINTS.filter((p) => p.employee_id === id).map((p) => ({
        id: p.id,
        kind: "points" as const,
        title: p.reason,
        occurredAt: p.created_at,
        points: p.amount,
      })),
    ];
    return items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)).slice(0, limit);
  }

  const supabase = await createClient();
  const [feedback, sessions, points, missions] = await Promise.all([
    supabase
      .from("feedback")
      .select("id, title, reported_at")
      .eq("employee_id", id)
      .order("reported_at", { ascending: false })
      .limit(limit),
    supabase
      .from("testing_sessions")
      .select("id, feature_module, created_at")
      .eq("employee_id", id)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("points_transactions")
      .select("id, reason, amount, created_at")
      .eq("employee_id", id)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("mission_participation")
      .select("id, completed_at, testing_missions(title)")
      .eq("employee_id", id)
      .order("completed_at", { ascending: false })
      .limit(limit),
  ]);

  const items: EmployeeHistoryItem[] = [
    ...(feedback.data as Feedback[] | null)?.map((f) => ({
      id: f.id,
      kind: "feedback" as const,
      title: f.title,
      occurredAt: f.reported_at,
    })) ?? [],
    ...(sessions.data as TestingSession[] | null)?.map((s) => ({
      id: s.id,
      kind: "session" as const,
      title: s.feature_module ? `Session: ${s.feature_module}` : "Testing session",
      occurredAt: s.created_at,
    })) ?? [],
    ...(points.data as PointsTransaction[] | null)?.map((p) => ({
      id: p.id,
      kind: "points" as const,
      title: p.reason,
      occurredAt: p.created_at,
      points: p.amount,
    })) ?? [],
    ...(missions.data as (MissionParticipation & { testing_missions: { title: string } | null })[] | null)?.map(
      (m) => ({
        id: m.id,
        kind: "mission" as const,
        title: m.testing_missions?.title ?? "Mission completed",
        occurredAt: m.completed_at,
      }),
    ) ?? [],
  ];

  return items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)).slice(0, limit);
}