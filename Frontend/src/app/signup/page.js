"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getAuthToastContent, signup } from "@/lib/auth-client";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      toast.error("Unable to create your account.", {
        description: "Complete every field before submitting the form.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.", {
        description: "Re-enter the same password in both fields to continue.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      toast.success("Account created.", {
        description: "Your account has been created and the auth cookies were set.",
      });

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsSubmitting(false);
    } catch (error) {
      const toastContent = getAuthToastContent(error, "signup");

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
            A calm sign-up flow with space to grow your account setup.
          </h1>
          <p className="max-w-md text-lg leading-8 text-white/80">
            Create an account, onboard new users smoothly, and tailor this page
            for registration without touching login.
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
          <p className="text-sm leading-7 text-white/80">
            Confirm password and visibility toggles are built in so the form is
            more complete before you connect backend validation.
          </p>
        </div>
      </section>

      <section className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md rounded-[2rem] border border-border/80 bg-surface/95 p-8 shadow-[0_24px_80px_rgba(17,51,34,0.08)] backdrop-blur xl:p-10">
          <div className="mb-8 space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Join the workspace
            </p>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold leading-tight text-foreground">
                Create your account in a clean white and green flow.
              </h2>
              <p className="text-sm leading-7 text-foreground/70">
                Start organizing tasks, collaborating faster, and launching with
                confidence.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/90">
                Username
              </span>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="alexgreen"
                autoComplete="username"
                className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-foreground/45 focus:border-primary focus:bg-white focus:ring-4 focus:ring-ring"
              />
            </label>

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
                    placeholder="Create a secure password"
                    autoComplete="new-password"
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

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/90">
                Confirm password
              </span>
              <div className="rounded-2xl border border-border bg-surface-muted focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-ring">
                <div className="flex items-center gap-3 px-4 py-1.5">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-foreground/45"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-primary hover:text-primary-strong"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(31,143,87,0.22)] transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:bg-primary-strong hover:shadow-[0_22px_45px_rgba(31,143,87,0.24)] focus:outline-none focus:ring-4 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/80 pt-5 text-sm text-foreground/72">
            <p>Already have an account?</p>
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-strong"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
