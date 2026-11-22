export type EmployeeStatus = "active" | "inactive";

export type FeedbackCategory =
  | "bug"
  | "ui_ux"
  | "feature_suggestion"
  | "performance"
  | "usability"
  | "other";

export type FeedbackSeverity = "critical" | "high" | "medium" | "low";

export type FeedbackStatus =
  | "new"
  | "under_review"
  | "in_progress"
  | "resolved"
  | "rejected";

export type MissionStatus = "draft" | "upcoming" | "active" | "completed" | "cancelled";

export type MissionScope = "all" | "department";

export type PointsSourceType =
  | "feedback"
  | "mission"
  | "session"
  | "manual"
  | "adjustment";

export interface Department {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  full_name: string;
  department_id: string | null;
  job_title: string | null;
  avatar_url: string | null;
  status: EmployeeStatus;
  date_added: string;
  created_at: string;
  updated_at: string;
  departments?: Department | null;
}

export interface Feedback {
  id: string;
  title: string;
  description: string | null;
  employee_id: string | null;
  department_id: string | null;
  feature_module: string | null;
  category: FeedbackCategory;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
  reported_at: string;
  admin_notes: string | null;
  validated: boolean;
  validated_at: string | null;
  is_duplicate: boolean;
  points_awarded: boolean;
  created_at: string;
  updated_at: string;
  employees?: Employee | null;
  departments?: Department | null;
}

export interface FeedbackAttachment {
  id: string;
  feedback_id: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface TestingMission {
  id: string;
  title: string;
  description: string | null;
  feature_module: string | null;
  instructions: string | null;
  start_date: string;
  end_date: string;
  scope: MissionScope;
  department_id: string | null;
  status: MissionStatus;
  points_available: number;
  completion_criteria: string | null;
  created_at: string;
  updated_at: string;
  departments?: Department | null;
}

export interface MissionParticipation {
  id: string;
  mission_id: string;
  employee_id: string;
  completed_at: string;
  validated: boolean;
  validated_at: string | null;
  points_awarded: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  employees?: Employee | null;
  testing_missions?: TestingMission | null;
}

export interface TestingSession {
  id: string;
  employee_id: string;
  session_date: string;
  notes: string | null;
  feature_module: string | null;
  validated: boolean;
  points_awarded: boolean;
  created_at: string;
  updated_at: string;
  employees?: Employee | null;
}

export interface PointsTransaction {
  id: string;
  employee_id: string;
  amount: number;
  reason: string;
  source_type: PointsSourceType;
  source_id: string | null;
  created_by: string | null;
  created_at: string;
  employees?: Employee | null;
}

export interface WeeklyReport {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  payload: Record<string, unknown>;
  next_week_priorities: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: Record<string, unknown> | unknown[] | string | number | boolean | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
}

export interface PointRules {
  validated_bug: number;
  high_priority_bug: number;
  critical_bug: number;
  useful_suggestion: number;
  completed_mission: number;
  documented_session: number;
  duplicate_or_invalid: number;
}

export const DEFAULT_POINT_RULES: PointRules = {
  validated_bug: 20,
  high_priority_bug: 30,
  critical_bug: 50,
  useful_suggestion: 15,
  completed_mission: 10,
  documented_session: 5,
  duplicate_or_invalid: 0,
};

export const DEPARTMENT_DEFAULTS = [
  "Product",
  "Development",
  "Design",
  "Marketing",
  "Operations",
  "Management",
  "Other",
] as const;

export const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "ui_ux", label: "UI/UX Issue" },
  { value: "feature_suggestion", label: "Feature Suggestion" },
  { value: "performance", label: "Performance" },
  { value: "usability", label: "Usability" },
  { value: "other", label: "Other" },
];

export const FEEDBACK_SEVERITIES: { value: FeedbackSeverity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const FEEDBACK_STATUSES: { value: FeedbackStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];
