import { Suspense } from "react";
import { LoginForm } from "@/components/forms/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="login-split-left relative hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(234,88,12,0.45),_transparent_55%)]" />
      </div>

      <div className="flex min-h-screen flex-col bg-[#0c0c0c] px-6 py-8 sm:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-400">
            Sign in
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-white md:text-5xl">
            Bring your next hangout to life with Zahma O La.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Admin access for INSIDE ZAHMA — manage testing, feedback, and weekly
            recognition for the team.
          </p>

          <div className="mt-10">
            <Suspense
              fallback={
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full rounded-full" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
