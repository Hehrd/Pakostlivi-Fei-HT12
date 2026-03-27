"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  fetchListingReservations,
  fetchMyRestaurantListings,
} from "@/lib/restaurant-client";

function formatReservationDate(value) {
  if (!value) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

function ListingCard({ listing, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(listing.id)}
      className={`w-full rounded-[1.6rem] border p-5 text-left transition ${
        isSelected
          ? "border-primary bg-primary-soft/55 shadow-[0_16px_36px_rgba(31,143,87,0.12)]"
          : "border-border bg-white hover:border-primary/30 hover:bg-primary-soft/25"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{listing.title}</h2>
          <p className="text-sm leading-7 text-foreground/66">
            {listing.description}
          </p>
        </div>
        <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-primary">
          {listing.price.toFixed(2)} lv
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground/72">
          Pickup {listing.pickupWindow}
        </span>
        <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground/72">
          {listing.reservationCount} reservations
        </span>
        <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground/72">
          {listing.reservedQuantity} meals reserved
        </span>
      </div>

      {listing.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {listing.tags.map((tag) => (
            <span
              key={`${listing.id}-${tag}`}
              className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-foreground/68"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

function ReservationRow({ reservation }) {
  return (
    <article className="rounded-[1.45rem] border border-border bg-white p-4 shadow-[0_12px_28px_rgba(17,51,34,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {reservation.customerName}
          </h3>
          <p className="text-sm text-foreground/62">{reservation.customerEmail}</p>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {reservation.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface-muted px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
            Reserved
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatReservationDate(reservation.reservedAt)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-muted px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
            Quantity
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {reservation.quantity} meals
          </p>
        </div>
        <div className="rounded-2xl bg-surface-muted px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
            Total
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {reservation.totalPrice.toFixed(2)} lv
          </p>
        </div>
      </div>
    </article>
  );
}

export default function RestaurantListingsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [listings, setListings] = useState([]);
  const [totals, setTotals] = useState({
    listingCount: 0,
    reservationCount: 0,
    reservedMeals: 0,
  });
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  const [unsupportedMessage, setUnsupportedMessage] = useState("");

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId]
  );

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
    async function loadDashboard() {
      setIsLoading(true);

      try {
        const payload = await fetchMyRestaurantListings();
        const nextListings = payload?.listings ?? [];

        setUnsupportedMessage("");
        setRestaurant(payload?.restaurant ?? null);
        setListings(nextListings);
        setTotals(
          payload?.totals ?? {
            listingCount: 0,
            reservationCount: 0,
            reservedMeals: 0,
          }
        );
        setSelectedListingId((current) => {
          if (current && nextListings.some((listing) => listing.id === current)) {
            return current;
          }

          return nextListings[0]?.id ?? null;
        });
      } catch (error) {
        if (error.status === 501) {
          setUnsupportedMessage(error.message || "Restaurant listings are not available.");
        } else {
          toast.error("Unable to load restaurant listings.", {
            description: error.message || "Please try again.",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (user && isRestaurantUser(user)) {
      loadDashboard();
    }
  }, [user]);

  useEffect(() => {
    async function loadReservations() {
      if (!selectedListingId) {
        setReservations([]);
        return;
      }

      setIsReservationsLoading(true);

      try {
        const payload = await fetchListingReservations(selectedListingId);
        setUnsupportedMessage("");
        setReservations(payload?.reservations ?? []);
      } catch (error) {
        if (error.status === 501) {
          setUnsupportedMessage(error.message || "Restaurant reservations are not available.");
        } else {
          toast.error("Unable to load reservations.", {
            description: error.message || "Please try again.",
          });
        }
      } finally {
        setIsReservationsLoading(false);
      }
    }

    if (user && isRestaurantUser(user)) {
      loadReservations();
    }
  }, [selectedListingId, user]);

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
                Track your listings and every reservation attached to them.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                Review what your restaurant has published, then open any listing
                to inspect who reserved it and how many meals are already claimed.
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
                value={restaurant?.name ?? "Unassigned"}
              />
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Listings" value={totals.listingCount} />
                <MetricCard
                  label="Reservations"
                  value={totals.reservationCount}
                  tone="neutral"
                />
              </div>
              <MetricCard
                label="Reserved meals"
                value={totals.reservedMeals}
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

        <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
          {unsupportedMessage ? (
            <section className="xl:col-span-2 rounded-[1.9rem] border border-border/75 bg-white/92 p-6 shadow-[0_22px_55px_rgba(17,51,34,0.07)] backdrop-blur-sm">
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  Restaurant tools
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-foreground/66">
                  {unsupportedMessage}
                </p>
              </div>
            </section>
          ) : (
            <>
              <section className="rounded-[1.9rem] border border-border/75 bg-white/92 p-6 shadow-[0_22px_55px_rgba(17,51,34,0.07)] backdrop-blur-sm">
                <div className="mb-5 space-y-2">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    Your listings
                  </h2>
                  <p className="text-sm leading-7 text-foreground/66">
                    Select any listing to inspect the reservations that belong to it.
                  </p>
                </div>

                <div className="space-y-4">
                  {isLoading ? (
                    <div className="rounded-[1.6rem] border border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                      Loading your listings...
                    </div>
                  ) : listings.length > 0 ? (
                    listings.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        isSelected={listing.id === selectedListingId}
                        onSelect={setSelectedListingId}
                      />
                    ))
                  ) : (
                    <div className="rounded-[1.6rem] border border-dashed border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                      No listings are assigned to this restaurant yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[1.9rem] border border-border/75 bg-white/92 p-6 shadow-[0_22px_55px_rgba(17,51,34,0.07)] backdrop-blur-sm">
                <div className="mb-5 space-y-2">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {selectedListing
                      ? `Reservations for ${selectedListing.title}`
                      : "Reservations"}
                  </h2>
                  <p className="text-sm leading-7 text-foreground/66">
                    {selectedListing
                      ? `Pickup window ${selectedListing.pickupWindow}`
                      : "Choose a listing on the left to inspect its reservation queue."}
                  </p>
                </div>

                <div className="space-y-4">
                  {selectedListing ? (
                    isReservationsLoading ? (
                      <div className="rounded-[1.6rem] border border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                        Loading reservations...
                      </div>
                    ) : reservations.length > 0 ? (
                      reservations.map((reservation) => (
                        <ReservationRow
                          key={reservation.id}
                          reservation={reservation}
                        />
                      ))
                    ) : (
                      <div className="rounded-[1.6rem] border border-dashed border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                        No reservations for this listing yet.
                      </div>
                    )
                  ) : (
                    <div className="rounded-[1.6rem] border border-dashed border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                      Select a listing to see its reservations.
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </motion.section>
    </main>
  );
}
