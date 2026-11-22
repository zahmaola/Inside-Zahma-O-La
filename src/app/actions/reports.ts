"use server";

import { z } from "zod";
import { isDemoMode } from "@/lib/demo/data";
import { requireAdmin } from "@/lib/auth";
import { buildWeeklyReportPayload } from "@/lib/data/reports";
import { createClient } from "@/lib/supabase/server";
import { formatZodError } from "@/lib/validations/schemas";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

const DEMO_WRITE_ERROR =
  "Connect Supabase to persist data. Demo mode is read-only." as const;

const weeklyReportSchema = z.object({
  title: z.string().min(3),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  next_week_priorities: z.string().optional().nullable(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function saveWeeklyReport(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = weeklyReportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const { admin } = await requireAdmin();
  const supabase = await createClient();

  const payload =
    parsed.data.payload ??
    (await buildWeeklyReportPayload(parsed.data.period_start, parsed.data.period_end));

  const { data, error } = await supabase
    .from("weekly_reports")
    .insert({
      title: parsed.data.title,
      period_start: parsed.data.period_start,
      period_end: parsed.data.period_end,
      payload,
      next_week_priorities: parsed.data.next_week_priorities ?? null,
      created_by: admin?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/reports");
  revalidatePath("/overview");

  return { success: true, id: data.id };
}