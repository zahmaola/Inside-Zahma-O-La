import { Badge } from "@/components/ui/badge";
import type { EmployeeStatus, FeedbackStatus, MissionStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const FEEDBACK_VARIANT: Record<
  FeedbackStatus,
  "info" | "warning" | "default" | "success" | "danger" | "muted"
> = {
  new: "info",
  under_review: "warning",
  in_progress: "default",
  resolved: "success",
  rejected: "danger",
};

export function FeedbackStatusBadge({
  status,
  className,
}: {
  status: FeedbackStatus;
  className?: string;
}) {
  const label = status.replace(/_/g, " ");
  return (
    <Badge variant={FEEDBACK_VARIANT[status]} className={cn("capitalize", className)}>
      {label}
    </Badge>
  );
}

export function EmployeeStatusBadge({
  status,
  className,
}: {
  status: EmployeeStatus;
  className?: string;
}) {
  return (
    <Badge
      variant={status === "active" ? "success" : "muted"}
      className={cn("capitalize", className)}
    >
      {status}
    </Badge>
  );
}

const MISSION_VARIANT: Record<
  MissionStatus,
  "success" | "info" | "warning" | "default" | "muted" | "danger"
> = {
  draft: "muted",
  upcoming: "info",
  active: "warning",
  completed: "success",
  cancelled: "danger",
};

export function MissionStatusBadge({
  status,
  className,
}: {
  status: MissionStatus;
  className?: string;
}) {
  return (
    <Badge variant={MISSION_VARIANT[status]} className={cn("capitalize", className)}>
      {status}
    </Badge>
  );
}