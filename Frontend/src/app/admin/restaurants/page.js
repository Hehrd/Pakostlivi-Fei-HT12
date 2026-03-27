"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { loadGoogleMaps } from "@/lib/google-maps";
import {
  createRestaurant,
  deleteRestaurant,
  fetchAdminRestaurants,
  updateRestaurant,
} from "@/lib/admin-client";
import { getUserDisplayName, isAdminUser } from "@/lib/auth-user";
import { useAuth } from "@/components/AuthProvider";

const EMPTY_FORM = {
  name: "",
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
  ownerPassword: "",
  ownerConfirmPassword: "",
  locationInput: "",
  resolvedLat: "",
  resolvedLng: "",
  googleMapsUrl: "",
};

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(value.trim());
}

function extractCoordinatesFromMapsLink(value) {
  const input = value.trim();

  if (!input) {
    return null;
  }

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]center=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);

    if (match) {
      return {
        lat: Number(match[1]),
        lng: Number(match[2]),
      };
    }
  }

  return null;
}

function isShortGoogleMapsLink(value) {
  try {
    const url = new URL(value.trim());

    return /(^|\.)maps\.app\.goo\.gl$/i.test(url.hostname);
  } catch {
    return false;
  }
}

async function geocodeLocationInput(locationInput) {
  const trimmedInput = locationInput.trim();

  if (!trimmedInput) {
    throw new Error("Add a Google Maps link first.");
  }

  if (!isLikelyUrl(trimmedInput)) {
    throw new Error("Paste a full Google Maps link.");
  }

  const parsedCoordinates = extractCoordinatesFromMapsLink(trimmedInput);

  if (parsedCoordinates) {
    return {
      ...parsedCoordinates,
      googleMapsUrl: trimmedInput,
    };
  }

  if (isShortGoogleMapsLink(trimmedInput)) {
    throw new Error(
      "Short maps.app.goo.gl links do not expose coordinates to the browser. Open the place in Google Maps and paste the full expanded URL from the address bar."
    );
  }

  const mapsApi = await loadGoogleMaps(["geocoding"]);
  const { Geocoder } = await mapsApi.importLibrary("geocoding");
  const geocoder = new Geocoder();
  const geocodeResponse = await geocoder.geocode({
    address: trimmedInput,
  });
  const result = geocodeResponse?.results?.[0];
  const location = result?.geometry?.location;

  if (!location) {
    throw new Error(
      "That Google Maps link does not include readable coordinates."
    );
  }

  return {
    lat: Number(location.lat().toFixed(6)),
    lng: Number(location.lng().toFixed(6)),
    googleMapsUrl: trimmedInput,
  };
}

function AdminCard({ title, description, children }) {
  return (
    <section className="rounded-[1.9rem] border border-border/75 bg-white/92 p-6 shadow-[0_22px_55px_rgba(17,51,34,0.07)] backdrop-blur-sm">
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

function RestaurantRow({ restaurant, isEditing, onEdit, onDelete }) {
  const ownerName = [restaurant.ownerFirstName, restaurant.ownerLastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <article className="rounded-[1.6rem] border border-border bg-white p-5 shadow-[0_14px_34px_rgba(17,51,34,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {restaurant.name}
            </h3>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              {restaurant.foodSaleCount} active food sales
            </span>
          </div>
          <a
            href={restaurant.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-medium text-primary hover:text-primary-strong"
          >
            Google Maps
          </a>
          <p className="text-xs text-foreground/55">
            Coordinates: {restaurant.lat}, {restaurant.lng}
          </p>
          {ownerName || restaurant.ownerEmail ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/48">
                Owner
              </p>
              {ownerName ? (
                <p className="text-sm text-foreground/68">{ownerName}</p>
              ) : null}
              {restaurant.ownerEmail ? (
                <p className="text-sm text-foreground/58">{restaurant.ownerEmail}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(restaurant)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isEditing
                ? "bg-primary text-white"
                : "border border-border bg-white text-foreground/74 hover:border-primary/35 hover:bg-primary-soft/35"
            }`}
          >
            {isEditing ? "Editing" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(restaurant)}
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [formState, setFormState] = useState({ ...EMPTY_FORM });
  const [editingRestaurantId, setEditingRestaurantId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

  const isEditing = editingRestaurantId !== null;
  const totalFoodSales = useMemo(
    () =>
      restaurants.reduce(
        (sum, restaurant) => sum + (restaurant.foodSaleCount ?? 0),
        0
      ),
    [restaurants]
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isAdminUser(user)) {
      router.replace("/");
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const payload = await fetchAdminRestaurants();
        setRestaurants(payload?.restaurants ?? []);
      } catch (error) {
        toast.error("Unable to load restaurants.", {
          description: error.message || "Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (user && isAdminUser(user)) {
      loadRestaurants();
    }
  }, [user]);

  function resetForm() {
    setFormState({ ...EMPTY_FORM });
    setEditingRestaurantId(null);
    setLocationStatus("");
  }

  function handleEdit(restaurant) {
    setEditingRestaurantId(restaurant.id);
    setFormState({
      ...EMPTY_FORM,
      name: restaurant.name ?? "",
      locationInput: restaurant.googleMapsUrl ?? "",
      resolvedLat: String(restaurant.lat ?? ""),
      resolvedLng: String(restaurant.lng ?? ""),
      googleMapsUrl: restaurant.googleMapsUrl ?? "",
    });
    setLocationStatus("");
  }

  async function resolveLocation(locationInputOverride) {
    const nextInput =
      typeof locationInputOverride === "string"
        ? locationInputOverride
        : formState.locationInput;

    setIsResolvingLocation(true);
    setLocationStatus("Resolving Google Maps link...");

    try {
      const resolvedLocation = await geocodeLocationInput(nextInput);

      setFormState((current) => ({
        ...current,
        resolvedLat: String(resolvedLocation.lat),
        resolvedLng: String(resolvedLocation.lng),
        googleMapsUrl: resolvedLocation.googleMapsUrl,
      }));

      setLocationStatus("Location resolved from Google Maps.");
      return resolvedLocation;
    } catch (error) {
      setLocationStatus(error.message || "Unable to resolve the Google Maps link.");
      toast.error("Unable to resolve location.", {
        description: error.message || "Please try a different Google Maps link.",
      });
      return null;
    } finally {
      setIsResolvingLocation(false);
    }
  }

  useEffect(() => {
    const trimmedInput = formState.locationInput.trim();

    if (!trimmedInput) {
      setLocationStatus("");
      setFormState((current) => {
        if (
          !current.resolvedLat &&
          !current.resolvedLng &&
          !current.googleMapsUrl
        ) {
          return current;
        }

        return {
          ...current,
          resolvedLat: "",
          resolvedLng: "",
          googleMapsUrl: "",
        };
      });
      return;
    }

    if (!isLikelyUrl(trimmedInput)) {
      setLocationStatus("Paste a full Google Maps link.");
      setFormState((current) => {
        if (
          !current.resolvedLat &&
          !current.resolvedLng &&
          !current.googleMapsUrl
        ) {
          return current;
        }

        return {
          ...current,
          resolvedLat: "",
          resolvedLng: "",
          googleMapsUrl: "",
        };
      });
      return;
    }

    if (trimmedInput === formState.googleMapsUrl && formState.resolvedLat && formState.resolvedLng) {
      setLocationStatus("Location resolved from Google Maps.");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      resolveLocation(trimmedInput);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [
    formState.googleMapsUrl,
    formState.locationInput,
    formState.resolvedLat,
    formState.resolvedLng,
  ]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formState.name.trim()) {
      toast.error("Restaurant name is required.");
      return;
    }

    if (!isEditing) {
      if (
        !formState.ownerFirstName.trim() ||
        !formState.ownerLastName.trim() ||
        !formState.ownerEmail.trim() ||
        !formState.ownerPassword.trim() ||
        !formState.ownerConfirmPassword.trim()
      ) {
        toast.error("Owner account details are required.", {
          description: "Complete all owner fields before creating the restaurant.",
        });
        return;
      }

      if (formState.ownerPassword !== formState.ownerConfirmPassword) {
        toast.error("Owner passwords do not match.", {
          description: "Enter the same password in both owner password fields.",
        });
        return;
      }

      if (formState.ownerPassword.length < 8) {
        toast.error("Owner password is too short.", {
          description: "Use at least 8 characters to match the backend rules.",
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      let resolvedLocation = null;
      const parsedLat = Number(formState.resolvedLat);
      const parsedLng = Number(formState.resolvedLng);

      if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
        resolvedLocation = await geocodeLocationInput(formState.locationInput);
      }

      const payload = {
        name: formState.name.trim(),
        ownerFirstName: formState.ownerFirstName.trim(),
        ownerLastName: formState.ownerLastName.trim(),
        ownerEmail: formState.ownerEmail.trim(),
        ownerPassword: formState.ownerPassword,
        lat: resolvedLocation?.lat ?? parsedLat,
        lng: resolvedLocation?.lng ?? parsedLng,
        googleMapsUrl:
          resolvedLocation?.googleMapsUrl ?? formState.googleMapsUrl.trim(),
      };

      const response = isEditing
        ? await updateRestaurant(editingRestaurantId, payload)
        : await createRestaurant(payload);

      const nextRestaurant = response?.restaurant;

      setRestaurants((current) => {
        if (!nextRestaurant) {
          return current;
        }

        if (isEditing) {
          return current.map((restaurant) =>
            restaurant.id === editingRestaurantId ? nextRestaurant : restaurant
          );
        }

        return [...current, nextRestaurant].sort((first, second) =>
          first.name.localeCompare(second.name)
        );
      });

      toast.success(isEditing ? "Restaurant updated." : "Restaurant created.");
      resetForm();
    } catch (error) {
      toast.error("Unable to save restaurant.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(restaurant) {
    const shouldDelete = window.confirm(
      `Delete ${restaurant.name}? This will also remove its food sales.`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingId(restaurant.id);

    try {
      await deleteRestaurant(restaurant.id);
      setRestaurants((current) =>
        current.filter((item) => item.id !== restaurant.id)
      );

      if (editingRestaurantId === restaurant.id) {
        resetForm();
      }

      toast.success("Restaurant deleted.");
    } catch (error) {
      toast.error("Unable to delete restaurant.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsDeletingId(null);
    }
  }

  if (isAuthLoading || !user || !isAdminUser(user)) {
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
        className="relative mx-auto max-w-[1500px] space-y-6"
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2.2rem] border border-border/80 bg-[linear-gradient(155deg,#154d33_0%,#1f8f57_46%,#2ca369_100%)] p-7 text-white shadow-[0_26px_70px_rgba(17,51,34,0.14)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/75">
              Admin Console
            </p>
            <div className="mt-4 space-y-3">
              <h1 className="max-w-[13ch] text-4xl font-semibold leading-[1.02] tracking-[-0.04em]">
                Manage restaurant records across the platform.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                Create, update, and remove restaurants from the customer map and
                nearby food sales experience.
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
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-[1.4rem] bg-primary-soft/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Restaurants
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {restaurants.length}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/55">
                  Food Sales
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {totalFoodSales}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <AdminCard
            title={isEditing ? "Edit restaurant" : "Create restaurant"}
            description={
              isEditing
                ? "Update restaurant details using the name plus a full Google Maps URL."
                : "Create a restaurant together with its owner account, then attach the location using a full Google Maps URL."
            }
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="text"
                value={formState.name ?? ""}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Restaurant name"
                className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
              {!isEditing ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={formState.ownerFirstName ?? ""}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        ownerFirstName: event.target.value,
                      }))
                    }
                    placeholder="Owner first name"
                    className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                  <input
                    type="text"
                    value={formState.ownerLastName ?? ""}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        ownerLastName: event.target.value,
                      }))
                    }
                    placeholder="Owner last name"
                    className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              ) : null}
              {!isEditing ? (
                <input
                  type="email"
                  value={formState.ownerEmail ?? ""}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      ownerEmail: event.target.value,
                    }))
                  }
                  placeholder="Owner email"
                  className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              ) : null}
              {!isEditing ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="password"
                    value={formState.ownerPassword ?? ""}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        ownerPassword: event.target.value,
                      }))
                    }
                    placeholder="Owner password"
                    className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                  <input
                    type="password"
                    value={formState.ownerConfirmPassword ?? ""}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        ownerConfirmPassword: event.target.value,
                      }))
                    }
                    placeholder="Confirm owner password"
                    className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              ) : null}
              <input
                type="text"
                value={formState.locationInput ?? ""}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    locationInput: event.target.value,
                  }))
                }
                placeholder="Full Google Maps URL"
                className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
              {locationStatus ? (
                <p className="text-sm text-foreground/62">{locationStatus}</p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={formState.resolvedLat ?? ""}
                  readOnly
                  placeholder="Resolved latitude"
                  className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
                <input
                  type="text"
                  value={formState.resolvedLng ?? ""}
                  readOnly
                  placeholder="Resolved longitude"
                  className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>
              {formState.googleMapsUrl ? (
                <a
                  href={formState.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-medium text-primary hover:text-primary-strong"
                >
                  Google Maps
                </a>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving || isResolvingLocation}
                  className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {isSaving
                    ? isEditing
                      ? "Saving changes..."
                      : "Creating restaurant..."
                    : isResolvingLocation
                      ? "Resolving link..."
                    : isEditing
                      ? "Save changes"
                      : "Create restaurant"}
                </button>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground/76 transition hover:border-primary/35 hover:bg-primary-soft/35"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </AdminCard>

          <AdminCard
            title="Restaurant directory"
            description="Use edit to update an existing record or delete to remove a restaurant and its food sales."
          >
            <div className="space-y-4">
              {isLoading ? (
                <div className="rounded-[1.6rem] border border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                  Loading restaurants...
                </div>
              ) : restaurants.length > 0 ? (
                restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className={isDeletingId === restaurant.id ? "opacity-60" : ""}
                  >
                    <RestaurantRow
                      restaurant={restaurant}
                      isEditing={editingRestaurantId === restaurant.id}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                  No restaurants found yet.
                </div>
              )}
            </div>
          </AdminCard>
        </div>
      </motion.section>
    </main>
  );
}

