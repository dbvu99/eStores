import { createHmac } from "node:crypto";
import type { APIRoute } from "astro";
import { availableStock } from "@vinfuit/fruitData";
import { getProductsForStorefront } from "@vinfuit/lib/account-auth";
import { evaluateVoucher } from "@vinfuit/lib/vouchers";

type PayOSItem = {
  name: string;
  quantity: number;
  price: number;
};

const payOSApiUrl = "https://api-merchant.payos.vn/v2/payment-requests";

const env = (key: string) =>
  ((import.meta as unknown as { env?: Record<string, string | undefined> })
    .env?.[key] as string | undefined) ||
  process.env[key] ||
  "";

function createPayOSSignature(data: {
  amount: number;
  cancelUrl: string;
  description: string;
  orderCode: number;
  returnUrl: string;
}) {
  const raw = [
    `amount=${data.amount}`,
    `cancelUrl=${data.cancelUrl}`,
    `description=${data.description}`,
    `orderCode=${data.orderCode}`,
    `returnUrl=${data.returnUrl}`,
  ].join("&");

  return createHmac("sha256", env("PAYOS_CHECKSUM_KEY"))
    .update(raw)
    .digest("hex");
}

function createOrderCode() {
  const time = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return Number(`${time}${random}`);
}

function checkoutFallbackPath(pathname: string) {
  const routeMatch = pathname.match(
    /^(.*)\/api\/orders\/payos-staging\/?$/,
  );
  return `${routeMatch?.[1] || ""}/checkout`;
}

function absoluteCheckoutUrl(request: Request, returnPath: unknown) {
  const requestUrl = new URL(request.url);
  const path = typeof returnPath === "string" ? returnPath : "";
  const safePath = path.startsWith("/")
    ? path
    : checkoutFallbackPath(requestUrl.pathname);
  return `${requestUrl.origin}${safePath}`;
}

async function buildOrderItems(cart: unknown[]) {
  const products = await getProductsForStorefront();
  return cart.map((item) => {
    const cartItem = item as { slug?: unknown; quantity?: unknown };
    const product = products.find(
      (candidate) =>
        typeof cartItem.slug === "string" && candidate.slug === cartItem.slug,
    );
    if (!product) {
      throw new Error("One or more cart items are no longer available.");
    }
    const quantity = Math.max(1, Math.round(Number(cartItem.quantity || 1)));
    const stock = availableStock(product);
    if (stock !== null && (stock <= 0 || quantity > stock)) {
      throw new Error(`${product.name} exceeds available inventory.`);
    }
    return {
      name: product.name.slice(0, 255),
      quantity,
      price: Math.max(0, Math.round(product.price)),
    };
  });
}

export const POST: APIRoute = async ({ request }) => {
  const clientId = env("PAYOS_CLIENT_ID");
  const apiKey = env("PAYOS_API_KEY");
  const checksumKey = env("PAYOS_CHECKSUM_KEY");
  const partnerCode = env("PAYOS_PARTNER_CODE");

  if (!clientId || !apiKey || !checksumKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Missing payOS staging credentials. Set PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const form = body?.form || {};
  const cart = Array.isArray(body?.cart) ? body.cart : [];
  let items: PayOSItem[];

  try {
    items = await buildOrderItems(cart);
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to validate cart.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const delivery = subtotal > 499000 || subtotal === 0 ? 0 : 42000;
  const voucher = body?.voucherCode
    ? evaluateVoucher(body.voucherCode, subtotal, delivery)
    : null;
  const discount = voucher?.valid ? voucher.discount : 0;
  const amount = Math.max(0, Math.round(subtotal + delivery - discount));

  if (!cart.length || amount <= 0) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Cart total must be greater than 0.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const orderCode = createOrderCode();
  const description = `VF${orderCode.toString().slice(-7)}`;
  const checkoutUrl = absoluteCheckoutUrl(request, body?.returnPath);

  const payload = {
    orderCode,
    amount,
    description,
    buyerName: typeof form?.name === "string" ? form.name.trim() : "",
    buyerEmail: typeof form?.email === "string" ? form.email.trim() : "",
    buyerPhone: typeof form?.phone === "string" ? form.phone.trim() : "",
    buyerAddress: typeof form?.address === "string" ? form.address.trim() : "",
    items,
    cancelUrl: checkoutUrl,
    returnUrl: checkoutUrl,
    signature: createPayOSSignature({
      amount,
      cancelUrl: checkoutUrl,
      description,
      orderCode,
      returnUrl: checkoutUrl,
    }),
  };

  const response = await fetch(payOSApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
      ...(partnerCode ? { "x-partner-code": partnerCode } : {}),
    },
    body: JSON.stringify(payload),
  });

  const payOSPayload = await response.json().catch(() => ({}));
  if (!response.ok || payOSPayload?.code !== "00") {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          typeof payOSPayload?.desc === "string"
            ? payOSPayload.desc
            : "Unable to create payOS payment link.",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      payment: {
        orderCode,
        checkoutUrl: payOSPayload.data.checkoutUrl,
        paymentLinkId: payOSPayload.data.paymentLinkId,
        qrCode: payOSPayload.data.qrCode,
      },
    }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );
};
