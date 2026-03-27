import { API_MODE, apiFetch } from "@/lib/api";
import {
  normalizePagedPayload,
  normalizeRestaurantRecord,
} from "@/lib/backend-normalizers";

export async function fetchAdminRestaurants() {
  if (API_MODE === "mock") {
    return apiFetch("/admin/restaurants");
  }

  const payload = await apiFetch("/restaurants?page=0&size=200");
  const { items } = normalizePagedPayload(payload, "restaurants");

  const restaurants = await Promise.all(
    items.map(async (restaurant) => {
      try {
        const sales = await apiFetch(`/food-sales/restaurant/${restaurant.id}`);

        return normalizeRestaurantRecord(restaurant, {
          listingCount: Array.isArray(sales) ? sales.length : 0,
        });
      } catch {
        return normalizeRestaurantRecord(restaurant, {
          listingCount: 0,
        });
      }
    })
  );

  return {
    restaurants,
  };
}

export async function createRestaurant(body) {
  if (API_MODE === "mock") {
    return apiFetch("/admin/restaurants", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  const payload = await apiFetch("/restaurants", {
    method: "POST",
    body: JSON.stringify({
      name: body?.name,
      googleMapsLink: body?.googleMapsUrl,
      longitude: body?.lng,
      latitude: body?.lat,
    }),
  });

  return {
    restaurant: normalizeRestaurantRecord(payload, {
      listingCount: 0,
    }),
  };
}

export async function updateRestaurant(restaurantId, body) {
  if (API_MODE === "mock") {
    return apiFetch(`/admin/restaurants/${restaurantId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  const payload = await apiFetch("/restaurants", {
    method: "PUT",
    body: JSON.stringify({
      id: Number(restaurantId),
      name: body?.name,
      googleMapsLink: body?.googleMapsUrl,
      longitude: body?.lng,
      latitude: body?.lat,
    }),
  });

  let listingCount = 0;

  try {
    const sales = await apiFetch(`/food-sales/restaurant/${restaurantId}`);
    listingCount = Array.isArray(sales) ? sales.length : 0;
  } catch {
    listingCount = 0;
  }

  return {
    restaurant: normalizeRestaurantRecord(payload, {
      listingCount,
    }),
  };
}

export async function deleteRestaurant(restaurantId) {
  if (API_MODE === "mock") {
    return apiFetch(`/admin/restaurants/${restaurantId}`, {
      method: "DELETE",
    });
  }

  return apiFetch(`/restaurants/${restaurantId}`, {
    method: "DELETE",
  });
}
