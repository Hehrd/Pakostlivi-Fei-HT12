import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(120,199,156,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(31,143,87,0.12),transparent_26%)]" />
      <section className="relative w-full max-w-5xl rounded-[2rem] border border-border/70 bg-surface/95 p-8 shadow-[0_24px_80px_rgba(17,51,34,0.08)] backdrop-blur-sm sm:p-10 lg:p-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-primary/20 bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
              Tailwind Auth Theme
            </span>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                White and green pages for login and sign up are ready to use.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
                This starter gives you a polished auth flow with theme tokens in
                Tailwind, shared styling, and responsive layouts you can connect
                to your backend next.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-surface-muted p-6">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                Explore Pages
              </p>
              <div className="grid gap-3">
                <Link
                  href="/login"
                  className="rounded-2xl bg-primary px-5 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_40px_rgba(31,143,87,0.22)] hover:-translate-y-0.5 hover:bg-primary-strong"
                >
                  Open Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-2xl border border-border bg-white px-5 py-4 text-center text-sm font-semibold text-foreground hover:border-primary/35 hover:bg-primary-soft/40"
                >
                  Open Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
