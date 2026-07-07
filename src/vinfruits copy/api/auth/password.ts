import {
  getCustomerBySessionToken,
  getSessionTokenFromCookies,
  updateCustomerPassword,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const customer = await getCustomerBySessionToken(
    getSessionTokenFromCookies(cookies),
  );

  if (!customer) {
    return new Response(JSON.stringify({ ok: false, error: "Not signed in." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json().catch(() => ({}));

  try {
    await updateCustomerPassword(customer, {
      currentPassword:
        typeof body?.currentPassword === "string" ? body.currentPassword : "",
      password: typeof body?.password === "string" ? body.password : "",
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update password.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
