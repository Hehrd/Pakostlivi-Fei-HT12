import { API_MODE, apiFetch, apiRequest } from "@/lib/api";
import {
  formatEnumLabel,
  normalizePagedPayload,
  normalizeRestaurantRecord,
} from "@/lib/backend-normalizers";
import { centsToCurrencyValue, currencyValueToCents } from "@/lib/price";
import { AUTH_USER_STORAGE_KEY } from "@/lib/api";

function formatPickupWindow(issuedAt, expiresAt) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!issuedAt && !expiresAt) {
    return "Pickup window unavailable";
  }

  if (!issuedAt) {
    return `Until ${formatter.format(new Date(expiresAt))}`;
  }

  if (!expiresAt) {
    return `From ${formatter.format(new Date(issuedAt))}`;
  }

  return `${formatter.format(new Date(issuedAt))} - ${formatter.format(
    new Date(expiresAt)
  )}`;
}

function mapOptionList(payload) {
  return Array.isArray(payload)
    ? payload.map((item) => ({
        id: Number(item?.id),
        label: formatEnumLabel(item?.type),
      }))
    : [];
}

function getMockRestaurantHeaders() {
  if (API_MODE !== "mock" || typeof window === "undefined") {
    return {};
  }

  try {
    const storedUser = window.sessionStorage.getItem(AUTH_USER_STORAGE_KEY);

    if (!storedUser) {
      return {};
    }

    const parsedUser = JSON.parse(storedUser);
    const email = parsedUser?.email?.trim();

    return email
      ? {
          "x-mock-user-email": email,
        }
      : {};
  } catch {
    return {};
  }
}

function isValidRedirectUrl(value) {
  return /^https?:\/\//i.test(String(value ?? "").trim());
}

async function extractOnboardingResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    const url =
      payload?.url ??
      payload?.redirectUrl ??
      payload?.data?.url ??
      payload?.data?.redirectUrl;

    if (isValidRedirectUrl(url)) {
      return {
        url: url.trim(),
        message: payload?.message ?? payload?.error ?? "",
      };
    }

    return {
      url: "",
      message: payload?.message ?? payload?.error ?? "",
    };
  }

  const text = (await response.text().catch(() => "")).trim();
  return {
    url: isValidRedirectUrl(text) ? text : "",
    message: isValidRedirectUrl(text) ? "" : text,
  };
}

async function fetchFoodSaleLookups() {
  const [allergensPayload, foodTagsPayload] = await Promise.all([
    apiFetch("/tags/allergens"),
    apiFetch("/tags/food"),
  ]);

  const allergens = mapOptionList(allergensPayload);
  const foodTags = mapOptionList(foodTagsPayload);

  return {
    allergens,
    foodTags,
    allergenLookup: new Map(allergens.map((item) => [item.id, item.label])),
    foodTagLookup: new Map(foodTags.map((item) => [item.id, item.label])),
  };
}

function normalizeRestaurantCollection(payload) {
  if (Array.isArray(payload)) {
    return payload.map((restaurant) => normalizeRestaurantRecord(restaurant));
  }

  const { items } = normalizePagedPayload(payload, "restaurants");
  return items.map((restaurant) => normalizeRestaurantRecord(restaurant));
}

function buildFoodSaleRecord({
  restaurant,
  sale,
  food,
  allergenLookup,
  foodTagLookup,
}) {
  const allergenLabels = Array.isArray(food?.allergenIds)
    ? food.allergenIds
        .map((item) => allergenLookup.get(Number(item)))
        .filter(Boolean)
    : [];
  const tagLabels = Array.isArray(food?.foodTagIds)
    ? food.foodTagIds
        .map((item) => foodTagLookup.get(Number(item)))
        .filter(Boolean)
    : [];

  return {
    id: String(sale?.id ?? ""),
    saleId: Number(sale?.id),
    foodId: Number(sale?.foodId),
    restaurantId: restaurant?.id ?? "",
    title: food?.name ?? `Food sale #${sale?.id ?? ""}`,
    description:
      food?.description?.trim() || "Description not available for this food sale.",
    price: centsToCurrencyValue(sale?.price),
    quantity: Number(sale?.quantity ?? 0) || null,
    pickupWindow: formatPickupWindow(sale?.issuedAt, sale?.expiresAt),
    issuedAt: sale?.issuedAt ?? "",
    expiresAt: sale?.expiresAt ?? "",
    allergenIds: Array.isArray(food?.allergenIds)
      ? food.allergenIds.map((item) => Number(item))
      : [],
    allergens: allergenLabels,
    foodTagIds: Array.isArray(food?.foodTagIds)
      ? food.foodTagIds.map((item) => Number(item))
      : [],
    tags: tagLabels,
  };
}

async function fetchRealOwnerRestaurants() {
  const payload = await apiFetch("/restaurants/by-owner?page=0&size=200");
  const restaurants = normalizeRestaurantCollection(payload);

  const restaurantsWithCounts = await Promise.all(
    restaurants.map(async (restaurant) => {
      try {
        const sales = await apiFetch(`/food-sales/restaurant/${restaurant.id}`);

        return {
          ...restaurant,
          foodSaleCount: Array.isArray(sales) ? sales.length : 0,
        };
      } catch {
        return {
          ...restaurant,
          foodSaleCount: 0,
        };
      }
    })
  );

  return {
    restaurants: restaurantsWithCounts,
  };
}

async function fetchRealRestaurantFoodSales(restaurantId) {
  const [restaurantsPayload, { allergenLookup, foodTagLookup }] =
    await Promise.all([fetchRealOwnerRestaurants(), fetchFoodSaleLookups()]);
  const restaurants = restaurantsPayload?.restaurants ?? [];
  const restaurant =
    restaurants.find((item) => item.id === String(restaurantId)) ??
    restaurants[0] ??
    null;

  if (!restaurant?.id) {
    return {
      restaurants,
      restaurant: null,
      foodSales: [],
      totals: {
        foodSaleCount: 0,
        reservationCount: 0,
        reservedMeals: 0,
      },
    };
  }

  const salesPayload = await apiFetch(`/food-sales/restaurant/${restaurant.id}`);
  const sales = Array.isArray(salesPayload) ? salesPayload : [];

  const foodSales = await Promise.all(
    sales.map(async (sale) => {
      let food = null;

      try {
        food = await apiFetch(`/foods/${sale.foodId}`);
      } catch {
        food = null;
      }

      return buildFoodSaleRecord({
        restaurant,
        sale,
        food,
        allergenLookup,
        foodTagLookup,
      });
    })
  );

  return {
    restaurants,
    restaurant,
    foodSales,
    totals: {
      foodSaleCount: foodSales.length,
      reservationCount: 0,
      reservedMeals: 0,
    },
  };
}

export async function fetchOwnerRestaurants() {
  if (API_MODE === "mock") {
    const payload = await apiFetch("/restaurant/food-sales");

    return {
      restaurants: payload?.restaurant ? [payload.restaurant] : [],
    };
  }

  return fetchRealOwnerRestaurants();
}

export async function startRestaurantStripeOnboarding() {
  if (API_MODE === "mock") {
    return {
      url: null,
      alreadyConnected: true,
    };
  }

  let response;

  try {
    response = await apiRequest("/restaurants/onboard", {
      method: "POST",
      headers: {
        ...getMockRestaurantHeaders(),
      },
    });
  } catch (error) {
    throw error;
  }

  const { url: onboardingUrl, message } = await extractOnboardingResponse(
    response
  );

  if (
    (response.ok || (response.status >= 300 && response.status < 400)) &&
    !onboardingUrl &&
    !message
  ) {
    return {
      url: null,
      alreadyConnected: true,
    };
  }

  if (
    (response.ok || (response.status >= 300 && response.status < 400)) &&
    onboardingUrl
  ) {
    return {
      url: onboardingUrl,
      alreadyConnected: false,
    };
  }

  if (response.status === 401) {
    throw {
      status: 401,
      message: "Your session expired. Please log in again.",
    };
  }

  if (response.status === 403) {
    throw {
      status: 403,
      message: "Only restaurant accounts can connect Stripe right now.",
    };
  }

  throw {
    status: response.status,
    message:
      message ||
      "Unable to start Stripe onboarding right now. Please try again.",
  };
}

export async function updateOwnedRestaurant(body) {
  if (API_MODE === "mock") {
    return apiFetch("/restaurant/food-sales/restaurant", {
      method: "PUT",
      body,
    });
  }

  const payload = await apiFetch("/restaurants", {
    method: "PUT",
    body: {
      id: Number(body?.restaurantId),
      name: body?.name?.trim(),
      googleMapsLink: body?.googleMapsUrl?.trim(),
      longitude: Number(body?.lng ?? 0),
      latitude: Number(body?.lat ?? 0),
    },
  });

  return {
    restaurant: normalizeRestaurantRecord(payload),
  };
}

export async function fetchRestaurantFoodSaleOptions() {
  if (API_MODE === "mock") {
    const [allergenPayload, foodTagPayload] = await Promise.all([
      apiFetch("/allergens"),
      apiFetch("/food-tags"),
    ]);

    return {
      allergens: Array.isArray(allergenPayload?.allergens)
        ? allergenPayload.allergens.map((item) => ({
            id: Number(item?.id),
            label: item?.label ?? "",
          }))
        : [],
      foodTags: Array.isArray(foodTagPayload?.tags)
        ? foodTagPayload.tags.map((item, index) => ({
            id: index + 1,
            label: item,
          }))
        : [],
    };
  }

  const { allergens, foodTags } = await fetchFoodSaleLookups();

  return {
    allergens,
    foodTags,
  };
}

export async function fetchMyRestaurantFoodSales(restaurantId) {
  if (API_MODE === "mock") {
    return apiFetch("/restaurant/food-sales");
  }

  return fetchRealRestaurantFoodSales(restaurantId);
}

export async function createRestaurantFoodSale(body) {
  if (API_MODE === "mock") {
    return apiFetch("/restaurant/food-sales", {
      method: "POST",
      body,
    });
  }

  const food = await apiFetch("/foods", {
    method: "POST",
    body: {
      restaurantId: Number(body?.restaurantId),
      name: body?.title?.trim(),
      description: body?.description?.trim(),
      allergenIds: Array.isArray(body?.allergenIds)
        ? body.allergenIds.map((item) => Number(item))
        : [],
      foodTagIds: Array.isArray(body?.foodTagIds)
        ? body.foodTagIds.map((item) => Number(item))
        : [],
    },
  });

  await apiFetch("/food-sales", {
    method: "POST",
    body: {
      foodId: Number(food?.id),
      price: currencyValueToCents(body?.price),
      quantity: Number(body?.quantity ?? 0),
      issuedAt: body?.issuedAt,
      expiresAt: body?.expiresAt,
    },
  });

  return fetchRealRestaurantFoodSales(body?.restaurantId);
}

export async function updateRestaurantFoodSale(body) {
  if (API_MODE === "mock") {
    return apiFetch(`/restaurant/food-sales/${body?.saleId}`, {
      method: "PUT",
      body,
    });
  }

  await Promise.all([
    apiFetch("/foods", {
      method: "PUT",
      body: {
        id: Number(body?.foodId),
        name: body?.title?.trim(),
        description: body?.description?.trim(),
        allergenIds: Array.isArray(body?.allergenIds)
          ? body.allergenIds.map((item) => Number(item))
          : [],
        foodTagIds: Array.isArray(body?.foodTagIds)
          ? body.foodTagIds.map((item) => Number(item))
          : [],
      },
    }),
    apiFetch("/food-sales", {
      method: "PUT",
      body: {
        id: Number(body?.saleId),
        foodId: Number(body?.foodId),
        price: currencyValueToCents(body?.price),
        quantity: Number(body?.quantity ?? 0),
        issuedAt: body?.issuedAt,
        expiresAt: body?.expiresAt,
      },
    }),
  ]);

  return fetchRealRestaurantFoodSales(body?.restaurantId);
}

export async function deleteRestaurantFoodSale(body) {
  if (API_MODE === "mock") {
    return apiFetch(`/restaurant/food-sales/${body?.saleId}`, {
      method: "DELETE",
    });
  }

  await apiFetch(`/food-sales/${body?.saleId}`, {
    method: "DELETE",
  });

  return fetchRealRestaurantFoodSales(body?.restaurantId);
}

export async function fetchFoodSaleReservations(foodSaleId) {
  if (API_MODE === "mock") {
    return apiFetch(`/restaurant/food-sales/${foodSaleId}/reservations`);
  }

  return apiFetch(`/reservations/by-food-sale/${foodSaleId}?page=0&size=50`);
}

