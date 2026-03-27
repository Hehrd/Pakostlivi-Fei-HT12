"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { API_MODE } from "@/lib/api";
import {
  changePassword,
  getAllergens,
  getFoodTags,
  updatePreferredFoodTags,
  updateUserAllergens,
} from "@/lib/auth-client";
import {
  getUserDisplayName,
  isAdminUser,
  isClientUser,
  isRestaurantUser,
} from "@/lib/auth-user";
import { startRestaurantStripeOnboarding } from "@/lib/restaurant-client";

function SettingsCard({ eyebrow, title, description, children }) {
  return (
    <section className="rounded-[1.9rem] border border-border/80 bg-white/92 p-6 shadow-[0_22px_55px_rgba(17,51,34,0.07)] backdrop-blur-sm">
      <div className="mb-5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-foreground/66">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function PreferenceChip({ active, children, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface-muted text-foreground/74 hover:border-primary/40 hover:bg-primary-soft/45 disabled:cursor-not-allowed disabled:opacity-60"
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthLoading, setCurrentUser } = useAuth();
  const [availableAllergens, setAvailableAllergens] = useState([]);
  const [availableFoodTags, setAvailableFoodTags] = useState([]);
  const [draftAllergens, setDraftAllergens] = useState([]);
  const [draftPreferredFoodTags, setDraftPreferredFoodTags] = useState([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingAllergens, setIsSavingAllergens] = useState(false);
  const [isSavingPreferredFoods, setIsSavingPreferredFoods] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isStartingStripeOnboarding, setIsStartingStripeOnboarding] =
    useState(false);
  const isPreferenceWriteUnavailable = false;
  const isPasswordWriteUnavailable = API_MODE !== "mock";
  const isStripeConnectUnavailable = API_MODE !== "real";
  const isAdmin = isAdminUser(user);
  const isRestaurant = isRestaurantUser(user);
  const isClient = isClientUser(user);
  const profileInitials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join("");
  const roleLabel = isAdmin
    ? "Admin account"
    : isRestaurant
      ? "Restaurant owner account"
      : "Client account";
  const heroTitle = isAdmin
    ? "Manage your admin account without the customer-only extras."
    : isRestaurant
      ? "Keep your restaurant-owner account details tidy and secure."
      : "Tune your account around how you actually eat.";
  const heroDescription = isAdmin
    ? "Security and profile details live here. Customer food preferences stay hidden for admin accounts."
    : isRestaurant
      ? "Update your account details here. Meal discovery preferences stay out of the way for restaurant-owner accounts."
      : "Update your password, allergen exclusions, and the food styles you want MunchMun to surface more often.";
  const backHref = isAdmin
    ? "/admin/restaurants"
    : isRestaurant
      ? "/restaurant/food-sales"
      : "/";
  const backLabel = isAdmin
    ? "Back to admin"
    : isRestaurant
      ? "Back to food sales"
      : "Back to home";

  const savedAllergensKey = useMemo(
    () => (user?.allergens ?? []).slice().sort().join("|"),
    [user]
  );
  const savedPreferredFoodTagsKey = useMemo(
    () => (user?.preferredFoodTags ?? []).slice().sort().join("|"),
    [user]
  );
  const draftAllergensKey = draftAllergens.slice().sort().join("|");
  const draftPreferredFoodTagsKey = draftPreferredFoodTags
    .slice()
    .sort()
    .join("|");
  const hasUnsavedAllergens = savedAllergensKey !== draftAllergensKey;
  const hasUnsavedPreferredFoods =
    savedPreferredFoodTagsKey !== draftPreferredFoodTagsKey;

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    setDraftAllergens(user.allergens ?? []);
    setDraftPreferredFoodTags(user.preferredFoodTags ?? []);
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    async function loadOptions() {
      if (!isClient) {
        setAvailableAllergens([]);
        setAvailableFoodTags([]);
        return;
      }

      try {
        const [allergenPayload, foodTagPayload] = await Promise.all([
          getAllergens(),
          getFoodTags(),
        ]);

        setAvailableAllergens(allergenPayload?.allergens ?? []);
        setAvailableFoodTags(foodTagPayload?.tags ?? []);
      } catch (error) {
        toast.error("Unable to load settings options.", {
          description: error.message || "Please try again.",
        });
      }
    }

    loadOptions();
  }, [isClient]);

  function toggleAllergen(allergenId) {
    setDraftAllergens((current) =>
      current.includes(allergenId)
        ? current.filter((item) => item !== allergenId)
        : [...current, allergenId]
    );
  }

  function togglePreferredFoodTag(tag) {
    setDraftPreferredFoodTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }

  async function handleSaveAllergens() {
    setIsSavingAllergens(true);

    try {
      const payload = await updateUserAllergens({
        allergens: draftAllergens,
      });

      setCurrentUser(payload?.user ?? payload);
      toast.success("Allergen preferences updated.");
    } catch (error) {
      toast.error("Unable to update allergens.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSavingAllergens(false);
    }
  }

  async function handleSavePreferredFoods() {
    setIsSavingPreferredFoods(true);

    try {
      const payload = await updatePreferredFoodTags({
        preferredFoodTags: draftPreferredFoodTags,
      });

      setCurrentUser(payload?.user ?? payload);
      toast.success("Preferred foods updated.");
    } catch (error) {
      toast.error("Unable to update preferred foods.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSavingPreferredFoods(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Unable to change password.", {
        description: "Complete all password fields first.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.", {
        description: "Confirm the same new password in both fields.",
      });
      return;
    }

    setIsSavingPassword(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } catch (error) {
      toast.error("Unable to change password.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleStartStripeOnboarding() {
    setIsStartingStripeOnboarding(true);

    try {
      const payload = await startRestaurantStripeOnboarding();

      if (!payload?.url) {
        throw {
          status: 400,
          message: "The backend did not return a Stripe onboarding URL.",
        };
      }

      window.location.href = payload.url;
    } catch (error) {
      toast.error("Unable to open Stripe onboarding.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsStartingStripeOnboarding(false);
    }
  }

  if (isAuthLoading || !user) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-5 text-foreground lg:px-5">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#f8fcf9_0%,#eef8f1_46%,#fbfefc_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,143,87,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,102,64,0.08),transparent_30%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative mx-auto max-w-[1450px] space-y-6"
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2.25rem] border border-border/75 bg-[linear-gradient(150deg,#1f8f57_0%,#208a55_45%,#155c3a_100%)] p-7 text-white shadow-[0_28px_70px_rgba(17,51,34,0.12)]">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-white/18 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/86">
                Account Hub
              </span>
              <div className="space-y-3">
                <h1 className="max-w-[16ch] text-4xl font-semibold leading-[1.05] tracking-[-0.04em]">
                  {heroTitle}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                  {heroDescription}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[2.25rem] border border-border/75 bg-white/85 p-6 shadow-[0_24px_65px_rgba(17,51,34,0.08)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Profile
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">
                {profileInitials || "MM"}
              </div>
              <div className="space-y-1">
                <p className="text-xl font-semibold text-foreground">
                  {getUserDisplayName(user)}
                </p>
                <p className="text-sm text-foreground/62">{user.email}</p>
                <p className="text-sm text-foreground/56">{roleLabel}</p>
                {isClient ? (
                  <p className="text-sm text-foreground/56">
                    Wallet balance: {Number(user.walletBalance ?? 0).toFixed(2)} lv
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          {isRestaurant ? (
            <SettingsCard
              eyebrow="Stripe"
              title="Connect your payout account"
              description="This frontend currently assumes your restaurant account still needs Stripe onboarding, so the connect action is always available here."
            >
              <div className="space-y-4">
                <div className="rounded-[1.4rem] border border-border bg-surface-muted/65 p-4 text-sm leading-7 text-foreground/68">
                  Stripe handles the account connection flow on its hosted page.
                  If Stripe sends you back here because the onboarding link
                  expired, press the button again to generate a fresh link.
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStartStripeOnboarding}
                    disabled={
                      isStripeConnectUnavailable || isStartingStripeOnboarding
                    }
                    className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    {isStripeConnectUnavailable
                      ? "Unavailable"
                      : isStartingStripeOnboarding
                        ? "Opening Stripe..."
                        : "Connect Stripe account"}
                  </button>
                  <p className="text-sm text-foreground/62">
                    {isStripeConnectUnavailable
                      ? "Stripe onboarding is only wired when the app is using the real backend."
                      : "You will be redirected to Stripe to connect the restaurant account."}
                  </p>
                </div>
              </div>
            </SettingsCard>
          ) : null}

          <SettingsCard
            eyebrow="Security"
            title="Change password"
            description="Update your password to keep your account secure."
          >
            <form className="space-y-4" onSubmit={handleChangePassword}>
              <input
                type="password"
                value={currentPassword}
                disabled={isPasswordWriteUnavailable}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
                className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
              <input
                type="password"
                value={newPassword}
                disabled={isPasswordWriteUnavailable}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
              <input
                type="password"
                value={confirmPassword}
                disabled={isPasswordWriteUnavailable}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="submit"
                disabled={isSavingPassword || isPasswordWriteUnavailable}
                className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isPasswordWriteUnavailable
                  ? "Unavailable"
                  : isSavingPassword
                    ? "Updating password..."
                    : "Save new password"}
              </button>
              {isPasswordWriteUnavailable ? (
                <p className="text-sm text-foreground/62">
                  Password updates are not available from the connected API yet.
                </p>
              ) : null}
            </form>
          </SettingsCard>

          {isClient ? (
            <SettingsCard
              eyebrow="Allergens"
              title="Manage allergen exclusions"
              description="These are used to exclude meals automatically while you browse nearby food sales."
            >
              <div className="flex flex-wrap gap-2">
                {availableAllergens.map((allergen) => (
                  <PreferenceChip
                    key={allergen.id}
                    disabled={isPreferenceWriteUnavailable}
                    active={draftAllergens.includes(allergen.id)}
                    onClick={() => toggleAllergen(allergen.id)}
                  >
                    {allergen.label}
                  </PreferenceChip>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveAllergens}
                  disabled={
                    !hasUnsavedAllergens ||
                    isSavingAllergens ||
                    isPreferenceWriteUnavailable
                  }
                  className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {isPreferenceWriteUnavailable
                    ? "Unavailable"
                    : isSavingAllergens
                      ? "Saving allergens..."
                      : "Save allergens"}
                </button>
                <p className="text-sm text-foreground/62">
                  {isPreferenceWriteUnavailable
                    ? "Allergen preferences are currently read-only with the connected API."
                    : draftAllergens.length > 0
                      ? `Selected: ${draftAllergens.join(", ")}`
                      : "No allergens selected yet."}
                </p>
              </div>
            </SettingsCard>

          ) : (
            <SettingsCard
              eyebrow="Role"
              title="Role-specific settings"
              description="This account type does not use customer meal discovery preferences."
            >
              <div className="space-y-4 text-sm leading-7 text-foreground/66">
                <p>
                  Allergen exclusions and preferred food tags are only shown for
                  client accounts, because those preferences shape what the home
                  feed and filters surface.
                </p>
                <p>
                  Your account still has access to profile details and password
                  management here when those features are supported by the API.
                </p>
              </div>
            </SettingsCard>
          )}

          {isClient ? (
            <div className="xl:col-span-2">
              <SettingsCard
                eyebrow="Taste profile"
                title="Preferred foods"
                description="Pick the food tags you want prioritized while browsing food sales."
              >
                <div className="flex flex-wrap gap-2">
                  {availableFoodTags.map((tag) => (
                    <PreferenceChip
                      key={tag}
                      disabled={isPreferenceWriteUnavailable}
                      active={draftPreferredFoodTags.includes(tag)}
                      onClick={() => togglePreferredFoodTag(tag)}
                    >
                      {tag}
                    </PreferenceChip>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSavePreferredFoods}
                    disabled={
                      !hasUnsavedPreferredFoods ||
                      isSavingPreferredFoods ||
                      isPreferenceWriteUnavailable
                    }
                    className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    {isPreferenceWriteUnavailable
                      ? "Unavailable"
                      : isSavingPreferredFoods
                        ? "Saving preferred foods..."
                        : "Save preferred foods"}
                  </button>
                  <p className="text-sm text-foreground/62">
                    {isPreferenceWriteUnavailable
                      ? "Preferred food tags are currently read-only with the connected API."
                      : draftPreferredFoodTags.length > 0
                        ? `Selected: ${draftPreferredFoodTags.join(", ")}`
                        : "No preferred food tags selected yet."}
                  </p>
                </div>
              </SettingsCard>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={backHref}
            className="rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/35 hover:bg-primary-soft/35"
          >
            {backLabel}
          </Link>
        </div>
      </motion.section>
    </main>
  );
}

