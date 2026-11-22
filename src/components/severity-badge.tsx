import { Badge } from "@/components/ui/badge";
import type { FeedbackSeverity } from "@/types/database";
import { cn } from "@/lib/utils";

const SEVERITY_VARIANT: Record<
  FeedbackSeverity,
  "danger" | "warning" | "default" | "muted"
> = {
  critical: "danger",
  high: "warning",
  medium: "default",
  low: "muted",
};

const SEVERITY_DOT: Record<FeedbackSeverity, string> = {
  critical: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-zinc-400",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: FeedbackSeverity;
  className?: string;
}) {
  const label = severity.replace("_", " ");
  return (
    <Badge variant={SEVERITY_VARIANT[severity]} className={cn("gap-1.5 capitalize", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_DOT[severity])} />
      {label}
    </Badge>
  );
}