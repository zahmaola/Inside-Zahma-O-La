"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, User } from "lucide-react";
import { getPageTitle } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

export function Topbar({
  pendingFeedback = 0,
  adminName = "Admin",
}: {
  pendingFeedback?: number;
  adminName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md">
      <div className="flex items-center justify-end gap-3 px-4 py-4 md:px-8">
        <span className="mr-auto hidden text-sm text-zinc-500 md:inline">
          {title}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full border border-white/10"
          onClick={() => router.push("/feedback?status=new")}
          aria-label="Pending feedback"
        >
          <Bell className="h-4 w-4" />
          {pendingFeedback > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-black">
              {pendingFeedback > 99 ? "99+" : pendingFeedback}
            </span>
          ) : null}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-zinc-300 transition hover:border-white/30"
              aria-label={adminName}
            >
              <User className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
