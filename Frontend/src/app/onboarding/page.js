"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { queueRedirectToast } from "@/components/AppToaster";
import { useAuth } from "@/components/AuthProvider";
import {
  completeOnboarding,
  getAllergens,
  getAuthToastContent,
  getFoodTags,
} from "@/lib/auth-client";
import { getUserDisplayName } from "@/lib/auth-user";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthLoading, setCurrentUser } = useAuth();
  const [allergens, setAllergens] = useState([]);
  const [foodTags, setFoodTags] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [selectedFoodTags, setSelectedFoodTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.hasOnboarded) {
      router.replace("/");
      return;
    }

    setSelectedAllergens(user.allergens ?? []);
    setSelectedFoodTags(user.preferredFoodTags ?? []);
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const [allergenPayload, foodTagPayload] = await Promise.all([
          getAllergens(),
          getFoodTags(),
        ]);
        setAllergens(allergenPayload?.allergens ?? []);
        setFoodTags(foodTagPayload?.tags ?? []);
      } catch (error) {
        toast.error("Unable to load onboarding options.", {
          description: error.message || "Please try again.",
        });
      } finally {
        setIsLoadingPreferences(false);
      }
    }

    loadPreferences();
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
    setIsSaving(true);

    try {
      const payload = await completeOnboarding({
        allergens: selectedAllergens,
        preferredFoodTags: selectedFoodTags,
      });

      const nextUser = payload?.user ?? payload;
      setCurrentUser(nextUser);

      queueRedirectToast({
        type: "success",
        title: "Onboarding complete.",
        description: "Your preferences are saved.",
      });

      router.push("/");
    } catch (error) {
      const toastContent = getAuthToastContent(error, "signup");

      toast.error("Unable to save your preferences.", {
        description: toastContent.description,
      });
      setIsSaving(false);
    }
  }

  if (isAuthLoading || !user || user.hasOnboarded) {
    return null;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10 text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f7fbf8_0%,#edf7f0_45%,#f9fcfa_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,143,87,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(22,102,64,0.10),transparent_32%)]" />

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-5xl rounded-[2rem] border border-border/70 bg-surface/95 p-8 shadow-[0_24px_80px_rgba(17,51,34,0.08)] backdrop-blur-sm sm:p-10"
      >
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-primary/20 bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
              Step 1 of 1
            </span>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-foreground">
                Finish setting up your preferences, {getUserDisplayName(user)}.
              </h1>
              <p className="text-base leading-8 text-foreground/72">
                We use allergens to surface safer meals and food tags to shape
                more relevant discovery from your very first browse.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-primary/15 bg-primary-soft/55 p-5">
              <p className="text-sm leading-7 text-foreground/74">
                Select as many as you need. You can always change these later in
                Settings.
              </p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_16px_40px_rgba(17,51,34,0.05)]">
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                  Common Allergens
                </p>
                <p className="text-sm text-foreground/68">
                  Choose the items you want Munchman to keep in mind.
                </p>
              </div>

              {isLoadingPreferences ? (
                <p className="text-sm text-foreground/60">Loading options...</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {allergens.map((allergen) => {
                    const isSelected = selectedAllergens.includes(allergen.id);

                    return (
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
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface-muted text-foreground hover:border-primary/35 hover:bg-primary-soft/40"
                        }`}
                      >
                        {allergen.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_16px_40px_rgba(17,51,34,0.05)]">
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                  Food Tags You Like
                </p>
                <p className="text-sm text-foreground/68">
                  Pick a few tags so discovery can feel more relevant right away.
                </p>
              </div>

              {isLoadingPreferences ? (
                <p className="text-sm text-foreground/60">Loading options...</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {foodTags.map((tag) => {
                    const isSelected = selectedFoodTags.includes(tag);

                    return (
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
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface-muted text-foreground hover:border-primary/35 hover:bg-primary-soft/40"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving || isLoadingPreferences}
              className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(31,143,87,0.22)] transition-[background-color,box-shadow] duration-200 ease-out hover:bg-primary-strong hover:shadow-[0_22px_45px_rgba(31,143,87,0.24)] focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSaving ? "Saving preferences..." : "Continue to Munchman"}
            </button>
          </form>
        </div>
      </motion.section>
    </main>
  );
}
