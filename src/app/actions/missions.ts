"use server";

import { isDemoMode } from "@/lib/demo/data";
import { requireAdmin } from "@/lib/auth";
import { getPointRules } from "@/lib/data/settings";
import { insertPointsTransaction } from "@/lib/points/rules";
import { createClient } from "@/lib/supabase/server";
import {
  formatZodError,
  missionParticipationSchema,
  missionSchema,
} from "@/lib/validations/schemas";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

const DEMO_WRITE_ERROR =
  "Connect Supabase to persist data. Demo mode is read-only." as const;

export async function createMission(input: unknown): Promise<ActionResult & { id?: string }> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = missionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("testing_missions")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      feature_module: parsed.data.feature_module ?? null,
      instructions: parsed.data.instructions ?? null,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      scope: parsed.data.scope,
      department_id:
        parsed.data.scope === "department" ? (parsed.data.department_id ?? null) : null,
      status: parsed.data.status,
      points_available: parsed.data.points_available,
      completion_criteria: parsed.data.completion_criteria ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/missions");
  revalidatePath("/overview");

  return { success: true, id: data.id };
}

export async function updateMission(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = missionSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("testing_missions")
    .update({
      ...parsed.data,
      department_id:
        parsed.data.scope === "department"
          ? (parsed.data.department_id ?? null)
          : parsed.data.scope === "all"
            ? null
            : undefined,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/missions");
  revalidatePath(`/missions/${id}`);
  revalidatePath("/overview");

  return { success: true };
}

export async function recordParticipation(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = missionParticipationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const { admin } = await requireAdmin();
  const supabase = await createClient();
  const rules = await getPointRules();

  const { data: mission, error: missionError } = await supabase
    .from("testing_missions")
    .select("title, points_available")
    .eq("id", parsed.data.mission_id)
    .single();

  if (missionError || !mission) {
    return { error: missionError?.message ?? "Mission not found" };
  }

  const completed_at = parsed.data.completed_at ?? new Date().toISOString();

  const { data: participation, error } = await supabase
    .from("mission_participation")
    .upsert(
      {
        mission_id: parsed.data.mission_id,
        employee_id: parsed.data.employee_id,
        completed_at,
        validated: parsed.data.validated,
        validated_at: parsed.data.validated ? completed_at : null,
        admin_notes: parsed.data.admin_notes ?? null,
        points_awarded: false,
      },
      { onConflict: "mission_id,employee_id" },
    )
    .select("id, points_awarded, validated")
    .single();

  if (error) return { error: error.message };

  if (!parsed.data.validated) {
    revalidatePath("/missions");
    revalidatePath(`/missions/${parsed.data.mission_id}`);
    return { success: true, id: participation.id };
  }

  const amount = mission.points_available ?? rules.completed_mission;

  const award = await insertPointsTransaction(supabase, {
    employee_id: parsed.data.employee_id,
    amount,
    reason: `Completed mission: ${mission.title}`,
    source_type: "mission",
    source_id: participation.id,
    created_by: admin?.id ?? null,
  });

  if (!award.ok) return { error: award.message };

  if (!award.alreadyAwarded) {
    await supabase
      .from("mission_participation")
      .update({ points_awarded: true })
      .eq("id", participation.id);
  }

  revalidatePath("/missions");
  revalidatePath(`/missions/${parsed.data.mission_id}`);
  revalidatePath("/leaderboard");
  revalidatePath("/overview");
  revalidatePath(`/employees/${parsed.data.employee_id}`);

  return { success: true, id: participation.id };
}