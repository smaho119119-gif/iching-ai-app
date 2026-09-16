import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: makeInterpretationPrompt(reading) }],
        });
        const text = response.content.find((block) => block.type === "text")?.text;
        if (text) {
          const parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
          if (parsed && typeof parsed.overview === "string" && Array.isArray(parsed.actions)) interpretation = { ...interpretation, ...parsed, isAi: true };
        }
      } catch (error) {
        console.error("AI interpretation unavailable; returning local reading.", error instanceof Error ? error.message : "Unknown AI error");
      }
    }

    return NextResponse.json({ reading, interpretation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "占いを計算できませんでした。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
