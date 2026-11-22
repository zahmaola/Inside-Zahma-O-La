import type { Feedback, PointRules, PointsTransaction } from "@/types/database";
import { DEFAULT_POINT_RULES } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export function resolveFeedbackPoints(
  feedback: Pick<Feedback, "category" | "severity" | "is_duplicate" | "validated">,
  rules: PointRules = DEFAULT_POINT_RULES,
) {
  if (!feedback.validated || feedback.is_duplicate) {
    return rules.duplicate_or_invalid;
  }

  if (feedback.category === "feature_suggestion") {
    return rules.useful_suggestion;
  }

  if (feedback.category === "bug" || feedback.category === "ui_ux" || feedback.category === "performance") {
    if (feedback.severity === "critical") return rules.critical_bug;
    if (feedback.severity === "high") return rules.high_priority_bug;
    return rules.validated_bug;
  }

  if (feedback.category === "usability") {
    return rules.useful_suggestion;
  }

  return rules.validated_bug;
}

export function mergePointRules(value: unknown): PointRules {
  if (!value || typeof value !== "object") return DEFAULT_POINT_RULES;
  return { ...DEFAULT_POINT_RULES, ...(value as Partial<PointRules>) };
}

export type AwardPointsInput = {
  employee_id: string;
  amount: number;
  reason: string;
  source_type: PointsTransaction["source_type"];
  source_id: string | null;
  created_by?: string | null;
};

/** Inserts a points row; returns alreadyAwarded when unique (source_type, source_id) conflicts. */
export async function insertPointsTransaction(
  supabase: SupabaseClient,
  input: AwardPointsInput,
): Promise<{ ok: true; alreadyAwarded: boolean } | { ok: false; message: string }> {
  if (input.amount <= 0) {
    return { ok: true, alreadyAwarded: false };
  }

  const { error } = await supabase.from("points_transactions").insert({
    employee_id: input.employee_id,
    amount: input.amount,
    reason: input.reason,
    source_type: input.source_type,
    source_id: input.source_id,
    created_by: input.created_by ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true, alreadyAwarded: true };
    }
    return { ok: false, message: error.message };
  }

  return { ok: true, alreadyAwarded: false };
}
