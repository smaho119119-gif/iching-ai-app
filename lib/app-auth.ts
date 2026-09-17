import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "iching_ai_app_session";
const THREE_DAYS_SECONDS = 60 * 60 * 24 * 3;
type Session = { id: string; email: string; trialEndsAt: string; exp: number };
function secret() { const value = process.env.ICHING_AI_APP_AUTH_SECRET; if (!value || value.length < 32) throw new Error("認証設定を準備中です。しばらくしてからお試しください。"); return value; }
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
export function createSessionToken(input: Omit<Session, "exp">) { const payload = Buffer.from(JSON.stringify({ ...input, exp: Math.floor(Date.now() / 1000) + THREE_DAYS_SECONDS })).toString("base64url"); return `${payload}.${sign(payload)}`; }
export function parseSessionToken(value?: string): Session | null {
  try { if (!value) return null; const [payload, signature] = value.split("."); if (!payload || !signature) return null; const expected = Buffer.from(sign(payload)); const actual = Buffer.from(signature); if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null; const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session; return typeof session.id === "string" && typeof session.email === "string" && typeof session.trialEndsAt === "string" && Number.isFinite(new Date(session.trialEndsAt).getTime()) && Number.isFinite(session.exp) && session.exp > Math.floor(Date.now() / 1000) ? session : null; } catch { return null; }
}
export async function getAppSession() { return parseSessionToken((await cookies()).get(COOKIE_NAME)?.value); }
export function sessionCookie(value: string) { return { name: COOKIE_NAME, value, options: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: THREE_DAYS_SECONDS } }; }
export function clearSessionCookie() { return { name: COOKIE_NAME, value: "", options: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 0 } }; }
