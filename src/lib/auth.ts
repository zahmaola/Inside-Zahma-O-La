import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Deduped per request — safe to call from layout + pages. */
export const getCurrentAdmin = cache(async () => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("id, user_id, display_name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  return admin ? { user, admin } : { user, admin: null };
});

export async function requireAdmin() {
  const result = await getCurrentAdmin();
  if (!result?.user) {
    throw new Error("Unauthorized");
  }
  return result;
}
