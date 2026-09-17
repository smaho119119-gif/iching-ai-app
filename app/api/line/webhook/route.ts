import { NextResponse } from "next/server";
import { getDailyHexagram } from "@/lib/daily";
import { isValidLineSignature } from "@/lib/line-signature";

export const runtime = "nodejs";

function makeReply(text: string) {
  const normalized = text.trim();
  if (/^(易経|今日の卦|今日の易)$/u.test(normalized)) {
    const daily = getDailyHexagram();
    const advice = daily.hexagram.lineAdvice[daily.changingLine - 1];
    return `【今日の卦】第${daily.hexagram.number}卦 ${daily.hexagram.name}（${daily.hexagram.reading}）\n\n${daily.hexagram.image}\n${daily.hexagram.judgment}\n\n【今日のヒント・第${daily.changingLine}爻】\n${advice}\n\n易経は考えを深めるための参考情報です。大切な判断はご自身で行ってください。`;
  }
  return "「易経」または「今日の卦」と送ると、今日の一卦をお届けします。";
}

export async function POST(request: Request) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelSecret || !accessToken) return NextResponse.json({ error: "LINE連携の環境変数が設定されていません。" }, { status: 503 });
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 1024 * 1024) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > 1024 * 1024) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  if (!isValidLineSignature(rawBody, request.headers.get("x-line-signature"), channelSecret)) return NextResponse.json({ error: "Invalid LINE webhook signature." }, { status: 401 });

  let payload: { events?: Array<{ type?: string; replyToken?: string; message?: { type?: string; text?: string } } | null> };
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!payload || !Array.isArray(payload.events)) return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  const messages = payload.events.filter((event): event is { type?: string; replyToken?: string; message?: { type?: string; text?: string } } => Boolean(event && event.type === "message" && event.message?.type === "text" && event.replyToken && event.message.text));
  for (const event of messages) {
    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ replyToken: event.replyToken, messages: [{ type: "text", text: makeReply(event.message!.text!) }] }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error("LINE reply failed with status", response.status);
      return NextResponse.json({ error: "LINEへの返信に失敗しました。" }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true, processed: messages.length });
}
