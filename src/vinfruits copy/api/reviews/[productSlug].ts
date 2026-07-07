import {
  deleteReviewForCustomer,
  getCustomerBySessionToken,
  getReviewsForProduct,
  getSessionTokenFromCookies,
  saveReviewForCustomer,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function currentCustomer(cookies: Parameters<APIRoute>[0]["cookies"]) {
  return getCustomerBySessionToken(getSessionTokenFromCookies(cookies));
}

async function requireCustomer(cookies: Parameters<APIRoute>[0]["cookies"]) {
  const customer = await currentCustomer(cookies);
  if (!customer) throw new Error("Sign in to review this product.");
  return customer;
}

function productSlugFromParams(params: Record<string, string | undefined>) {
  const productSlug = params.productSlug?.trim();
  if (!productSlug) throw new Error("Product is required.");
  return productSlug;
}

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const productSlug = productSlugFromParams(params);
    const customer = await currentCustomer(cookies);
    const payload = await getReviewsForProduct(productSlug, customer);
    return json({ ok: true, ...payload });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to load reviews.",
      },
      400,
    );
  }
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const productSlug = productSlugFromParams(params);
    const customer = await requireCustomer(cookies);
    const body = await request.json().catch(() => ({}));
    const payload = await saveReviewForCustomer(customer, {
      productSlug,
      rating: Number(body?.rating),
      title: typeof body?.title === "string" ? body.title : "",
      body: typeof body?.body === "string" ? body.body : "",
    });
    return json({ ok: true, ...payload });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to save review.",
      },
      error instanceof Error && error.message.includes("Sign in") ? 401 : 400,
    );
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const productSlug = productSlugFromParams(params);
    const customer = await requireCustomer(cookies);
    const payload = await deleteReviewForCustomer(customer, productSlug);
    return json({ ok: true, ...payload });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to delete review.",
      },
      error instanceof Error && error.message.includes("Sign in") ? 401 : 400,
    );
  }
};
