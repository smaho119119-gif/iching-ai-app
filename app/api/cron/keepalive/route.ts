import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    return NextResponse.json({ status: "ok", database: "not-configured" }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/u, "")}/rest/v1/rpc/iching_ai_app_touch_keepalive`, {
      method: "POST",
      headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Database health check failed." }, { status: 502 });
    }
    return NextResponse.json({ status: "ok", database: "reachable", timestamp: new Date().toISOString() }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Database health check failed." }, { status: 502 });
  }
}
