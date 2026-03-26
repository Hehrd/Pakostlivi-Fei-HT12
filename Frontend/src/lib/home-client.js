import { apiFetch } from "@/lib/api";

function buildQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, item);
        }
      });
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

export async function fetchNearbyRestaurants(params) {
  return apiFetch(`/restaurants/nearby${buildQueryString(params)}`);
}

export async function fetchNearbyListings(params) {
  return apiFetch(`/listings/nearby${buildQueryString(params)}`);
}
