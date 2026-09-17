import { NextResponse } from "next/server";
import { billingSessionSecretIsConfigured, getActivePlan, isPlanConfigured } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return NextResponse.json({
    plan: await getActivePlan(request),
    plansConfigured: { standard: isPlanConfigured("standard"), premium: isPlanConfigured("premium"), corporate: isPlanConfigured("corporate") },
    sessionConfigured: billingSessionSecretIsConfigured(),
  });
}
