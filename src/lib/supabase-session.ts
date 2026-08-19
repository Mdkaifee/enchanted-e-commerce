import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

const REFRESH_WINDOW_SECONDS = 120;

export async function getFreshSupabaseSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;

  const session = data.session;
  const expiresAt = session.expires_at ?? 0;
  const secondsUntilExpiry = expiresAt - Math.floor(Date.now() / 1000);

  if (secondsUntilExpiry > REFRESH_WINDOW_SECONDS) {
    return session;
  }

  const refreshed = await supabase.auth.refreshSession();
  return refreshed.data.session ?? null;
}
