"use server";

import { isDemoMode } from "@/lib/demo/data";
import { requireAdmin } from "@/lib/auth";
import { getPointRules } from "@/lib/data/settings";
import { insertPointsTransaction } from "@/lib/points/rules";
import { createClient } from "@/lib/supabase/server";
import {
  employeeSchema,
  formatZodError,
  testingSessionSchema,
} from "@/lib/validations/schemas";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

const DEMO_WRITE_ERROR =
  "Connect Supabase to persist data. Demo mode is read-only." as const;

export async function createEmployee(input: unknown): Promise<ActionResult & { id?: string }> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .insert({
      full_name: parsed.data.full_name,
      department_id: parsed.data.department_id ?? null,
      job_title: parsed.data.job_title ?? null,
      avatar_url: parsed.data.avatar_url || null,
      status: parsed.data.status,
      date_added: parsed.data.date_added ?? new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/employees");
  revalidatePath("/overview");

  return { success: true, id: data.id };
}

export async function updateEmployee(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = employeeSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({
      ...parsed.data,
      avatar_url: parsed.data.avatar_url === "" ? null : parsed.data.avatar_url,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  revalidatePath("/overview");

  return { success: true };
}

export async function deactivateEmployee(id: string): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/employees");
  revalidatePath("/overview");
  revalidatePath("/leaderboard");

  return { success: true };
}

export async function createTestingSession(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = testingSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const { admin } = await requireAdmin();
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("testing_sessions")
    .insert({
      employee_id: parsed.data.employee_id,
      session_date: parsed.data.session_date,
      notes: parsed.data.notes ?? null,
      feature_module: parsed.data.feature_module ?? null,
      validated: true,
      points_awarded: false,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (parsed.data.award_points) {
    const rules = await getPointRules();
    const award = await insertPointsTransaction(supabase, {
      employee_id: parsed.data.employee_id,
      amount: rules.documented_session,
      reason: "Documented testing session",
      source_type: "session",
      source_id: session.id,
      created_by: admin?.id ?? null,
    });

    if (!award.ok) return { error: award.message };

    if (!award.alreadyAwarded) {
      await supabase
        .from("testing_sessions")
        .update({ points_awarded: true })
        .eq("id", session.id);
    }
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${parsed.data.employee_id}`);
  revalidatePath("/overview");
  revalidatePath("/leaderboard");

  return { success: true, id: session.id };
}