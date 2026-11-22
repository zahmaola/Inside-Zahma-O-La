"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, type ActionResult } from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const initialState: ActionResult = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const unconfigured = !isSupabaseConfigured();

  return (
    <form action={formAction} className="space-y-8">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {unconfigured ? (
        <div className="space-y-3 border border-white/15 px-4 py-3 text-sm text-zinc-300">
          <p>
            Supabase is not connected yet. Add your project keys to{" "}
            <code className="text-white">.env.local</code>, or browse demo data.
          </p>
          <a
            href="/overview"
            className="inline-flex text-white underline underline-offset-4"
          >
            Browse demo dashboard →
          </a>
        </div>
      ) : null}

      {state.error ? (
        <p className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-7">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder=" "
            className="underline-field"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder=" "
            className="underline-field"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
