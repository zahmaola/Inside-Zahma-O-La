"use client";

import { useTransition, useState } from "react";
import { saveWeeklyReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SaveWeeklyReportButton({
  title,
  periodStart,
  periodEnd,
}: {
  title: string;
  periodStart: string;
  periodEnd: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await saveWeeklyReport({
        title,
        period_start: periodStart,
        period_end: periodEnd,
      });
      if (result.error) setError(result.error);
      else if (result.id) router.push(`/reports/${result.id}`);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="accent" disabled={pending} onClick={onClick}>
        {pending ? "Generating…" : "Generate & save this week"}
      </Button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}