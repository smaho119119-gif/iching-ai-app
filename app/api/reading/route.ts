import { NextResponse } from "next/server";
import { generateAIJSON, resolveAICredentials } from "@/lib/ai-provider";
import { buildReading, localInterpretation, type CastingMethod, type LineValue } from "@/lib/iching";
import { makeInterpretationPrompt, SYSTEM_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
    const input = body as Record<string, unknown>;
    if (typeof input.question !== "string" || input.question.length > 500) return NextResponse.json({ error: "質問は500文字以内で入力してください。" }, { status: 400 });
    if (!Array.isArray(input.lines) || input.lines.length !== 6 || !input.lines.every((value) => Number.isInteger(value) && [6,7,8,9].includes(value))) return NextResponse.json({ error: "6・7・8・9の爻を6つ指定してください。" }, { status: 400 });
    const method: CastingMethod = input.method === "yarrow" ? "yarrow" : "coins";
    const reading = buildReading(input.question, input.lines as LineValue[], method);
    let interpretation = localInterpretation(reading);

    const credentials = resolveAICredentials(request);
    if (credentials) {
      try {
        const text = await generateAIJSON(credentials, SYSTEM_PROMPT, makeInterpretationPrompt(reading));
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.overview === "string" && Array.isArray(parsed.actions)) interpretation = { ...interpretation, ...parsed, isAi: true };
      } catch {
        // Provider errors may include sensitive request metadata; do not log them.
      }
    }

    return NextResponse.json({ reading, interpretation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "占いを計算できませんでした。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
