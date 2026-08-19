import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Field, PasswordField } from "@/components/form-field";
import { ensureAdminAccount } from "@/lib/admin-seed";
import { useServerFn } from "@tanstack/react-start";

type LoginSearch = { redirect?: string | undefined };

function authErrorMessage(error: Error) {
  if (error.message.toLowerCase().includes("database error querying schema")) {
    return "Supabase Auth could not sign in this account. Repair the admin Auth user, then try again.";
  }

  return error.message;
}

function canAttemptAdminRepair(error: Error) {
  const message = error.message.toLowerCase();
  return (
    message.includes("invalid login credentials") ||
    message.includes("database error querying schema")
  );
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "Sign in — MD Attire" }],
  }),
  component: Login,
});

function Login() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const seedAdmin = useServerFn(ensureAdminAccount);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSeedError, setAdminSeedError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAdminSeedError("");
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    const isAdminLogin = email.trim().toLowerCase() === "test@yopmail.com";

    if (error && isAdminLogin && canAttemptAdminRepair(error)) {
      const seedResult = await seedAdmin({ data: { email, password } });
      if (seedResult.ok) {
        ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
      } else {
        setSubmitting(false);
        setAdminSeedError(seedResult.message);
        toast.error(seedResult.message);
        return;
      }
    }

    setSubmitting(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    await queryClient.invalidateQueries({ queryKey: ["orders"] });

    if (!redirect && data.user) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (role) {
        toast.success("Welcome back, admin");
        navigate({ to: "/admin" });
        return;
      }
    }

    toast.success("Welcome back");
    navigate({ to: redirect || "/account" });
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        Your account
      </p>
      <h1 className="rise-in mt-4 font-display text-4xl font-light">Sign in</h1>

      <form onSubmit={onSubmit} className="rise-in mt-10 space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <PasswordField label="Password" value={password} onChange={setPassword} />
        {adminSeedError && (
          <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-destructive">
            {adminSeedError}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="press w-full bg-foreground py-4 text-xs tracking-[0.24em] text-background uppercase disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/signup" search={{ redirect }} className="underline-sweep text-foreground">
          Create an account
        </Link>
      </p>
    </div>
  );
}
