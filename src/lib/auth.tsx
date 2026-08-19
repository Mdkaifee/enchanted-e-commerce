import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getFreshSupabaseSession } from "@/lib/supabase-session";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  adminLoading: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(false);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);
  const adminRoleCacheRef = useRef(new Map<string, boolean>());

  useEffect(() => {
    let active = true;

    supabase.auth.startAutoRefresh();

    getFreshSupabaseSession().then((nextSession) => {
      if (!active) return;
      const userId = nextSession?.user.id ?? null;
      currentUserIdRef.current = userId;
      setIsAdmin(userId ? (adminRoleCacheRef.current.get(userId) ?? null) : false);
      setSession(nextSession);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      const userId = next?.user.id ?? null;
      const previousUserId = currentUserIdRef.current;
      currentUserIdRef.current = userId;
      setIsAdmin((current) => {
        if (!userId) return false;
        const cachedRole = adminRoleCacheRef.current.get(userId);
        if (cachedRole !== undefined) return cachedRole;
        return previousUserId === userId ? current : null;
      });
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
        const admin = Boolean(data);
        adminRoleCacheRef.current.set(userId, admin);
        if (active) setIsAdmin(admin);
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
      adminLoading: Boolean(session?.user) && isAdmin === null,
      loading,
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
  const { user, isAdmin, loading, adminLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || adminLoading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/admin" } });
    } else if (!isAdmin) {
      navigate({ to: "/" });
    }
  }, [loading, adminLoading, user, isAdmin, navigate]);

  return { ready: !loading && !adminLoading && Boolean(user) && isAdmin };
}
