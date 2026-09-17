import { createHmac, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";

export type BillingPlan = "free" | "standard" | "premium" | "corporate";
type PaidPlan = Exclude<BillingPlan, "free">;

const PLAN_PRICES: Record<PaidPlan, string | undefined> = {
  standard: process.env.STRIPE_PRICE_STANDARD_MONTHLY,
  premium: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  corporate: process.env.STRIPE_PRICE_CORPORATE_MONTHLY,
};

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  return new Stripe(key);
}

function signingKey() {
  const value = process.env.BILLING_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("BILLING_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function parseBillingCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("iching_billing="))?.slice("iching_billing=".length);
  if (!token) return null;
  const [payload, providedSignature] = decodeURIComponent(token).split(".");
  if (!payload || !providedSignature) return null;
  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(sign(payload), "base64url");
    actual = Buffer.from(providedSignature, "base64url");
  } catch { return null; }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { customer?: string; subscription?: string; plan?: string; expires?: number };
    if (!data.customer || !data.subscription || !data.plan || !["standard", "premium", "corporate"].includes(data.plan) || !data.expires || data.expires < Date.now()) return null;
    const plan = data.plan as PaidPlan;
    return { ...data, plan };
  } catch { return null; }
}

export async function getActivePlan(request: Request): Promise<BillingPlan> {
  const session = parseBillingCookie(request);
  if (!session) return "free";
  if (!session.subscription) return "free";
  try {
    const subscription = await stripeClient().subscriptions.retrieve(session.subscription);
    if (subscription.customer !== session.customer || !["active", "trialing"].includes(subscription.status)) return "free";
    return session.plan;
  } catch { return "free"; }
}

export function isPlanConfigured(plan: string): plan is PaidPlan {
  return plan in PLAN_PRICES && Boolean(PLAN_PRICES[plan as PaidPlan] && process.env.STRIPE_SECRET_KEY && process.env.APP_BASE_URL);
}

export function createBillingCookie(customer: string, subscription: string, plan: PaidPlan) {
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ customer, subscription, plan, expires })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  return `iching_billing=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function stripe() { return stripeClient(); }
export function stripePrice(plan: string) { return plan in PLAN_PRICES ? PLAN_PRICES[plan as PaidPlan] : undefined; }
export function billingSessionSecretIsConfigured() { try { signingKey(); return true; } catch { return false; } }
