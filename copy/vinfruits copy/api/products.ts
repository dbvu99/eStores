import { getProductsForStorefront } from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    const products = await getProductsForStorefront();
    return new Response(
      JSON.stringify({
        ok: true,
        products,
        source: "database",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        products: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load database products.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
