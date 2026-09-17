import Link from "next/link";
import { signIn, signUp } from "./actions";

export const metadata = { title: "ログイン・3日間お試し — 易の余白" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="auth-shell"><Link href="/" className="handwriting-back">← 易の余白に戻る</Link><section className="auth-card"><p className="section-eyebrow">START IN MINUTES · NO CARD</p><h1>3日間、<span>すぐ試せます。</span></h1><p>メールアドレスとパスワードだけで開始できます。試用中はAI解釈と手書き認識を利用できます。</p>{error && <p className="auth-error" role="alert">{error}</p>}<div className="auth-forms"><form action={signUp}><h2>はじめての方</h2><label>メールアドレス<input name="email" type="email" autoComplete="email" inputMode="email" required /></label><label>パスワード（8文字以上）<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label><button className="primary-cta" type="submit">3日間を始める</button></form><form action={signIn}><h2>すでに登録済みの方</h2><label>メールアドレス<input name="email" type="email" autoComplete="email" inputMode="email" required /></label><label>パスワード<input name="password" type="password" autoComplete="current-password" minLength={8} maxLength={72} required /></label><button className="secondary-action" type="submit">ログイン</button></form></div><small>カード登録不要。試用期限は登録時から72時間です。</small></section></main>;
}
