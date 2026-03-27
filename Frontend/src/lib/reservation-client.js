import { apiFetch } from "@/lib/api";

const RESERVATION_STORAGE_KEY = "munchmun-reservations";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getReservationOwnerKey(user) {
  if (user?.id) {
    return `user:${user.id}`;
  }

  if (user?.email) {
    return `email:${user.email.toLowerCase()}`;
  }

  return "";
}

function readReservationStorage() {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const storedValue = window.localStorage.getItem(RESERVATION_STORAGE_KEY);

    return storedValue ? JSON.parse(storedValue) : {};
  } catch {
    return {};
  }
}

function writeReservationStorage(value) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

function sortReservations(reservations) {
  return [...reservations].sort(
    (first, second) =>
      new Date(second.issuedAt || second.reservedAt || 0).getTime() -
      new Date(first.issuedAt || first.reservedAt || 0).getTime()
  );
}

export function getStoredReservations(user) {
  const ownerKey = getReservationOwnerKey(user);

  if (!ownerKey) {
    return [];
  }

  const storage = readReservationStorage();
  const reservations = storage?.[ownerKey];

  return Array.isArray(reservations) ? sortReservations(reservations) : [];
}

export function saveStoredReservation(user, reservation) {
  const ownerKey = getReservationOwnerKey(user);

  if (!ownerKey || !reservation?.id) {
    return [];
  }

  const storage = readReservationStorage();
  const currentReservations = Array.isArray(storage?.[ownerKey])
    ? storage[ownerKey]
    : [];
  const nextReservations = sortReservations(
    currentReservations.some((item) => item.id === reservation.id)
      ? currentReservations.map((item) =>
          item.id === reservation.id ? { ...item, ...reservation } : item
        )
      : [reservation, ...currentReservations]
  );

  writeReservationStorage({
    ...storage,
    [ownerKey]: nextReservations,
  });

  return nextReservations;
}

export function replaceStoredReservations(user, reservations) {
  const ownerKey = getReservationOwnerKey(user);

  if (!ownerKey) {
    return [];
  }

  const storage = readReservationStorage();
  const nextReservations = sortReservations(
    Array.isArray(reservations) ? reservations : []
  );

  writeReservationStorage({
    ...storage,
    [ownerKey]: nextReservations,
  });

  return nextReservations;
}

export async function refreshStoredReservations(user) {
  const storedReservations = getStoredReservations(user);

  if (storedReservations.length === 0) {
    return [];
  }

  const refreshedReservations = await Promise.all(
    storedReservations.map(async (reservation) => {
      try {
        const payload = await apiFetch(`/reservations/${reservation.id}`);

        return {
          ...reservation,
          issuedAt: payload?.issued_at ?? reservation.issuedAt ?? "",
          expiresAt: payload?.expires_at ?? reservation.expiresAt ?? "",
        };
      } catch {
        return reservation;
      }
    })
  );

  return replaceStoredReservations(user, refreshedReservations);
}

export function createReservationRecord(listing, payload) {
  return {
    id:
      payload?.reservation?.id ??
      payload?.listing?.currentUsersReservation?.id ??
      listing?.id,
    listingId: listing?.id ?? "",
    title: listing?.title ?? "Reserved meal",
    description: listing?.description ?? "",
    restaurantId: listing?.restaurantId ?? "",
    restaurantName: listing?.restaurantName ?? "",
    restaurantGoogleMapsUrl:
      listing?.restaurantGoogleMapsUrl ?? listing?.googleMapsUrl ?? "",
    price: Number(listing?.price ?? 0),
    reservedAt:
      payload?.reservation?.issuedAt ??
      payload?.reservation?.reservedAt ??
      new Date().toISOString(),
    issuedAt: payload?.reservation?.issuedAt ?? "",
    expiresAt: payload?.reservation?.expiresAt ?? "",
    pickupWindow: payload?.reservation?.pickupWindow ?? listing?.pickupWindow ?? "",
    pickupCode:
      payload?.reservation?.pickupCode ??
      payload?.listing?.currentUsersReservation?.pickupCode ??
      "",
    quantity: Number(payload?.reservation?.quantity ?? 1),
    totalPrice: Number(
      payload?.reservation?.totalPrice ?? Number(listing?.price ?? 0)
    ),
    status:
      payload?.reservation?.status ??
      payload?.listing?.currentUsersReservation?.status ??
      "CONFIRMED",
    paymentStatus: "Stripe integration coming soon",
  };
}
