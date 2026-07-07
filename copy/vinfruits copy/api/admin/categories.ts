import {
  getCategoriesForAdmin,
  getCustomerBySessionToken,
  getSessionTokenFromCookies,
  saveCategoryForAdmin,
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
    const categories = await getCategoriesForAdmin(customer);
    return new Response(JSON.stringify({ ok: true, categories }), {
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
    await saveCategoryForAdmin(customer, {
      id: typeof body?.id === "string" ? body.id : undefined,
      slug: typeof body?.slug === "string" ? body.slug : undefined,
      name: typeof body?.name === "string" ? body.name : "",
      nameVi: typeof body?.nameVi === "string" ? body.nameVi : undefined,
      nameEn: typeof body?.nameEn === "string" ? body.nameEn : undefined,
      sourcePath:
        typeof body?.sourcePath === "string" ? body.sourcePath : undefined,
      sortOrder: Number(body?.sortOrder || 0),
      visible: body?.visible !== false,
    });
    const categories = await getCategoriesForAdmin(customer);
    return new Response(JSON.stringify({ ok: true, categories }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save category.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
