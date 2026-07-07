import sgMail from "@sendgrid/mail";
import { formatVnd } from "@vinfuit/fruitData";
import { businessInfo } from "@vinfuit/lib/business-info";

type EmailResult = {
  sent: boolean;
  skipped?: boolean;
};

type OrderEmailItem = {
  name: string;
  quantity: number;
  total?: number;
  price?: number;
};

const SENDGRID_API_KEY =
  import.meta.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
const FROM_EMAIL =
  // import.meta.env.KLEVERFRUITS_FROM_EMAIL ||
  // process.env.KLEVERFRUITS_FROM_EMAIL ||
  // import.meta.env.SENDGRID_FROM_EMAIL ||
  // process.env.SENDGRID_FROM_EMAIL ||
  businessInfo.email;
const INTERNAL_BCC =
  // import.meta.env.KLEVERFRUITS_BCC_EMAIL ||
  // process.env.KLEVERFRUITS_BCC_EMAIL ||
  businessInfo.email;

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function configured() {
  if (!SENDGRID_API_KEY) {
    console.warn("[vinfruits-email] SENDGRID_API_KEY is missing.");
    return false;
  }
  sgMail.setApiKey(SENDGRID_API_KEY);
  return true;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const recipient = to.trim().toLowerCase();
  if (!isValidEmail(recipient)) return { sent: false, skipped: true };
  if (!configured()) return { sent: false, skipped: true };

  await sgMail.send({
    to: recipient,
    bcc:
      INTERNAL_BCC && isValidEmail(INTERNAL_BCC) ? [INTERNAL_BCC] : undefined,
    from: FROM_EMAIL,
    subject,
    html,
  });

  return { sent: true };
}

function shell(title: string, body: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6; padding:24px 0;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; font-family:Arial,Helvetica,sans-serif; color:#1f2937; border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:22px 24px; border-bottom:1px solid #e5e7eb;">
                <strong style="font-size:24px; letter-spacing:4px; color:#24545f;">VINFRUITS</strong>
                <div style="margin-top:6px; font-size:13px; line-height:1.5; color:#6b7280;">
                  ${escapeHtml(businessInfo.displayName)}<br />
                  Hotline: ${escapeHtml(businessInfo.hotline)} · ${escapeHtml(businessInfo.email)}<br />
                  ${escapeHtml(businessInfo.address)}<br />
                  ${escapeHtml(businessInfo.businessHours)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 16px; font-size:24px; line-height:1.25; color:#24545f;">${escapeHtml(title)}</h1>
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export async function sendWelcomeEmail(params: {
  name: string;
  email: string;
}) {
  return sendEmail({
    to: params.email,
    subject: "Welcome to VinFruits",
    html: shell(
      "Welcome to VinFruits",
      `
        <p style="margin:0 0 14px; font-size:15px; line-height:1.6;">
          Hi ${escapeHtml(params.name || "there")}, your VinFruits account is ready.
        </p>
        <p style="margin:0; font-size:15px; line-height:1.6;">
          You can now save delivery addresses, view order history, and check out faster.
        </p>
      `,
    ),
  });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  resetUrl: string;
  token: string;
  expiresAt: string;
}) {
  const expiresLabel = new Date(params.expiresAt).toLocaleString("en-US", {
    timeZone: "America/Chicago",
  });

  return sendEmail({
    to: params.email,
    subject: "Reset your VinFruits password",
    html: shell(
      "Reset your password",
      `
        <p style="margin:0 0 14px; font-size:15px; line-height:1.6;">
          Use the button below to reset your VinFruits password.
        </p>
        <p style="margin:0 0 18px;">
          <a href="${escapeHtml(params.resetUrl)}" style="display:inline-block; background:#24545f; color:#ffffff; padding:12px 18px; text-decoration:none; font-weight:bold;">
            Reset password
          </a>
        </p>
        <p style="margin:0 0 12px; font-size:14px; line-height:1.6;">
          Reset token: <strong>${escapeHtml(params.token)}</strong>
        </p>
        <p style="margin:0; font-size:13px; line-height:1.6; color:#6b7280;">
          This reset token expires at ${escapeHtml(expiresLabel)} CT. If you did not request this, you can ignore this email.
        </p>
      `,
    ),
  });
}

export async function sendOrderConfirmationEmail(params: {
  email: string;
  name: string;
  orderNumber: string;
  address: string;
  items: OrderEmailItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  voucherCode: string;
  total: number;
}) {
  const itemRows = params.items
    .map((item) => {
      const total = item.total ?? (item.price || 0) * item.quantity;
      return `
        <tr>
          <td style="padding:8px; border:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
          <td style="padding:8px; border:1px solid #e5e7eb; text-align:right;">${item.quantity}</td>
          <td style="padding:8px; border:1px solid #e5e7eb; text-align:right;">${escapeHtml(formatVnd(total))}</td>
        </tr>
      `;
    })
    .join("");

  return sendEmail({
    to: params.email,
    subject: `VinFruits order received ${params.orderNumber}`,
    html: shell(
      "Order received",
      `
        <p style="margin:0 0 14px; font-size:15px; line-height:1.6;">
          Hi ${escapeHtml(params.name || "there")}, we received your order <strong>${escapeHtml(params.orderNumber)}</strong>.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin:0 0 18px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th align="left" style="padding:8px; border:1px solid #e5e7eb;">Product</th>
              <th align="right" style="padding:8px; border:1px solid #e5e7eb;">Qty</th>
              <th align="right" style="padding:8px; border:1px solid #e5e7eb;">Tổng cộng</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="margin:0 0 8px; font-size:15px;"><strong>Delivery address:</strong> ${escapeHtml(params.address)}</p>
        <p style="margin:0 0 6px; font-size:15px;"><strong>Subtotal:</strong> ${escapeHtml(formatVnd(params.subtotal))}</p>
        <p style="margin:0 0 6px; font-size:15px;"><strong>Delivery:</strong> ${params.delivery ? escapeHtml(formatVnd(params.delivery)) : "Miễn phí"}</p>
        ${params.discount ? `<p style="margin:0 0 6px; font-size:15px;"><strong>Voucher${params.voucherCode ? ` (${escapeHtml(params.voucherCode)})` : ""}:</strong> -${escapeHtml(formatVnd(params.discount))}</p>` : ""}
        <p style="margin:0; font-size:16px;"><strong>Total:</strong> ${escapeHtml(formatVnd(params.total))}</p>
      `,
    ),
  });
}

export async function sendOrderStatusEmail(params: {
  email: string;
  name: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
}) {
  return sendEmail({
    to: params.email,
    subject: `VinFruits order ${params.orderNumber} is ${params.status}`,
    html: shell(
      "Order status updated",
      `
        <p style="margin:0 0 14px; font-size:15px; line-height:1.6;">
          Hi ${escapeHtml(params.name || "there")}, order <strong>${escapeHtml(params.orderNumber)}</strong> has been updated.
        </p>
        <p style="margin:0 0 8px; font-size:15px;"><strong>Status:</strong> ${escapeHtml(params.status)}</p>
        <p style="margin:0; font-size:15px;"><strong>Payment:</strong> ${escapeHtml(params.paymentStatus)}</p>
      `,
    ),
  });
}
