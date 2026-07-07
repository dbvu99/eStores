import {
  getCustomerBySessionToken,
  getSessionTokenFromCookies,
  updateCustomerProfile,
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
    const user = await updateCustomerProfile(customer, {
      name: typeof body?.name === "string" ? body.name : "",
      email: typeof body?.email === "string" ? body.email : "",
      phone: typeof body?.phone === "string" ? body.phone : "",
    });

    return new Response(JSON.stringify({ ok: true, user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update profile.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
