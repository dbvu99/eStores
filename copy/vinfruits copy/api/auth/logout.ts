import {
  clearCustomerSessionCookie,
  deleteCustomerSession,
  getSessionTokenFromCookies,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies }) => {
  await deleteCustomerSession(getSessionTokenFromCookies(cookies));
  clearCustomerSessionCookie(cookies);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
