import { getHexagram, getTrigrams } from "@/data/hexagrams";

export type LineValue = 6 | 7 | 8 | 9;
export type CastingMethod = "coins" | "yarrow";

export interface Reading {
  question: string;
  method: CastingMethod;
  values: LineValue[];
  primary: ReturnType<typeof getHexagram>;
  relating: ReturnType<typeof getHexagram> | null;
  changingLines: number[];
  trigrams: ReturnType<typeof getTrigrams>;
  date: string;
}

export function castCoin(): 2 | 3 {
  return crypto.getRandomValues(new Uint8Array(1))[0] & 1 ? 3 : 2;
}

export function castCoins(): LineValue {
  return (castCoin() + castCoin() + castCoin()) as LineValue;
}

function oneYarrowChange(stalks: number): number {
  const split = crypto.getRandomValues(new Uint32Array(1))[0] % (stalks - 1) + 1;
  const right = stalks - split - 1;
  const leftRemainder = split % 4 || 4;
  const rightRemainder = right % 4 || 4;
  return stalks - (1 + leftRemainder + rightRemainder);
}

export function castYarrow(): LineValue {
  let stalks = 49;
  for (let change = 0; change < 3; change += 1) stalks = oneYarrowChange(stalks);
  const value = stalks / 4;
  if (value !== 6 && value !== 7 && value !== 8 && value !== 9) throw new Error("筮竹法の爻を計算できませんでした。");
  return value;
}

export function buildReading(question: string, values: LineValue[], method: CastingMethod): Reading {
  if (values.length !== 6 || values.some((value) => ![6, 7, 8, 9].includes(value))) {
    throw new Error("6・7・8・9からなる6本の爻を指定してください。");
  }
  const yangLines = values.map((value) => value === 7 || value === 9);
  const changingLines = values.map((value, index) => value === 6 || value === 9 ? index + 1 : 0).filter(Boolean);
  const relatingLines = yangLines.map((yang, index) => changingLines.includes(index + 1) ? !yang : yang);
  return {
    question: question.trim().slice(0, 500),
    method,
    values,
    primary: getHexagram(yangLines),
    relating: changingLines.length ? getHexagram(relatingLines) : null,
    changingLines,
    trigrams: getTrigrams(yangLines),
    date: new Date().toISOString(),
  };
}

export function changingLineRule(count: number): string {
  const rules: Record<number, string> = {
    0: "変爻がないため本卦全体の卦辞を中心に読みます。",
    1: "変爻が一つです。その爻辞を特に大切な指針として読みます。",
    2: "変爻が二つです。上の爻をやや重視しながら両方を読みます。",
    3: "変爻が三つです。本卦を現在、之卦を移りゆく方向として読みます。",
    4: "変爻が四つです。之卦で変わらなかった二爻にも注目します。",
    5: "変爻が五つです。之卦で変わらなかった一爻を指針にします。",
    6: "六爻すべてが変わります。之卦を中心に、転換の大きさを慎重に読みます。",
  };
  return rules[count] ?? rules[0];
}

export function localInterpretation(reading: Reading) {
  const { primary, relating, changingLines, trigrams } = reading;
  const lineText = changingLines.length
    ? changingLines.map((position) => `第${position}爻：${primary.lineAdvice[position - 1]}`).join("\n\n")
    : "今回は変爻がありません。卦全体の傾向と、問いに対する基本姿勢を手がかりにしてください。";
  return {
    overview: `${primary.image} 今の問いには「${primary.keywords.join("・")}」が手がかりになりそうです。`,
    structure: `上卦は${trigrams.upper.name}（${trigrams.upper.nature}）、下卦は${trigrams.lower.name}（${trigrams.lower.nature}）。${trigrams.upper.quality}と${trigrams.lower.quality}の組み合わせです。`,
    judgment: primary.judgment,
    changingLines: lineText,
    relating: relating ? `第${relating.number}卦「${relating.name}」へ移る象です。${relating.image} 目の前の状況だけで決めつけず、変化の方向も考えてみましょう。` : "変爻がないため、今の状況に落ち着いて向き合うことが主題です。",
    advice: primary.advice,
    actions: ["問いに関係する事実と、自分の予想を分けて書き出す。", "今日できる小さな一歩を一つ選び、実行する。", "判断に迷う点は、信頼できる人の視点も聞いてみる。"],
    reflection: changingLineRule(changingLines.length),
    isAi: false,
  };
}
