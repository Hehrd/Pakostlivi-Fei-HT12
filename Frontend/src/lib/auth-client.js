const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6969";

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

async function request(path, body) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
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
}

export async function login(body) {
  return request("/account/login", body);
}

export async function signup(body) {
  return request("/account/signup", body);
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
