/**
 * DEMO DATA — clearly labeled development fixtures.
 * Used only when Supabase is not configured OR SEED_DEMO_DATA=true is requested
 * by server helpers. Never mixed into production writes.
 */
import type {
  Department,
  Employee,
  Feedback,
  PointsTransaction,
  TestingMission,
  TestingSession,
  WeeklyReport,
} from "@/types/database";

const now = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
};

export const DEMO_DEPARTMENTS: Department[] = [
  { id: "d1", name: "Product", slug: "product", active: true, created_at: iso(daysAgo(60)), updated_at: iso(daysAgo(60)) },
  { id: "d2", name: "Development", slug: "development", active: true, created_at: iso(daysAgo(60)), updated_at: iso(daysAgo(60)) },
  { id: "d3", name: "Design", slug: "design", active: true, created_at: iso(daysAgo(60)), updated_at: iso(daysAgo(60)) },
  { id: "d4", name: "Marketing", slug: "marketing", active: true, created_at: iso(daysAgo(60)), updated_at: iso(daysAgo(60)) },
  { id: "d5", name: "Operations", slug: "operations", active: true, created_at: iso(daysAgo(60)), updated_at: iso(daysAgo(60)) },
  { id: "d6", name: "Management", slug: "management", active: true, created_at: iso(daysAgo(60)), updated_at: iso(daysAgo(60)) },
];

export const DEMO_EMPLOYEES: Employee[] = [
  { id: "e1", full_name: "Sara Alharbi", department_id: "d1", job_title: "Product Manager", avatar_url: null, status: "active", date_added: "2026-01-10", created_at: iso(daysAgo(40)), updated_at: iso(daysAgo(1)), departments: DEMO_DEPARTMENTS[0] },
  { id: "e2", full_name: "Omar Alqahtani", department_id: "d2", job_title: "Engineer", avatar_url: null, status: "active", date_added: "2026-01-12", created_at: iso(daysAgo(38)), updated_at: iso(daysAgo(1)), departments: DEMO_DEPARTMENTS[1] },
  { id: "e3", full_name: "Noura Almutairi", department_id: "d3", job_title: "Designer", avatar_url: null, status: "active", date_added: "2026-01-15", created_at: iso(daysAgo(35)), updated_at: iso(daysAgo(2)), departments: DEMO_DEPARTMENTS[2] },
  { id: "e4", full_name: "Fahad Alshamrani", department_id: "d4", job_title: "Marketing Lead", avatar_url: null, status: "active", date_added: "2026-01-20", created_at: iso(daysAgo(30)), updated_at: iso(daysAgo(3)), departments: DEMO_DEPARTMENTS[3] },
  { id: "e5", full_name: "Lina Aldossary", department_id: "d2", job_title: "QA Engineer", avatar_url: null, status: "active", date_added: "2026-02-01", created_at: iso(daysAgo(25)), updated_at: iso(daysAgo(1)), departments: DEMO_DEPARTMENTS[1] },
  { id: "e6", full_name: "Khalid Alotaibi", department_id: "d5", job_title: "Ops Specialist", avatar_url: null, status: "active", date_added: "2026-02-05", created_at: iso(daysAgo(20)), updated_at: iso(daysAgo(5)), departments: DEMO_DEPARTMENTS[4] },
  { id: "e7", full_name: "Reem Alsulaiman", department_id: "d1", job_title: "Product Analyst", avatar_url: null, status: "inactive", date_added: "2026-01-08", created_at: iso(daysAgo(45)), updated_at: iso(daysAgo(10)), departments: DEMO_DEPARTMENTS[0] },
  { id: "e8", full_name: "Yousef Almanea", department_id: "d6", job_title: "Director", avatar_url: null, status: "active", date_added: "2026-01-05", created_at: iso(daysAgo(50)), updated_at: iso(daysAgo(4)), departments: DEMO_DEPARTMENTS[5] },
];

export const DEMO_FEEDBACK: Feedback[] = [
  { id: "f1", title: "OTP fails on slow network", description: "Registration OTP times out after 30s on 3G.", employee_id: "e5", department_id: "d2", feature_module: "Registration", category: "bug", severity: "critical", status: "in_progress", reported_at: iso(daysAgo(2)), admin_notes: "Reproduced on staging", validated: true, validated_at: iso(daysAgo(2)), is_duplicate: false, points_awarded: true, created_at: iso(daysAgo(2)), updated_at: iso(daysAgo(1)), employees: DEMO_EMPLOYEES[4], departments: DEMO_DEPARTMENTS[1] },
  { id: "f2", title: "Timeline like animation jank", description: "Like heart stutters on older Android devices.", employee_id: "e3", department_id: "d3", feature_module: "Timeline", category: "ui_ux", severity: "medium", status: "new", reported_at: iso(daysAgo(1)), admin_notes: null, validated: false, validated_at: null, is_duplicate: false, points_awarded: false, created_at: iso(daysAgo(1)), updated_at: iso(daysAgo(1)), employees: DEMO_EMPLOYEES[2], departments: DEMO_DEPARTMENTS[2] },
  { id: "f3", title: "Add calendar export for Jadwal", description: "Export hangout plan to Apple/Google calendar.", employee_id: "e1", department_id: "d1", feature_module: "Jadwal", category: "feature_suggestion", severity: "low", status: "under_review", reported_at: iso(daysAgo(3)), admin_notes: "Good candidate for next sprint", validated: true, validated_at: iso(daysAgo(3)), is_duplicate: false, points_awarded: true, created_at: iso(daysAgo(3)), updated_at: iso(daysAgo(2)), employees: DEMO_EMPLOYEES[0], departments: DEMO_DEPARTMENTS[0] },
  { id: "f4", title: "Chat media upload fails for video", description: "Videos over 20MB fail silently.", employee_id: "e2", department_id: "d2", feature_module: "Chat", category: "bug", severity: "high", status: "resolved", reported_at: iso(daysAgo(6)), admin_notes: "Fixed compression pipeline", validated: true, validated_at: iso(daysAgo(5)), is_duplicate: false, points_awarded: true, created_at: iso(daysAgo(6)), updated_at: iso(daysAgo(1)), employees: DEMO_EMPLOYEES[1], departments: DEMO_DEPARTMENTS[1] },
  { id: "f5", title: "RSVP confirmation unclear", description: "Users unsure if they confirmed attendance.", employee_id: "e4", department_id: "d4", feature_module: "Events", category: "usability", severity: "medium", status: "new", reported_at: iso(daysAgo(0)), admin_notes: null, validated: false, validated_at: null, is_duplicate: false, points_awarded: false, created_at: iso(daysAgo(0)), updated_at: iso(daysAgo(0)), employees: DEMO_EMPLOYEES[3], departments: DEMO_DEPARTMENTS[3] },
];

export const DEMO_MISSIONS: TestingMission[] = [
  { id: "m1", title: "Test registration & OTP", description: "Walk through signup and OTP verification.", feature_module: "Registration", instructions: "Create account, request OTP, verify, then log out/in.", start_date: iso(daysAgo(3)).slice(0, 10), end_date: iso(daysAgo(-2)).slice(0, 10), scope: "all", department_id: null, status: "active", points_available: 10, completion_criteria: "OTP verified successfully", created_at: iso(daysAgo(4)), updated_at: iso(daysAgo(1)) },
  { id: "m2", title: "Test profile creation", description: "Create and edit profile fields and photo.", feature_module: "Profile", instructions: "Update name, bio, avatar; verify persistence.", start_date: iso(daysAgo(1)).slice(0, 10), end_date: iso(daysAgo(-4)).slice(0, 10), scope: "department", department_id: "d3", status: "active", points_available: 10, completion_criteria: "Profile updates persist", created_at: iso(daysAgo(2)), updated_at: iso(daysAgo(1)), departments: DEMO_DEPARTMENTS[2] },
  { id: "m3", title: "Test event RSVP flow", description: "Create event and RSVP from a second account.", feature_module: "Events", instructions: "Create hangout, invite, confirm RSVP, check timeline.", start_date: iso(daysAgo(-3)).slice(0, 10), end_date: iso(daysAgo(-7)).slice(0, 10), scope: "all", department_id: null, status: "upcoming", points_available: 10, completion_criteria: "RSVP status correct for host and guest", created_at: iso(daysAgo(1)), updated_at: iso(daysAgo(1)) },
];

export const DEMO_SESSIONS: TestingSession[] = [
  { id: "s1", employee_id: "e1", session_date: iso(daysAgo(1)).slice(0, 10), notes: "Walked through Jadwal invite flow", feature_module: "Jadwal", validated: true, points_awarded: true, created_at: iso(daysAgo(1)), updated_at: iso(daysAgo(1)), employees: DEMO_EMPLOYEES[0] },
  { id: "s2", employee_id: "e5", session_date: iso(daysAgo(2)).slice(0, 10), notes: "Regression on OTP", feature_module: "Registration", validated: true, points_awarded: true, created_at: iso(daysAgo(2)), updated_at: iso(daysAgo(2)), employees: DEMO_EMPLOYEES[4] },
  { id: "s3", employee_id: "e2", session_date: iso(daysAgo(3)).slice(0, 10), notes: "Chat upload edge cases", feature_module: "Chat", validated: true, points_awarded: true, created_at: iso(daysAgo(3)), updated_at: iso(daysAgo(3)), employees: DEMO_EMPLOYEES[1] },
];

export const DEMO_POINTS: PointsTransaction[] = [
  { id: "p1", employee_id: "e5", amount: 50, reason: "Critical bug: OTP fails on slow network", source_type: "feedback", source_id: "f1", created_by: null, created_at: iso(daysAgo(2)), employees: DEMO_EMPLOYEES[4] },
  { id: "p2", employee_id: "e1", amount: 15, reason: "Useful suggestion: calendar export", source_type: "feedback", source_id: "f3", created_by: null, created_at: iso(daysAgo(3)), employees: DEMO_EMPLOYEES[0] },
  { id: "p3", employee_id: "e2", amount: 30, reason: "High-priority bug: chat video upload", source_type: "feedback", source_id: "f4", created_by: null, created_at: iso(daysAgo(5)), employees: DEMO_EMPLOYEES[1] },
  { id: "p4", employee_id: "e1", amount: 5, reason: "Documented testing session", source_type: "session", source_id: "s1", created_by: null, created_at: iso(daysAgo(1)), employees: DEMO_EMPLOYEES[0] },
  { id: "p5", employee_id: "e5", amount: 5, reason: "Documented testing session", source_type: "session", source_id: "s2", created_by: null, created_at: iso(daysAgo(2)), employees: DEMO_EMPLOYEES[4] },
  { id: "p6", employee_id: "e2", amount: 5, reason: "Documented testing session", source_type: "session", source_id: "s3", created_by: null, created_at: iso(daysAgo(3)), employees: DEMO_EMPLOYEES[1] },
  { id: "p7", employee_id: "e3", amount: 10, reason: "Completed mission: profile creation", source_type: "mission", source_id: "m2", created_by: null, created_at: iso(daysAgo(1)), employees: DEMO_EMPLOYEES[2] },
  { id: "p8", employee_id: "e5", amount: 10, reason: "Completed mission: registration & OTP", source_type: "mission", source_id: "m1", created_by: null, created_at: iso(daysAgo(1)), employees: DEMO_EMPLOYEES[4] },
];

export const DEMO_REPORTS: WeeklyReport[] = [
  {
    id: "r1",
    title: "Week of testing — demo",
    period_start: iso(daysAgo(4)).slice(0, 10),
    period_end: iso(daysAgo(0)).slice(0, 10),
    payload: {
      is_demo: true,
      participation_rate: 62.5,
      feedback_count: 5,
      bugs_by_severity: { critical: 1, high: 1, medium: 2, low: 1 },
    },
    next_week_priorities: "Focus on chat media and RSVP clarity.",
    created_by: null,
    created_at: iso(daysAgo(0)),
    updated_at: iso(daysAgo(0)),
  },
];

export function isDemoMode() {
  return (
    process.env.SEED_DEMO_DATA === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR_PROJECT")
  );
}
