import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getFreshSupabaseSession } from "@/lib/supabase-session";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.startAutoRefresh();

    getFreshSupabaseSession().then((nextSession) => {
      if (!active) return;
      setIsAdmin(nextSession?.user ? null : false);
      setSession(nextSession);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setIsAdmin(next?.user ? null : false);
      setSession(next);
    });

    return () => {
      active = false;
      supabase.auth.stopAutoRefresh();
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    setIsAdmin(null);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsAdmin(Boolean(data));
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isAdmin: isAdmin === true,
      loading: loading || isAdmin === null,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isAdmin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Redirects to /login if signed out, once the session has finished loading. */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: router.state.location.pathname } });
    }
  }, [loading, user, navigate, router]);

  return { ready: !loading && Boolean(user) };
}

/** Redirects home if signed out or not an admin, once the session has finished loading. */
export function useRequireAdmin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/admin" } });
    } else if (!isAdmin) {
      navigate({ to: "/" });
    }
  }, [loading, user, isAdmin, navigate]);

  return { ready: !loading && Boolean(user) && isAdmin };
}
