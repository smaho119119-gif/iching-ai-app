"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authenticateAccount, registerAccount } from "@/lib/app-accounts";
import { clearSessionCookie, createSessionToken, sessionCookie } from "@/lib/app-auth";

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
    const { email, password } = credentials(formData);
    const account = await registerAccount(email, password);
    const cookie = sessionCookie(createSessionToken({ id: account.id, email: account.email, trialEndsAt: account.trial_ends_at }));
    (await cookies()).set(cookie.name, cookie.value, cookie.options);
  } catch (error) { redirect(`/login?error=${message(error)}`); }
  redirect("/?welcome=trial");
}

export async function signIn(formData: FormData) {
  try {
    const { email, password } = credentials(formData);
    const account = await authenticateAccount(email, password);
    const cookie = sessionCookie(createSessionToken({ id: account.id, email: account.email, trialEndsAt: account.trial_ends_at }));
    (await cookies()).set(cookie.name, cookie.value, cookie.options);
  } catch (error) { redirect(`/login?error=${message(error)}`); }
  redirect("/");
}

export async function signOut() {
  const cookie = clearSessionCookie();
  (await cookies()).set(cookie.name, cookie.value, cookie.options);
  redirect("/");
}
