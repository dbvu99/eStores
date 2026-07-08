import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { Pool } from "pg";

export const SESSION_COOKIE = "mm_session";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function parseCookies(
  cookieHeader: string | null,
): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce(
    (acc, part) => {
      const [key, ...valueParts] = part.trim().split("=");
      if (!key) return acc;
      acc[key] = decodeURIComponent(valueParts.join("="));
      return acc;
    },
    {} as Record<string, string>,
  );
}

export async function getSessionUser(pool: Pool, token: string) {
  const { rows } = await pool.query(
    `
    select u.id, u.email
    from bsc_sessions s
    join bsc_users u on u.id = s.user_id
    where s.token = $1
      and s.expires_at > now()
    `,
    [token],
  );

  return rows[0] ?? null;
}
