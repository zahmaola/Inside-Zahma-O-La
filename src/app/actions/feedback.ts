"use server";

import { isDemoMode } from "@/lib/demo/data";
import { requireAdmin } from "@/lib/auth";
import { getPointRules } from "@/lib/data/settings";
import { insertPointsTransaction, resolveFeedbackPoints } from "@/lib/points/rules";
import { createClient } from "@/lib/supabase/server";
import { feedbackSchema, formatZodError } from "@/lib/validations/schemas";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/app/actions/auth";

const DEMO_WRITE_ERROR =
  "Connect Supabase to persist data. Demo mode is read-only." as const;

const adminNotesSchema = z.object({
  id: z.string().uuid(),
  admin_notes: z.string().optional().nullable(),
});

async function resolveDepartmentId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string | null | undefined,
) {
  if (!employeeId) return null;
  const { data } = await supabase
    .from("employees")
    .select("department_id")
    .eq("id", employeeId)
    .maybeSingle();
  return data?.department_id ?? null;
}

export async function createFeedback(input: unknown): Promise<ActionResult & { id?: string }> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  await requireAdmin();
  const supabase = await createClient();
  const department_id = await resolveDepartmentId(supabase, parsed.data.employee_id);

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      employee_id: parsed.data.employee_id ?? null,
      department_id,
      feature_module: parsed.data.feature_module ?? null,
      category: parsed.data.category,
      severity: parsed.data.severity,
      status: parsed.data.status,
      reported_at: parsed.data.reported_at ?? new Date().toISOString(),
      admin_notes: parsed.data.admin_notes ?? null,
      is_duplicate: parsed.data.is_duplicate,
      validated: false,
      points_awarded: false,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/feedback");
  revalidatePath("/overview");

  return { success: true, id: data.id };
}

export async function updateFeedback(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = feedbackSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  await requireAdmin();
  const supabase = await createClient();

  const department_id =
    parsed.data.employee_id !== undefined
      ? await resolveDepartmentId(supabase, parsed.data.employee_id)
      : undefined;

  const { error } = await supabase
    .from("feedback")
    .update({
      ...parsed.data,
      ...(department_id !== undefined ? { department_id } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/feedback");
  revalidatePath(`/feedback/${id}`);
  revalidatePath("/overview");

  return { success: true };
}

export async function deleteFeedback(id: string): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/feedback");
  revalidatePath("/overview");

  return { success: true };
}

export async function addAdminNotes(input: unknown): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = adminNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("feedback")
    .update({ admin_notes: parsed.data.admin_notes ?? null })
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidatePath("/feedback");
  revalidatePath(`/feedback/${parsed.data.id}`);

  return { success: true };
}

const validateOptionsSchema = z.object({
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  /** Admin-set points that replace the severity-based amount. */
  points_override: z.coerce.number().int().min(0).max(1000).optional(),
});

export type ValidateFeedbackOptions = z.input<typeof validateOptionsSchema>;

/**
 * Admin validation — the only place feedback points are awarded.
 * Points = configured value for the (possibly adjusted) severity, unless overridden.
 */
export async function validateFeedback(
  id: string,
  options?: ValidateFeedbackOptions,
): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsedOptions = validateOptionsSchema.safeParse(options ?? {});
  if (!parsedOptions.success) {
    return { error: formatZodError(parsedOptions.error) };
  }

  const { admin } = await requireAdmin();
  const supabase = await createClient();
  const rules = await getPointRules();

  const { data: feedback, error: fetchError } = await supabase
    .from("feedback")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !feedback) {
    return { error: fetchError?.message ?? "Feedback not found" };
  }

  if (feedback.validated && feedback.points_awarded) {
    return { success: true };
  }

  const severity = parsedOptions.data.severity ?? feedback.severity;

  const validatedFeedback = {
    ...feedback,
    severity,
    validated: true,
    validated_at: feedback.validated_at ?? new Date().toISOString(),
  };

  const amount =
    parsedOptions.data.points_override ?? resolveFeedbackPoints(validatedFeedback, rules);

  const { error: updateError } = await supabase
    .from("feedback")
    .update({
      severity,
      validated: true,
      validated_at: validatedFeedback.validated_at,
      is_duplicate: false,
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  if (!feedback.employee_id || amount <= 0) {
    revalidatePath("/feedback");
    revalidatePath("/leaderboard");
    return { success: true };
  }

  const award = await insertPointsTransaction(supabase, {
    employee_id: feedback.employee_id,
    amount,
    reason: `Validated ${
      feedback.category === "feature_suggestion" ? "suggestion" : `${severity} issue`
    }: ${feedback.title}`,
    source_type: "feedback",
    source_id: id,
    created_by: admin?.id ?? null,
  });

  if (!award.ok) return { error: award.message };

  if (!award.alreadyAwarded) {
    await supabase.from("feedback").update({ points_awarded: true }).eq("id", id);
  }

  revalidatePath("/feedback");
  revalidatePath(`/feedback/${id}`);
  revalidatePath("/leaderboard");
  revalidatePath("/overview");
  revalidatePath(`/employees/${feedback.employee_id}`);

  return { success: true };
}

/** Admin rejects a report as invalid or duplicate — no points are awarded. */
export async function markFeedbackInvalid(id: string): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  await requireAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("feedback")
    .select("points_awarded")
    .eq("id", id)
    .maybeSingle();

  if (existing?.points_awarded) {
    return {
      error:
        "Points were already awarded for this report. Use a manual points adjustment instead.",
    };
  }

  const { error } = await supabase
    .from("feedback")
    .update({
      is_duplicate: true,
      validated: false,
      validated_at: null,
      status: "rejected",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/feedback");
  revalidatePath(`/feedback/${id}`);
  revalidatePath("/overview");

  return { success: true };
}

export async function uploadFeedbackAttachment(
  feedbackId: string,
  formData: FormData,
): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image or attachment to upload." };
  }

  if (file.size > 8 * 1024 * 1024) {
    return { error: "File must be under 8MB." };
  }

  await requireAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("feedback")
    .select("id")
    .eq("id", feedbackId)
    .maybeSingle();

  if (!existing) return { error: "Feedback not found." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${feedbackId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("feedback-attachments")
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("feedback_attachments").insert({
    feedback_id: feedbackId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath(`/feedback/${feedbackId}`);
  return { success: true };
}