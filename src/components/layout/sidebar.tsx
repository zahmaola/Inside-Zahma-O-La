"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

const PRIMARY = NAV_ITEMS.slice(0, 4);
const SECONDARY = NAV_ITEMS.slice(4);

export function Sidebar({ adminName = "Admin" }: { adminName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="glass-panel hidden w-[260px] shrink-0 flex-col rounded-[28px] lg:flex">
      <div className="px-5 pb-2 pt-6">
        <Link href="/overview" className="flex items-center gap-2.5">
          <Image
            src="/brand/zahma-o-la-logo.png"
            alt="Zahma O La"
            width={1024}
            height={146}
            className="h-6 w-auto"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Main
          </p>
          <div className="space-y-1">
            {PRIMARY.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-all",
                    active
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-zinc-950" : "text-zinc-500")} />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Insights
          </p>
          <div className="space-y-1">
            {SECONDARY.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-all",
                    active
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-zinc-950" : "text-zinc-500")} />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="glass-panel-soft flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/10"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                {adminName.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">
                  {adminName}
                </span>
                <span className="block truncate text-xs text-zinc-500">Admin</span>
              </span>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
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
    </aside>
  );
}
