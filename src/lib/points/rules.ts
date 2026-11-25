import type {
  Feedback,
  FeedbackCategory,
  FeedbackSeverity,
  PointRules,
  PointsTransaction,
} from "@/types/database";
import { DEFAULT_POINT_RULES } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Points a report is worth once validated (ignores validation state — use for previews). */
export function pointsForFeedback(
  category: FeedbackCategory,
  severity: FeedbackSeverity,
  rules: PointRules = DEFAULT_POINT_RULES,
) {
  if (category === "feature_suggestion") return rules.useful_suggestion;

  switch (severity) {
    case "critical":
      return rules.critical_bug;
    case "high":
      return rules.high_priority_bug;
    case "medium":
      return rules.medium_bug;
    case "low":
      return rules.low_bug;
  }
}

export function resolveFeedbackPoints(
  feedback: Pick<Feedback, "category" | "severity" | "is_duplicate" | "validated">,
  rules: PointRules = DEFAULT_POINT_RULES,
) {
  if (!feedback.validated || feedback.is_duplicate) {
    return rules.duplicate_or_invalid;
  }
  return pointsForFeedback(feedback.category, feedback.severity, rules);
}

export function mergePointRules(value: unknown): PointRules {
  if (!value || typeof value !== "object") return DEFAULT_POINT_RULES;
  const stored = value as Partial<PointRules> & { validated_bug?: number };
  const merged = { ...DEFAULT_POINT_RULES };

  for (const key of Object.keys(DEFAULT_POINT_RULES) as (keyof PointRules)[]) {
    const v = stored[key];
    if (typeof v === "number") merged[key] = v;
  }

  // Legacy single "validated bug" value becomes the medium-severity default
  if (typeof stored.medium_bug !== "number" && typeof stored.validated_bug === "number") {
    merged.medium_bug = stored.validated_bug;
  }

  return merged;
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
