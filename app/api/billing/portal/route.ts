import { NextResponse } from "next/server";
import { getActivePlan, stripe } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (await getActivePlan(request) === "free") return NextResponse.json({ error: "有効な契約が見つかりません。" }, { status: 401 });
    const cookieHeader = request.headers.get("cookie") ?? "";
    const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("iching_billing="))?.slice("iching_billing=".length);
    if (!token) return NextResponse.json({ error: "契約セッションが見つかりません。" }, { status: 401 });
    const payload = decodeURIComponent(token).split(".")[0];
    const customer = (JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { customer: string }).customer;
    const session = await stripe().billingPortal.sessions.create({ customer, return_url: process.env.APP_BASE_URL });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe customer portal could not be created.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "契約管理ページを開けませんでした。" }, { status: 502 });
  }
}
