import {
  addWishlistItemForCustomer,
  getCustomerBySessionToken,
  getSessionTokenFromCookies,
  getWishlistForCustomer,
  removeWishlistItemForCustomer,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

async function requireCustomer(cookies: Parameters<APIRoute>[0]["cookies"]) {
  const customer = await getCustomerBySessionToken(
    getSessionTokenFromCookies(cookies),
  );
  if (!customer) throw new Error("Sign in to use your wishlist.");
  return customer;
}

function unauthorized(error: unknown) {
  return new Response(
    JSON.stringify({
      ok: false,
      error:
        error instanceof Error ? error.message : "Sign in to use your wishlist.",
    }),
    { status: 401, headers: { "Content-Type": "application/json" } },
  );
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const customer = await requireCustomer(cookies);
    const wishlist = await getWishlistForCustomer(customer);
    return new Response(JSON.stringify({ ok: true, wishlist }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return unauthorized(error);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const customer = await requireCustomer(cookies);
    const body = await request.json().catch(() => ({}));
    const productSlug = typeof body?.productSlug === "string" ? body.productSlug : "";
    const wishlist = await addWishlistItemForCustomer(customer, productSlug);
    return new Response(JSON.stringify({ ok: true, wishlist }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return unauthorized(error);
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const customer = await requireCustomer(cookies);
    const body = await request.json().catch(() => ({}));
    const productSlug = typeof body?.productSlug === "string" ? body.productSlug : "";
    const wishlist = await removeWishlistItemForCustomer(customer, productSlug);
    return new Response(JSON.stringify({ ok: true, wishlist }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return unauthorized(error);
  }
};
