import { getAppSession } from "@/lib/app-auth";

export type TrialAccess = {
  configured: boolean;
  signedIn: boolean;
  active: boolean;
  endsAt: string | null;
};

export async function getTrialAccess(): Promise<TrialAccess> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !process.env.ICHING_AI_APP_AUTH_SECRET) return { configured: false, signedIn: false, active: false, endsAt: null };
  const session = await getAppSession();
  if (!session) return { configured: true, signedIn: false, active: false, endsAt: null };
  return { configured: true, signedIn: true, active: new Date(session.trialEndsAt).getTime() > Date.now(), endsAt: session.trialEndsAt };
}
