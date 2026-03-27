"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import {
  getUserDisplayName,
  isAdminUser,
  isClientUser,
  isRestaurantUser,
} from "@/lib/auth-user";
import {
  createRestaurantFoodSale,
  deleteRestaurantFoodSale,
  fetchMyRestaurantFoodSales,
  fetchOwnerRestaurants,
  fetchRestaurantFoodSaleOptions,
  updateOwnedRestaurant,
  updateRestaurantFoodSale,
} from "@/lib/restaurant-client";

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  quantity: "1",
  issuedAt: "",
  expiresAt: "",
  allergenIds: [],
  foodTagIds: [],
};

function Panel({ title, description, children, className = "" }) {
  return (
    <section
      className={`rounded-[1.9rem] border border-border/75 bg-white/92 p-6 shadow-[0_22px_55px_rgba(17,51,34,0.07)] backdrop-blur-sm ${className}`}
    >
      <div className="mb-5 space-y-2">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
          {title}
        </h2>
        <p className="text-sm leading-7 text-foreground/66">{description}</p>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, tone = "primary" }) {
  const toneClassName =
    tone === "neutral"
      ? "bg-surface-muted text-foreground"
      : "bg-primary-soft text-primary";

  return (
    <div className={`rounded-[1.5rem] p-4 ${toneClassName}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function OptionChip({ active, disabled = false, onClick, children }) {
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

function FoodSaleCard({ foodSale, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(foodSale)}
      className={`w-full rounded-[1.6rem] border p-5 text-left transition ${
        isSelected
          ? "border-primary bg-primary-soft/55 shadow-[0_16px_36px_rgba(31,143,87,0.12)]"
          : "border-border bg-white hover:border-primary/30 hover:bg-primary-soft/25"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{foodSale.title}</h3>
          <p className="text-sm leading-7 text-foreground/66">
            {foodSale.description}
          </p>
        </div>
        <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-primary">
          {foodSale.price.toFixed(2)} lv
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground/72">
          Pickup {foodSale.pickupWindow}
        </span>
        <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground/72">
          {foodSale.quantity ? `${foodSale.quantity} meals` : "Quantity unavailable"}
        </span>
      </div>

      {foodSale.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {foodSale.tags.map((tag) => (
            <span
              key={`${foodSale.id}-${tag}`}
              className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-foreground/68"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {foodSale.allergens?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {foodSale.allergens.map((allergen) => (
            <span
              key={`${foodSale.id}-${allergen}`}
              className="rounded-full border border-border/75 bg-white px-3 py-1 text-xs font-medium text-foreground/60"
            >
              {allergen}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoString(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function buildFormStateFromFoodSale(foodSale) {
  if (!foodSale) {
    return EMPTY_FORM;
  }

  return {
    title: foodSale.title ?? "",
    description: foodSale.description ?? "",
    price: String(foodSale.price ?? ""),
    quantity: foodSale.quantity ? String(foodSale.quantity) : "",
    issuedAt: toDateTimeLocalValue(foodSale.issuedAt),
    expiresAt: toDateTimeLocalValue(foodSale.expiresAt),
    allergenIds: Array.isArray(foodSale.allergenIds) ? foodSale.allergenIds : [],
    foodTagIds: Array.isArray(foodSale.foodTagIds) ? foodSale.foodTagIds : [],
  };
}

export default function RestaurantFoodSalesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthLoading } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState(null);
  const [foodSales, setFoodSales] = useState([]);
  const [totals, setTotals] = useState({
    foodSaleCount: 0,
    reservationCount: 0,
    reservedMeals: 0,
  });
  const [selectedFoodSaleId, setSelectedFoodSaleId] = useState(null);
  const [options, setOptions] = useState({
    allergens: [],
    foodTags: [],
  });
  const [formMode, setFormMode] = useState("create");
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    googleMapsUrl: "",
    lat: "",
    lng: "",
  });
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingRestaurant, setIsSavingRestaurant] = useState(false);
  const [apiNotice, setApiNotice] = useState("");
  const stripeFlowState = searchParams.get("stripe");

  const selectedFoodSale = useMemo(
    () => foodSales.find((foodSale) => foodSale.id === selectedFoodSaleId) ?? null,
    [foodSales, selectedFoodSaleId]
  );

  function applyWorkspacePayload(payload, nextSelectedFoodSaleId = null) {
    const nextRestaurants = payload?.restaurants ?? [];
    const nextRestaurant = payload?.restaurant ?? null;
    const nextFoodSales = payload?.foodSales ?? [];

    setRestaurants(nextRestaurants);
    setRestaurant(nextRestaurant);
    setFoodSales(nextFoodSales);
    setTotals(
      payload?.totals ?? {
        foodSaleCount: nextFoodSales.length,
        reservationCount: 0,
        reservedMeals: 0,
      }
    );
    setSelectedRestaurantId(nextRestaurant?.id ?? "");
    setRestaurantForm({
      name: nextRestaurant?.name ?? "",
      googleMapsUrl: nextRestaurant?.googleMapsUrl ?? "",
      lat:
        nextRestaurant && Number.isFinite(Number(nextRestaurant.lat))
          ? String(nextRestaurant.lat)
          : "",
      lng:
        nextRestaurant && Number.isFinite(Number(nextRestaurant.lng))
          ? String(nextRestaurant.lng)
          : "",
    });

    if (
      nextSelectedFoodSaleId &&
      nextFoodSales.some((foodSale) => foodSale.id === nextSelectedFoodSaleId)
    ) {
      setSelectedFoodSaleId(nextSelectedFoodSaleId);
      setFormMode("edit");
      setFormState(
        buildFormStateFromFoodSale(
          nextFoodSales.find((foodSale) => foodSale.id === nextSelectedFoodSaleId)
        )
      );
      return;
    }

    setSelectedFoodSaleId(null);
    setFormMode("create");
    setFormState(EMPTY_FORM);
  }

  function handleStartCreate() {
    setSelectedFoodSaleId(null);
    setFormMode("create");
    setFormState(EMPTY_FORM);
  }

  function handleSelectFoodSale(foodSale) {
    setSelectedFoodSaleId(foodSale.id);
    setFormMode("edit");
    setFormState(buildFormStateFromFoodSale(foodSale));
  }

  function toggleOption(field, optionId) {
    setFormState((current) => ({
      ...current,
      [field]: current[field].includes(optionId)
        ? current[field].filter((item) => item !== optionId)
        : [...current[field], optionId],
    }));
  }

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (isAdminUser(user)) {
      router.replace("/admin/restaurants");
      return;
    }

    if (isClientUser(user)) {
      router.replace("/");
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    async function loadPageChrome() {
      setIsPageLoading(true);

      try {
        const [restaurantsPayload, optionsPayload] = await Promise.all([
          fetchOwnerRestaurants(),
          fetchRestaurantFoodSaleOptions(),
        ]);

        const ownedRestaurants = restaurantsPayload?.restaurants ?? [];
        setRestaurants(ownedRestaurants);
        setOptions(optionsPayload ?? { allergens: [], foodTags: [] });
        setSelectedRestaurantId((current) => {
          if (
            current &&
            ownedRestaurants.some((item) => item.id === current)
          ) {
            return current;
          }

          return ownedRestaurants[0]?.id ?? "";
        });
        setApiNotice(
          ownedRestaurants.length > 0
            ? "Reservations are still read-only here until the backend exposes restaurant reservation queues."
            : ""
        );
      } catch (error) {
        toast.error("Unable to load restaurant tools.", {
          description: error.message || "Please try again.",
        });
      } finally {
        setIsPageLoading(false);
      }
    }

    if (user && isRestaurantUser(user)) {
      loadPageChrome();
    }
  }, [user]);

  useEffect(() => {
    async function loadWorkspace() {
      if (!selectedRestaurantId) {
      setRestaurant(null);
      setFoodSales([]);
      setTotals({
          foodSaleCount: 0,
        reservationCount: 0,
        reservedMeals: 0,
      });
      setRestaurantForm({
        name: "",
        googleMapsUrl: "",
        lat: "",
        lng: "",
      });
      handleStartCreate();
      return;
    }

      setIsWorkspaceLoading(true);

      try {
        const payload = await fetchMyRestaurantFoodSales(selectedRestaurantId);
        applyWorkspacePayload(payload);
      } catch (error) {
        toast.error("Unable to load food sales.", {
          description: error.message || "Please try again.",
        });
      } finally {
        setIsWorkspaceLoading(false);
      }
    }

    if (user && isRestaurantUser(user) && !isPageLoading) {
      loadWorkspace();
    }
  }, [isPageLoading, selectedRestaurantId, user]);

  useEffect(() => {
    if (!user || !isRestaurantUser(user) || stripeFlowState !== "return") {
      return;
    }

    toast.success("Returned from Stripe onboarding.", {
      description:
        "If Stripe still needs more details later, you can reopen onboarding from Settings.",
    });
    router.replace("/restaurant/food-sales");
  }, [router, stripeFlowState, user]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedRestaurantId) {
      toast.error("Pick a restaurant first.");
      return;
    }

    if (!formState.title.trim()) {
      toast.error("Food sale name is required.");
      return;
    }

    if (!formState.price || Number(formState.price) < 0) {
      toast.error("Enter a valid price.");
      return;
    }

    if (formMode === "create" && (!formState.quantity || Number(formState.quantity) <= 0)) {
      toast.error("Enter a valid quantity.");
      return;
    }

    if (formMode === "edit" && (!formState.quantity || Number(formState.quantity) <= 0)) {
      toast.error("Enter a valid quantity.");
      return;
    }

    const issuedAt = toIsoString(formState.issuedAt);
    const expiresAt = toIsoString(formState.expiresAt);

    if (issuedAt && expiresAt && new Date(expiresAt) <= new Date(issuedAt)) {
      toast.error("Pickup end must be after pickup start.");
      return;
    }

    setIsSaving(true);

    try {
      const payload =
        formMode === "create"
          ? await createRestaurantFoodSale({
              restaurantId: selectedRestaurantId,
              title: formState.title,
              description: formState.description,
              price: formState.price,
              quantity: formState.quantity,
              issuedAt,
              expiresAt,
              allergenIds: formState.allergenIds,
              foodTagIds: formState.foodTagIds,
            })
          : await updateRestaurantFoodSale({
              restaurantId: selectedRestaurantId,
              saleId: selectedFoodSale?.saleId,
              foodId: selectedFoodSale?.foodId,
              title: formState.title,
              description: formState.description,
              price: formState.price,
              quantity: formState.quantity,
              issuedAt,
              expiresAt,
              allergenIds: formState.allergenIds,
              foodTagIds: formState.foodTagIds,
            });

      applyWorkspacePayload(
        payload,
        formMode === "edit" ? selectedFoodSale?.id ?? null : null
      );
      toast.success(
        formMode === "create" ? "Food sale created." : "Food sale updated."
      );
    } catch (error) {
      toast.error(
        formMode === "create" ? "Unable to create food sale." : "Unable to update food sale.",
        {
          description: error.message || "Please try again.",
        }
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedFoodSale || !selectedRestaurantId) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${selectedFoodSale.title}? This removes the active food sale from the restaurant dashboard.`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const payload = await deleteRestaurantFoodSale({
        restaurantId: selectedRestaurantId,
        saleId: selectedFoodSale.saleId,
      });
      applyWorkspacePayload(payload);
      toast.success("Food sale deleted.");
    } catch (error) {
      toast.error("Unable to delete food sale.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSaveRestaurant(event) {
    event.preventDefault();

    if (!selectedRestaurantId) {
      toast.error("Pick a restaurant first.");
      return;
    }

    if (!restaurantForm.name.trim()) {
      toast.error("Restaurant name is required.");
      return;
    }

    if (
      restaurantForm.lat.trim() === "" ||
      restaurantForm.lng.trim() === "" ||
      !Number.isFinite(Number(restaurantForm.lat)) ||
      !Number.isFinite(Number(restaurantForm.lng))
    ) {
      toast.error("Enter valid restaurant coordinates.");
      return;
    }

    setIsSavingRestaurant(true);

    try {
      const payload = await updateOwnedRestaurant({
        restaurantId: selectedRestaurantId,
        name: restaurantForm.name,
        googleMapsUrl: restaurantForm.googleMapsUrl,
        lat: restaurantForm.lat,
        lng: restaurantForm.lng,
      });

      const updatedRestaurant = payload?.restaurant ?? null;

      setRestaurant(updatedRestaurant);
      setRestaurants((current) =>
        current.map((item) =>
          item.id === updatedRestaurant?.id
            ? {
                ...item,
                ...updatedRestaurant,
                foodSaleCount: item.foodSaleCount ?? 0,
              }
            : item
        )
      );
      setRestaurantForm({
        name: updatedRestaurant?.name ?? "",
        googleMapsUrl: updatedRestaurant?.googleMapsUrl ?? "",
        lat:
          updatedRestaurant && Number.isFinite(Number(updatedRestaurant.lat))
            ? String(updatedRestaurant.lat)
            : "",
        lng:
          updatedRestaurant && Number.isFinite(Number(updatedRestaurant.lng))
            ? String(updatedRestaurant.lng)
            : "",
      });
      toast.success("Restaurant details updated.");
    } catch (error) {
      toast.error("Unable to update restaurant.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSavingRestaurant(false);
    }
  }

  if (isAuthLoading || !user || !isRestaurantUser(user)) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-5 text-foreground lg:px-5">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#f9fcfa_0%,#edf7f0_46%,#fbfefc_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,143,87,0.10),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,102,64,0.08),transparent_30%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative mx-auto max-w-[1550px] space-y-6"
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2.2rem] border border-border/80 bg-[linear-gradient(155deg,#154d33_0%,#1f8f57_46%,#2ca369_100%)] p-7 text-white shadow-[0_26px_70px_rgba(17,51,34,0.14)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/75">
              Restaurant Console
            </p>
            <div className="mt-4 space-y-3">
              <h1 className="max-w-[14ch] text-4xl font-semibold leading-[1.02] tracking-[-0.04em]">
                Build and manage live meal food sales for your restaurants.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                Pick one of your owned restaurants, publish a food sale,
                and keep the active pickup windows and meal tags up to date.
              </p>
            </div>
          </section>

          <aside className="rounded-[2.2rem] border border-border/75 bg-white/88 p-6 shadow-[0_22px_60px_rgba(17,51,34,0.08)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Signed in as
            </p>
            <p className="mt-3 text-2xl font-semibold text-foreground">
              {getUserDisplayName(user)}
            </p>
            <p className="mt-1 text-sm text-foreground/60">{user.email}</p>

            <div className="mt-6 space-y-3">
              <MetricCard
                label="Restaurant"
                value={restaurant?.name ?? "No restaurant selected"}
              />
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Food Sales" value={totals.foodSaleCount} />
                <MetricCard
                  label="Reservations"
                  value="Soon"
                  tone="neutral"
                />
              </div>
              <MetricCard
                label="Owned restaurants"
                value={restaurants.length}
                tone="neutral"
              />
              {restaurant?.googleMapsUrl ? (
                <a
                  href={restaurant.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-medium text-primary hover:text-primary-strong"
                >
                  Open restaurant in Google Maps
                </a>
              ) : null}
            </div>
          </aside>
        </div>

        {apiNotice ? (
          <section className="rounded-[1.7rem] border border-primary/15 bg-primary-soft/60 px-5 py-4 text-sm leading-7 text-foreground/72">
            {apiNotice}
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Panel
            title="Workspace"
            description="Choose which owned restaurant you want to publish food sales for, then switch between creating a new food sale and editing an existing one."
          >
            {isPageLoading ? (
              <div className="rounded-[1.6rem] border border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                Loading restaurant tools...
              </div>
            ) : restaurants.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                No owned restaurants came back from `/restaurants/by-owner` yet.
              </div>
            ) : (
              <div className="space-y-5">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">
                    Restaurant workspace
                  </span>
                  <select
                    value={selectedRestaurantId}
                    onChange={(event) => setSelectedRestaurantId(event.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  >
                    {restaurants.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <form
                  className="space-y-4 rounded-[1.6rem] border border-border bg-surface-muted/60 p-4"
                  onSubmit={handleSaveRestaurant}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Restaurant details
                    </p>
                    <p className="text-sm leading-6 text-foreground/62">
                      The backend now lets restaurant owners update their own
                      restaurant record, so this form edits the selected workspace
                      directly.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold text-foreground">
                        Restaurant name
                      </span>
                      <input
                        type="text"
                        value={restaurantForm.name}
                        onChange={(event) =>
                          setRestaurantForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold text-foreground">
                        Google Maps URL
                      </span>
                      <input
                        type="url"
                        value={restaurantForm.googleMapsUrl}
                        onChange={(event) =>
                          setRestaurantForm((current) => ({
                            ...current,
                            googleMapsUrl: event.target.value,
                          }))
                        }
                        placeholder="https://maps.google.com/..."
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">
                        Latitude
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={restaurantForm.lat}
                        onChange={(event) =>
                          setRestaurantForm((current) => ({
                            ...current,
                            lat: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">
                        Longitude
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={restaurantForm.lng}
                        onChange={(event) =>
                          setRestaurantForm((current) => ({
                            ...current,
                            lng: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingRestaurant || !selectedRestaurantId}
                    className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSavingRestaurant
                      ? "Saving restaurant..."
                      : "Save restaurant details"}
                  </button>
                </form>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong"
                  >
                    New food sale
                  </button>
                  {selectedFoodSale ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isDeleting ? "Deleting..." : "Delete selected"}
                    </button>
                  ) : null}
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold text-foreground">
                        Food sale title
                      </span>
                      <input
                        type="text"
                        value={formState.title}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        placeholder="Smoked chicken bowls"
                        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold text-foreground">
                        Description
                      </span>
                      <textarea
                        rows={4}
                        value={formState.description}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Short note about what customers will pick up."
                        className="w-full rounded-[1.4rem] border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">
                        Price
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formState.price}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            price: event.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">
                        Quantity
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formState.quantity}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            quantity: event.target.value,
                          }))
                        }
                        placeholder="1"
                        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">
                        Pickup starts
                      </span>
                      <input
                        type="datetime-local"
                        value={formState.issuedAt}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            issuedAt: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">
                        Pickup ends
                      </span>
                      <input
                        type="datetime-local"
                        value={formState.expiresAt}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            expiresAt: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      Allergens
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {options.allergens.map((allergen) => (
                        <OptionChip
                          key={allergen.id}
                          active={formState.allergenIds.includes(allergen.id)}
                          onClick={() => toggleOption("allergenIds", allergen.id)}
                        >
                          {allergen.label}
                        </OptionChip>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Food tags</p>
                    <div className="flex flex-wrap gap-2">
                      {options.foodTags.map((tag) => (
                        <OptionChip
                          key={tag.id}
                          active={formState.foodTagIds.includes(tag.id)}
                          onClick={() => toggleOption("foodTagIds", tag.id)}
                        >
                          {tag.label}
                        </OptionChip>
                      ))}
                    </div>
                  </div>

                  {formMode === "edit" ? (
                    <div className="rounded-[1.4rem] border border-border bg-surface-muted px-4 py-4 text-sm leading-7 text-foreground/64">
                      Food sale prices are entered here in lv for humans, then sent
                      to the backend in cents. Description and quantity now update
                      together with the rest of the food sale fields.
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSaving || !selectedRestaurantId}
                    className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving
                      ? formMode === "create"
                        ? "Creating food sale..."
                        : "Saving changes..."
                      : formMode === "create"
                        ? "Create food sale"
                        : "Save food sale changes"}
                  </button>
                </form>
              </div>
            )}
          </Panel>

          <Panel
            title="Active food sales"
            description="These food sales are composed from the current restaurant's foods and food-sale records. Pick one to edit it, or start a new food sale from the left."
          >
            {isWorkspaceLoading ? (
              <div className="rounded-[1.6rem] border border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                Loading food sales...
              </div>
            ) : foodSales.length > 0 ? (
              <div className="space-y-4">
                {foodSales.map((foodSale) => (
                  <FoodSaleCard
                    key={foodSale.id}
                    foodSale={foodSale}
                    isSelected={foodSale.id === selectedFoodSaleId}
                    onSelect={handleSelectFoodSale}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-dashed border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                  No active food sales for this restaurant yet.
                </div>
                <div className="rounded-[1.6rem] border border-border bg-white px-5 py-5 text-sm leading-7 text-foreground/64">
                  Create a food sale on the left to post a food + food-sale pair to
                  the backend. Reservation queue details will fit here once the API
                  adds a restaurant-facing reservations endpoint.
                </div>
              </div>
            )}
          </Panel>
        </div>
      </motion.section>
    </main>
  );
}

