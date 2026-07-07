import {
  createCustomerSession,
  registerCustomer,
  setCustomerSessionCookie,
} from "@vinfuit/lib/account-auth";
import { sendWelcomeEmail } from "@vinfuit/lib/email";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json().catch(() => ({}));

  try {
    const user = await registerCustomer({
      name: typeof body?.name === "string" ? body.name : "",
      phone: typeof body?.phone === "string" ? body.phone : "",
      email: typeof body?.email === "string" ? body.email : "",
      password: typeof body?.password === "string" ? body.password : "",
    });
    const session = await createCustomerSession(user);
    setCustomerSessionCookie(cookies, session.token);

    try {
      await sendWelcomeEmail({ name: user.name, email: user.email });
    } catch (error) {
      console.error("[vinfruits] welcome email failed:", error);
    }

    return new Response(JSON.stringify({ ok: true, user }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create account.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
