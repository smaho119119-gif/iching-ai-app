"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, ShieldCheck, Trash2 } from "lucide-react";

export type AIProvider = "openai" | "gemini" | "anthropic";
const PROVIDERS: { id: AIProvider; name: string; prefix: string }[] = [
  { id: "openai", name: "OpenAI", prefix: "sk-…" },
  { id: "gemini", name: "Gemini", prefix: "AIza…" },
  { id: "anthropic", name: "Anthropic", prefix: "sk-ant-…" },
];
const PROVIDER_KEY = "iching_ai_provider";
const keyName = (provider: AIProvider) => `iching_ai_key:${provider}`;

export function getStoredAIConfig(): { provider: AIProvider; key: string } {
  if (typeof window === "undefined") return { provider: "openai", key: "" };
  try {
    const stored = window.sessionStorage.getItem(PROVIDER_KEY);
    const provider = PROVIDERS.some((item) => item.id === stored) ? stored as AIProvider : "openai";
    return { provider, key: window.sessionStorage.getItem(keyName(provider)) ?? "" };
  } catch { return { provider: "openai", key: "" }; }
}

export function getStoredAIHeaders(): Record<string, string> {
  const { provider, key } = getStoredAIConfig();
  return key ? { "x-ai-provider": provider, "x-ai-api-key": key } : {};
}

export function ApiKeySettings() {
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const config = getStoredAIConfig();
    setProvider(config.provider); setValue(config.key); setSaved(Boolean(config.key));
  }, []);

  const selectProvider = (next: AIProvider) => {
    setProvider(next); setMessage("");
    try { window.sessionStorage.setItem(PROVIDER_KEY, next); const key = window.sessionStorage.getItem(keyName(next)) ?? ""; setValue(key); setSaved(Boolean(key)); }
    catch { setValue(""); setSaved(false); }
  };
  const save = () => {
    const key = value.trim();
    const valid = provider === "openai" ? key.startsWith("sk-") : provider === "gemini" ? key.startsWith("AIza") : key.startsWith("sk-ant-");
    if (!valid || key.length > 512 || /[\r\n]/u.test(key)) { setMessage(`${PROVIDERS.find((item) => item.id === provider)?.name}のAPIキー形式を確認してください。`); return; }
    try { window.sessionStorage.setItem(PROVIDER_KEY, provider); window.sessionStorage.setItem(keyName(provider), key); setValue(key); setSaved(true); setMessage("このブラウザーのタブに保存しました。AI機能で使えます。"); }
    catch { setMessage("ブラウザーのセッション保存が使えません。設定を確認してください。"); }
  };
  const clear = () => { try { window.sessionStorage.removeItem(keyName(provider)); } catch { /* Storage can be unavailable. */ } setValue(""); setSaved(false); setMessage("選択中のプロバイダーのキーをこのタブから削除しました。"); };

  return <section className="api-key-section" id="api-key"><div className="section-eyebrow"><ShieldCheck size={13}/> YOUR KEY · YOUR CONTROL</div><h2>いつものAIで、<br/><span>易を読み解く。</span></h2><p className="api-key-intro">OpenAI・Gemini・Anthropicのいずれか1社を選び、そのAPIキーを登録してください。通常のAI解釈と手書き卦の画像認識に同じキーを使えます。キーなしでも基本の卦計算は動作します。</p>
    <div className="api-key-card"><label><KeyRound size={14}/> AI PROVIDER <span>{saved ? "REGISTERED IN THIS TAB" : "CHOOSE ONE"}</span></label><div className="provider-options" role="group" aria-label="AIプロバイダーを選択">{PROVIDERS.map((item)=><button type="button" key={item.id} className={provider===item.id?"selected":""} onClick={()=>selectProvider(item.id)}>{item.name}</button>)}</div><label htmlFor="ai-api-key">{PROVIDERS.find((item)=>item.id===provider)?.name} API KEY</label><div className="api-key-input-row"><input id="ai-api-key" type={visible?"text":"password"} autoComplete="off" spellCheck={false} placeholder={PROVIDERS.find((item)=>item.id===provider)?.prefix} value={value} onChange={(event)=>{setValue(event.target.value);setSaved(false);setMessage("");}} onKeyDown={(event)=>{if(event.key==="Enter"){event.preventDefault();save();}}}/><button type="button" className="api-key-visibility" onClick={()=>setVisible(!visible)} aria-label={visible?"APIキーを隠す":"APIキーを表示"}>{visible?<EyeOff size={15}/>:<Eye size={15}/>}</button></div><div className="api-key-controls"><span>{saved?<><Check size={12}/> このタブのセッションに保存中</>:"タブを閉じるとキーは消去されます"}</span><div>{saved&&<button type="button" className="api-key-clear" onClick={clear}><Trash2 size={12}/> 削除</button>}<button type="button" className="api-key-save" onClick={save}>このタブで使う</button></div></div></div>
    {message&&<p className="api-key-message" role="status">{message}</p>}
    <div className="api-key-safety"><ShieldCheck size={15}/><p><b>安全と料金について</b><br/>キーはこのタブのセッション保存のみで、アプリのデータベースやGitHubには保存せず、ログにも出しません。AIの利用時は選択した会社へサーバー経由で質問内容を送信します。手書き認識では画像も送信され、アプリには保存しません。API利用料は各社から別途請求されます。HTTPSの信頼できるサイトで使い、共有端末では使用後に削除してください。</p></div>
  </section>;
}
