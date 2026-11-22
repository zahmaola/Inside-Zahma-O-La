"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-4 right-4 z-40"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/80 p-4 backdrop-blur-sm">
          <div className="ml-auto max-w-xs rounded-2xl border border-white/10 bg-black p-3">
            <div className="px-3 py-3">
              <Image
                src="/brand/zahma-o-la-logo.png"
                alt="Zahma O La"
                width={1024}
                height={146}
                className="h-5 w-auto"
              />
            </div>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm",
                      active
                        ? "bg-white/10 text-white"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
            <Button
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
