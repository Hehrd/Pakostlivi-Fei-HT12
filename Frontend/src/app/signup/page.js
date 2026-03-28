"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { queueRedirectToast } from "@/components/AppToaster";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import {
  getAllergens,
  getAuthToastContent,
  getFoodTags,
  signup,
} from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [allergens, setAllergens] = useState([]);
  const [foodTags, setFoodTags] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [selectedFoodTags, setSelectedFoodTags] = useState([]);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function buildProfilePictureUrl(nextFirstName, nextLastName) {
    const seed = encodeURIComponent(
      `${nextFirstName} ${nextLastName}`.trim() || "Munchman User"
    );
    return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
  }

  useEffect(() => {
    async function loadPreferenceOptions() {
      try {
        const [allergenPayload, foodTagPayload] = await Promise.all([
          getAllergens(),
          getFoodTags(),
        ]);

        setAllergens(allergenPayload?.allergens ?? []);
        setFoodTags(foodTagPayload?.tags ?? []);
      } catch (error) {
        toast.error("Unable to load preference options.", {
          description: error.message || "You can try refreshing the page.",
        });
      } finally {
        setIsLoadingPreferences(false);
      }
    }

    loadPreferenceOptions();
  }, []);

  function toggleSelection(value, currentValues, setter) {
    setter(
      currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (
      !trimmedFirstName ||
      !trimmedLastName ||
      !trimmedEmail ||
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

    if (password.length < 8) {
      toast.error("Password is too short.", {
        description: "Use at least 8 characters to match the backend rules.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        email: trimmedEmail,
        password,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        allergens: selectedAllergens,
        foodTags: selectedFoodTags,
        profilePictureUrl: buildProfilePictureUrl(
          trimmedFirstName,
          trimmedLastName
        ),
      });

      queueRedirectToast({
        type: "success",
        title: "Account created.",
        description:
          "Your allergens and food tags were saved with your account. Log in to continue.",
      });

      router.push("/login");
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
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f7fbf8_0%,#edf7f0_45%,#f9fcfa_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,143,87,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(22,102,64,0.10),transparent_32%)]" />
      <div className="absolute -top-24 right-[-90px] h-80 w-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="absolute bottom-[-140px] left-[42%] h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:52px_52px]" />

      <section className="relative hidden flex-1 overflow-hidden border-r border-white/10 bg-[linear-gradient(155deg,#1f8f57_0%,#23955d_46%,#166640_100%)] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.12),transparent_26%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.10),transparent_20%),radial-gradient(circle_at_50%_85%,rgba(255,255,255,0.08),transparent_28%)]" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-sm font-semibold uppercase tracking-[0.3em] shadow-[0_10px_35px_rgba(0,0,0,0.12)] backdrop-blur-md"
        >
          <Image
            src="/logo.png"
            alt="Munchman logo"
            width={44}
            height={44}
            className="h-full w-full rounded-2xl object-cover"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: "easeOut" }}
          className="relative z-10 max-w-xl space-y-7"
        >
          <p className="text-sm uppercase tracking-[0.32em] text-white/72">
            Join Munchman
          </p>

          <div className="space-y-5">
            <h1 className="max-w-[12ch] text-5xl font-semibold leading-[1.02] tracking-[-0.04em] xl:text-6xl">
              Create an account and start saving food for less.
            </h1>

            <p className="max-w-[33rem] text-lg leading-8 text-white/80">
              Join local users who reserve surplus meals, manage their food
              preferences, and collect reserved meals with confidence.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.22, ease: "easeOut" }}
          className="relative z-10 max-w-[54rem] rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur-md"
        >
          <p className="text-sm leading-7 text-white/82">
            Sign up once, choose your allergens and preferred food styles, and
            arrive with a ready-to-use discovery profile.
          </p>
        </motion.div>
      </section>

      <section className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(17,51,34,0.10)] backdrop-blur-2xl xl:p-10"
        >
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-black/5" />

          <div className="relative mb-9 space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Start saving today
            </p>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                Create your Munchman account.
              </h2>

              <p className="text-sm leading-7 text-foreground/68">
                Set up your profile and choose your allergen and food-tag
                preferences as part of signup.
              </p>
            </div>
          </div>

          <form className="relative space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2.5">
                <span className="text-sm font-medium text-foreground/82">
                  First name
                </span>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Anna"
                  autoComplete="given-name"
                  className="w-full rounded-2xl border border-border/80 bg-surface-muted/80 px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-foreground/40 transition-all duration-200 focus:-translate-y-[1px] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label className="block space-y-2.5">
                <span className="text-sm font-medium text-foreground/82">
                  Last name
                </span>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Petrova"
                  autoComplete="family-name"
                  className="w-full rounded-2xl border border-border/80 bg-surface-muted/80 px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-foreground/40 transition-all duration-200 focus:-translate-y-[1px] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label className="block space-y-2.5 md:col-span-2">
                <span className="text-sm font-medium text-foreground/82">
                  Email address
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="foodlover@munchman.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-border/80 bg-surface-muted/80 px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-foreground/40 transition-all duration-200 focus:-translate-y-[1px] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label className="block space-y-2.5">
                <span className="text-sm font-medium text-foreground/82">
                  Password
                </span>
                <div className="rounded-2xl border border-border/80 bg-surface-muted/80 transition-all duration-200 focus-within:-translate-y-[1px] focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
                  <div className="flex items-center gap-3 px-4 py-1.5">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create your Munchman password"
                      autoComplete="new-password"
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-foreground/40"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary-strong"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </label>

              <label className="block space-y-2.5">
                <span className="text-sm font-medium text-foreground/82">
                  Confirm password
                </span>
                <div className="rounded-2xl border border-border/80 bg-surface-muted/80 transition-all duration-200 focus-within:-translate-y-[1px] focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
                  <div className="flex items-center gap-3 px-4 py-1.5">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm your Munchman password"
                      autoComplete="new-password"
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-foreground/40"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary-strong"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </label>
            </div>

            <div className="rounded-[1.7rem] border border-border/75 bg-surface-muted/55 p-5">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  Preferences
                </p>
                <p className="text-sm leading-7 text-foreground/68">
                  The backend stores these during signup, so there is no need to
                  collect them in a separate onboarding step afterward.
                </p>
              </div>

              <div className="mt-5 space-y-5">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Allergens
                  </p>
                  {isLoadingPreferences ? (
                    <p className="text-sm text-foreground/60">
                      Loading preference options...
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allergens.map((allergen) => (
                        <button
                          key={allergen.id}
                          type="button"
                          onClick={() =>
                            toggleSelection(
                              allergen.id,
                              selectedAllergens,
                              setSelectedAllergens
                            )
                          }
                          className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                            selectedAllergens.includes(allergen.id)
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40"
                          }`}
                        >
                          {allergen.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Food tags you like
                  </p>
                  {isLoadingPreferences ? (
                    <p className="text-sm text-foreground/60">
                      Loading preference options...
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {foodTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            toggleSelection(
                              tag,
                              selectedFoodTags,
                              setSelectedFoodTags
                            )
                          }
                          className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                            selectedFoodTags.includes(tag)
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <AuthSubmitButton
              disabled={isSubmitting || isLoadingPreferences}
              isLoading={isSubmitting}
              loadingLabel="Creating account..."
            >
              Create account
            </AuthSubmitButton>
          </form>

          <div className="relative mt-7 flex items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-foreground/68">
            <p>Already have an account?</p>

            <Link
              href="/login"
              className="font-semibold text-primary transition-colors hover:text-primary-strong"
            >
              Log in
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
