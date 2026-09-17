import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ status: "ok", database: "not-configured" }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/u, "")}/rest/v1/iching_ai_app_keepalive?id=eq.1&select=id`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
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
