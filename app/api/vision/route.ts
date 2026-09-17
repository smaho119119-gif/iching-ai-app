import { NextResponse } from "next/server";
import { generateAIJSONWithImage, resolveAICredentials } from "@/lib/ai-provider";
import { buildReading, type LineValue } from "@/lib/iching";
import { getActivePlan } from "@/lib/billing";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VISION_PROMPT = `Read the six-line I Ching hexagram drawn in this image. Read from bottom to top: the bottom stroke is position 1 and the top stroke is position 6. A continuous stroke is yang; a broken stroke is yin. A circle next to a line marks changing yang; an X next to a line marks changing yin. Return JSON only with keys recognized (boolean), confidence (0 to 1), lines (exactly six objects with position 1-6, type "yang" or "yin", changing (boolean)), and notes (short Japanese string). If there are not exactly six clearly readable I Ching lines, set recognized false. Do not infer or invent unclear strokes.`;

export async function POST(request: Request) {
  const credentials = resolveAICredentials(request);
  if (!credentials) {
    return NextResponse.json({ error: "手書き認識にはOpenAI・Gemini・AnthropicのいずれかのAPIキーが必要です。AI設定から登録してください。" }, { status: 503 });
  }

  const plan = await getActivePlan(request);
  const paidPremiumEnabled = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PREMIUM_MONTHLY);
  if (paidPremiumEnabled && plan !== "premium" && plan !== "corporate") {
    return NextResponse.json({ error: "手書き卦の認識はプレミアムプランの機能です。料金・設定をご確認ください。", code: "PREMIUM_REQUIRED" }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const image = form.get("image");
    const questionInput = form.get("question");
    if (!(image instanceof File)) return NextResponse.json({ error: "認識する画像を選択してください。" }, { status: 400 });
    if (image.size < 1 || image.size > 8 * 1024 * 1024) return NextResponse.json({ error: "画像は8MB以下にしてください。" }, { status: 413 });
    if (!ALLOWED_TYPES.has(image.type)) return NextResponse.json({ error: "JPEG・PNG・WebP・GIF画像を選択してください。" }, { status: 415 });
    const question = typeof questionInput === "string" ? questionInput.slice(0, 500) : "";
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const text = await generateAIJSONWithImage(credentials, VISION_PROMPT, image.type, base64);
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as {
      recognized?: boolean;
      confidence?: number;
      lines?: Array<{ position?: number; type?: string; changing?: boolean }>;
      notes?: string;
    };
    if (!parsed.recognized || typeof parsed.confidence !== "number" || parsed.confidence < 0.7 || !Array.isArray(parsed.lines) || parsed.lines.length !== 6) {
      return NextResponse.json({ error: "卦をはっきり認識できませんでした。線を6本、間隔をあけて撮影してください。", confidence: parsed.confidence ?? 0, notes: parsed.notes ?? "" }, { status: 422 });
    }
    const sorted = [...parsed.lines].sort((a, b) => Number(a.position) - Number(b.position));
    if (sorted.some((line, index) => line.position !== index + 1 || !["yang", "yin"].includes(line.type ?? "") || typeof line.changing !== "boolean")) {
      return NextResponse.json({ error: "6本の爻を正しく読み取れませんでした。向きと線を確認してください。" }, { status: 422 });
    }
    const values = sorted.map((line) => line.type === "yang" ? (line.changing ? 9 : 7) : (line.changing ? 6 : 8)) as LineValue[];
    const reading = buildReading(question, values, "coins");
    return NextResponse.json({
      confidence: parsed.confidence,
      notes: parsed.notes ?? "",
      lines: values,
      hexagram: { number: reading.primary.number, name: reading.primary.name, reading: reading.primary.reading },
      changingLines: reading.changingLines,
    });
  } catch {
    return NextResponse.json({ error: "画像の認識中に問題が起きました。別の写真でお試しください。" }, { status: 502 });
  }
}
