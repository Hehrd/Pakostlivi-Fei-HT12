import { http, HttpResponse } from "msw";

const COMMON_ALLERGENS = [
  { id: "milk", label: "Milk" },
  { id: "eggs", label: "Eggs" },
  { id: "peanuts", label: "Peanuts" },
  { id: "tree-nuts", label: "Tree Nuts" },
  { id: "soy", label: "Soy" },
  { id: "wheat", label: "Wheat" },
  { id: "fish", label: "Fish" },
  { id: "shellfish", label: "Shellfish" },
  { id: "sesame", label: "Sesame" },
];

const DEFAULT_LOCATION = {
  lat: 42.6977,
  lng: 23.3219,
};

const RESTAURANTS = [
  {
    id: "r1",
    name: "Green Fork Kitchen",
    address: "15 Vitosha Blvd, Sofia",
    lat: 42.6955,
    lng: 23.3211,
  },
  {
    id: "r2",
    name: "City Harvest Deli",
    address: "22 Graf Ignatiev St, Sofia",
    lat: 42.6909,
    lng: 23.3256,
  },
  {
    id: "r3",
    name: "Sun Tray Bistro",
    address: "48 Rakovski St, Sofia",
    lat: 42.6992,
    lng: 23.3324,
  },
  {
    id: "r4",
    name: "Campus Lunch Lab",
    address: "5 Shipka St, Sofia",
    lat: 42.6942,
    lng: 23.3372,
  },
  {
    id: "r5",
    name: "Daily Crumb Bakery",
    address: "11 Solunska St, Sofia",
    lat: 42.6927,
    lng: 23.3167,
  },
  {
    id: "r6",
    name: "Bowl & Board Market",
    address: "72 Alabin St, Sofia",
    lat: 42.6968,
    lng: 23.3129,
  },
];

const FOOD_SALES = [
  {
    id: "l1",
    restaurantId: "r1",
    title: "Roasted Veggie Grain Bowl",
    description: "Brown rice, carrots, chickpeas, tahini drizzle.",
    price: 6.5,
    pickupWindow: "18:00 - 19:30",
    tags: ["vegan", "healthy", "bowl"],
    allergens: ["sesame"],
  },
  {
    id: "l2",
    restaurantId: "r1",
    title: "Spinach Pasta Box",
    description: "Creamy pasta with spinach and roasted garlic.",
    price: 5.9,
    pickupWindow: "19:00 - 20:00",
    tags: ["pasta", "comfort"],
    allergens: ["milk", "wheat"],
  },
  {
    id: "l3",
    restaurantId: "r2",
    title: "Chicken Teriyaki Lunch Pack",
    description: "Rice, glazed chicken, quick-pickled vegetables.",
    price: 7.2,
    pickupWindow: "17:30 - 18:30",
    tags: ["protein", "asian", "rice"],
    allergens: ["soy", "sesame"],
  },
  {
    id: "l4",
    restaurantId: "r2",
    title: "Tomato Soup & Focaccia Set",
    description: "A warm soup cup with rosemary focaccia slices.",
    price: 4.8,
    pickupWindow: "18:00 - 19:00",
    tags: ["soup", "bakery"],
    allergens: ["wheat"],
  },
  {
    id: "l5",
    restaurantId: "r3",
    title: "Mediterranean Wrap Trio",
    description: "Falafel, hummus, greens, and herby dressing.",
    price: 6.1,
    pickupWindow: "16:30 - 18:00",
    tags: ["wrap", "vegetarian", "quick-bite"],
    allergens: ["wheat", "sesame"],
  },
  {
    id: "l6",
    restaurantId: "r3",
    title: "Salmon Rice Plate",
    description: "Grilled salmon with lemon rice and greens.",
    price: 8.9,
    pickupWindow: "19:00 - 20:30",
    tags: ["fish", "protein", "dinner"],
    allergens: ["fish"],
  },
  {
    id: "l7",
    restaurantId: "r4",
    title: "Turkey Club Sandwich",
    description: "Stacked toastie with turkey, lettuce, tomato, and sauce.",
    price: 5.4,
    pickupWindow: "15:00 - 17:00",
    tags: ["sandwich", "quick-bite"],
    allergens: ["eggs", "wheat"],
  },
  {
    id: "l8",
    restaurantId: "r4",
    title: "Tofu Noodle Salad",
    description: "Cold noodle bowl with tofu, greens, and sesame dressing.",
    price: 5.7,
    pickupWindow: "17:30 - 18:30",
    tags: ["vegan", "salad", "asian"],
    allergens: ["soy", "sesame", "wheat"],
  },
  {
    id: "l9",
    restaurantId: "r5",
    title: "Mixed Pastry Surprise Bag",
    description: "A mix of sweet and savory bakery items from today.",
    price: 4.2,
    pickupWindow: "18:30 - 20:00",
    tags: ["bakery", "sweet", "surprise-bag"],
    allergens: ["milk", "eggs", "wheat", "tree-nuts"],
  },
  {
    id: "l10",
    restaurantId: "r5",
    title: "Savory Croissant Pair",
    description: "Two flaky croissants with cheese and herbs.",
    price: 3.9,
    pickupWindow: "18:00 - 19:30",
    tags: ["bakery", "quick-bite"],
    allergens: ["milk", "wheat", "eggs"],
  },
  {
    id: "l11",
    restaurantId: "r6",
    title: "Falafel Mezze Tray",
    description: "Falafel, tabbouleh, hummus, and flatbread.",
    price: 6.8,
    pickupWindow: "18:30 - 20:00",
    tags: ["vegetarian", "sharing", "mediterranean"],
    allergens: ["sesame", "wheat"],
  },
  {
    id: "l12",
    restaurantId: "r6",
    title: "Peanut Satay Bowl",
    description: "Rice bowl with satay sauce, greens, and tofu.",
    price: 6.3,
    pickupWindow: "17:00 - 18:30",
    tags: ["vegan", "bowl", "asian"],
    allergens: ["peanuts", "soy"],
  },
];

const RESERVATIONS = [
  {
    id: "res1",
    foodSaleId: "l1",
    customerName: "Mila Petrova",
    customerEmail: "mila@example.com",
    quantity: 2,
    status: "CONFIRMED",
    reservedAt: "2026-03-26T10:15:00.000Z",
  },
  {
    id: "res2",
    foodSaleId: "l1",
    customerName: "Ivan Georgiev",
    customerEmail: "ivan@example.com",
    quantity: 1,
    status: "PICKED_UP",
    reservedAt: "2026-03-26T11:05:00.000Z",
  },
  {
    id: "res3",
    foodSaleId: "l2",
    customerName: "Teodora Marinova",
    customerEmail: "teodora@example.com",
    quantity: 1,
    status: "CONFIRMED",
    reservedAt: "2026-03-26T12:20:00.000Z",
  },
  {
    id: "res4",
    foodSaleId: "l2",
    customerName: "Georgi Stoyanov",
    customerEmail: "georgi@example.com",
    quantity: 3,
    status: "CONFIRMED",
    reservedAt: "2026-03-26T13:10:00.000Z",
  },
  {
    id: "res5",
    foodSaleId: "l3",
    customerName: "Sofia Nikolova",
    customerEmail: "sofia@example.com",
    quantity: 2,
    status: "CONFIRMED",
    reservedAt: "2026-03-26T10:40:00.000Z",
  },
];

function buildUser(overrides = {}) {
  return {
    id: 1,
    email: "foodlover@munchmun.com",
    firstName: "Save",
    lastName: "Foodhero",
    role: "CLIENT",
    restaurantId: null,
    walletBalance: 42.5,
    hasOnboarded: true,
    allergens: [],
    preferredFoodTags: ["healthy", "asian"],
    password: "anything123",
    ...overrides,
  };
}

function buildAuthError(status, error, message, path) {
  return {
    status,
    error,
    message,
    path,
  };
}

function buildSessionCookie(email) {
  return `session=${encodeURIComponent(
    email.toLowerCase()
  )}; Path=/; HttpOnly; SameSite=Lax`;
}

function parseCookieHeader(cookieHeader) {
  return Object.fromEntries(
    (cookieHeader ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");

        if (separatorIndex === -1) {
          return [part, ""];
        }

        const key = part.slice(0, separatorIndex).trim();
        const value = part.slice(separatorIndex + 1).trim();
        return [key, decodeURIComponent(value)];
      })
  );
}

function buildForbiddenError(path) {
  return buildAuthError(
    403,
    "Forbidden",
    "You do not have permission to perform this action",
    path
  );
}

function saveRegisteredUser(user) {
  registeredUsers.set(user.email.toLowerCase(), buildUser(user));
}

function setCurrentUser(nextUser) {
  currentUser = buildUser(nextUser);
  saveRegisteredUser(currentUser);
  return currentUser;
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

function parseLocation(searchParams) {
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  return {
    lat: Number.isFinite(lat) ? lat : DEFAULT_LOCATION.lat,
    lng: Number.isFinite(lng) ? lng : DEFAULT_LOCATION.lng,
  };
}

function getAvailableTags() {
  return [...new Set(FOOD_SALES.flatMap((foodSale) => foodSale.tags))].sort();
}

function buildGoogleMapsUrl({ lat, lng }) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function getUserFullName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
}

function getRestaurantFoodSaleCount(restaurantId) {
  return FOOD_SALES.filter((foodSale) => foodSale.restaurantId === restaurantId).length;
}

function getRestaurantReservationCount(restaurantId) {
  const ownedFoodSaleIds = FOOD_SALES.filter(
    (foodSale) => foodSale.restaurantId === restaurantId
  ).map((foodSale) => foodSale.id);

  return RESERVATIONS.filter((reservation) =>
    ownedFoodSaleIds.includes(reservation.foodSaleId)
  ).length;
}

function getAdminRestaurants() {
  return RESTAURANTS.map((restaurant) => ({
    ...restaurant,
    googleMapsUrl: restaurant.googleMapsUrl ?? buildGoogleMapsUrl(restaurant),
    foodSaleCount: getRestaurantFoodSaleCount(restaurant.id),
  })).sort((first, second) => first.name.localeCompare(second.name));
}

function getNextRestaurantId() {
  const maxId = RESTAURANTS.reduce((currentMax, restaurant) => {
    const numericId = Number(String(restaurant.id).replace(/\D/g, "")) || 0;
    return Math.max(currentMax, numericId);
  }, 0);

  return `r${maxId + 1}`;
}

function getNextReservationId() {
  const maxId = RESERVATIONS.reduce((currentMax, reservation) => {
    const numericId = Number(String(reservation.id).replace(/\D/g, "")) || 0;
    return Math.max(currentMax, numericId);
  }, 0);

  return `res${maxId + 1}`;
}

function buildPickupCode(foodSaleId, reservationId) {
  return `PK-${String(foodSaleId).toUpperCase()}-${String(reservationId)
    .replace(/^res/i, "")
    .padStart(3, "0")}`;
}

function paginate(items, page, pageSize) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
  };
}

function enrichRestaurants(location) {
  return RESTAURANTS.map((restaurant) => ({
    ...restaurant,
    distanceKm: Number(
      getDistanceInKm(location.lat, location.lng, restaurant.lat, restaurant.lng).toFixed(
        2
      )
    ),
    foodSaleCount: FOOD_SALES.filter(
      (foodSale) => foodSale.restaurantId === restaurant.id
    ).length,
  })).sort((first, second) => first.distanceKm - second.distanceKm);
}

function enrichFoodSales(location, viewer = null) {
  return FOOD_SALES.map((foodSale) => {
    const restaurant = RESTAURANTS.find(
      (item) => item.id === foodSale.restaurantId
    );
    const foodSaleReservations = RESERVATIONS.filter(
      (reservation) => reservation.foodSaleId === foodSale.id
    );
    const currentUsersReservation =
      viewer?.email && viewer.role === "CLIENT"
        ? foodSaleReservations.find(
            (reservation) =>
              reservation.customerEmail.toLowerCase() === viewer.email.toLowerCase()
          ) ?? null
        : null;

    return {
      ...foodSale,
      restaurantName: restaurant?.name ?? "Unknown restaurant",
      restaurantAddress:
        restaurant?.address ?? restaurant?.googleMapsUrl ?? "Google Maps link available",
      restaurantLat: restaurant?.lat ?? DEFAULT_LOCATION.lat,
      restaurantLng: restaurant?.lng ?? DEFAULT_LOCATION.lng,
      restaurantGoogleMapsUrl:
        restaurant?.googleMapsUrl ??
        buildGoogleMapsUrl({
          lat: restaurant?.lat ?? DEFAULT_LOCATION.lat,
          lng: restaurant?.lng ?? DEFAULT_LOCATION.lng,
        }),
      distanceKm: Number(
        getDistanceInKm(
          location.lat,
          location.lng,
          restaurant?.lat ?? DEFAULT_LOCATION.lat,
          restaurant?.lng ?? DEFAULT_LOCATION.lng
        ).toFixed(2)
      ),
      reservationCount: foodSaleReservations.length,
      reservedQuantity: foodSaleReservations.reduce(
        (sum, reservation) => sum + reservation.quantity,
        0
      ),
      isReservedByCurrentUser: Boolean(currentUsersReservation),
      currentUsersReservation: currentUsersReservation
        ? {
            id: currentUsersReservation.id,
            status: currentUsersReservation.status,
            pickupCode: currentUsersReservation.pickupCode ?? "",
          }
        : null,
    };
  }).sort((first, second) => first.distanceKm - second.distanceKm);
}

function getCurrentUsersRestaurant() {
  if (!currentUser?.restaurantId) {
    return null;
  }

  const restaurant = RESTAURANTS.find(
    (item) => item.id === currentUser.restaurantId
  );

  if (!restaurant) {
    return null;
  }

  return {
    ...restaurant,
    googleMapsUrl: restaurant.googleMapsUrl ?? buildGoogleMapsUrl(restaurant),
    foodSaleCount: getRestaurantFoodSaleCount(restaurant.id),
    reservationCount: getRestaurantReservationCount(restaurant.id),
  };
}

function getRestaurantFoodSalesForOwner(restaurantId) {
  return FOOD_SALES.filter((foodSale) => foodSale.restaurantId === restaurantId)
    .map((foodSale) => {
      const foodSaleReservations = RESERVATIONS.filter(
        (reservation) => reservation.foodSaleId === foodSale.id
      );

      return {
        ...foodSale,
        reservationCount: foodSaleReservations.length,
        reservedQuantity: foodSaleReservations.reduce(
          (sum, reservation) => sum + reservation.quantity,
          0
        ),
      };
    })
    .sort((first, second) => first.title.localeCompare(second.title));
}

function getReservationsForFoodSale(foodSaleId) {
  const foodSale = FOOD_SALES.find((item) => item.id === foodSaleId);

  return RESERVATIONS.filter((reservation) => reservation.foodSaleId === foodSaleId)
    .map((reservation) => ({
      ...reservation,
      foodSaleTitle: foodSale?.title ?? "Unknown food sale",
      pickupWindow: foodSale?.pickupWindow ?? "",
      totalPrice: Number(((foodSale?.price ?? 0) * reservation.quantity).toFixed(2)),
    }))
    .sort(
      (first, second) =>
        new Date(second.reservedAt).getTime() - new Date(first.reservedAt).getTime()
    );
}

function matchesFilters(foodSale, searchParams) {
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const restaurantId = searchParams.get("restaurant");
  const selectedTags = searchParams.getAll("tag");
  const excludedAllergens = searchParams.getAll("excludeAllergen");

  if (search && !foodSale.title.toLowerCase().includes(search)) {
    return false;
  }

  if (restaurantId && foodSale.restaurantId !== restaurantId) {
    return false;
  }

  if (
    selectedTags.length > 0 &&
    !selectedTags.some((tag) => foodSale.tags.includes(tag))
  ) {
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

function hydrateCurrentUserFromRequest(request) {
  if (currentUser) {
    return currentUser;
  }

  const mockUserEmail = request?.headers?.get("x-mock-user-email")?.toLowerCase();

  if (mockUserEmail) {
    const headerUser = registeredUsers.get(mockUserEmail);

    if (headerUser) {
      currentUser = buildUser(headerUser);
      return currentUser;
    }
  }

  const cookies = parseCookieHeader(request?.headers?.get("cookie"));
  const sessionEmail = cookies.session?.toLowerCase();

  if (!sessionEmail) {
    return null;
  }

  const sessionUser = registeredUsers.get(sessionEmail);

  if (!sessionUser) {
    return null;
  }

  currentUser = buildUser(sessionUser);
  return currentUser;
}

function requireAuthenticatedUser(path, request) {
  const sessionUser = hydrateCurrentUserFromRequest(request);

  if (!sessionUser) {
    return HttpResponse.json(
      buildAuthError(401, "Unauthorized", "Authentication is required", path),
      {
        status: 401,
      }
    );
  }

  return null;
}

function requireAdmin(path, request) {
  const unauthorizedResponse = requireAuthenticatedUser(path, request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (currentUser.role !== "ADMIN") {
    return HttpResponse.json(buildForbiddenError(path), {
      status: 403,
    });
  }

  return null;
}

function requireRestaurant(path, request) {
  const unauthorizedResponse = requireAuthenticatedUser(path, request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (currentUser.role !== "RESTAURANT") {
    return HttpResponse.json(buildForbiddenError(path), {
      status: 403,
    });
  }

  return null;
}

function requireClient(path, request) {
  const unauthorizedResponse = requireAuthenticatedUser(path, request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (currentUser.role !== "CLIENT") {
    return HttpResponse.json(buildForbiddenError(path), {
      status: 403,
    });
  }

  return null;
}

let currentUser = null;
const registeredUsers = new Map([
  [
    "foodlover@munchmun.com",
    buildUser({
      email: "foodlover@munchmun.com",
      firstName: "Save",
      lastName: "Foodhero",
    }),
  ],
  [
    "froggerstheboys@gmail.com",
    buildUser({
      email: "froggerstheboys@gmail.com",
      firstName: "Frogger",
      lastName: "The Boys",
    }),
  ],
  [
    "admin@munchmun.com",
    buildUser({
      id: 100,
      email: "admin@munchmun.com",
      firstName: "Admin",
      lastName: "Fairy",
      role: "ADMIN",
      preferredFoodTags: [],
    }),
  ],
  [
    "restaurant@munchmun.com",
    buildUser({
      id: 200,
      email: "restaurant@munchmun.com",
      firstName: "Restaurant",
      lastName: "Owner",
      role: "RESTAURANT",
      restaurantId: "r1",
      preferredFoodTags: [],
    }),
  ],
]);

export const handlers = [
  http.post("*/account/login", async ({ request }) => {
    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();
    const password = body?.password?.trim();

    if (!email || !password) {
      return HttpResponse.json(
        buildAuthError(
          400,
          "Bad Request",
          "Email and password are required",
          "/account/login"
        ),
        {
          status: 400,
        }
      );
    }

    const registeredUser = registeredUsers.get(email);

    if (!registeredUser || registeredUser.password !== password) {
      return HttpResponse.json(
        buildAuthError(
          401,
          "Unauthorized",
          "Invalid credentials",
          "/account/login"
        ),
        {
          status: 401,
        }
      );
    }

    currentUser = setCurrentUser({
      ...(registeredUser ?? {}),
      email,
    });

    return HttpResponse.json(
      {
        id: currentUser.id,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        role: currentUser.role,
        restaurantId: currentUser.restaurantId,
      },
      {
        headers: {
          "Set-Cookie": buildSessionCookie(currentUser.email),
        },
      }
    );
  }),

  http.post("*/account/signup", async ({ request }) => {
    const body = await request.json();
    const email = body?.user?.email?.trim()?.toLowerCase();
    const password = body?.user?.password?.trim();
    const firstName = body?.client?.firstName?.trim();
    const lastName = body?.client?.lastName?.trim();
    const profilePictureUrl = body?.client?.profilePictureUrl?.trim() || "";
    const role = body?.user?.role || "CLIENT";

    if (!email || !password || !firstName || !lastName) {
      return HttpResponse.json(
        buildAuthError(
          400,
          "Bad Request",
          "Sign-up details are incomplete",
          "/account/signup"
        ),
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return HttpResponse.json(
        buildAuthError(
          400,
          "Bad Request",
          "Password must be between 8 and 100 characters long",
          "/account/signup"
        ),
        {
          status: 400,
        }
      );
    }

    if (registeredUsers.has(email)) {
      return HttpResponse.json(
        buildAuthError(409, "Conflict", "Email is already in use", "/account/signup"),
        {
          status: 409,
        }
      );
    }

    saveRegisteredUser({
        id: registeredUsers.size + 1,
        email,
        firstName,
        lastName,
        profilePictureUrl,
        role,
        password,
      });

    return HttpResponse.json(
      {
        ok: true,
      },
      {
        status: 201,
      }
    );
  }),

  http.get("*/allergens", async () => {
    return HttpResponse.json({
      allergens: COMMON_ALLERGENS,
    });
  }),

  http.get("*/food-tags", async () => {
    return HttpResponse.json({
      tags: getAvailableTags(),
    });
  }),

  http.patch("*/users/me/allergens", async ({ request }) => {
    const guardResponse = requireAuthenticatedUser("/users/me/allergens", request);

    if (guardResponse) {
      return guardResponse;
    }

    const body = await request.json();
    const selectedAllergens = Array.isArray(body?.allergens)
      ? body.allergens
      : [];

    currentUser = setCurrentUser({
      ...currentUser,
      allergens: selectedAllergens,
    });

    return HttpResponse.json({
      message: "Allergen preferences updated.",
      user: currentUser,
    });
  }),

  http.patch("*/users/me/preferences", async ({ request }) => {
    const guardResponse = requireAuthenticatedUser("/users/me/preferences", request);

    if (guardResponse) {
      return guardResponse;
    }

    const body = await request.json();
    const preferredFoodTags = Array.isArray(body?.preferredFoodTags)
      ? body.preferredFoodTags
      : [];

    currentUser = setCurrentUser({
      ...currentUser,
      preferredFoodTags,
    });

    return HttpResponse.json({
      message: "Preferred foods updated.",
      user: currentUser,
    });
  }),

  http.post("*/account/change-password", async ({ request }) => {
    const guardResponse = requireAuthenticatedUser("/account/change-password", request);

    if (guardResponse) {
      return guardResponse;
    }

    const body = await request.json();
    const currentPassword = body?.currentPassword?.trim();
    const newPassword = body?.newPassword?.trim();

    if (!currentPassword || !newPassword) {
      return HttpResponse.json(
        buildAuthError(
          400,
          "Bad Request",
          "Current and new password are required",
          "/account/change-password"
        ),
        {
          status: 400,
        }
      );
    }

    if (currentUser.password !== currentPassword) {
      return HttpResponse.json(
        buildAuthError(
          401,
          "Unauthorized",
          "Current password is incorrect",
          "/account/change-password"
        ),
        {
          status: 401,
        }
      );
    }

    if (newPassword.length < 8) {
      return HttpResponse.json(
        buildAuthError(
          400,
          "Bad Request",
          "Password must be between 8 and 100 characters long",
          "/account/change-password"
        ),
        {
          status: 400,
        }
      );
    }

    currentUser = setCurrentUser({
      ...currentUser,
      password: newPassword,
    });

    return HttpResponse.json({
      message: "Password updated.",
    });
  }),

  http.post("*/account/onboarding", async ({ request }) => {
    const guardResponse = requireAuthenticatedUser("/account/onboarding", request);

    if (guardResponse) {
      return HttpResponse.json(
        buildAuthError(
          401,
          "Unauthorized",
          "You must be logged in to continue.",
          "/account/onboarding"
        ),
        {
          status: 401,
        }
      );
    }

    const body = await request.json();
    const selectedAllergens = Array.isArray(body?.allergens)
      ? body.allergens
      : [];

    currentUser = setCurrentUser({
      ...currentUser,
      hasOnboarded: true,
      allergens: selectedAllergens,
    });

    return HttpResponse.json({
      message: "Onboarding completed.",
      user: currentUser,
    });
  }),

  http.get("*/account/me", async ({ request }) => {
    const guardResponse = requireAuthenticatedUser("/account/me", request);

    if (guardResponse) {
      return guardResponse;
    }

    return HttpResponse.json(currentUser);
  }),

  http.get("*/restaurant/food-sales", async ({ request }) => {
    const guardResponse = requireRestaurant("/restaurant/food-sales", request);

    if (guardResponse) {
      return guardResponse;
    }

    const restaurant = getCurrentUsersRestaurant();

    if (!restaurant) {
      return HttpResponse.json(
        buildAuthError(
          404,
          "Not Found",
          "No restaurant is assigned to this account",
          "/restaurant/food-sales"
        ),
        {
          status: 404,
        }
      );
    }

    const foodSales = getRestaurantFoodSalesForOwner(restaurant.id);

    return HttpResponse.json({
      restaurant,
      foodSales,
      totals: {
        foodSaleCount: foodSales.length,
        reservationCount: restaurant.reservationCount,
        reservedMeals: foodSales.reduce(
          (sum, foodSale) => sum + (foodSale.reservedQuantity ?? 0),
          0
        ),
      },
    });
  }),

  http.get("*/restaurant/food-sales/:foodSaleId/reservations", async ({ request, params }) => {
    const guardResponse = requireRestaurant(
      `/restaurant/food-sales/${params.foodSaleId}/reservations`,
      request
    );

    if (guardResponse) {
      return guardResponse;
    }

    const restaurant = getCurrentUsersRestaurant();

    if (!restaurant) {
      return HttpResponse.json(
        buildAuthError(
          404,
          "Not Found",
          "No restaurant is assigned to this account",
          `/restaurant/food-sales/${params.foodSaleId}/reservations`
        ),
        {
          status: 404,
        }
      );
    }

    const foodSale = FOOD_SALES.find((item) => item.id === params.foodSaleId);

    if (!foodSale || foodSale.restaurantId !== restaurant.id) {
      return HttpResponse.json(
        buildAuthError(
          404,
          "Not Found",
          "Food sale not found for this restaurant",
          `/restaurant/food-sales/${params.foodSaleId}/reservations`
        ),
        {
          status: 404,
        }
      );
    }

    return HttpResponse.json({
      foodSale: {
        ...foodSale,
        restaurantName: restaurant.name,
      },
      reservations: getReservationsForFoodSale(foodSale.id),
    });
  }),

  http.post("*/food-sales/:foodSaleId/reserve", async ({ request, params }) => {
    const guardResponse = requireClient(
      `/food-sales/${params.foodSaleId}/reserve`,
      request
    );

    if (guardResponse) {
      return guardResponse;
    }

    const foodSale = FOOD_SALES.find((item) => item.id === params.foodSaleId);

    if (!foodSale) {
      return HttpResponse.json(
        buildAuthError(
          404,
          "Not Found",
          "Food sale not found",
          `/food-sales/${params.foodSaleId}/reserve`
        ),
        {
          status: 404,
        }
      );
    }

    const existingReservation = RESERVATIONS.find(
      (reservation) =>
        reservation.foodSaleId === foodSale.id &&
        reservation.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
    );

    if (existingReservation) {
      return HttpResponse.json(
        buildAuthError(
          409,
          "Conflict",
          "You already reserved this food sale",
          `/food-sales/${params.foodSaleId}/reserve`
        ),
        {
          status: 409,
        }
      );
    }

    const reservationId = getNextReservationId();
    const reservation = {
      id: reservationId,
      foodSaleId: foodSale.id,
      customerName: getUserFullName(currentUser) || currentUser.email,
      customerEmail: currentUser.email,
      quantity: 1,
      status: "CONFIRMED",
      reservedAt: new Date().toISOString(),
      pickupCode: buildPickupCode(foodSale.id, reservationId),
    };

    RESERVATIONS.push(reservation);

    return HttpResponse.json(
      {
        message: "Food sale reserved.",
        reservation: {
          ...reservation,
          foodSaleTitle: foodSale.title,
          pickupWindow: foodSale.pickupWindow,
          totalPrice: Number((foodSale.price * reservation.quantity).toFixed(2)),
        },
        foodSale: {
          id: foodSale.id,
          reservationCount: RESERVATIONS.filter(
            (item) => item.foodSaleId === foodSale.id
          ).length,
          reservedQuantity: RESERVATIONS.filter(
            (item) => item.foodSaleId === foodSale.id
          ).reduce((sum, item) => sum + item.quantity, 0),
          isReservedByCurrentUser: true,
          currentUsersReservation: {
            id: reservation.id,
            status: reservation.status,
            pickupCode: reservation.pickupCode,
          },
        },
      },
      {
        status: 201,
      }
    );
  }),

  http.get("*/admin/restaurants", async ({ request }) => {
    const guardResponse = requireAdmin("/admin/restaurants", request);

    if (guardResponse) {
      return guardResponse;
    }

    return HttpResponse.json({
      restaurants: getAdminRestaurants(),
    });
  }),

  http.post("*/admin/restaurants", async ({ request }) => {
    const guardResponse = requireAdmin("/admin/restaurants", request);

    if (guardResponse) {
      return guardResponse;
    }

      const body = await request.json();
      const name = body?.name?.trim();
      const googleMapsUrl = body?.googleMapsUrl?.trim();
      const lat = Number(body?.lat);
      const lng = Number(body?.lng);

      if (!name || !googleMapsUrl || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return HttpResponse.json(
          buildAuthError(
            400,
            "Bad Request",
          "Restaurant name, latitude, longitude, and Google Maps link are required",
            "/admin/restaurants"
          ),
          {
          status: 400,
        }
      );
    }

      const nextRestaurant = {
        id: getNextRestaurantId(),
        name,
        lat,
        lng,
        googleMapsUrl,
      };

      RESTAURANTS.push(nextRestaurant);

    return HttpResponse.json(
      {
        message: "Restaurant created.",
        restaurant: {
          ...nextRestaurant,
          foodSaleCount: 0,
        },
      },
      {
        status: 201,
      }
    );
  }),

  http.put("*/admin/restaurants/:restaurantId", async ({ request, params }) => {
    const guardResponse = requireAdmin(
      `/admin/restaurants/${params.restaurantId}`,
      request
    );

    if (guardResponse) {
      return guardResponse;
    }

    const restaurantIndex = RESTAURANTS.findIndex(
      (restaurant) => restaurant.id === params.restaurantId
    );

    if (restaurantIndex === -1) {
      return HttpResponse.json(
        buildAuthError(
          404,
          "Not Found",
          "Restaurant not found",
          `/admin/restaurants/${params.restaurantId}`
        ),
        {
          status: 404,
        }
      );
    }

    const body = await request.json();
    const name = body?.name?.trim();
    const googleMapsUrl = body?.googleMapsUrl?.trim();
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);

    if (!name || !googleMapsUrl || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return HttpResponse.json(
        buildAuthError(
          400,
          "Bad Request",
          "Restaurant name, latitude, longitude, and Google Maps link are required",
          `/admin/restaurants/${params.restaurantId}`
        ),
        {
          status: 400,
        }
      );
    }

    const updatedRestaurant = {
      ...RESTAURANTS[restaurantIndex],
      name,
      lat,
      lng,
      googleMapsUrl,
    };

    RESTAURANTS.splice(restaurantIndex, 1, updatedRestaurant);

    return HttpResponse.json({
      message: "Restaurant updated.",
      restaurant: {
        ...updatedRestaurant,
        foodSaleCount: getRestaurantFoodSaleCount(updatedRestaurant.id),
      },
    });
  }),

  http.delete("*/admin/restaurants/:restaurantId", async ({ request, params }) => {
    const guardResponse = requireAdmin(
      `/admin/restaurants/${params.restaurantId}`,
      request
    );

    if (guardResponse) {
      return guardResponse;
    }

    const restaurantIndex = RESTAURANTS.findIndex(
      (restaurant) => restaurant.id === params.restaurantId
    );

    if (restaurantIndex === -1) {
      return HttpResponse.json(
        buildAuthError(
          404,
          "Not Found",
          "Restaurant not found",
          `/admin/restaurants/${params.restaurantId}`
        ),
        {
          status: 404,
        }
      );
    }

    RESTAURANTS.splice(restaurantIndex, 1);

    for (let index = FOOD_SALES.length - 1; index >= 0; index -= 1) {
      if (FOOD_SALES[index].restaurantId === params.restaurantId) {
        FOOD_SALES.splice(index, 1);
      }
    }

    return new HttpResponse(null, {
      status: 204,
    });
  }),

  http.post("*/account/logout", async () => {
    currentUser = null;

    return new HttpResponse(null, {
      status: 200,
      headers: {
        "Set-Cookie": "session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
      },
    });
  }),

  http.post("*/token/refresh", async ({ request }) => {
    const guardResponse = requireAuthenticatedUser("/token/refresh", request);

    if (guardResponse) {
      return guardResponse;
    }

    return new HttpResponse(null, {
      status: 200,
      headers: {
        "Set-Cookie": buildSessionCookie(currentUser.email),
      },
    });
  }),

  http.get("*/restaurants/nearby", async ({ request }) => {
    const url = new URL(request.url);
    const location = parseLocation(url.searchParams);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 4;
    const pagination = paginate(enrichRestaurants(location), page, pageSize);

    return HttpResponse.json({
      restaurants: pagination.items,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
      },
      userLocation: location,
    });
  }),

  http.get("*/food-sales/nearby", async ({ request }) => {
    const url = new URL(request.url);
    const location = parseLocation(url.searchParams);
    const viewer = hydrateCurrentUserFromRequest(request);
    const filteredFoodSales = enrichFoodSales(location, viewer).filter((foodSale) =>
      matchesFilters(foodSale, url.searchParams)
    );
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 6;
    const pagination = paginate(filteredFoodSales, page, pageSize);

    return HttpResponse.json({
      foodSales: pagination.items,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
      },
      availableTags: getAvailableTags(),
      userLocation: location,
    });
  }),
];

