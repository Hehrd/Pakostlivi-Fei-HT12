export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:6969";
export const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? "real";
export const AUTH_USER_STORAGE_KEY = "auth-user";
export const AUTH_EXPIRED_EVENT = "auth:expired";

let refreshRequestPromise = null;

function buildUrl(path) {
  const normalizedPath = path.startsWith("/v1/")
    ? path
    : path.startsWith("/")
      ? `/v1${path}`
      : `/v1/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
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

function isBinaryBody(body) {
  return (
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}

function normalizeRequestBody(body) {
  if (body === undefined || body === null) {
    return {
      body: undefined,
      shouldSetJsonContentType: false,
    };
  }

  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    isBinaryBody(body)
  ) {
    return {
      body,
      shouldSetJsonContentType: typeof body === "string",
    };
  }

  return {
    body: JSON.stringify(body),
    shouldSetJsonContentType: true,
  };
}

function createRequestOptions(options = {}) {
  const { headers, body, ...restOptions } = options;
  const requestHeaders = new Headers(headers ?? {});
  const normalizedBody = normalizeRequestBody(body);

  Object.entries(getMockAuthHeaders()).forEach(([key, value]) => {
    if (!requestHeaders.has(key)) {
      requestHeaders.set(key, value);
    }
  });

  if (
    normalizedBody.shouldSetJsonContentType &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  return {
    ...restOptions,
    credentials: "include",
    headers: requestHeaders,
    body: normalizedBody.body,
  };
}

async function executeRequest(path, options = {}) {
  try {
    return await fetch(buildUrl(path), createRequestOptions(options));
  } catch {
    throw {
      status: 0,
      message:
        "The backend could not be reached. Make sure the Java server is running and CORS allows this frontend.",
    };
  }
}

function notifyAuthExpired() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch {}

  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

function isAuthFailureStatus(status) {
  return status === 401 || status === 403;
}

function createExpiredSessionError(status = 401) {
  return {
    status,
    message: "Your session expired. Please log in again.",
  };
}

function shouldAttemptRefresh(path, retryOnUnauthorized) {
  if (API_MODE !== "real" || retryOnUnauthorized === false) {
    return false;
  }

  return !new Set([
    "/account/login",
    "/account/signup",
    "/account/logout",
    "/token/refresh",
  ]).has(path);
}

async function refreshSession() {
  if (API_MODE !== "real") {
    return false;
  }

  if (!refreshRequestPromise) {
    refreshRequestPromise = (async () => {
      try {
        const response = await fetch(buildUrl("/token/refresh"), {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          notifyAuthExpired();
          return false;
        }

        return true;
      } catch {
        notifyAuthExpired();
        return false;
      } finally {
        refreshRequestPromise = null;
      }
    })();
  }

  return refreshRequestPromise;
}

async function parseApiError(response) {
  try {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await response.json();

      return {
        status: response.status,
        message: data.message || data.error || "Request failed.",
      };
    }

    const text = await response.text();

    return {
      status: response.status,
      message: text || response.statusText || "Request failed.",
    };
  } catch {
    return {
      status: response.status,
      message: response.statusText || "Request failed.",
    };
  }
}

export async function apiRequest(path, options = {}) {
  const shouldRetryOnUnauthorized = shouldAttemptRefresh(
    path,
    options.retryOnUnauthorized
  );
  let response = await executeRequest(path, options);
  let didRetryAfterRefresh = false;

  if (isAuthFailureStatus(response.status) && shouldRetryOnUnauthorized) {
    const didRefresh = await refreshSession();

    if (didRefresh) {
      didRetryAfterRefresh = true;
      response = await executeRequest(path, {
        ...options,
        retryOnUnauthorized: false,
      });
    } else {
      throw createExpiredSessionError(response.status);
    }
  }

  if (
    !response.ok &&
    isAuthFailureStatus(response.status) &&
    shouldRetryOnUnauthorized &&
    !didRetryAfterRefresh
  ) {
    notifyAuthExpired();
    throw createExpiredSessionError(response.status);
  }

  return response;
}

export async function apiFetch(path, options = {}) {
  const response = await apiRequest(path, options);

  if (!response.ok) {
    const error = await parseApiError(response);
    throw error;
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
