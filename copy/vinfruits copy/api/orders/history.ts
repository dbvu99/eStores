import {
  getCustomerBySessionToken,
  getOrdersForCustomer,
  getSessionTokenFromCookies,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies }) => {
  const customer = await getCustomerBySessionToken(
    getSessionTokenFromCookies(cookies),
  );

  if (!customer) {
    return new Response(JSON.stringify({ ok: false, error: "Not signed in." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const orders = await getOrdersForCustomer(customer);

  return new Response(JSON.stringify({ ok: true, orders }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
