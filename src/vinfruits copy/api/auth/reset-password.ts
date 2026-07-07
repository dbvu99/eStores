import { resetPasswordWithToken } from "@vinfuit/lib/account-auth";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));

  try {
    await resetPasswordWithToken({
      token: typeof body?.token === "string" ? body.token : "",
      password: typeof body?.password === "string" ? body.password : "",
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
