import { createClient } from "@/lib/supabase/server";
import { DEMO_FEEDBACK, isDemoMode } from "@/lib/demo/data";
import type {
  Feedback,
  FeedbackAttachment,
  FeedbackCategory,
  FeedbackSeverity,
  FeedbackStatus,
} from "@/types/database";

export type FeedbackFilters = {
  search?: string;
  status?: FeedbackStatus | FeedbackStatus[];
  category?: FeedbackCategory | FeedbackCategory[];
  severity?: FeedbackSeverity | FeedbackSeverity[];
  employeeId?: string;
  departmentId?: string;
  validated?: boolean;
};

const feedbackSelect = "*, employees(*), departments(*)";

function normalizeArray<T>(value?: T | T[]): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

function filterDemoFeedback(filters: FeedbackFilters): Feedback[] {
  let list = [...DEMO_FEEDBACK];

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.feature_module?.toLowerCase().includes(q),
    );
  }

  const statuses = normalizeArray(filters.status);
  if (statuses?.length) list = list.filter((f) => statuses.includes(f.status));

  const categories = normalizeArray(filters.category);
  if (categories?.length) list = list.filter((f) => categories.includes(f.category));

  const severities = normalizeArray(filters.severity);
  if (severities?.length) list = list.filter((f) => severities.includes(f.severity));

  if (filters.employeeId) list = list.filter((f) => f.employee_id === filters.employeeId);
  if (filters.departmentId) list = list.filter((f) => f.department_id === filters.departmentId);
  if (filters.validated !== undefined) list = list.filter((f) => f.validated === filters.validated);

  return list.sort((a, b) => (a.reported_at < b.reported_at ? 1 : -1));
}

export async function listFeedback(filters: FeedbackFilters = {}): Promise<Feedback[]> {
  if (isDemoMode()) return filterDemoFeedback(filters);

  const supabase = await createClient();
  let query = supabase.from("feedback").select(feedbackSelect).order("reported_at", { ascending: false });

  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(`title.ilike.${q},description.ilike.${q},feature_module.ilike.${q}`);
  }

  const statuses = normalizeArray(filters.status);
  if (statuses?.length) query = query.in("status", statuses);

  const categories = normalizeArray(filters.category);
  if (categories?.length) query = query.in("category", categories);

  const severities = normalizeArray(filters.severity);
  if (severities?.length) query = query.in("severity", severities);

  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters.departmentId) query = query.eq("department_id", filters.departmentId);
  if (filters.validated !== undefined) query = query.eq("validated", filters.validated);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFeedback(id: string): Promise<Feedback | null> {
  if (isDemoMode()) return DEMO_FEEDBACK.find((f) => f.id === id) ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select(feedbackSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function listFeedbackAttachments(
  feedbackId: string,
): Promise<(FeedbackAttachment & { url?: string | null })[]> {
  if (isDemoMode()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback_attachments")
    .select("*")
    .eq("feedback_id", feedbackId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("feedback-attachments")
        .createSignedUrl(row.storage_path, 60 * 60);
      return { ...row, url: signed?.signedUrl ?? null };
    }),
  );
}

function titleSimilarity(a: string, b: string) {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wordsA = new Set(na.split(/\s+/));
  const wordsB = new Set(nb.split(/\s+/));
  const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? overlap / union : 0;
}

export async function findSimilarFeedback(
  title: string,
  employeeId?: string | null,
  threshold = 0.55,
): Promise<Feedback[]> {
  if (isDemoMode()) {
    return DEMO_FEEDBACK.filter((f) => {
      if (employeeId && f.employee_id !== employeeId) return false;
      return titleSimilarity(title, f.title) >= threshold;
    });
  }

  const supabase = await createClient();
  let query = supabase.from("feedback").select(feedbackSelect).ilike("title", `%${title.slice(0, 40)}%`);

  if (employeeId) query = query.eq("employee_id", employeeId);

  const { data, error } = await query.limit(20);
  if (error) throw new Error(error.message);

  return (data ?? []).filter((f) => titleSimilarity(title, f.title) >= threshold);
}