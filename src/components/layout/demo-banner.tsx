import { AlertTriangle } from "lucide-react";

export function DemoModeBanner() {
  return (
    <div className="border-b border-white/10 bg-white/[0.03] px-4 py-2.5 md:px-8">
      <div className="flex items-center gap-2 text-sm text-zinc-300">
        <AlertTriangle className="h-4 w-4 shrink-0 text-zinc-400" />
        <span>Demo mode — connect Supabase to persist data</span>
      </div>
    </div>
  );
}
