import {
  getCustomerBySessionToken,
  getSessionTokenFromCookies,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getCustomerBySessionToken(getSessionTokenFromCookies(cookies));

  return new Response(JSON.stringify({ ok: true, user }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
