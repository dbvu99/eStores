import { evaluateVoucher } from "@vinfuit/lib/vouchers";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const result = evaluateVoucher(
    body?.code,
    Number(body?.subtotal || 0),
    Number(body?.delivery || 0),
  );

  return new Response(
    JSON.stringify({
      ok: result.valid,
      voucher: result,
      ...(result.valid ? {} : { error: result.message }),
    }),
    {
      status: result.valid ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    },
  );
};
