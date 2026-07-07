import {
  getCustomerBySessionToken,
  getInventoryForAdmin,
  getSessionTokenFromCookies,
  saveProductForAdmin,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

async function requireAdmin(cookies: Parameters<APIRoute>[0]["cookies"]) {
  const customer = await getCustomerBySessionToken(
    getSessionTokenFromCookies(cookies),
  );
  if (!customer?.roles.includes("admin")) {
    throw new Error("Admin access is required.");
  }
  return customer;
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const customer = await requireAdmin(cookies);
    const products = await getInventoryForAdmin(customer);
    return new Response(JSON.stringify({ ok: true, products }), {
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

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const customer = await requireAdmin(cookies);
    const body = await request.json().catch(() => ({}));
    await saveProductForAdmin(customer, {
      id: typeof body?.id === "string" ? body.id : undefined,
      slug: typeof body?.slug === "string" ? body.slug : undefined,
      name: typeof body?.name === "string" ? body.name : "",
      category: typeof body?.category === "string" ? body.category : "",
      categorySlugs: Array.isArray(body?.categorySlugs)
        ? body.categorySlugs.filter((value: unknown) => typeof value === "string")
        : [],
      origin: typeof body?.origin === "string" ? body.origin : "",
      description: typeof body?.description === "string" ? body.description : "",
      priceVnd: Number(body?.priceVnd || 0),
      compareAtVnd:
        body?.compareAtVnd === "" || body?.compareAtVnd === null
          ? null
          : Number(body?.compareAtVnd || 0),
      imageUrl: typeof body?.imageUrl === "string" ? body.imageUrl : "",
      imageUrls: Array.isArray(body?.imageUrls)
        ? body.imageUrls.filter((value: unknown) => typeof value === "string")
        : [],
      giftReady: Boolean(body?.giftReady),
      inStock: body?.inStock !== false,
      inventoryQuantity:
        body?.inventoryQuantity === "" || body?.inventoryQuantity === null
          ? null
          : Number(body?.inventoryQuantity || 0),
      visible: body?.visible !== false,
      sortOrder: Number(body?.sortOrder || 0),
    });
    const products = await getInventoryForAdmin(customer);
    return new Response(JSON.stringify({ ok: true, products }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save product.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
