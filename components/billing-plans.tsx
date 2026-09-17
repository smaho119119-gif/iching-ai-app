"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Crown, LoaderCircle, Sparkles } from "lucide-react";

type BillingStatus = { plan: "free"|"standard"|"premium"|"corporate"; plansConfigured: { standard:boolean; premium:boolean; corporate:boolean }; sessionConfigured:boolean };

export function BillingPlans() {
  const [status,setStatus]=useState<BillingStatus|null>(null);
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");

  useEffect(()=>{
    void fetch("/api/billing/status").then((response)=>response.json()).then((value)=>setStatus(value as BillingStatus)).catch(()=>setStatus(null));
    const url=new URL(window.location.href);
    const checkout=url.searchParams.get("checkout");
    const sessionId=url.searchParams.get("session_id");
    if(checkout==="success"&&sessionId){
      window.history.replaceState({},"",url.pathname);
      setBusy("activate");
      void fetch("/api/billing/activate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId})}).then(async(response)=>{const data=await response.json();if(!response.ok)throw new Error(data.error);setMessage("ご契約を確認しました。プレミアム機能をご利用いただけます。");return fetch("/api/billing/status");}).then((response)=>response?.json()).then((value)=>value&&setStatus(value as BillingStatus)).catch((error)=>setMessage(error instanceof Error?error.message:"購入状態を確認できませんでした。")).finally(()=>setBusy(""));
    }else if(checkout==="cancelled"){window.history.replaceState({},"",url.pathname);setMessage("決済はキャンセルされました。料金は発生していません。");}
  },[]);

  const checkout=async(plan:"standard"|"premium"|"corporate")=>{
    setBusy(plan);setMessage("");
    try{const response=await fetch("/api/billing/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan})});const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign(data.url);}catch(error){setMessage(error instanceof Error?error.message:"決済ページを開けませんでした。");setBusy("");}
  };
  const portal=async()=>{setBusy("portal");try{const response=await fetch("/api/billing/portal",{method:"POST"});const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign(data.url);}catch(error){setMessage(error instanceof Error?error.message:"契約管理を開けませんでした。");setBusy("");}};

  const plans=[
    {id:"standard" as const,name:"スタンダード",price:"980",description:"易を日々の思考習慣に。",features:["日々のコイン占い","AIによる質問別解釈","変爻と之卦の読み解き"]},
    {id:"premium" as const,name:"プレミアム",price:"2,980",description:"古代の作法とAIを、さらに深く。",features:["スタンダードの全機能","手書き卦のVision認識","ビジネス向けの問いに対応"]},
  ];

  return <section className="billing-section" id="plans"><div className="section-eyebrow"><span className="eyebrow-dot"/> SUBSCRIPTION · OPTIONAL</div><h2>問いを深める、<br/><span>ふたつのプラン。</span></h2><p className="billing-intro">基本の易経占いは無料です。AI解釈や手書き認識を使いたい方は、任意でご利用いただけます。</p>
    {status?.plan!=="free"&&<button className="portal-button" disabled={busy!==""} onClick={portal}>契約内容・お支払い方法を管理 <ArrowRight size={14}/></button>}
    <div className="plan-grid">{plans.map((plan)=><article className={`plan-card ${plan.id==="premium"?"plan-featured":""}`} key={plan.id}>{plan.id==="premium"&&<span className="plan-ribbon"><Crown size={11}/> RECOMMENDED</span>}<span className="plan-label">{plan.name.toUpperCase()}</span><h3>{plan.name}</h3><p>{plan.description}</p><div className="plan-price">¥{plan.price}<span> / 月</span></div><ul>{plan.features.map((feature)=><li key={feature}><Check size={13}/>{feature}</li>)}</ul>{status?.plan===plan.id?<button className="plan-button current-plan" disabled><Check size={14}/> ご利用中</button>:<button className="plan-button" onClick={()=>checkout(plan.id)} disabled={busy!==""}>{busy===plan.id?<LoaderCircle className="spin-icon" size={15}/>:<Sparkles size={14}/>} このプランを選ぶ</button>}</article>)}</div>
    <div className="corporate-note"><div><span className="plan-label">FOR TEAMS</span><b>法人プラン　¥9,800〜 / 月</b><p>チーム利用や朝礼配信など、個別のご要望に合わせたプランです。</p></div><button onClick={()=>setMessage("法人向けのStripe Price IDが設定されていません。ご利用には個別のお見積もりが必要です。")}><span>内容を見る</span><ArrowRight size={14}/></button></div>
    {message&&<p className="billing-message" role="status">{message}</p>}
    <p className="billing-note">{status?.plansConfigured.standard||status?.plansConfigured.premium?"Stripe決済を利用します。サブスクリプションはStripeの契約管理ページから解約できます。":"決済は現在未設定です。Stripeのテスト環境を設定すると、実際のCheckoutフローを確認できます。"} 料金は税込・月額です。プランはいつでも変更・解約できます。{status&&!status.sessionConfigured&&" · BILLING_SESSION_SECRET未設定"}</p>
  </section>;
}
