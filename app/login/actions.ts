"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function credentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/u.test(email)) throw new Error("メールアドレスを確認してください。");
  if (password.length < 8 || password.length > 72) throw new Error("パスワードは8〜72文字で入力してください。");
  return { email, password };
}

function message(error: unknown) {
  return encodeURIComponent(error instanceof Error ? error.message : "処理に失敗しました。もう一度お試しください。");
}

export async function signUp(formData: FormData) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) throw new Error("認証サービスを準備中です。しばらくしてからお試しください。");
    const { email, password } = credentials(formData);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error("登録確認が必要です。運営者はSupabaseで「Confirm email」を無効にしてください。");
  } catch (error) { redirect(`/login?error=${message(error)}`); }
  redirect("/?welcome=trial");
}

export async function signIn(formData: FormData) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) throw new Error("認証サービスを準備中です。しばらくしてからお試しください。");
    const { email, password } = credentials(formData);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  } catch (error) { redirect(`/login?error=${message(error)}`); }
  redirect("/");
}

export async function signOut() {
  const supabase = await getSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}
