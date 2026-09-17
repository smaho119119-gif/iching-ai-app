import { NextResponse } from "next/server";
import { isPlanConfigured, stripe, stripePrice } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { plan?: string };
    const plan = body.plan;
    if (plan !== "standard" && plan !== "premium" && plan !== "corporate") return NextResponse.json({ error: "プランを選択してください。" }, { status: 400 });
    if (!isPlanConfigured(plan)) return NextResponse.json({ error: "このプランの決済は未設定です。StripeのAPIキー・Price ID・APP_BASE_URLを設定してください。" }, { status: 503 });
    const baseUrl = process.env.APP_BASE_URL!;
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: stripePrice(plan)!, quantity: 1 }],
      success_url: `${baseUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,
      allow_promotion_codes: true,
      metadata: { plan },
      subscription_data: { metadata: { plan } },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout could not be created.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "決済ページを作成できませんでした。Stripeの設定を確認してください。" }, { status: 502 });
  }
}
