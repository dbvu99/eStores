import {
  authenticateCustomer,
  createCustomerSession,
  setCustomerSessionCookie,
} from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json().catch(() => ({}));

  try {
    const user = await authenticateCustomer({
      login: typeof body?.login === "string" ? body.login : "",
      password: typeof body?.password === "string" ? body.password : "",
    });

    if (!user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid credentials." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const session = await createCustomerSession(user);
    setCustomerSessionCookie(cookies, session.token);

    return new Response(JSON.stringify({ ok: true, user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign in.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
