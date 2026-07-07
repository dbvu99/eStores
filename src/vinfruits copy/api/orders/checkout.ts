import {
  createCheckoutOrder,
  getCustomerBySessionToken,
  getSessionTokenFromCookies,
} from "@vinfuit/lib/account-auth";
import { sendOrderConfirmationEmail } from "@vinfuit/lib/email";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json().catch(() => ({}));
  const customer = await getCustomerBySessionToken(
    getSessionTokenFromCookies(cookies),
  );

  try {
    const order = await createCheckoutOrder({
      customer,
      form: body?.form || {},
      cart: Array.isArray(body?.cart) ? body.cart : [],
      subtotal: Number(body?.subtotal || 0),
      delivery: Number(body?.delivery || 0),
      voucherCode: body?.voucherCode,
    });

    const form = body?.form || {};
    const email =
      typeof form?.email === "string" && form.email.trim()
        ? form.email.trim()
        : customer?.email || "";
    try {
      await sendOrderConfirmationEmail({
        email,
        name:
          typeof form?.name === "string" && form.name.trim()
            ? form.name.trim()
            : customer?.name || "",
        orderNumber: order.orderNumber,
        address: typeof form?.address === "string" ? form.address.trim() : "",
        items: Array.isArray(body?.cart) ? body.cart : [],
        subtotal: order.subtotal,
        delivery: order.delivery,
        discount: order.discount,
        voucherCode: order.voucherCode,
        total: order.total,
      });
    } catch (error) {
      console.error("[vinfruits] order confirmation email failed:", error);
    }

    return new Response(JSON.stringify({ ok: true, order }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to place order.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
