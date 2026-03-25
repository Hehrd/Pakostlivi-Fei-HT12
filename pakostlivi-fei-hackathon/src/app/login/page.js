"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queueRedirectToast } from "@/components/AppToaster";
import { getAuthToastContent, login } from "@/lib/auth-client";

const NEXT_ROUTE = "/";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      queueRedirectToast({
        type: "success",
        title: "Logged in successfully.",
        description: "Welcome back. Redirecting you to the next page now.",
      });

      router.push(NEXT_ROUTE);
    } catch (error) {
      const toastContent = getAuthToastContent(error, "login");

      toast.error(toastContent.title, {
        description: toastContent.description,
      });
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,199,156,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(223,244,231,0.42))]" />

      <section className="relative hidden flex-1 flex-col justify-between border-r border-border/70 bg-primary px-12 py-14 text-white lg:flex">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-sm font-semibold uppercase tracking-[0.3em]">
          HE
        </div>

        <div className="max-w-lg space-y-6">
          <p className="text-sm uppercase tracking-[0.32em] text-white/75">
            White & Green Theme
          </p>
          <h1 className="text-5xl font-semibold leading-tight">
            A fresh login experience for your Next.js app.
          </h1>
          <p className="max-w-md text-lg leading-8 text-white/80">
            Sign back in, pick up where you left off, and keep your team moving
            with a calm, high-contrast interface.
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
          <p className="text-sm leading-7 text-white/80">
            A successful login toast is saved before redirect so it still shows
            up after navigation.
          </p>
        </div>
      </section>

      <section className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md rounded-[2rem] border border-border/80 bg-surface/95 p-8 shadow-[0_24px_80px_rgba(17,51,34,0.08)] backdrop-blur xl:p-10">
          <div className="mb-8 space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Welcome back
            </p>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold leading-tight text-foreground">
                Sign in to continue building with your team.
              </h2>
              <p className="text-sm leading-7 text-foreground/70">
                Access your dashboard, track progress, and keep your projects
                moving.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/90">
                Email address
              </span>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-foreground/45 focus:border-primary focus:bg-white focus:ring-4 focus:ring-ring"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/90">
                Password
              </span>
              <div className="rounded-2xl border border-border bg-surface-muted focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-ring">
                <div className="flex items-center gap-3 px-4 py-1.5">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-foreground/45"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-primary hover:text-primary-strong"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(31,143,87,0.22)] transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:bg-primary-strong hover:shadow-[0_22px_45px_rgba(31,143,87,0.24)] focus:outline-none focus:ring-4 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSubmitting ? "Redirecting..." : "Log in"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/80 pt-5 text-sm text-foreground/72">
            <p>Need an account?</p>
            <Link
              href="/signup"
              className="font-semibold text-primary hover:text-primary-strong"
            >
              Create one
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
