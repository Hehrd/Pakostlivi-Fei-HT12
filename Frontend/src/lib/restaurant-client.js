import { API_MODE, apiFetch } from "@/lib/api";
import {
  formatEnumLabel,
  normalizePagedPayload,
  normalizeRestaurantRecord,
} from "@/lib/backend-normalizers";
import { centsToCurrencyValue, currencyValueToCents } from "@/lib/price";

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

async function fetchListingLookups() {
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

function buildListingRecord({
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
      food?.description?.trim() || "Description not available for this listing.",
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
          listingCount: Array.isArray(sales) ? sales.length : 0,
        };
      } catch {
        return {
          ...restaurant,
          listingCount: 0,
        };
      }
    })
  );

  return {
    restaurants: restaurantsWithCounts,
  };
}

async function fetchRealRestaurantListings(restaurantId) {
  const [restaurantsPayload, { allergenLookup, foodTagLookup }] =
    await Promise.all([fetchRealOwnerRestaurants(), fetchListingLookups()]);
  const restaurants = restaurantsPayload?.restaurants ?? [];
  const restaurant =
    restaurants.find((item) => item.id === String(restaurantId)) ??
    restaurants[0] ??
    null;

  if (!restaurant?.id) {
    return {
      restaurants,
      restaurant: null,
      listings: [],
      totals: {
        listingCount: 0,
        reservationCount: 0,
        reservedMeals: 0,
      },
    };
  }

  const salesPayload = await apiFetch(`/food-sales/restaurant/${restaurant.id}`);
  const sales = Array.isArray(salesPayload) ? salesPayload : [];

  const listings = await Promise.all(
    sales.map(async (sale) => {
      let food = null;

      try {
        food = await apiFetch(`/foods/${sale.foodId}`);
      } catch {
        food = null;
      }

      return buildListingRecord({
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
    listings,
    totals: {
      listingCount: listings.length,
      reservationCount: 0,
      reservedMeals: 0,
    },
  };
}

export async function fetchOwnerRestaurants() {
  if (API_MODE === "mock") {
    const payload = await apiFetch("/restaurant/listings");

    return {
      restaurants: payload?.restaurant ? [payload.restaurant] : [],
    };
  }

  return fetchRealOwnerRestaurants();
}

export async function updateOwnedRestaurant(body) {
  if (API_MODE !== "real") {
    throw {
      status: 501,
      message: "Restaurant updates are only wired for the real backend right now.",
    };
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

export async function fetchRestaurantListingOptions() {
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

  const { allergens, foodTags } = await fetchListingLookups();

  return {
    allergens,
    foodTags,
  };
}

export async function fetchMyRestaurantListings(restaurantId) {
  if (API_MODE === "mock") {
    return apiFetch("/restaurant/listings");
  }

  return fetchRealRestaurantListings(restaurantId);
}

export async function createRestaurantListing(body) {
  if (API_MODE !== "real") {
    throw {
      status: 501,
      message: "Listing creation is only wired for the real backend right now.",
    };
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

  return fetchRealRestaurantListings(body?.restaurantId);
}

export async function updateRestaurantListing(body) {
  if (API_MODE !== "real") {
    throw {
      status: 501,
      message: "Listing updates are only wired for the real backend right now.",
    };
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

  return fetchRealRestaurantListings(body?.restaurantId);
}

export async function deleteRestaurantListing(body) {
  if (API_MODE !== "real") {
    throw {
      status: 501,
      message: "Listing deletion is only wired for the real backend right now.",
    };
  }

  await apiFetch(`/food-sales/${body?.saleId}`, {
    method: "DELETE",
  });

  return fetchRealRestaurantListings(body?.restaurantId);
}

export async function fetchListingReservations(listingId) {
  if (API_MODE !== "mock") {
    throw {
      status: 501,
      message:
        "Restaurant reservation lookup still needs a dedicated backend endpoint.",
    };
  }

  return apiFetch(`/restaurant/listings/${listingId}/reservations`);
}
