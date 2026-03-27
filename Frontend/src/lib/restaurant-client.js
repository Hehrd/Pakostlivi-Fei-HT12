import { apiFetch } from "@/lib/api";

export async function fetchMyRestaurantListings() {
  return apiFetch("/restaurant/listings");
}

export async function fetchListingReservations(listingId) {
  return apiFetch(`/restaurant/listings/${listingId}/reservations`);
}
