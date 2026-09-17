"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Check, LoaderCircle, Sparkles } from "lucide-react";
import { ApiKeySettings, getStoredAIHeaders } from "@/components/api-key-settings";

type Payload = { confidence: number; notes: string; lines: number[]; hexagram: { number: number; name: string; reading: string }; changingLines: number[]; interpretation?: { overview: string; structure: string; changingLines: string; relating: string; advice: string; actions: string[] } };

export function HandwrittenTool() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Payload | null>(null);

  const chooseFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (!next) return;
    if (next.size > 8 * 1024 * 1024) { setError("画像は8MB以下にしてください。"); return; }
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setResult(null);
    setError("");
  };

  const recognize = async () => {
    if (!file || busy) return;
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.append("image", file); form.append("question", question);
      const visionHeaders:Record<string,string>={...getStoredAIHeaders()};
      const response = await fetch("/api/vision", { method: "POST", headers: visionHeaders, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "卦を認識できませんでした。");
      const readingHeaders:Record<string,string>={"Content-Type":"application/json",...getStoredAIHeaders()};
      const interpretationResponse=await fetch("/api/reading",{method:"POST",headers:readingHeaders,body:JSON.stringify({question,lines:data.lines,method:"handwritten"})});
      const interpretationData=await interpretationResponse.json();
      if(!interpretationResponse.ok)throw new Error(interpretationData.error??"卦の解釈を取得できませんでした。");
      setResult({...data,interpretation:interpretationData.interpretation} as Payload);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "通信エラーが発生しました。"); }
    finally { setBusy(false); }
  };

  return <main className="handwriting-shell">
    <Link className="handwriting-back" href="/"><ArrowLeft size={15}/> 易の余白へ戻る</Link>
    <div className="section-eyebrow">ANALOG WISDOM, READ BY AI</div>
    <h1>手書きの卦を、<br/><span>読み解く。</span></h1>
    <p className="handwriting-intro">紙に描いた六本の爻を撮影してください。線の向きと変爻をAIが読み取り、卦を照合します。</p>
    <div className="handwriting-guide"><b>撮影のコツ</b><ul><li>横線を6本、上下に少し間隔を空けて描く</li><li>一番下が初爻。下から上へ数えます</li><li>陽は一本線、陰は中央が切れた二本線</li><li>変爻は陽に○、陰に×を添える</li></ul></div>
    <label className="photo-picker"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" onChange={chooseFile}/><Camera size={18}/><span>{file ? "別の写真を選ぶ" : "卦の写真を撮る / 選ぶ"}</span></label>
    {preview && <img className="handwriting-preview" src={preview} alt="選択した手書き卦"/>}
    <label className="handwriting-question" htmlFor="handwriting-question">読み解きたい問い <span>任意</span></label>
    <textarea id="handwriting-question" value={question} maxLength={500} onChange={(event)=>setQuestion(event.target.value)} placeholder="例：新しい仕事を始めるとき、気をつけることは？"/>
    <button className="handwriting-submit" disabled={!file || busy} onClick={recognize}>{busy ? <><LoaderCircle className="spin-icon" size={16}/> 線を読み取っています…</> : <><Sparkles size={16}/> 手書きの卦を認識する</>}</button>
    {error && <div className="handwriting-error" role="alert">{error}</div>}
    {result && <section className="handwriting-result" aria-live="polite"><div className="section-eyebrow"><Check size={13}/> RECOGNIZED · 確信度 {Math.round(result.confidence*100)}%</div><h2>第{result.hexagram.number}卦　{result.hexagram.name}</h2><p>{result.hexagram.reading}</p><div className="vision-lines">{[...result.lines].reverse().map((line,index)=><span key={index} className={line===7||line===9?"vision-yang":"vision-yin"}>{["上","五","四","三","二","初"][index]} {line===7||line===9?"━━━":"━ ━"}{line===6||line===9?"　變":""}</span>)}</div><p>変爻：{result.changingLines.length?result.changingLines.map((line)=>`第${line}爻`).join("・"):"なし"}</p>{result.notes&&<small>{result.notes}</small>}{result.interpretation&&<div className="vision-interpretation"><div className="section-eyebrow">THE READING</div><h3>いま、ここにあるもの</h3><p>{result.interpretation.overview}</p><p>{result.interpretation.structure}</p><h3>変化の兆し</h3><p>{result.interpretation.changingLines}</p><p>{result.interpretation.relating}</p><h3>今日に持ち帰ること</h3><p>{result.interpretation.advice}</p><ol>{result.interpretation.actions?.map((action,index)=><li key={index}>{action}</li>)}</ol></div>}<Link href="/">占いページへ <ArrowLeft size={14}/></Link></section>}
    <p className="handwriting-disclaimer">画像は選択したOpenAI・Gemini・Anthropicのいずれかへ送信され、アプリには保存しません。いずれかのAPIキーが必要です。API利用料が別途発生します。認識結果は必ずご自身で確認してください。</p>
    <ApiKeySettings/>
  </main>;
}
