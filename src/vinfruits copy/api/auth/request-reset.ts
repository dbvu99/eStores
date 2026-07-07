import { createPasswordResetRequest } from "@vinfuit/lib/account-auth";
import { sendPasswordResetEmail } from "@vinfuit/lib/email";
import type { APIRoute } from "astro";

function accountUrlFromRequest(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/api\/auth\/request-reset$/, "/account");
  return `${url.origin}${pathname}`;
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email) {
    return new Response(JSON.stringify({ ok: false, error: "Email is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const reset = await createPasswordResetRequest(email);
    const resetUrl = reset
      ? `${accountUrlFromRequest(request)}?resetToken=${encodeURIComponent(reset.token)}`
      : "";

    if (reset) {
      try {
        await sendPasswordResetEmail({
          email,
          resetUrl,
          token: reset.token,
          expiresAt: reset.expiresAt,
        });
      } catch (error) {
        console.error("[vinfruits] password reset email failed:", error);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        resetUrl,
        message:
          "If this email is tied to an account, a password reset link has been created.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to request a password reset right now.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
