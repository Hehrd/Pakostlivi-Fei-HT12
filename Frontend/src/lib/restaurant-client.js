import { API_MODE, apiFetch } from "@/lib/api";

export async function fetchMyRestaurantListings() {
  if (API_MODE !== "mock") {
    throw {
      status: 501,
      message:
        "Restaurant listing lookup needs a current-restaurant endpoint from the backend.",
    };
  }

  return apiFetch("/restaurant/listings");
}

export async function fetchListingReservations(listingId) {
  if (API_MODE !== "mock") {
    throw {
      status: 501,
      message:
        "Restaurant reservation lookup needs a current-restaurant endpoint from the backend.",
    };
  }

  return apiFetch(`/restaurant/listings/${listingId}/reservations`);
}
