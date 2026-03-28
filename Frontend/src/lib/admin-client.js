import { API_MODE, apiFetch } from "@/lib/api";
import {
  normalizePagedPayload,
  normalizeRestaurantRecord,
} from "@/lib/backend-normalizers";

function buildDefaultProfilePictureUrl(firstName = "", lastName = "") {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const seed = encodeURIComponent(fullName || "Munchman User");

  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
}

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
          foodSaleCount: Array.isArray(sales) ? sales.length : 0,
        });
      } catch {
        return normalizeRestaurantRecord(restaurant, {
          foodSaleCount: 0,
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
      signUpReqDTO: {
        email: body?.ownerEmail?.trim(),
        password: body?.ownerPassword,
        firstName: body?.ownerFirstName?.trim(),
        lastName: body?.ownerLastName?.trim(),
        profilePictureUrl: buildDefaultProfilePictureUrl(
          body?.ownerFirstName,
          body?.ownerLastName
        ),
      },
      restaurantCreateData: {
        name: body?.name,
        googleMapsLink: body?.googleMapsUrl,
        longitude: body?.lng,
        latitude: body?.lat,
      },
    }),
  });

  return {
    restaurant: normalizeRestaurantRecord(payload, {
      foodSaleCount: 0,
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

  let foodSaleCount = 0;

  try {
    const sales = await apiFetch(`/food-sales/restaurant/${restaurantId}`);
    foodSaleCount = Array.isArray(sales) ? sales.length : 0;
  } catch {
    foodSaleCount = 0;
  }

  return {
    restaurant: normalizeRestaurantRecord(payload, {
      foodSaleCount,
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

