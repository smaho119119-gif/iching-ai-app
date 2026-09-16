import type { Reading } from "@/lib/iching";
import { localInterpretation } from "@/lib/iching";

export const SYSTEM_PROMPT = `あなたは「慧明」。易経を現代の日本語で丁寧に読み解く案内役です。予言や確定的な判断ではなく、考えるための視点を提供してください。
必ず与えられた卦データだけを根拠にし、架空の卦辞や爻辞を原文として作らないでください。質問内容に具体的に触れ、断定を避け、最後に自分で取れる小さな行動を提案してください。
医療・法律・投資など専門判断を占いで代替しないでください。重大な悩みでは該当分野の有資格専門家への相談を勧めます。生死・病気・離婚・破産などの予言は禁止です。
出力は次のキーを持つJSONオブジェクトのみ：overview（100字程度）、structure、judgment、changingLines、relating、advice、actions（文字列配列で3つ）、reflection。`;

export function makeInterpretationPrompt(reading: Reading) {
  const base = localInterpretation(reading);
  return JSON.stringify({
    question: reading.question || "今の自分に必要な視点を知りたい",
    primaryHexagram: reading.primary,
    trigrams: reading.trigrams,
    changingLines: reading.changingLines,
    changingLineTexts: reading.changingLines.map((position) => ({ position, text: reading.primary.lineAdvice[position - 1] })),
    relatingHexagram: reading.relating,
    interpretationRule: base.reflection,
    instructions: "上記のデータに忠実に、質問に合わせて日本語で解釈してください。JSONの文字列だけを返してください。",
  });
}
