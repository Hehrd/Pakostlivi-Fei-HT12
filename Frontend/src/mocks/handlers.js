import { http, HttpResponse } from "msw";

function buildUser(overrides = {}) {
  return {
    id: 1,
    email: "foodlover@munchmun.com",
    username: "savefoodhero",
    role: "USER",
    walletBalance: 42.5,
    ...overrides,
  };
}

export const handlers = [
  http.post("*/account/login", async ({ request }) => {
    const body = await request.json();
    const email = body?.email?.trim() || "a@a.a";

    return HttpResponse.json(
      {
        message: "Logged in successfully.",
        user: buildUser({ email }),
      },
      {
        headers: {
          "Set-Cookie":
            "session=mock-session-token; Path=/; HttpOnly; SameSite=Lax",
        },
      }
    );
  }),

  http.post("*/account/signup", async ({ request }) => {
    const body = await request.json();
    const email = body?.email?.trim() || "foodlover@munchmun.com";
    const username = body?.username?.trim() || "savefoodhero";

    return HttpResponse.json(
      {
        message: "Account created successfully.",
        user: buildUser({ email, username }),
      },
      {
        status: 201,
        headers: {
          "Set-Cookie":
            "session=mock-session-token; Path=/; HttpOnly; SameSite=Lax",
        },
      }
    );
  }),

  http.get("*/users/me", async () => {
    return HttpResponse.json(buildUser());
  }),
];
