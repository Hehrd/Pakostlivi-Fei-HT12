import { API_MODE, apiFetch } from "@/lib/api";
import { normalizePagedPayload } from "@/lib/backend-normalizers";

function normalizeReservationRecord(reservation) {
  const reservationId =
    reservation?.reservationId ?? reservation?.id ?? reservation?.reservation_id;

  return {
    id: String(reservationId ?? ""),
    reservationId: Number(reservationId ?? 0),
    title: reservation?.title ?? `Reservation #${reservationId ?? ""}`,
    description: reservation?.description ?? "",
    restaurantName: reservation?.restaurantName ?? "",
    restaurantGoogleMapsUrl: reservation?.restaurantGoogleMapsUrl ?? "",
    price: Number(reservation?.price ?? 0),
    totalPrice: Number(reservation?.totalPrice ?? reservation?.price ?? 0),
    reservedAt:
      reservation?.reservedAt ?? reservation?.issuedAt ?? reservation?.issued_at ?? "",
    issuedAt: reservation?.issuedAt ?? reservation?.issued_at ?? "",
    expiresAt: reservation?.expiresAt ?? reservation?.expires_at ?? "",
    pickupWindow: reservation?.pickupWindow ?? "",
    pickupCode: reservation?.pickupCode ?? "",
    quantity: Number(reservation?.quantity ?? 1),
    status: reservation?.status ?? "UNPAID",
    paymentStatus:
      reservation?.paymentStatus ??
      (reservation?.status === "PAID"
        ? "Paid with Stripe"
        : reservation?.status === "UNPAID"
          ? "Awaiting Stripe payment"
          : "Payment status unavailable"),
  };
}

export async function fetchUserReservations(params = {}) {
  const query = new URLSearchParams({
    page: String(Math.max(Number(params?.page ?? 1) - 1, 0)),
    size: String(Number(params?.pageSize ?? 50)),
  });

  const payload = await apiFetch(`/reservations/by-user?${query.toString()}`);
  const { items, pagination } = normalizePagedPayload(payload, "reservations");

  return {
    reservations: items.map((reservation) => normalizeReservationRecord(reservation)),
    pagination,
  };
}

export async function createReservation(foodSaleId, quantity = 1) {
  return apiFetch("/reservations", {
    method: "POST",
    body: {
      foodSaleId: Number(foodSaleId),
      quantity: Number(quantity),
    },
  });
}

export async function fetchReservationDetails(reservationId) {
  const payload = await apiFetch(`/reservations/${reservationId}`);
  return normalizeReservationRecord(payload);
}

export async function createStripePaymentIntent({ reservationId, amount }) {
  const payload = await apiFetch("/payments", {
    method: "POST",
    body: {
      foodSaleId: Number(reservationId),
      amount: Number(amount),
    },
  });

  return {
    clientSecret: payload?.clientSecret ?? "",
  };
}

export function createReservationRecord(foodSale, payload) {
  const reservationStatus =
    payload?.reservation?.status ??
    payload?.foodSale?.currentUsersReservation?.status ??
    "UNPAID";

  return normalizeReservationRecord({
    id:
      payload?.reservation?.id ??
      payload?.foodSale?.currentUsersReservation?.id ??
      foodSale?.id,
    title: foodSale?.title ?? "Reserved meal",
    description: foodSale?.description ?? "",
    restaurantName: foodSale?.restaurantName ?? "",
    restaurantGoogleMapsUrl:
      foodSale?.restaurantGoogleMapsUrl ?? foodSale?.googleMapsUrl ?? "",
    price: Number(foodSale?.price ?? 0),
    totalPrice: Number(
      payload?.reservation?.totalPrice ?? Number(foodSale?.price ?? 0)
    ),
    reservedAt:
      payload?.reservation?.issuedAt ??
      payload?.reservation?.reservedAt ??
      new Date().toISOString(),
    issuedAt: payload?.reservation?.issuedAt ?? "",
    expiresAt: payload?.reservation?.expiresAt ?? "",
    pickupWindow: payload?.reservation?.pickupWindow ?? foodSale?.pickupWindow ?? "",
    pickupCode:
      payload?.reservation?.pickupCode ??
      payload?.foodSale?.currentUsersReservation?.pickupCode ??
      "",
    quantity: Number(payload?.reservation?.quantity ?? 1),
    status: reservationStatus,
  });
}

export async function fetchFoodSaleReservations(foodSaleId, params = {}) {
  const query = new URLSearchParams({
    page: String(Math.max(Number(params?.page ?? 1) - 1, 0)),
    size: String(Number(params?.pageSize ?? 50)),
  });

  if (API_MODE === "mock") {
    const payload = await apiFetch(`/restaurant/food-sales/${foodSaleId}/reservations`);
    const reservations = Array.isArray(payload?.reservations)
      ? payload.reservations.map((reservation) =>
          normalizeReservationRecord({
            ...reservation,
            id: reservation?.id,
            issuedAt: reservation?.issuedAt ?? reservation?.reservedAt,
            expiresAt: reservation?.expiresAt,
          })
        )
      : [];

    return {
      reservations,
      pagination: {
        page: 1,
        pageSize: reservations.length,
        totalItems: reservations.length,
        totalPages: 1,
      },
    };
  }

  const payload = await apiFetch(
    `/reservations/by-food-sale/${foodSaleId}?${query.toString()}`
  );
  const { items, pagination } = normalizePagedPayload(payload, "reservations");

  return {
    reservations: items.map((reservation) => normalizeReservationRecord(reservation)),
    pagination,
  };
}
