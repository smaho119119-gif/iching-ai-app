import { NextResponse } from "next/server";
import { billingSessionSecretIsConfigured, createBillingCookie, stripe } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!billingSessionSecretIsConfigured()) return NextResponse.json({ error: "BILLING_SESSION_SECRETを設定してください。" }, { status: 503 });
    const body = await request.json() as { sessionId?: string };
    if (typeof body.sessionId !== "string" || !/^cs_(test|live)_/.test(body.sessionId)) return NextResponse.json({ error: "Checkoutセッションが正しくありません。" }, { status: 400 });
    const session = await stripe().checkout.sessions.retrieve(body.sessionId);
    if (session.status !== "complete" || !session.customer || typeof session.subscription !== "string") return NextResponse.json({ error: "決済がまだ完了していないようです。" }, { status: 402 });
    const subscription = await stripe().subscriptions.retrieve(session.subscription);
    if (!["active", "trialing"].includes(subscription.status)) return NextResponse.json({ error: "有効なサブスクリプションが見つかりません。" }, { status: 402 });
    const plan = subscription.metadata.plan;
    if (plan !== "standard" && plan !== "premium" && plan !== "corporate") return NextResponse.json({ error: "購入プランを検証できませんでした。サポートにお問い合わせください。" }, { status: 400 });
    const response = NextResponse.json({ ok: true, plan });
    response.headers.append("Set-Cookie", createBillingCookie(String(session.customer), subscription.id, plan));
    return response;
  } catch (error) {
    console.error("Stripe checkout activation failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "購入状態を確認できませんでした。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
