"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[240px] shrink-0 border-r border-white/10 bg-black lg:flex lg:flex-col">
      <div className="px-5 py-6">
        <Link href="/overview" className="block">
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

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300",
                )}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
