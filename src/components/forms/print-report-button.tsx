"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="gap-2"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      Print
    </Button>
  );
}