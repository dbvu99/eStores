import {
  getCustomerBySessionToken,
  getInventoryForAdmin,
  getSessionTokenFromCookies,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies }) => {
  const customer = await getCustomerBySessionToken(
    getSessionTokenFromCookies(cookies),
  );

  try {
    if (!customer) throw new Error("Admin access is required.");
    const inventory = await getInventoryForAdmin(customer);
    return new Response(JSON.stringify({ ok: true, inventory }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin access is required.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
};
