"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import GoogleRestaurantsMap from "@/components/GoogleRestaurantsMap";
import {
  getAllergens,
  getFoodTags,
  updateUserAllergens,
} from "@/lib/auth-client";
import { isAdminUser, isRestaurantUser } from "@/lib/auth-user";
import {
  fetchNearbyListings,
  fetchNearbyRestaurants,
  reserveListing,
} from "@/lib/home-client";
import {
  createReservationRecord,
  saveStoredReservation,
} from "@/lib/reservation-client";

const DEFAULT_LOCATION = {
  lat: 42.6977,
  lng: 23.3219,
};

const RESTAURANTS_FETCH_LIMIT = 24;
const LISTINGS_PER_PAGE = 6;

function formatReservationExpiry(expiresAt) {
  if (!expiresAt) {
    return "";
  }

  const parsedDate = new Date(expiresAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-white text-foreground/74 hover:border-primary/35 hover:bg-primary-soft/40"
      }`}
    >
      {children}
    </button>
  );
}

function PaginationBar({
  page,
  totalPages,
  itemLabel,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
      <p className="text-sm text-foreground/64">
        {itemLabel} page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={page <= 1}
          className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ReservationNotice({
  reservation,
  onDismiss,
  onShowRestaurant,
  onViewReservations,
}) {
  if (!reservation) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-4 shadow-[0_12px_35px_rgba(21,128,61,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Active reservation
          </p>
          <h3 className="text-base font-semibold text-foreground">
            {reservation.title}
          </h3>
          <p className="text-sm text-foreground/68">
            Reserved from {reservation.restaurantName}.
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
          Pickup {reservation.pickupWindow}
        </span>
        {reservation.pickupCode ? (
          <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
            Pickup code {reservation.pickupCode}
          </span>
        ) : null}
        {reservation.expiresAt ? (
          <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
            Held until {formatReservationExpiry(reservation.expiresAt)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onShowRestaurant}
          className="rounded-full bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
        >
          Show restaurant
        </button>
        <button
          type="button"
          onClick={onViewReservations}
          className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
        >
          View all reservations
        </button>
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  isSelected,
  isReserving,
  onReserve,
  onSelectRestaurant,
}) {
  function handleReserve() {
    if (listing.isReservedByCurrentUser || isReserving) {
      return;
    }

    onReserve(listing);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleReserve}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleReserve();
        }
      }}
      className={`rounded-[1.5rem] border p-4 transition-colors ${
        isSelected
          ? "border-primary bg-primary-soft/45"
          : listing.isReservedByCurrentUser
            ? "border-emerald-300 bg-emerald-50/70"
            : "border-border bg-white hover:border-primary/35"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">
            {listing.title}
          </h3>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectRestaurant(listing.restaurantId);
            }}
            className="text-sm font-medium text-primary hover:text-primary-strong"
          >
            {listing.restaurantName}
          </button>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
          {listing.price.toFixed(2)} lv
        </span>
      </div>

      <p className="mt-3 text-sm leading-7 text-foreground/68">
        {listing.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-foreground/72">
          Pickup {listing.pickupWindow}
        </span>
        {listing.tags.map((tag) => (
          <span
            key={`${listing.id}-${tag}`}
            className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground/68"
          >
            {tag}
          </span>
        ))}
      </div>

      {listing.allergens.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {listing.allergens.map((allergen) => (
            <span
              key={`${listing.id}-${allergen}`}
              className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900"
            >
              Contains {allergen}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
        <div className="flex flex-wrap gap-2">
          {listing.isReservedByCurrentUser ? (
            <>
              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Reserved
              </span>
              {listing.currentUsersReservation?.pickupCode ? (
                <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
                  Pickup code {listing.currentUsersReservation.pickupCode}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-foreground/58">
              Tap the card or use reserve to hold this meal.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleReserve();
          }}
          disabled={listing.isReservedByCurrentUser || isReserving}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            listing.isReservedByCurrentUser
              ? "cursor-default border border-emerald-300 bg-emerald-100 text-emerald-800"
              : "bg-primary text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-80"
          }`}
        >
          {listing.isReservedByCurrentUser
            ? "Reserved"
            : isReserving
              ? "Reserving..."
              : "Reserve"}
        </button>
      </div>
    </article>
  );
}

function SelectedRestaurantPanel({
  restaurant,
  listings,
  pagination,
  isLoading,
  reservingListingId,
  onClear,
  onReserve,
  onSelectRestaurant,
  onPreviousPage,
  onNextPage,
}) {
  if (!restaurant) {
    return (
      <aside className="h-full rounded-[1.75rem] border border-dashed border-border bg-white/70 p-5 text-sm leading-7 text-foreground/64">
        Select a restaurant marker on the map to inspect only that
        restaurant&apos;s listings here.
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_18px_40px_rgba(17,51,34,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Selected Restaurant
          </p>
          <h2 className="text-xl font-semibold text-foreground">
            {restaurant.name}
          </h2>
          {restaurant.googleMapsUrl ? (
            <a
              href={restaurant.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-primary hover:text-primary-strong"
            >
              Google Maps
            </a>
          ) : restaurant.address ? (
            <p className="text-sm leading-7 text-foreground/66">
              {restaurant.address}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40"
        >
          Clear
        </button>
      </div>

      <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="rounded-2xl bg-surface-muted px-4 py-4 text-sm leading-7 text-foreground/68">
            Loading listings from this restaurant...
          </div>
        ) : listings.length > 0 ? (
          listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isSelected
              isReserving={reservingListingId === listing.id}
              onReserve={onReserve}
              onSelectRestaurant={onSelectRestaurant}
            />
          ))
        ) : (
          <p className="rounded-2xl bg-surface-muted px-4 py-4 text-sm leading-7 text-foreground/68">
            No listings from this restaurant match the current search and tag
            filters on this page.
          </p>
        )}
      </div>

      <div className="mt-4">
        <PaginationBar
          page={pagination.page}
          totalPages={pagination.totalPages}
          itemLabel="Restaurant listings"
          onPrevious={onPreviousPage}
          onNext={onNextPage}
        />
      </div>
    </aside>
  );
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { user, isAuthLoading, setCurrentUser } = useAuth();

  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationState, setLocationState] = useState("locating");
  const [restaurants, setRestaurants] = useState([]);
  const [listings, setListings] = useState([]);
  const [selectedRestaurantListings, setSelectedRestaurantListings] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableAllergens, setAvailableAllergens] = useState([]);
  const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");
  const [draftAllergens, setDraftAllergens] = useState(user?.allergens ?? []);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(true);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [isSelectedRestaurantListingsLoading, setIsSelectedRestaurantListingsLoading] =
    useState(false);
  const [reservingListingId, setReservingListingId] = useState(null);
  const [latestReservation, setLatestReservation] = useState(null);
  const [isAllergenMenuOpen, setIsAllergenMenuOpen] = useState(false);
  const [isSavingAllergens, setIsSavingAllergens] = useState(false);
  const [listingsPagination, setListingsPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [selectedRestaurantPagination, setSelectedRestaurantPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  const searchQuery = searchParams.get("search") ?? "";
  const selectedRestaurantId = searchParams.get("restaurant") ?? "";
  const listingPage = Math.max(1, Number(searchParams.get("listingPage")) || 1);
  const selectedRestaurantListingPage = Math.max(
    1,
    Number(searchParams.get("restaurantListingPage")) || 1
  );
  const activeTags = useMemo(() => searchParams.getAll("tag"), [searchParams]);
  const activeTagsKey = activeTags.join("|");
  const requestTags = useMemo(
    () => (activeTagsKey ? activeTagsKey.split("|") : []),
    [activeTagsKey]
  );
  const savedAllergens = useMemo(() => user?.allergens ?? [], [user]);
  const savedAllergensKey = savedAllergens.slice().sort().join("|");
  const requestAllergens = useMemo(
    () => (savedAllergensKey ? savedAllergensKey.split("|") : []),
    [savedAllergensKey]
  );
  const shouldLoadDiscovery =
    Boolean(user) &&
    !isAdminUser(user) &&
    !isRestaurantUser(user) &&
    user?.hasOnboarded !== false;

  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setDraftAllergens(savedAllergens);
  }, [savedAllergens, savedAllergensKey]);

  const draftAllergensKey = draftAllergens.slice().sort().join("|");
  const hasUnsavedAllergens = draftAllergensKey !== savedAllergensKey;

  const selectedRestaurant = useMemo(
    () =>
      restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ??
      null,
    [restaurants, selectedRestaurantId]
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

    if (isRestaurantUser(user)) {
      router.replace("/restaurant/listings");
      return;
    }

    if (user.hasOnboarded === false) {
      router.replace("/onboarding");
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    if (!shouldLoadDiscovery) {
      return;
    }

    async function loadFilterOptions() {
      try {
        const [allergenPayload, foodTagPayload] = await Promise.all([
          getAllergens(),
          getFoodTags(),
        ]);

        setAvailableAllergens(allergenPayload?.allergens ?? []);
        setAvailableTags(foodTagPayload?.tags ?? []);
      } catch (error) {
        toast.error("Unable to load filters.", {
          description: error.message || "Please try again.",
        });
      }
    }

    loadFilterOptions();
  }, [shouldLoadDiscovery]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationState("fallback");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationState("ready");
      },
      () => {
        setLocation(DEFAULT_LOCATION);
        setLocationState("fallback");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  useEffect(() => {
    if (!shouldLoadDiscovery) {
      return;
    }

    async function loadRestaurants() {
      setIsRestaurantsLoading(true);

      try {
        const payload = await fetchNearbyRestaurants({
          lat: location.lat,
          lng: location.lng,
          pageSize: RESTAURANTS_FETCH_LIMIT,
        });

        setRestaurants(payload?.restaurants ?? []);
      } catch (error) {
        toast.error("Unable to load nearby restaurants.", {
          description: error.message || "Please try again.",
        });
      } finally {
        setIsRestaurantsLoading(false);
      }
    }

    loadRestaurants();
  }, [location.lat, location.lng, shouldLoadDiscovery]);

  useEffect(() => {
    if (!shouldLoadDiscovery) {
      return;
    }

    async function loadListings() {
      setIsListingsLoading(true);

      try {
        const payload = await fetchNearbyListings({
          lat: location.lat,
          lng: location.lng,
          search: searchQuery,
          tag: requestTags,
          excludeAllergen: requestAllergens,
          page: listingPage,
          pageSize: LISTINGS_PER_PAGE,
        });

        setListings(payload?.listings ?? []);
        setAvailableTags((current) =>
          [...new Set([...current, ...(payload?.availableTags ?? [])])].sort()
        );
        setListingsPagination(
          payload?.pagination ?? {
            page: 1,
            totalPages: 1,
          }
        );
      } catch (error) {
        toast.error("Unable to load nearby listings.", {
          description: error.message || "Please try again.",
        });
      } finally {
        setIsListingsLoading(false);
      }
    }

    loadListings();
  }, [
    listingPage,
    location.lat,
    location.lng,
    requestAllergens,
    requestTags,
    searchQuery,
    shouldLoadDiscovery,
  ]);

  useEffect(() => {
    if (!shouldLoadDiscovery) {
      return;
    }

    async function loadSelectedRestaurantListings() {
      if (!selectedRestaurantId) {
        setSelectedRestaurantListings([]);
        setSelectedRestaurantPagination({
          page: 1,
          totalPages: 1,
        });
        return;
      }

      setIsSelectedRestaurantListingsLoading(true);

      try {
        const payload = await fetchNearbyListings({
          lat: location.lat,
          lng: location.lng,
          search: searchQuery,
          restaurant: selectedRestaurantId,
          tag: requestTags,
          excludeAllergen: requestAllergens,
          page: selectedRestaurantListingPage,
          pageSize: LISTINGS_PER_PAGE,
        });

        setSelectedRestaurantListings(payload?.listings ?? []);
        setSelectedRestaurantPagination(
          payload?.pagination ?? {
            page: 1,
            totalPages: 1,
          }
        );
      } catch (error) {
        toast.error("Unable to load listings for this restaurant.", {
          description: error.message || "Please try again.",
        });
      } finally {
        setIsSelectedRestaurantListingsLoading(false);
      }
    }

    loadSelectedRestaurantListings();
  }, [
    location.lat,
    location.lng,
    requestAllergens,
    requestTags,
    searchQuery,
    selectedRestaurantId,
    selectedRestaurantListingPage,
    shouldLoadDiscovery,
  ]);

  function updateQueryParams(mutator) {
    const nextParams = new URLSearchParams(searchParams.toString());
    mutator(nextParams);
    const queryString = nextParams.toString();

    startTransition(() => {
      router.replace(queryString ? `/?${queryString}` : "/", {
        scroll: false,
      });
    });
  }

  function toggleParamValue(key, value) {
    updateQueryParams((nextParams) => {
      const values = nextParams.getAll(key);

      if (values.includes(value)) {
        nextParams.delete(key);
        values
          .filter((item) => item !== value)
          .forEach((item) => nextParams.append(key, item));
      } else {
        nextParams.append(key, value);
      }

      nextParams.delete("listingPage");
      nextParams.delete("restaurantListingPage");
    });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    updateQueryParams((nextParams) => {
      nextParams.delete("search");
      nextParams.delete("listingPage");
      nextParams.delete("restaurantListingPage");

      const trimmedSearch = searchText.trim();

      if (trimmedSearch) {
        nextParams.set("search", trimmedSearch);
      }
    });
  }

  function handleSelectRestaurant(restaurantId) {
    updateQueryParams((nextParams) => {
      nextParams.delete("restaurantListingPage");

      if (nextParams.get("restaurant") === restaurantId) {
        nextParams.delete("restaurant");
        return;
      }

      nextParams.set("restaurant", restaurantId);
    });
  }

  function clearSelectedRestaurant() {
    updateQueryParams((nextParams) => {
      nextParams.delete("restaurant");
      nextParams.delete("restaurantListingPage");
    });
  }

  function clearFilters() {
    updateQueryParams((nextParams) => {
      nextParams.delete("search");
      nextParams.delete("tag");
      nextParams.delete("listingPage");
      nextParams.delete("restaurantListingPage");
      setSearchText("");
    });
  }

  function setListingsPage(page) {
    updateQueryParams((nextParams) => {
      nextParams.set("listingPage", String(page));
    });
  }

  function setSelectedRestaurantListingsPage(page) {
    updateQueryParams((nextParams) => {
      nextParams.set("restaurantListingPage", String(page));
    });
  }

  function toggleDraftAllergen(allergenId) {
    setDraftAllergens((current) =>
      current.includes(allergenId)
        ? current.filter((item) => item !== allergenId)
        : [...current, allergenId]
    );
  }

  function applyReservedListingUpdate(listingId, listingUpdate) {
    if (!listingUpdate) {
      return;
    }

    function mergeListing(currentListing) {
      if (currentListing.id !== listingId) {
        return currentListing;
      }

      const nextReservationCount =
        listingUpdate.reservationCount ?? (currentListing.reservationCount ?? 0) + 1;
      const nextReservedQuantity =
        listingUpdate.reservedQuantity ?? (currentListing.reservedQuantity ?? 0) + 1;

      return {
        ...currentListing,
        ...listingUpdate,
        reservationCount: nextReservationCount,
        reservedQuantity: nextReservedQuantity,
      };
    }

    setListings((current) => current.map(mergeListing));
    setSelectedRestaurantListings((current) => current.map(mergeListing));
  }

  async function handleReserveListing(listing) {
    if (!listing?.id || reservingListingId === listing.id || listing.isReservedByCurrentUser) {
      return;
    }

    setReservingListingId(listing.id);

    try {
      const payload = await reserveListing(listing.id);
      const reservationRecord = createReservationRecord(listing, payload);

      saveStoredReservation(user, reservationRecord);
      applyReservedListingUpdate(listing.id, payload?.listing);
      setLatestReservation(reservationRecord);

      toast.success("Listing reserved.", {
        description:
          payload?.reservation?.pickupCode
            ? `Pickup code ${payload.reservation.pickupCode}. Pickup window ${payload.reservation.pickupWindow}.`
            : payload?.reservation?.expiresAt
              ? `Reservation created. It currently expires at ${new Date(payload.reservation.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
              : `Pickup window ${payload?.reservation?.pickupWindow ?? listing.pickupWindow}.`,
      });
    } catch (error) {
      toast.error(
        error.status === 409 ? "Already reserved." : "Unable to reserve listing.",
        {
          description: error.message || "Please try again.",
        }
      );
    } finally {
      setReservingListingId(null);
    }
  }

  async function handleSaveAllergens() {
    setIsSavingAllergens(true);

    try {
      const payload = await updateUserAllergens({
        allergens: draftAllergens,
      });
      const nextUser = payload?.user ?? payload;
      setCurrentUser(nextUser);
      setIsAllergenMenuOpen(false);
      toast.success("Saved allergen preferences.");
      setListingsPage(1);
      if (selectedRestaurantId) {
        setSelectedRestaurantListingsPage(1);
      }
    } catch (error) {
      toast.error("Unable to update allergens.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSavingAllergens(false);
    }
  }

  if (isAuthLoading) {
    return null;
  }

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 text-foreground lg:px-5">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f7fbf8_0%,#edf7f0_45%,#f9fcfa_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,143,87,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(22,102,64,0.10),transparent_32%)]" />
        <section className="relative mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-border/70 bg-white/88 p-8 text-center shadow-[0_24px_80px_rgba(17,51,34,0.08)] backdrop-blur-sm sm:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Login Required
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              You need to log in to view this page.
            </h1>
            <p className="mt-4 text-sm leading-7 text-foreground/68 sm:text-base">
              Sign in to browse nearby restaurants, reserve meals, and manage
              your preferences.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/login"
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong"
              >
                Go to login
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (user.hasOnboarded === false) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-4 text-foreground lg:px-5 lg:py-5">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f7fbf8_0%,#edf7f0_45%,#f9fcfa_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,143,87,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(22,102,64,0.10),transparent_32%)]" />

      <section className="relative mx-auto grid max-w-[1700px] gap-4 lg:h-[calc(100vh-2.5rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(23rem,0.95fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(24rem,0.95fr)_minmax(21rem,0.82fr)]">
        <div className="flex min-h-[43vh] flex-col rounded-[2rem] border border-border/70 bg-surface/92 p-4 shadow-[0_24px_80px_rgba(17,51,34,0.08)] backdrop-blur-sm lg:h-full lg:min-h-0">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-primary/20 bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
                Nearby Restaurants
              </span>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                  Rescue meals around you
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-foreground/68 sm:text-base">
                  Browse nearby restaurants on the map, then open their active
                  surplus listings from the panels on the right.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-border bg-white px-4 py-2 text-sm text-foreground/68">
                {locationState === "ready"
                  ? "Using your location"
                  : locationState === "locating"
                    ? "Finding your location..."
                    : "Using fallback location"}
              </span>
              <Link
                href="/settings"
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground/74 hover:border-primary/35 hover:bg-primary-soft/40"
              >
                Open Settings
              </Link>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <GoogleRestaurantsMap
              restaurants={restaurants}
              selectedRestaurantId={selectedRestaurantId}
              onSelectRestaurant={handleSelectRestaurant}
              userLocation={location}
            />
          </div>

          <div className="mt-4 space-y-4">
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2">
              {isRestaurantsLoading ? (
                <span className="text-sm text-foreground/60">
                  Loading nearby restaurants...
                </span>
              ) : (
                restaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => handleSelectRestaurant(restaurant.id)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                      restaurant.id === selectedRestaurantId
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40"
                    }`}
                  >
                    {restaurant.name}
                  </button>
                ))
              )}
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex min-h-[35rem] flex-col rounded-[2rem] border border-border/70 bg-surface/94 p-5 shadow-[0_24px_80px_rgba(17,51,34,0.08)] backdrop-blur-sm lg:h-full lg:min-h-0"
        >
          <div className="space-y-4 border-b border-border/70 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                  Nearby Listings
                </p>
                <p className="text-sm leading-7 text-foreground/66">
                  Search by listing title and narrow results using food tags.
                  Your saved allergens are excluded automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40"
              >
                Clear filters
              </button>
            </div>

            <form className="flex gap-3" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search listing title"
                className="min-w-0 flex-1 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none placeholder:text-foreground/42 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-strong disabled:opacity-80"
              >
                Apply
              </button>
            </form>

            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/56">
                  Food Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <FilterChip
                      key={tag}
                      active={activeTags.includes(tag)}
                      onClick={() => toggleParamValue("tag", tag)}
                    >
                      {tag}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-white/75 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/56">
                      Saved Allergens
                    </p>
                    <p className="text-sm text-foreground/66">
                      {savedAllergens.length > 0
                        ? `Excluding meals containing: ${savedAllergens.join(", ")}`
                        : "No saved allergens. All meals are currently shown."}
                    </p>
                    {savedAllergens.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {savedAllergens.map((allergen) => (
                          <span
                            key={allergen}
                            className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAllergenMenuOpen((value) => !value)}
                      className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40"
                    >
                      {isAllergenMenuOpen ? "Close" : "Quick edit"}
                    </button>
                    <Link
                      href="/settings"
                      className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40"
                    >
                      Open settings
                    </Link>
                  </div>
                </div>

                {isAllergenMenuOpen ? (
                  <div className="mt-4 space-y-4 border-t border-border/70 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {availableAllergens.map((allergen) => (
                        <button
                          key={allergen.id}
                          type="button"
                          onClick={() => toggleDraftAllergen(allergen.id)}
                          className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                            draftAllergens.includes(allergen.id)
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-surface-muted text-foreground/72 hover:border-primary/35 hover:bg-primary-soft/40"
                          }`}
                        >
                          {allergen.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveAllergens}
                        disabled={!hasUnsavedAllergens || isSavingAllergens}
                        className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-80"
                      >
                        {isSavingAllergens
                          ? "Saving..."
                          : "Save allergen preferences"}
                      </button>
                      {hasUnsavedAllergens ? (
                        <p className="text-sm text-foreground/62">
                          You have unsaved allergen changes.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <ReservationNotice
                reservation={latestReservation}
                onDismiss={() => setLatestReservation(null)}
                onShowRestaurant={() =>
                  latestReservation?.restaurantId
                    ? handleSelectRestaurant(latestReservation.restaurantId)
                    : undefined
                }
                onViewReservations={() => router.push("/reservations")}
              />
            </div>
          </div>

          <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {selectedRestaurant ? (
              <div className="xl:hidden">
                <SelectedRestaurantPanel
                  restaurant={selectedRestaurant}
                  listings={selectedRestaurantListings}
                  pagination={selectedRestaurantPagination}
                  isLoading={isSelectedRestaurantListingsLoading}
                  reservingListingId={reservingListingId}
                  onClear={clearSelectedRestaurant}
                  onReserve={handleReserveListing}
                  onSelectRestaurant={handleSelectRestaurant}
                  onPreviousPage={() =>
                    setSelectedRestaurantListingsPage(
                      Math.max(1, selectedRestaurantListingPage - 1)
                    )
                  }
                  onNextPage={() =>
                    setSelectedRestaurantListingsPage(
                      Math.min(
                        selectedRestaurantPagination.totalPages,
                        selectedRestaurantListingPage + 1
                      )
                    )
                  }
                />
              </div>
            ) : null}

            {isListingsLoading ? (
              <div className="rounded-[1.75rem] border border-border bg-white px-5 py-6 text-sm text-foreground/64">
                Loading nearby listings...
              </div>
            ) : listings.length > 0 ? (
              listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSelected={listing.restaurantId === selectedRestaurantId}
                  isReserving={reservingListingId === listing.id}
                  onReserve={handleReserveListing}
                  onSelectRestaurant={handleSelectRestaurant}
                />
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-border bg-white px-5 py-6 text-sm leading-7 text-foreground/64">
                No listings match your current search and tag filters.
              </div>
            )}
          </div>

          <div className="mt-4">
            <PaginationBar
              page={listingsPagination.page}
              totalPages={listingsPagination.totalPages}
              itemLabel="Listings"
              onPrevious={() => setListingsPage(Math.max(1, listingPage - 1))}
              onNext={() =>
                setListingsPage(
                  Math.min(listingsPagination.totalPages, listingPage + 1)
                )
              }
            />
          </div>
        </motion.div>

        <div className="hidden xl:block xl:h-full xl:min-h-0">
          <SelectedRestaurantPanel
            restaurant={selectedRestaurant}
            listings={selectedRestaurantListings}
            pagination={selectedRestaurantPagination}
            isLoading={isSelectedRestaurantListingsLoading}
            reservingListingId={reservingListingId}
            onClear={clearSelectedRestaurant}
            onReserve={handleReserveListing}
            onSelectRestaurant={handleSelectRestaurant}
            onPreviousPage={() =>
              setSelectedRestaurantListingsPage(
                Math.max(1, selectedRestaurantListingPage - 1)
              )
            }
            onNextPage={() =>
              setSelectedRestaurantListingsPage(
                Math.min(
                  selectedRestaurantPagination.totalPages,
                  selectedRestaurantListingPage + 1
                )
              )
            }
          />
        </div>
      </section>
    </main>
  );
}
