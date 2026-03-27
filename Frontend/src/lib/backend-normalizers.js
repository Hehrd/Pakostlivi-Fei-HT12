export function formatEnumLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeRole(role) {
  if (role === "RESTORANT") {
    return "RESTAURANT";
  }

  return role ?? "CLIENT";
}

export function normalizeRestaurantRecord(restaurant, options = {}) {
  const lat = Number(restaurant?.latitude ?? restaurant?.lat ?? 0);
  const lng = Number(restaurant?.longitude ?? restaurant?.lng ?? 0);
  const googleMapsUrl =
    restaurant?.googleMapsLink ?? restaurant?.googleMapsUrl ?? "";

  return {
    id: String(restaurant?.id ?? ""),
    name: restaurant?.name ?? "",
    address:
      restaurant?.address ??
      googleMapsUrl ??
      "Google Maps link available",
    lat,
    lng,
    googleMapsUrl,
    listingCount: options.listingCount ?? restaurant?.listingCount ?? 0,
    distanceKm: options.distanceKm ?? restaurant?.distanceKm ?? 0,
    ownerId:
      options.ownerId ??
      (restaurant?.ownerId !== undefined && restaurant?.ownerId !== null
        ? String(restaurant.ownerId)
        : ""),
    ownerEmail: options.ownerEmail ?? restaurant?.ownerEmail ?? "",
    ownerFirstName: options.ownerFirstName ?? restaurant?.ownerFirstName ?? "",
    ownerLastName: options.ownerLastName ?? restaurant?.ownerLastName ?? "",
  };
}

export function normalizePagedPayload(payload, key) {
  if (Array.isArray(payload?.data)) {
    return {
      items: payload.data,
      pagination: {
        page: Number(payload.page ?? 0) + 1,
        pageSize: Number(payload.size ?? payload.data.length ?? 0),
        totalItems: Number(payload.total ?? payload.data.length ?? 0),
        totalPages: Number(payload.totalPages ?? 1),
      },
    };
  }

  if (Array.isArray(payload?.[key])) {
    return {
      items: payload[key],
      pagination: payload?.pagination ?? {
        page: 1,
        pageSize: payload[key].length,
        totalItems: payload[key].length,
        totalPages: 1,
      },
    };
  }

  return {
    items: [],
    pagination: {
      page: 1,
      pageSize: 0,
      totalItems: 0,
      totalPages: 1,
    },
  };
}
