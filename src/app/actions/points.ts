"use server";

import { isDemoMode } from "@/lib/demo/data";
import { requireAdmin } from "@/lib/auth";
import { insertPointsTransaction } from "@/lib/points/rules";
import { createClient } from "@/lib/supabase/server";
import { formatZodError, pointsAdjustmentSchema } from "@/lib/validations/schemas";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

const DEMO_WRITE_ERROR =
  "Connect Supabase to persist data. Demo mode is read-only." as const;

export async function adjustPoints(input: unknown): Promise<ActionResult & { id?: string }> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = pointsAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const { admin } = await requireAdmin();
  const supabase = await createClient();

  const award = await insertPointsTransaction(supabase, {
    employee_id: parsed.data.employee_id,
    amount: parsed.data.amount,
    reason: parsed.data.reason,
    source_type: "adjustment",
    source_id: null,
    created_by: admin?.id ?? null,
  });

  if (!award.ok) return { error: award.message };

  revalidatePath("/employees");
  revalidatePath("/leaderboard");
  revalidatePath("/overview");

  return { success: true, id: parsed.data.employee_id };
}