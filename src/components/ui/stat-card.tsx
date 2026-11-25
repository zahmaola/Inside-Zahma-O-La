import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn("transition hover:bg-white/[0.06]", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
              {label}
            </p>
            <p className="mt-3 text-3xl font-medium tracking-tight text-white">
              {value}
            </p>
            {hint ? <p className="mt-2 text-xs text-zinc-500">{hint}</p> : null}
          </div>
          {Icon ? (
            <div className="rounded-full border border-white/10 bg-white/5 p-2.5 text-zinc-300">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
