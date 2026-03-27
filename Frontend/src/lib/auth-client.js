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

async function getCurrentAccountAndProfile() {
  const currentUser = await request("/account/me");

  if (!currentUser?.id) {
    throw {
      status: 400,
      message: "Unable to resolve the current user.",
    };
  }

  const profile = await request(`/profiles/${currentUser.id}`);

  if (!profile?.id) {
    throw {
      status: 400,
      message: "Unable to load your profile details.",
    };
  }

  return {
    currentUser,
    profile,
  };
}

function buildOptionLookup(items) {
  return new Map(
    (Array.isArray(items) ? items : []).map((item) => [
      formatEnumLabel(item?.type),
      item,
    ])
  );
}

function mapSelectedLabelsToOptions(selectedLabels, options, emptyMessage) {
  const lookup = buildOptionLookup(options);

  return (Array.isArray(selectedLabels) ? selectedLabels : []).map((label) => {
    const option = lookup.get(label);

    if (!option) {
      throw {
        status: 400,
        message: emptyMessage,
      };
    }

    return option;
  });
}

async function refreshCurrentUser() {
  return getCurrentUser();
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
    const profile = await apiFetch(`/profiles/${currentUser.id}`);

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
  if (API_MODE === "mock") {
    return request("/users/me/allergens", {
      method: "PATCH",
      body,
    });
  }

  const [{ profile }, allergenOptions] = await Promise.all([
    getCurrentAccountAndProfile(),
    request("/tags/allergens"),
  ]);
  const nextAllergenTypes = mapSelectedLabelsToOptions(
    body?.allergens,
    allergenOptions,
    "One or more selected allergens could not be matched."
  );

  await request("/profiles", {
    method: "PUT",
    body: {
      id: profile.id,
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      profilePictureUrl: profile?.profilePictureUrl ?? "",
      allergenTypes: nextAllergenTypes,
      foodTagTypes: Array.isArray(profile?.foodTagTypes) ? profile.foodTagTypes : [],
    },
  });

  return {
    user: await refreshCurrentUser(),
  };
}

export async function updatePreferredFoodTags(body) {
  if (API_MODE === "mock") {
    return request("/users/me/preferences", {
      method: "PATCH",
      body,
    });
  }

  const [{ profile }, foodTagOptions] = await Promise.all([
    getCurrentAccountAndProfile(),
    request("/tags/food"),
  ]);
  const nextFoodTagTypes = mapSelectedLabelsToOptions(
    body?.preferredFoodTags,
    foodTagOptions,
    "One or more selected food tags could not be matched."
  );

  await request("/profiles", {
    method: "PUT",
    body: {
      id: profile.id,
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      profilePictureUrl: profile?.profilePictureUrl ?? "",
      allergenTypes: Array.isArray(profile?.allergenTypes) ? profile.allergenTypes : [],
      foodTagTypes: nextFoodTagTypes,
    },
  });

  return {
    user: await refreshCurrentUser(),
  };
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
