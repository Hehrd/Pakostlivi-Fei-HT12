const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:6969";
const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? "real";
const AUTH_USER_STORAGE_KEY = "auth-user";

function getMockAuthHeaders() {
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

    if (!email) {
      return {};
    }

    return {
      "x-mock-user-email": email,
    };
  } catch {
    return {};
  }
}

async function parseAuthError(response) {
  try {
    const data = await response.json();

    return {
      status: response.status,
      error: data.error,
      message: data.message || "Something went wrong",
    };
  } catch {
    return {
      status: response.status,
      error: response.statusText,
      message: "Something went wrong",
    };
  }
}

async function request(path, options = {}) {
  let response;
  const { body, method = "GET", headers = {}, ...restOptions } = options;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...getMockAuthHeaders(),
        ...headers,
      },
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...restOptions,
    });
  } catch {
    throw {
      status: 0,
      message:
        "The backend could not be reached. Make sure the Java server is running and CORS allows this frontend.",
    };
  }

  if (!response.ok) {
    throw await parseAuthError(response);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const contentLength = response.headers.get("content-length");

  if (
    response.status === 204 ||
    contentLength === "0" ||
    !contentType.includes("application/json")
  ) {
    return null;
  }

  return response.json();
}

export async function login(body) {
  return request("/account/login", {
    method: "POST",
    body,
  });
}

export async function signup(body) {
  return request("/account/signup", {
    method: "POST",
    body,
  });
}

export async function getCurrentUser() {
  return request("/account/me");
}

export async function getAllergens() {
  return request("/allergens");
}

export async function getFoodTags() {
  return request("/food-tags");
}

export async function completeOnboarding(body) {
  return request("/account/onboarding", {
    method: "POST",
    body,
  });
}

export async function updateUserAllergens(body) {
  return request("/users/me/allergens", {
    method: "PATCH",
    body,
  });
}

export async function updatePreferredFoodTags(body) {
  return request("/users/me/preferences", {
    method: "PATCH",
    body,
  });
}

export async function changePassword(body) {
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

  return {
    title: "Request failed.",
    description: error.message || "Please try again.",
  };
}
