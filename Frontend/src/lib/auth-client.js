import { API_MODE, apiFetch } from "@/lib/api";
import { formatEnumLabel, normalizeRole } from "@/lib/backend-normalizers";

async function request(path, options = {}) {
  return apiFetch(path, options);
}

function buildDefaultProfilePictureUrl(firstName = "", lastName = "") {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const seed = encodeURIComponent(fullName || "MunchMun User");

  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
}

export async function login(body) {
  return request("/account/login", {
    method: "POST",
    body: {
      email: body?.email,
      password: body?.password,
    },
  });
}

export async function signup(body) {
  const normalizedProfilePictureUrl =
    body?.profilePictureUrl?.trim() ||
    buildDefaultProfilePictureUrl(body?.firstName, body?.lastName);
  const payload =
    API_MODE === "mock"
      ? {
          user: {
            email: body?.email?.trim(),
            password: body?.password,
            role: "CLIENT",
          },
          client: {
            firstName: body?.firstName?.trim(),
            lastName: body?.lastName?.trim(),
            profilePictureUrl: normalizedProfilePictureUrl,
          },
        }
      : {
          email: body?.email?.trim(),
          password: body?.password,
          firstName: body?.firstName?.trim(),
          lastName: body?.lastName?.trim(),
          profilePictureUrl: normalizedProfilePictureUrl,
        };

  return request("/account/signup", {
    method: "POST",
    body: payload,
  });
}

export async function getCurrentUser() {
  const currentUser = await request("/account/me");

  if (!currentUser?.id || API_MODE === "mock") {
    return currentUser;
  }

  try {
    const profile = await apiFetch(`/profile/${currentUser.id}`);

    return {
      ...currentUser,
      role: normalizeRole(currentUser.role),
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      profilePictureUrl: profile?.profilePictureUrl ?? "",
      allergens: Array.isArray(profile?.allergenTypes)
        ? profile.allergenTypes.map((item) => formatEnumLabel(item?.type))
        : [],
      preferredFoodTags: Array.isArray(profile?.foodTagTypes)
        ? profile.foodTagTypes.map((item) => formatEnumLabel(item?.type))
        : [],
      hasOnboarded: true,
    };
  } catch {
    return {
      ...currentUser,
      role: normalizeRole(currentUser.role),
    };
  }
}

export async function getAllergens() {
  if (API_MODE === "mock") {
    return request("/allergens");
  }

  const payload = await request("/tags/allergens");

  return {
    allergens: Array.isArray(payload)
      ? payload.map((item) => {
          const label = formatEnumLabel(item?.type);

          return {
            id: label,
            label,
          };
        })
      : [],
  };
}

export async function getFoodTags() {
  if (API_MODE === "mock") {
    return request("/food-tags");
  }

  const payload = await request("/tags/food");

  return {
    tags: Array.isArray(payload)
      ? payload.map((item) => formatEnumLabel(item?.type))
      : [],
  };
}

export async function completeOnboarding(body) {
  if (API_MODE !== "mock") {
    throw {
      status: 501,
      message: "Onboarding updates are not available from the backend yet.",
    };
  }

  return request("/account/onboarding", {
    method: "POST",
    body,
  });
}

export async function updateUserAllergens(body) {
  if (API_MODE !== "mock") {
    throw {
      status: 501,
      message: "Allergen updates are not available from the backend yet.",
    };
  }

  return request("/users/me/allergens", {
    method: "PATCH",
    body,
  });
}

export async function updatePreferredFoodTags(body) {
  if (API_MODE !== "mock") {
    throw {
      status: 501,
      message: "Preferred food updates are not available from the backend yet.",
    };
  }

  return request("/users/me/preferences", {
    method: "PATCH",
    body,
  });
}

export async function changePassword(body) {
  if (API_MODE !== "mock") {
    throw {
      status: 501,
      message: "Password changes are not available from the backend yet.",
    };
  }

  return request("/account/change-password", {
    method: "POST",
    body,
  });
}

export async function logout() {
  return request("/account/logout", {
    method: "POST",
  });
}

export function getAuthToastContent(error, mode) {
  if (error.status === 0) {
    return {
      title: "Connection failed.",
      description: error.message,
    };
  }

  if (mode === "login") {
    if (error.status === 401) {
      return {
        title: "Login failed.",
        description: error.message,
      };
    }

    if (error.status === 400) {
      return {
        title: "Check your login details.",
        description: error.message,
      };
    }
  }

  if (mode === "signup") {
    if (error.status === 409) {
      return {
        title: "Email already in use.",
        description: error.message,
      };
    }

    if (error.status === 400) {
      return {
        title: "Check your sign-up details.",
        description: error.message,
      };
    }
  }

  if (error.status >= 500) {
    return {
      title: "Server error.",
      description: error.message || "Something went wrong on the backend.",
    };
  }

  if (error.status === 501) {
    return {
      title: "Feature unavailable.",
      description: error.message || "This action is not available yet.",
    };
  }

  return {
    title: "Request failed.",
    description: error.message || "Please try again.",
  };
}
