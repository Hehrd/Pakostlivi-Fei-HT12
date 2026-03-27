import { normalizeRole } from "@/lib/backend-normalizers";

const DEFAULT_USER = {
  id: null,
  email: "",
  firstName: "",
  lastName: "",
  role: "CLIENT",
  restaurantId: null,
  hasOnboarded: true,
  allergens: [],
  preferredFoodTags: [],
  walletBalance: 0,
  profilePictureUrl: "",
};

export function normalizeAuthUser(user = {}) {
  return {
    ...DEFAULT_USER,
    ...user,
    role: normalizeRole(user?.role),
    allergens: Array.isArray(user?.allergens) ? user.allergens : [],
    preferredFoodTags: Array.isArray(user?.preferredFoodTags)
      ? user.preferredFoodTags
      : [],
  };
}

export function mergeAuthUsers(...users) {
  const merged = users.filter(Boolean).reduce(
    (result, user) => ({
      ...result,
      ...user,
    }),
    {}
  );

  return normalizeAuthUser(merged);
}

export function getUserDisplayName(user) {
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  if (user?.email) {
    return user.email;
  }

  return "friend";
}

export function isAdminUser(user) {
  return user?.role === "ADMIN";
}

export function isRestaurantUser(user) {
  return normalizeRole(user?.role) === "RESTAURANT";
}

export function isClientUser(user) {
  return user?.role === "CLIENT";
}
