import { createClient } from "@/lib/supabase/server";
import { DEMO_EMPLOYEES, DEMO_MISSIONS, isDemoMode } from "@/lib/demo/data";
import type { MissionStatus, TestingMission } from "@/types/database";

const missionSelect = "*, departments(*)";

export type MissionProgressSummary = {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
  participationCount: number;
  participationRate: number;
};

export async function listMissions(status?: MissionStatus): Promise<TestingMission[]> {
  if (isDemoMode()) {
    let list = [...DEMO_MISSIONS];
    if (status) list = list.filter((m) => m.status === status);
    return list.sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  }

  const supabase = await createClient();
  let query = supabase
    .from("testing_missions")
    .select(missionSelect)
    .order("start_date", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMission(id: string): Promise<TestingMission | null> {
  if (isDemoMode()) return DEMO_MISSIONS.find((m) => m.id === id) ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testing_missions")
    .select(missionSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getMissionProgress(): Promise<MissionProgressSummary> {
  if (isDemoMode()) {
    const activeEmployees = DEMO_EMPLOYEES.filter((e) => e.status === "active").length;
    const participationCount = 2;
    return {
      total: DEMO_MISSIONS.length,
      active: DEMO_MISSIONS.filter((m) => m.status === "active").length,
      upcoming: DEMO_MISSIONS.filter((m) => m.status === "upcoming").length,
      completed: DEMO_MISSIONS.filter((m) => m.status === "completed").length,
      participationCount,
      participationRate:
        activeEmployees > 0 ? Math.round((participationCount / activeEmployees) * 100) : 0,
    };
  }

  const supabase = await createClient();
  const [
    { count: total },
    { count: active },
    { count: upcoming },
    { count: completed },
    { count: participationCount },
    { count: activeEmployees },
  ] = await Promise.all([
    supabase.from("testing_missions").select("*", { count: "exact", head: true }),
    supabase.from("testing_missions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("testing_missions").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
    supabase.from("testing_missions").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase
      .from("mission_participation")
      .select("employee_id", { count: "exact", head: true }),
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const employees = activeEmployees ?? 0;
  const participants = participationCount ?? 0;

  return {
    total: total ?? 0,
    active: active ?? 0,
    upcoming: upcoming ?? 0,
    completed: completed ?? 0,
    participationCount: participants,
    participationRate: employees > 0 ? Math.round((participants / employees) * 100) : 0,
  };
}