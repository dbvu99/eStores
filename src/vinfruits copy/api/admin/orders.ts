import {
  getCustomerBySessionToken,
  getOrdersForCustomer,
  getSessionTokenFromCookies,
  updateOrderForAdmin,
} from "@vinfuit/lib/account-auth";
import { sendOrderStatusEmail } from "@vinfuit/lib/email";
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
    const orders = await getOrdersForCustomer(customer);
    return new Response(JSON.stringify({ ok: true, orders }), {
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

export const PATCH: APIRoute = async ({ request, cookies }) => {
  try {
    const customer = await requireAdmin(cookies);
    const body = await request.json().catch(() => ({}));
    await updateOrderForAdmin(customer, {
      orderId: typeof body?.orderId === "string" ? body.orderId : "",
      status: typeof body?.status === "string" ? body.status : undefined,
      paymentStatus:
        typeof body?.paymentStatus === "string" ? body.paymentStatus : undefined,
    });
    const orders = await getOrdersForCustomer(customer);
    const updatedOrder = orders.find(
      (order) => order.id === (typeof body?.orderId === "string" ? body.orderId : ""),
    );
    if (updatedOrder?.customer_email) {
      try {
        await sendOrderStatusEmail({
          email: updatedOrder.customer_email,
          name: updatedOrder.customer_name,
          orderNumber: updatedOrder.order_number,
          status: updatedOrder.status,
          paymentStatus: updatedOrder.payment_status,
        });
      } catch (error) {
        console.error("[vinfruits] order status email failed:", error);
      }
    }
    return new Response(JSON.stringify({ ok: true, orders }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
