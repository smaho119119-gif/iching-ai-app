import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Stripe webhook signature is required." }, { status: 400 });
  try {
    const rawBody = await request.text();
    const event = stripe().webhooks.constructEvent(rawBody, signature, secret);
    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.warn("Stripe webhook signature verification failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }
}
