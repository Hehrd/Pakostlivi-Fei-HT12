const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:6969";
const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? "real";
const AUTH_USER_STORAGE_KEY = "auth-user";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

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

async function parseApiError(response) {
  try {
    const data = await response.json();

    return {
      status: response.status,
      message: data.message || data.error || "Request failed.",
    };
  } catch {
    return {
      status: response.status,
      message: response.statusText || "Request failed.",
    };
  }
}

export async function apiFetch(path, options = {}) {
  const { headers = {}, ...restOptions } = options;

  const response = await fetch(buildUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getMockAuthHeaders(),
      ...headers,
    },
    ...restOptions,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
