import { getProductCategories } from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const categories = await getProductCategories();

  return new Response(JSON.stringify({ ok: true, categories }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
