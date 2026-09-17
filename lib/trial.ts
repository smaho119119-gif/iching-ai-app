import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type TrialAccess = {
  configured: boolean;
  signedIn: boolean;
  active: boolean;
  endsAt: string | null;
};

export async function getTrialAccess(): Promise<TrialAccess> {
  if (!isSupabaseConfigured()) return { configured: false, signedIn: false, active: false, endsAt: null };
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { configured: false, signedIn: false, active: false, endsAt: null };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { configured: true, signedIn: false, active: false, endsAt: null };
  const { data } = await supabase
    .from("iching_ai_app_profiles")
    .select("trial_ends_at")
    .eq("id", user.id)
    .maybeSingle();
  const endsAt = data?.trial_ends_at ?? null;
  return { configured: true, signedIn: true, active: Boolean(endsAt && new Date(endsAt).getTime() > Date.now()), endsAt };
}
