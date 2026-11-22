"use server";

import { z } from "zod";
import { isDemoMode } from "@/lib/demo/data";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatZodError, settingsSchema } from "@/lib/validations/schemas";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

const DEMO_WRITE_ERROR =
  "Connect Supabase to persist data. Demo mode is read-only." as const;

const departmentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Department name is required"),
  slug: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function updateSettings(input: unknown): Promise<ActionResult> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  await requireAdmin();
  const supabase = await createClient();

  const updates = [
    {
      key: "campaign_name",
      value: parsed.data.campaign_name,
    },
    {
      key: "point_rules",
      value: parsed.data.point_rules,
    },
  ];

  for (const row of updates) {
    const { error } = await supabase
      .from("settings")
      .upsert({ key: row.key, value: row.value }, { onConflict: "key" });
    if (error) return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/overview");

  return { success: true };
}

export async function upsertDepartment(input: unknown): Promise<ActionResult & { id?: string }> {
  if (isDemoMode()) return { error: DEMO_WRITE_ERROR };

  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  await requireAdmin();
  const supabase = await createClient();

  const slug = parsed.data.slug ?? slugify(parsed.data.name);
  const payload = {
    name: parsed.data.name,
    slug,
    active: parsed.data.active ?? true,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("departments")
      .update(payload)
      .eq("id", parsed.data.id);
    if (error) return { error: error.message };
    revalidatePath("/settings");
    return { success: true, id: parsed.data.id };
  }

  const { data, error } = await supabase
    .from("departments")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/employees");

  return { success: true, id: data.id };
}