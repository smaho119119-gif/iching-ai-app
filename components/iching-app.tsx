"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CircleHelp, Coins, Feather, RotateCcw, Sparkles, Waves, Wind } from "lucide-react";
import { getLinesForHexagram, HEXAGRAMS } from "@/data/hexagrams";
import { buildReading, castCoin, castYarrow, type CastingMethod, type LineValue } from "@/lib/iching";

type ResultPayload = ReturnType<typeof buildReading>;
type Interpretation = { overview: string; structure: string; judgment: string; changingLines: string; relating: string; advice: string; actions: string[]; reflection: string; isAi: boolean };
type CoinFace = 2 | 3;

const quotes = [
  { text: "窮すれば變じ、變ずれば通じ、通ずれば久し。", source: "繫辞下伝", translation: "行き詰まったら変化が生まれ、変化が道を開けば、それは長く続いていく。" },
  { text: "天行健。君子以て自彊して息まず。", source: "乾・象伝", translation: "天の運行は健やかである。学ぶ人は、自らを磨くことをやめない。" },
  { text: "地勢坤。君子以て厚徳をもって物を載す。", source: "坤・象伝", translation: "大地はあらゆるものを受けとめる。深い徳で人と物事を支える。" },
  { text: "君子以て多く聞きて疑を闕き、慎みて其の餘りを言う。", source: "大畜・象伝", translation: "広く学んで疑わしいことを保留し、確かなことだけを慎重に語る。" },
  { text: "君子以て言に忠信、行いに篤敬。", source: "文言伝", translation: "言葉には誠実さを、行いには深い敬意を込める。" },
  { text: "善を積まざれば以て名を成すに足らず。", source: "繫辞下伝", translation: "善いことを積み重ねなければ、信頼される人にはなれない。" },
  { text: "君子以て虚を致し、静を守る。", source: "繫辞下伝", translation: "心に余白をつくり、静かな姿勢を守る。" },
];

const nameReadings: Record<number,string> = { 1:"乾為天",2:"坤為地",3:"水雷屯",4:"山水蒙",5:"水天需",6:"天水訟",7:"地水師",8:"水地比",9:"風天小畜",10:"天沢履",11:"地天泰",12:"天地否",13:"天火同人",14:"火天大有",15:"地山謙",16:"雷地豫",17:"沢雷随",18:"山風蠱",19:"地沢臨",20:"風地観",21:"火雷噬嗑",22:"山火賁",23:"山地剝",24:"地雷復",25:"天雷无妄",26:"山天大畜",27:"山雷頤",28:"沢風大過",29:"坎為水",30:"離為火",31:"沢山咸",32:"雷風恒",33:"天山遯",34:"雷天大壮",35:"火地晋",36:"地火明夷",37:"風火家人",38:"火沢睽",39:"水山蹇",40:"雷水解",41:"山沢損",42:"風雷益",43:"沢天夬",44:"天風姤",45:"沢地萃",46:"地風升",47:"沢水困",48:"水風井",49:"沢火革",50:"火風鼎",51:"震為雷",52:"艮為山",53:"風山漸",54:"雷沢帰妹",55:"雷火豊",56:"火山旅",57:"巽為風",58:"兌為沢",59:"風水渙",60:"水沢節",61:"風沢中孚",62:"雷山小過",63:"水火既済",64:"火水未済" };

function HexagramLines({ values, changing = [], small = false }: { values: (boolean | LineValue)[]; changing?: number[]; small?: boolean }) {
  const normalized = values.map((value) => typeof value === "boolean" ? value : value === 7 || value === 9);
  return <div className={`hex-lines ${small ? "hex-lines-small" : ""}`} aria-label="卦の爻を下から上の順に表示">{[...normalized].reverse().map((yang, index) => {
    const position = 6 - index;
    return <div className="hex-line-row" key={position}><span className="hex-position">{["初","二","三","四","五","上"][position - 1]}</span><div className={`hex-line ${yang ? "yang" : "yin"} ${changing.includes(position) ? "is-changing" : ""}`}><i /><i /></div>{changing.includes(position) && <span className="change-label">變</span>}</div>;
  })}</div>;
}

function Ritual({ method, setMethod, onComplete }: { method: CastingMethod; setMethod: (method: CastingMethod) => void; onComplete: (lines: LineValue[]) => void }) {
  const [values, setValues] = useState<LineValue[]>([]);
  const [flipping, setFlipping] = useState(false);
  const [coins, setCoins] = useState<CoinFace[]>([]);
  useEffect(() => { setValues([]); }, [method]);
  const toss = () => {
    if (flipping || values.length >= 6) return;
    setFlipping(true);
    const coinValues: CoinFace[] = [castCoin(), castCoin(), castCoin()];
    setCoins(coinValues);
    window.setTimeout(() => {
      const value = method === "coins" ? coinValues.reduce<number>((sum, coin) => sum + coin, 0) as LineValue : castYarrow();
      const next = [...values, value];
      setValues(next); setFlipping(false);
      if (next.length === 6) window.setTimeout(() => onComplete(next), 380);
    }, 780);
  };
  return <div className="ritual-stage">
    <div className="ritual-kicker"><span className="ritual-kicker-line"/>QUIET THE MIND <span className="ritual-kicker-line"/></div>
    <h2 className="ritual-heading">{values.length < 6 ? "心を澄ませて、問いを思い浮かべて。" : "六つの爻が、そろいました。"}</h2>
    <p className="ritual-intro">{values.length < 6 ? `コインをゆっくり振って、卦を一爻ずつ重ねましょう。${6-values.length}回残っています。` : "いまの状況と、これからの変化を読み解いていきます。"}</p>
    <div className="method-toggle" aria-label="占い方"><button onClick={() => setMethod("coins")} className={method === "coins" ? "selected" : ""}><Coins size={14}/> コイン</button><button onClick={() => setMethod("yarrow")} className={method === "yarrow" ? "selected" : ""}><Waves size={14}/> 筮竹</button></div>
    <div className="reading-layout">
      <div className="ritual-orb"><span className="orb-ring orb-ring-one"/><span className="orb-ring orb-ring-two"/><span className="orb-glyph">易</span><span className="orb-caption">{method === "coins" ? "THREE COINS" : "YARROW STALKS"}</span></div>
      <div className="lines-build">{Array.from({length:6},(_,row) => { const index=5-row;const value = values[index]; return <div className={`build-line-row ${index < values.length ? "built" : "pending"}`} key={index}><span>{["初","二","三","四","五","上"][index]}爻</span><div className={`build-line ${value === 7 || value === 9 ? "yang" : value === 6 || value === 8 ? "yin" : ""} ${flipping && index === 5-values.length ? "build-active" : ""}`}><i/><i/></div><span className="build-marker">{value === 6 || value === 9 ? "變" : index < values.length ? "·" : ""}</span></div>; })}</div>
    </div>
    {flipping && <div className="coin-tray" aria-live="polite">{coins.map((coin,index)=><div className={`coin coin-${coin === 3 ? "yang" : "yin"}`} key={index} style={{"--coin-index":index} as React.CSSProperties}><span>{coin===3?"陽":"陰"}</span></div>)}</div>}
    <button className="cast-button" onClick={toss} disabled={flipping || values.length >= 6}>{flipping ? <><Sparkles size={16}/> 聆く…</> : values.length < 6 ? <><Coins size={16}/> {values.length === 0 ? "最初の一投" : `第 ${values.length+1} 回を投げる`} <ArrowRight size={15}/></> : <><Check size={16}/> 卦を読み解く <ArrowRight size={15}/></>}</button>
    <p className="ritual-note">{method === "coins" ? "各爻は３枚のコインの組み合わせから生まれます。" : "筮竹法の手順を簡略化してデジタルで再現します。"}</p>
  </div>;
}

function ResultView({ reading, interpretation, onReset }: { reading: ResultPayload; interpretation: Interpretation; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const trigrams = useMemo(() => reading.trigrams, [reading.trigrams]);
  const share = async () => {
    const message = `易の余白｜第${reading.primary.number}卦 ${reading.primary.name}\n${interpretation.overview}\n\n${window.location.origin}`;
    try { if (navigator.share) await navigator.share({title:"易の余白",text:message}); else { await navigator.clipboard.writeText(message); setCopied(true); window.setTimeout(()=>setCopied(false),1800); } } catch { /* The share sheet may be dismissed without action. */ }
  };
  return <div className="result-wrap">
    <div className="result-topline"><span>YOUR READING</span><span>{new Date(reading.date).toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric"})}</span></div>
    <div className="result-hero">
      <div className="result-number"><span>HEXAGRAM</span>{String(reading.primary.number).padStart(2,"0")}</div>
      <div><div className="result-kanji">{reading.primary.unicode}</div><h2>{reading.primary.name}</h2><p>{reading.primary.reading}　·　{reading.method === "coins" ? "コイン法" : "筮竹法"}</p></div>
    </div>
    <div className="result-chart"><div className="chart-caption"><span>本卦 <b>NOW</b></span><span>{reading.primary.number} / 64</span></div><HexagramLines values={reading.values}/><div className="chart-trigrams"><div><span>上卦</span><b>{trigrams.upper.glyph}　{trigrams.upper.name}</b><small>{trigrams.upper.nature} · {trigrams.upper.quality}</small></div><div><span>下卦</span><b>{trigrams.lower.glyph}　{trigrams.lower.name}</b><small>{trigrams.lower.nature} · {trigrams.lower.quality}</small></div></div></div>
    <div className="reading-copy"><div className="section-eyebrow"><span className="eyebrow-dot"/> THE MOMENT</div><h3>いま、ここにあるもの</h3><p className="reading-overview">{interpretation.overview}</p><div className="judgment-quote"><span>卦辞</span><p>{interpretation.judgment}</p></div><p className="structure-copy">{interpretation.structure}</p></div>
    <div className="change-card"><div className="change-icon"><Wind size={17}/></div><div><div className="section-eyebrow">{reading.changingLines.length ? `THE TURNING POINT · ${reading.changingLines.map(n=>`第${n}爻`).join(" / ")}` : "THE STEADY LINES"}</div><h3>{reading.changingLines.length ? "変化の兆し" : "いまの流れ"}</h3><p>{interpretation.changingLines}</p></div></div>
    <div className="related-card"><div className="related-top"><div><div className="section-eyebrow">{reading.relating ? "WHAT MAY EMERGE" : "STAY WITH THE PRESENT"}</div><h3>{reading.relating ? "移りゆく先" : "変わらない爻"}</h3></div><ArrowDown size={17}/></div>{reading.relating ? <><div className="related-inner"><div className="related-glyph">{reading.relating.unicode}</div><div><b>第{reading.relating.number}卦　{reading.relating.name}</b><span>{reading.relating.reading}</span></div></div><p>{interpretation.relating}</p></> : <p>{interpretation.relating}</p>}</div>
    <div className="advice-section"><div className="section-eyebrow"><span className="eyebrow-dot"/> A THOUGHT TO CARRY</div><h3>今日に持ち帰ること</h3><p>{interpretation.advice}</p><ol className="action-list">{interpretation.actions.map((action,index)=><li key={index}><span>0{index+1}</span><p>{action}</p></li>)}</ol></div>
    <div className="reflection-note"><Feather size={16}/><p>{interpretation.reflection}</p></div>
    <div className="result-actions"><button className="secondary-action" onClick={onReset}><RotateCcw size={15}/> もう一度、問い直す</button><button className="share-action" onClick={share}>{copied ? <Check size={15}/> : <ArrowUpRight size={15}/>} {copied ? "コピーしました" : "結果を分かち合う"}</button></div>
    <p className="ai-footnote">{interpretation.isAi ? <><Sparkles size={12}/> AIとともに読み解きました。卦の情報に基づく解釈です。</> : <><CircleHelp size={12}/> AIキーなしで表示中。解釈を有効化するにはREADMEをご覧ください。</>}</p>
  </div>;
}

export function IChingApp() {
  const [phase, setPhase] = useState<"home"|"ritual"|"loading"|"result"|"hexagrams">("home");
  const [question, setQuestion] = useState("");
  const [method, setMethod] = useState<CastingMethod>("coins");
  const [result, setResult] = useState<{reading:ResultPayload;interpretation:Interpretation}|null>(null);
  const [dailyIndex, setDailyIndex] = useState(0);
  const dailyQuote = quotes[dailyIndex];

  useEffect(() => { setDailyIndex(Math.floor(Math.random() * quotes.length)); }, []);

  const start = () => { setResult(null); setPhase("ritual"); };
  const onComplete = async (lines: LineValue[]) => {
    setPhase("loading");
    try {
      const response = await fetch("/api/reading", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,lines,method})});
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "結果を読み込めませんでした。");
      setResult(payload); setPhase("result");
    } catch {
      const reading = buildReading(question, lines, method);
      const fallback = {overview:`${reading.primary.image} 「${reading.primary.keywords.join("・")}」が、いま考えてみたい手がかりです。`,structure:`上卦は${reading.trigrams.upper.name}（${reading.trigrams.upper.nature}）、下卦は${reading.trigrams.lower.name}（${reading.trigrams.lower.nature}）。`,judgment:reading.primary.judgment,changingLines:reading.changingLines.map((n)=>`第${n}爻：${reading.primary.lineAdvice[n-1]}`).join("\n\n")||"変爻はありません。卦全体の傾向を手がかりにしてください。",relating:reading.relating?`第${reading.relating.number}卦「${reading.relating.name}」へ移る象です。${reading.relating.image}`:"変爻がないため、今の状況に落ち着いて向き合うことが主題です。",advice:reading.primary.advice,actions:["事実と予想を分けて書き出す。","今日できる小さな一歩を選ぶ。","信頼できる人の視点も聞いてみる。"],reflection:"卦は決断を代行するものではなく、自分の考えを見つめ直すための補助線です。",isAi:false};
      setResult({reading,interpretation:fallback}); setPhase("result");
    }
  };
  const reset = () => { setResult(null); setQuestion(""); setPhase("home"); window.scrollTo({top:0,behavior:"smooth"}); };

  return <main className="site-shell">
    <header className="site-nav"><a className="brand-mark" href="#top" onClick={reset}><span className="brand-symbol">易</span><span>易の余白<small>THE SPACE OF CHANGE</small></span></a><nav><a href="#about">易経について</a><button onClick={()=>setPhase(phase === "hexagrams" ? "home" : "hexagrams")}>六十四卦 <ArrowUpRight size={13}/></button></nav></header>
    <section className={`hero-section ${phase !== "home" ? "hero-compact" : ""}`} id="top"><div className="hero-copy"><div className="hero-kicker"><span/> THE ANCIENT ART OF CHANGE <span/></div><h1>答えよりも、<br/>問いを<span>深く。</span></h1><p className="hero-description">三千年の知恵、易経。<br/>変わりゆく日々のなかに、<br/>自分のための静かな余白を。</p>{phase === "home" && <div className="hero-cta-row"><button className="primary-cta" onClick={start}>今日の問いを立てる <ArrowRight size={16}/></button><span className="cta-caption">所要時間 約２分 · 無料</span></div>}</div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-a"/><div className="art-orbit orbit-b"/><div className="art-orbit orbit-c"/><div className="art-center"><span>易</span><small>I · CHING</small></div><div className="art-trigram trigram-top"><i/><i/><i/></div><div className="art-trigram trigram-right"><i/><i/><i/></div><div className="art-trigram trigram-bottom"><i/><i/><i/></div><div className="art-trigram trigram-left"><i/><i/><i/></div><span className="art-coordinate coordinate-top">30° 16′ N</span><span className="art-coordinate coordinate-bottom">ANCIENT WISDOM · PRESENT MOMENT</span></div><div className="hero-index"><span>01</span><i/> AN INVITATION TO REFLECT</div></section>
    <div className="fine-rule"><span>陰</span><i/><span>陽</span></div>
    {phase === "home" && <><section className="quote-section"><div className="quote-mark">“</div><div><p>{dailyQuote.text}</p><span>{dailyQuote.source} <i/> {dailyQuote.translation}</span></div><div className="quote-date">本日のことば<br/>{new Intl.DateTimeFormat("ja-JP",{month:"long",day:"numeric"}).format(new Date())}</div></section><section className="invitation-section"><div className="invitation-index">A QUIET MOMENT <span>— 01</span></div><div className="invitation-body"><div><h2>いま、心にある問いを。<br/><span>そのまま、聞かせてください。</span></h2><p>易経は未来を決めつけるものではありません。<br/>状況を別の角度から眺め、自分の考えを整理するための、<br/>ひとつの対話のかたちです。</p></div><div className="question-card"><label htmlFor="question">心にある問い <span>OPTIONAL</span></label><textarea id="question" placeholder="例：新しい挑戦に踏み出すタイミングだろうか…" maxLength={500} value={question} onChange={(event)=>setQuestion(event.target.value)}/><div className="question-footer"><span>{question.length} / 500</span><button onClick={start}>問いを立てる <ArrowRight size={14}/></button></div></div></div></section></>}
    {phase === "ritual" && <Ritual method={method} setMethod={setMethod} onComplete={onComplete}/>}
    {phase === "loading" && <div className="loading-panel"><div className="loading-motif">易</div><div className="loading-label"><span/> READING THE LINES <span/></div><h2>変化のあわいに、<br/>耳を澄ませています。</h2><p>六つの爻から、問いの姿を読み解いています。</p></div>}
    {phase === "result" && result && <ResultView reading={result.reading} interpretation={result.interpretation} onReset={reset}/>}
    {phase === "hexagrams" && <section className="hexagram-library"><div className="section-eyebrow">THE 64 HEXAGRAMS</div><h2>六十四の、<br/><span>変化のかたち。</span></h2><p>問いの導きとなる六十四卦。気になる卦を眺めてみてください。</p><div className="hexagram-grid">{HEXAGRAMS.map((hexagram)=><button key={hexagram.number} className="hexagram-tile" onClick={()=>{const values=getLinesForHexagram(hexagram.number).map((yang)=>yang?7:8) as LineValue[];const reading=buildReading("",values,"coins");setResult({reading,interpretation:{overview:hexagram.image,structure:hexagram.keywords.join(" · "),judgment:hexagram.judgment,changingLines:"変爻なし。卦全体の気配を眺めてください。",relating:"いまの卦を手がかりに、問いを立てて占うこともできます。",advice:hexagram.advice,actions:["卦の名前を味わう。","状況に重なるところを探す。","小さく行動してみる。"],reflection:"六十四卦は未来の断定ではなく、状況を考えるための視点です。",isAi:false}});setPhase("result");}}><span>{String(hexagram.number).padStart(2,"0")}</span><b>{hexagram.unicode}</b><strong>{nameReadings[hexagram.number]??hexagram.name}</strong><small>{hexagram.reading}</small></button>)}</div></section>}
    <section className="principles-section" id="about"><div className="principles-index">A WAY OF SEEING<br/><span>— 02</span></div><div className="principles-content"><div className="section-eyebrow">NOT A PREDICTION, BUT A PERSPECTIVE</div><h2>変化を見つめることは、<br/>自分に立ち返ること。</h2><p>陰と陽。六本の爻。六十四の卦。<br/>易経は、変化する世界を見つめるために育まれてきた古い知恵です。<br/>ここではそれを、今日を考えるためのひとつの視点としてお届けします。</p><div className="principle-points"><div><span>01</span><b>卦は決断をしません。</b><p>選択をするのは、いつもあなた自身です。</p></div><div><span>02</span><b>問いは、あなたのもの。</b><p>誰かの答えより、自分の問いを大切に。</p></div><div><span>03</span><b>変化には、余白がある。</b><p>今日の読みは、考えはじめるきっかけ。</p></div></div></div></section>
    <footer className="site-footer"><a className="brand-mark footer-brand" href="#top" onClick={reset}><span className="brand-symbol">易</span><span>易の余白<small>THE SPACE OF CHANGE</small></span></a><p>古い知恵に、いまの問いを重ねる。</p><span className="footer-copyright">© 2026 易の余白　·　古典の一解釈です</span></footer>
  </main>;
}
