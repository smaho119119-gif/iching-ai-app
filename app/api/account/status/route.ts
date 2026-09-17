import { NextResponse } from "next/server";
import { getTrialAccess } from "@/lib/trial";

export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(await getTrialAccess(), { headers: { "Cache-Control": "no-store" } }); }
