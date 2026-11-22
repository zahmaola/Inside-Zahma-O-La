import { createClient } from "@/lib/supabase/server";
import {
  DEMO_EMPLOYEES,
  DEMO_FEEDBACK,
  DEMO_POINTS,
  isDemoMode,
} from "@/lib/demo/data";
import { getCurrentWeekRange, getMonthRange } from "@/lib/dates/week";
import { relationOne } from "@/lib/utils";

export type LeaderboardPeriod = "weekly" | "monthly" | "all_time" | "department";

export type LeaderboardEntry = {
  employeeId: string;
  fullName: string;
  departmentName: string | null;
  points: number;
  feedbackCount: number;
  rank: number;
};

export type LeaderboardResult = {
  period: LeaderboardPeriod;
  departmentId?: string | null;
  entries: LeaderboardEntry[];
  updatedAt: string;
};

export type RecognitionItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  reason: string;
  amount: number;
  occurredAt: string;
};

function buildDemoLeaderboard(
  period: LeaderboardPeriod,
  departmentId?: string | null,
): LeaderboardResult {
  const { start, end } =
    period === "monthly"
      ? getMonthRange()
      : period === "all_time" || period === "department"
        ? { start: new Date(0), end: new Date() }
        : getCurrentWeekRange();

  const inRange = (iso: string) => {
    const d = new Date(iso);
    return d >= start && d <= end;
  };

  let points = [...DEMO_POINTS];
  if (period !== "all_time" && period !== "department") {
    points = points.filter((p) => inRange(p.created_at));
  }

  const totals = new Map<string, { points: number; feedback: number }>();
  points.forEach((p) => {
    const row = totals.get(p.employee_id) ?? { points: 0, feedback: 0 };
    row.points += p.amount;
    totals.set(p.employee_id, row);
  });

  DEMO_FEEDBACK.forEach((f) => {
    if (!f.employee_id) return;
    if (period !== "all_time" && period !== "department" && !inRange(f.reported_at)) return;
    const row = totals.get(f.employee_id) ?? { points: 0, feedback: 0 };
    row.feedback += 1;
    totals.set(f.employee_id, row);
  });

  let employees = DEMO_EMPLOYEES.filter((e) => e.status === "active");
  if (period === "department" && departmentId) {
    employees = employees.filter((e) => e.department_id === departmentId);
  }

  const entries: LeaderboardEntry[] = employees
    .map((emp) => {
      const stats = totals.get(emp.id) ?? { points: 0, feedback: 0 };
      return {
        employeeId: emp.id,
        fullName: emp.full_name,
        departmentName: emp.departments?.name ?? null,
        points: stats.points,
        feedbackCount: stats.feedback,
        rank: 0,
      };
    })
    .sort((a, b) => b.points - a.points || a.fullName.localeCompare(b.fullName))
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return {
    period,
    departmentId: departmentId ?? null,
    entries,
    updatedAt: new Date().toISOString(),
  };
}

export async function getLeaderboard(
  period: LeaderboardPeriod,
  departmentId?: string | null,
): Promise<LeaderboardResult> {
  if (isDemoMode()) return buildDemoLeaderboard(period, departmentId);

  const supabase = await createClient();
  const range =
    period === "monthly"
      ? getMonthRange()
      : period === "weekly" || period === "department"
        ? getCurrentWeekRange()
        : null;

  let pointsQuery = supabase
    .from("points_transactions")
    .select("employee_id, amount, employees(full_name, department_id, departments(name))");

  if (range) {
    pointsQuery = pointsQuery
      .gte("created_at", range.start.toISOString())
      .lte("created_at", range.end.toISOString());
  }

  let feedbackQuery = supabase.from("feedback").select("employee_id");
  if (range) {
    feedbackQuery = feedbackQuery
      .gte("reported_at", range.start.toISOString())
      .lte("reported_at", range.end.toISOString());
  }

  const [{ data: points }, { data: feedback }, { data: employees }] = await Promise.all([
    pointsQuery,
    feedbackQuery.not("employee_id", "is", null),
    supabase
      .from("employees")
      .select("id, full_name, department_id, departments(name)")
      .eq("status", "active"),
  ]);

  const totals = new Map<
    string,
    { points: number; feedback: number; fullName: string; departmentName: string | null }
  >();

  employees?.forEach((emp) => {
    if (period === "department" && departmentId && emp.department_id !== departmentId) return;
    totals.set(emp.id, {
      points: 0,
      feedback: 0,
      fullName: emp.full_name,
      departmentName: relationOne<{ name: string }>(emp.departments)?.name ?? null,
    });
  });

  points?.forEach((p) => {
    const empRel = relationOne<{
      full_name: string;
      department_id: string | null;
      departments: { name: string } | null;
    }>(p.employees);

    if (period === "department" && departmentId) {
      if (empRel?.department_id !== departmentId) return;
    }
    const existing = totals.get(p.employee_id);
    const fullName = existing?.fullName ?? empRel?.full_name ?? "Unknown";
    const departmentName =
      existing?.departmentName ??
      relationOne<{ name: string }>(empRel?.departments)?.name ??
      null;
    const row = totals.get(p.employee_id) ?? {
      points: 0,
      feedback: 0,
      fullName,
      departmentName,
    };
    row.points += p.amount;
    totals.set(p.employee_id, row);
  });

  feedback?.forEach((f) => {
    if (!f.employee_id) return;
    if (period === "department" && departmentId) {
      const emp = employees?.find((e) => e.id === f.employee_id);
      if (emp?.department_id !== departmentId) return;
    }
    const row = totals.get(f.employee_id);
    if (!row) return;
    row.feedback += 1;
  });

  const entries: LeaderboardEntry[] = [...totals.entries()]
    .map(([employeeId, row]) => ({
      employeeId,
      fullName: row.fullName,
      departmentName: row.departmentName,
      points: row.points,
      feedbackCount: row.feedback,
      rank: 0,
    }))
    .sort((a, b) => b.points - a.points || a.fullName.localeCompare(b.fullName))
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return {
    period,
    departmentId: departmentId ?? null,
    entries,
    updatedAt: new Date().toISOString(),
  };
}

export async function getRecognition(limit = 8): Promise<RecognitionItem[]> {
  if (isDemoMode()) {
    return DEMO_POINTS.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        employeeId: p.employee_id,
        employeeName: p.employees?.full_name ?? "Unknown",
        reason: p.reason,
        amount: p.amount,
        occurredAt: p.created_at,
      }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("points_transactions")
    .select("id, employee_id, reason, amount, created_at, employees(full_name)")
    .gt("amount", 0)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({
    id: p.id,
    employeeId: p.employee_id,
    employeeName: relationOne<{ full_name: string }>(p.employees)?.full_name ?? "Unknown",
    reason: p.reason,
    amount: p.amount,
    occurredAt: p.created_at,
  }));
}