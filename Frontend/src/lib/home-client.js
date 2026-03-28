import { API_MODE, apiFetch } from "@/lib/api";
import {
  formatEnumLabel,
  normalizePagedPayload,
  normalizeRestaurantRecord,
} from "@/lib/backend-normalizers";
import { centsToCurrencyValue } from "@/lib/price";

const DEFAULT_RADIUS_KM = 5;
const DISCOVERY_RESTAURANT_LIMIT = 60;

function normalizeRestaurantsWithDistance(restaurants, params) {
  return restaurants
    .map((restaurant) =>
      normalizeRestaurantRecord(restaurant, {
        distanceKm: Number(
          getDistanceInKm(
            Number(params?.lat ?? 0),
            Number(params?.lng ?? 0),
            Number(restaurant?.latitude ?? restaurant?.lat ?? 0),
            Number(restaurant?.longitude ?? restaurant?.lng ?? 0)
          ).toFixed(2)
        ),
      })
    )
    .sort((first, second) => first.distanceKm - second.distanceKm);
}

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

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceInKm(fromLat, fromLng, toLat, toLng) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

function paginate(items, page, pageSize) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

function matchesFilters(foodSale, filters) {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const restaurantId = filters.restaurant ? String(filters.restaurant) : "";
  const selectedTags = Array.isArray(filters.tag) ? filters.tag : [];
  const excludedAllergens = Array.isArray(filters.excludeAllergen)
    ? filters.excludeAllergen
    : [];

  if (search && !foodSale.title.toLowerCase().includes(search)) {
    return false;
  }

  if (restaurantId && foodSale.restaurantId !== restaurantId) {
    return false;
  }

  if (selectedTags.length > 0 && !selectedTags.some((tag) => foodSale.tags.includes(tag))) {
    return false;
  }

  if (
    excludedAllergens.length > 0 &&
    excludedAllergens.some((allergen) => foodSale.allergens.includes(allergen))
  ) {
    return false;
  }

  return true;
}

async function fetchNearbyRestaurantRecords(params) {
  const query = buildQueryString({
    lat: params?.lat,
    lng: params?.lng,
    radius: params?.radius ?? DEFAULT_RADIUS_KM,
    page: Math.max((params?.page ?? 1) - 1, 0),
    size: params?.pageSize ?? DISCOVERY_RESTAURANT_LIMIT,
  });

  try {
    const payload = await apiFetch(`/restaurants/nearby${query}`);
    const { items, pagination } = normalizePagedPayload(payload, "restaurants");

    if (items.length > 0) {
      return {
        restaurants: normalizeRestaurantsWithDistance(items, params),
        pagination,
      };
    }
  } catch {}

  const fallbackPayload = await apiFetch(
    `/restaurants${buildQueryString({
      page: 0,
      size: params?.pageSize ?? DISCOVERY_RESTAURANT_LIMIT,
    })}`
  );
  const { items, pagination } = normalizePagedPayload(
    fallbackPayload,
    "restaurants"
  );

  return {
    restaurants: normalizeRestaurantsWithDistance(items, params),
    pagination,
  };
}

async function fetchFoodLookups() {
  const [foodTagsPayload, allergensPayload] = await Promise.all([
    apiFetch("/tags/food"),
    apiFetch("/tags/allergens"),
  ]);

  const foodTagLookup = new Map(
    (Array.isArray(foodTagsPayload) ? foodTagsPayload : []).map((item) => [
      Number(item.id),
      formatEnumLabel(item.type),
    ])
  );
  const allergenLookup = new Map(
    (Array.isArray(allergensPayload) ? allergensPayload : []).map((item) => [
      Number(item.id),
      formatEnumLabel(item.type),
    ])
  );

  return {
    foodTagLookup,
    allergenLookup,
  };
}

async function fetchRealRestaurantsWithCounts(params) {
  const { restaurants, pagination } = await fetchNearbyRestaurantRecords(params);

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
    pagination,
    userLocation: {
      lat: params?.lat,
      lng: params?.lng,
    },
  };
}

async function fetchRealFoodSales(params) {
  const [{ restaurants }, { foodTagLookup, allergenLookup }] = await Promise.all([
    fetchNearbyRestaurantRecords({
      lat: params?.lat,
      lng: params?.lng,
      radius: params?.radius ?? DEFAULT_RADIUS_KM,
      page: 1,
      pageSize: DISCOVERY_RESTAURANT_LIMIT,
    }),
    fetchFoodLookups(),
  ]);

  const scopedRestaurants = params?.restaurant
    ? restaurants.filter((restaurant) => restaurant.id === String(params.restaurant))
    : restaurants;

  const salesByRestaurant = await Promise.all(
    scopedRestaurants.map(async (restaurant) => {
      try {
        const sales = await apiFetch(`/food-sales/restaurant/${restaurant.id}`);

        return {
          restaurant,
          sales: Array.isArray(sales) ? sales : [],
        };
      } catch {
        return {
          restaurant,
          sales: [],
        };
      }
    })
  );

  const foodIds = [
    ...new Set(
      salesByRestaurant.flatMap(({ sales }) =>
        sales.map((sale) => Number(sale?.foodId)).filter(Number.isFinite)
      )
    ),
  ];

  const foods = await Promise.all(
    foodIds.map(async (foodId) => {
      try {
        const food = await apiFetch(`/foods/${foodId}`);
        return [foodId, food];
      } catch {
        return [foodId, null];
      }
    })
  );

  const foodLookup = new Map(foods);

  const foodSales = salesByRestaurant
    .flatMap(({ restaurant, sales }) =>
      sales.map((sale) => {
        const food = foodLookup.get(Number(sale?.foodId));
        const tags = Array.isArray(food?.foodTagIds)
          ? food.foodTagIds
              .map((id) => foodTagLookup.get(Number(id)))
              .filter(Boolean)
          : [];
        const allergens = Array.isArray(food?.allergenIds)
          ? food.allergenIds
              .map((id) => allergenLookup.get(Number(id)))
              .filter(Boolean)
          : [];

        return {
          id: String(sale?.id ?? ""),
          restaurantId: restaurant.id,
          title: food?.name ?? `Food sale #${sale?.id ?? ""}`,
          description:
            food?.description?.trim() || `Available meal from ${restaurant.name}.`,
          price: centsToCurrencyValue(sale?.price),
          pickupWindow: formatPickupWindow(sale?.issuedAt, sale?.expiresAt),
          tags,
          allergens,
          restaurantName: restaurant.name,
          restaurantAddress: restaurant.address,
          restaurantLat: restaurant.lat,
          restaurantLng: restaurant.lng,
          restaurantGoogleMapsUrl: restaurant.googleMapsUrl,
          distanceKm: restaurant.distanceKm,
          reservationCount: 0,
          reservedQuantity: 0,
          isReservedByCurrentUser: false,
          currentUsersReservation: null,
        };
      })
    )
    .sort((first, second) => first.distanceKm - second.distanceKm);

  const filteredFoodSales = foodSales.filter((foodSale) => matchesFilters(foodSale, params));
  const { items, pagination } = paginate(
    filteredFoodSales,
    Number(params?.page ?? 1),
    Number(params?.pageSize ?? 6)
  );

  return {
    foodSales: items,
    pagination,
    availableTags: [...new Set(foodSales.flatMap((foodSale) => foodSale.tags))].sort(),
    userLocation: {
      lat: params?.lat,
      lng: params?.lng,
    },
  };
}

export async function fetchNearbyRestaurants(params) {
  if (API_MODE === "mock") {
    return apiFetch(`/restaurants/nearby${buildQueryString(params)}`);
  }

  return fetchRealRestaurantsWithCounts(params);
}

export async function fetchNearbyFoodSales(params) {
  if (API_MODE === "mock") {
    return apiFetch(`/food-sales/nearby${buildQueryString(params)}`);
  }

  return fetchRealFoodSales(params);
}

export async function reserveFoodSale(foodSaleId) {
  if (API_MODE === "mock") {
    return apiFetch(`/food-sales/${foodSaleId}/reserve`, {
      method: "POST",
    });
  }

  const reservationId = await apiFetch("/reservations", {
    method: "POST",
    body: JSON.stringify({
      foodSaleId: Number(foodSaleId),
    }),
  });

  let reservationDetails = null;

  try {
    reservationDetails = await apiFetch(`/reservations/${reservationId}`);
  } catch {
    reservationDetails = null;
  }

  return {
    reservation: {
      id: reservationId,
      issuedAt: reservationDetails?.issuedAt ?? "",
      expiresAt: reservationDetails?.expiresAt ?? "",
    },
    foodSale: {
      id: String(foodSaleId),
      isReservedByCurrentUser: true,
      currentUsersReservation: {
        id: reservationId,
        status: "CONFIRMED",
      },
    },
  };
}

