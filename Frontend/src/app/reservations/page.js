"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  fetchUserReservations,
} from "@/lib/reservation-client";

function formatDateTime(value) {
  if (!value) {
    return "Unavailable";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function isReservationActive(reservation) {
  if (!reservation?.expiresAt) {
    return true;
  }

  const expiresAt = new Date(reservation.expiresAt);

  if (Number.isNaN(expiresAt.getTime())) {
    return true;
  }

  return expiresAt.getTime() >= Date.now();
}

function ReservationCard({ reservation }) {
  const active = isReservationActive(reservation);

  return (
    <article className="rounded-[1.7rem] border border-border bg-white p-5 shadow-[0_18px_42px_rgba(17,51,34,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                active
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-surface-muted text-foreground/68"
              }`}
            >
              {active ? "Current" : "Saved"}
            </span>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {(reservation.status ?? "UNPAID").replaceAll("_", " ")}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {reservation.title || `Reservation #${reservation.id}`}
          </h2>
          <p className="text-sm text-foreground/64">
            {reservation.restaurantName || "Restaurant unavailable"}
          </p>
          {reservation.description ? (
            <p className="max-w-2xl text-sm leading-7 text-foreground/68">
              {reservation.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/52">
            Total
          </p>
          <p className="text-2xl font-semibold text-foreground">
            EUR {Number(reservation.totalPrice ?? reservation.price ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-foreground/52">
            {reservation.paymentStatus || "Payment status unavailable"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-surface-muted px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
            Reserved
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatDateTime(reservation.issuedAt || reservation.reservedAt)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-muted px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
            Hold expires
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatDateTime(reservation.expiresAt)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-muted px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
            Pickup window
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {reservation.pickupWindow || "Unavailable"}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-muted px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
            Pickup code
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {reservation.pickupCode || "Not returned by backend"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {reservation.restaurantGoogleMapsUrl ? (
          <a
            href={reservation.restaurantGoogleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground/76 transition hover:border-primary/35 hover:bg-primary-soft/35"
          >
            Open restaurant
          </a>
        ) : null}
        <Link
          href="/"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong"
        >
          Reserve another meal
        </Link>
      </div>
    </article>
  );
}

export default function ReservationsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

    if (isRestaurantUser(user)) {
      router.replace("/restaurant/food-sales");
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    async function loadReservations() {
      setIsLoading(true);

      try {
        const payload = await fetchUserReservations();
        setReservations(payload?.reservations ?? []);
      } catch (error) {
        toast.error("Unable to load reservation details.", {
          description: error.message || "Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (user && isClientUser(user)) {
      loadReservations();
    }
  }, [user]);

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => isReservationActive(reservation)),
    [reservations]
  );
  const savedReservations = useMemo(
    () => reservations.filter((reservation) => !isReservationActive(reservation)),
    [reservations]
  );

  if (isAuthLoading || !user || !isClientUser(user)) {
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
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[2.2rem] border border-border/80 bg-[linear-gradient(155deg,#154d33_0%,#1f8f57_46%,#2ca369_100%)] p-7 text-white shadow-[0_26px_70px_rgba(17,51,34,0.14)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/75">
              Current Reservations
            </p>
            <div className="mt-4 space-y-3">
              <h1 className="max-w-[14ch] text-4xl font-semibold leading-[1.02] tracking-[-0.04em]">
                Track the meals you already reserved.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                Use this page as your reservation hub after checkout. Stripe
                payment progress and reservation holds are now loaded from your
                backend reservation history.
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
                  Current
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {activeReservations.length}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/55">
                  Total
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {reservations.length}
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-foreground/62">
              Reservation history on this page now comes directly from the
              backend account endpoint.
            </p>
          </aside>
        </div>

        <section className="rounded-[1.9rem] border border-border/75 bg-white/92 p-6 shadow-[0_22px_55px_rgba(17,51,34,0.07)] backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                Active now
              </h2>
              <p className="text-sm leading-7 text-foreground/66">
                Reservations stay here so users have a dedicated place to review
                paid meals and any holds that are still waiting on payment or
                pickup.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
            >
              Discover meals
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {isLoading ? (
              <div className="rounded-[1.6rem] border border-border bg-surface-muted px-5 py-6 text-sm text-foreground/64">
                Loading your reservations...
              </div>
            ) : activeReservations.length > 0 ? (
              activeReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-border bg-surface-muted px-5 py-6 text-sm leading-7 text-foreground/64">
                No active reservations yet. Reserve a meal from the discover
                page and it will appear here.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-border/75 bg-white/92 p-6 shadow-[0_22px_55px_rgba(17,51,34,0.07)] backdrop-blur-sm">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Older reservations
            </h2>
            <p className="text-sm leading-7 text-foreground/66">
              Reservations that are no longer active stay grouped here once
              their hold window has expired.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {savedReservations.length > 0 ? (
              savedReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-border bg-surface-muted px-5 py-6 text-sm leading-7 text-foreground/64">
                No older reservations yet.
              </div>
            )}
          </div>
        </section>
      </motion.section>
    </main>
  );
}

