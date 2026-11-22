import { createClient } from "@/lib/supabase/server";
import {
  DEMO_DEPARTMENTS,
  isDemoMode,
} from "@/lib/demo/data";
import { mergePointRules } from "@/lib/points/rules";
import type { AppSetting, Department, PointRules } from "@/types/database";
import { DEFAULT_POINT_RULES } from "@/types/database";

export type AppSettings = {
  campaign_name: string;
  point_rules: PointRules;
  leaderboard: Record<string, unknown>;
  week_config: Record<string, unknown>;
  feedback_categories: string[];
  severity_levels: string[];
  mission_categories: string[];
  departments: Department[];
};

const SETTINGS_KEYS = [
  "campaign_name",
  "point_rules",
  "leaderboard",
  "week_config",
  "feedback_categories",
  "severity_levels",
  "mission_categories",
] as const;

function parseSettingValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  return value as T;
}

function buildSettingsFromRows(rows: AppSetting[], departments: Department[]): AppSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const campaignRaw = map.get("campaign_name");
  const campaign_name =
    typeof campaignRaw === "string"
      ? campaignRaw
      : typeof campaignRaw === "object" && campaignRaw !== null
        ? String((campaignRaw as { toString?: () => string }).toString?.() ?? "INSIDE ZAHMA")
        : "INSIDE ZAHMA Testing Campaign";

  return {
    campaign_name,
    point_rules: mergePointRules(map.get("point_rules")),
    leaderboard: parseSettingValue(map.get("leaderboard"), { default_view: "weekly", show_podium: true }),
    week_config: parseSettingValue(map.get("week_config"), {
      starts_on: "sunday",
      ends_on: "thursday",
      meeting_day: "thursday",
    }),
    feedback_categories: parseSettingValue(map.get("feedback_categories"), []),
    severity_levels: parseSettingValue(map.get("severity_levels"), []),
    mission_categories: parseSettingValue(map.get("mission_categories"), []),
    departments,
  };
}

export async function getPointRules(): Promise<PointRules> {
  if (isDemoMode()) return DEFAULT_POINT_RULES;

  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "point_rules")
    .maybeSingle();

  return mergePointRules(data?.value);
}

export async function getSettings(): Promise<AppSettings> {
  if (isDemoMode()) {
    return {
      campaign_name: "INSIDE ZAHMA Testing Campaign",
      point_rules: DEFAULT_POINT_RULES,
      leaderboard: { default_view: "weekly", show_podium: true },
      week_config: { starts_on: "sunday", ends_on: "thursday", meeting_day: "thursday" },
      feedback_categories: ["bug", "ui_ux", "feature_suggestion", "performance", "usability", "other"],
      severity_levels: ["critical", "high", "medium", "low"],
      mission_categories: [
        "registration",
        "profile",
        "timeline",
        "events",
        "invitations",
        "chat",
        "media",
        "performance",
      ],
      departments: DEMO_DEPARTMENTS,
    };
  }

  const supabase = await createClient();
  const [{ data: settings }, { data: departments }] = await Promise.all([
    supabase.from("settings").select("*").in("key", [...SETTINGS_KEYS]),
    supabase.from("departments").select("*").order("name"),
  ]);

  return buildSettingsFromRows(settings ?? [], departments ?? []);
}