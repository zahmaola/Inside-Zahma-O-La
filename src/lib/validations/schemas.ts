import { z, type ZodError } from "zod";

export function formatZodError(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const employeeSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  department_id: z.string().uuid().nullable().optional(),
  job_title: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
  date_added: z.string().optional(),
});

export const testingSessionSchema = z.object({
  employee_id: z.string().uuid(),
  session_date: z.string().min(1),
  notes: z.string().optional().nullable(),
  feature_module: z.string().optional().nullable(),
  award_points: z.boolean().default(true),
});

export const feedbackSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional().nullable(),
  employee_id: z.string().uuid().nullable().optional(),
  feature_module: z.string().optional().nullable(),
  category: z.enum([
    "bug",
    "ui_ux",
    "feature_suggestion",
    "performance",
    "usability",
    "other",
  ]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  status: z.enum([
    "new",
    "under_review",
    "in_progress",
    "resolved",
    "rejected",
  ]),
  reported_at: z.string().optional(),
  admin_notes: z.string().optional().nullable(),
  is_duplicate: z.boolean().default(false),
});

export const missionSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  feature_module: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  scope: z.enum(["all", "department"]).default("all"),
  department_id: z.string().uuid().nullable().optional(),
  status: z.enum(["draft", "upcoming", "active", "completed", "cancelled"]),
  points_available: z.coerce.number().int().min(0).default(10),
  completion_criteria: z.string().optional().nullable(),
});

export const missionParticipationSchema = z.object({
  mission_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  completed_at: z.string().optional(),
  validated: z.boolean().default(true),
  admin_notes: z.string().optional().nullable(),
});

export const pointsAdjustmentSchema = z.object({
  employee_id: z.string().uuid(),
  amount: z.coerce.number().int(),
  reason: z.string().min(3, "Reason is required"),
});

export const settingsSchema = z.object({
  campaign_name: z.string().min(1),
  point_rules: z.object({
    critical_bug: z.coerce.number().int().min(0),
    high_priority_bug: z.coerce.number().int().min(0),
    medium_bug: z.coerce.number().int().min(0),
    low_bug: z.coerce.number().int().min(0),
    useful_suggestion: z.coerce.number().int().min(0),
    completed_mission: z.coerce.number().int().min(0),
    documented_session: z.coerce.number().int().min(0),
    duplicate_or_invalid: z.coerce.number().int().min(0),
  }),
});
