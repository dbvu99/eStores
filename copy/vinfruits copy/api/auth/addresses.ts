import {
  deleteCustomerAddress,
  getCustomerAddresses,
  getCustomerBySessionToken,
  getSessionTokenFromCookies,
  saveCustomerAddress,
  setDefaultCustomerAddress,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

async function requireCustomer(cookies: Parameters<APIRoute>[0]["cookies"]) {
  return getCustomerBySessionToken(getSessionTokenFromCookies(cookies));
}

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: "Not signed in." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  const customer = await requireCustomer(cookies);
  if (!customer) return unauthorized();

  const addresses = await getCustomerAddresses(customer);
  return new Response(JSON.stringify({ ok: true, addresses }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const customer = await requireCustomer(cookies);
  if (!customer) return unauthorized();

  const body = await request.json().catch(() => ({}));

  try {
    if (body?.action === "set-default") {
      await setDefaultCustomerAddress(
        customer,
        typeof body?.id === "string" ? body.id : "",
      );
    } else {
      await saveCustomerAddress(customer, {
        id: typeof body?.id === "string" ? body.id : "",
        label: typeof body?.label === "string" ? body.label : "",
        recipient_name:
          typeof body?.recipient_name === "string" ? body.recipient_name : "",
        phone: typeof body?.phone === "string" ? body.phone : "",
        address_line_1:
          typeof body?.address_line_1 === "string" ? body.address_line_1 : "",
        address_line_2:
          typeof body?.address_line_2 === "string" ? body.address_line_2 : "",
        ward: typeof body?.ward === "string" ? body.ward : "",
        district: typeof body?.district === "string" ? body.district : "",
        city: typeof body?.city === "string" ? body.city : "",
        country: typeof body?.country === "string" ? body.country : "",
        is_default: Boolean(body?.is_default),
      });
    }

    const addresses = await getCustomerAddresses(customer);
    return new Response(JSON.stringify({ ok: true, addresses }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save address.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const customer = await requireCustomer(cookies);
  if (!customer) return unauthorized();

  const body = await request.json().catch(() => ({}));

  try {
    await deleteCustomerAddress(
      customer,
      typeof body?.id === "string" ? body.id : "",
    );
    const addresses = await getCustomerAddresses(customer);
    return new Response(JSON.stringify({ ok: true, addresses }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete address.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
