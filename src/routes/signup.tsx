import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Field, PasswordField } from "@/components/form-field";

type SignupSearch = { redirect?: string | undefined; email?: string | undefined };

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): SignupSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
    email: typeof search["email"] === "string" ? search["email"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "Create an account — MD Attire" }],
  }),
  component: Signup,
});

function Signup() {
  const { redirect, email: prefillEmail } = Route.useSearch();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // The confirmation link always lands on /login, never signed in — the
    // click just confirms the address server-side; signing in still needs an
    // explicit password. Carry the original `redirect` along as a query
    // param so login can still send them on to where they meant to go.
    const confirmRedirectPath = redirect
      ? `/login?redirect=${encodeURIComponent(redirect)}`
      : "/login";
    // Always resolve against the canonical site URL, never the browser's
    // current origin — the confirmation email is often opened on a different
    // device than the one used to sign up, so "wherever you signed up from"
    // (e.g. localhost during local dev) is meaningless as a redirect target.
    const siteUrl =
      import.meta.env["VITE_SITE_URL"] ||
      (typeof window === "undefined" ? "https://md-attire.lovable.app" : window.location.origin);
    const emailRedirectTo = new URL(confirmRedirectPath, siteUrl).toString();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo },
    });
    setSubmitting(false);

    const goToSignIn = () => navigate({ to: "/login", search: { redirect, email } });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        toast.error("An account with this email already exists.", {
          action: { label: "Sign in", onClick: goToSignIn },
        });
        return;
      }
      toast.error(error.message);
      return;
    }

    // Supabase's documented signal for "this email is already a confirmed
    // account": with email confirmations on, signUp() doesn't error (to
    // avoid leaking which emails exist) but returns an empty identities
    // array instead of creating a new identity.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("An account with this email already exists.", {
        action: { label: "Sign in", onClick: goToSignIn },
      });
      return;
    }

    if (data.session) {
      toast.success("Account created — welcome to MD Attire");
      navigate({ to: redirect || "/account" });
      return;
    }
    toast.success("Check your inbox to confirm your email, then sign in.");
    goToSignIn();
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        Your account
      </p>
      <h1 className="rise-in mt-4 font-display text-4xl font-light">Create an account</h1>

      <form onSubmit={onSubmit} className="rise-in mt-10 space-y-4">
        <Field label="Full name" value={fullName} onChange={setFullName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="At least 6 characters"
        />
        <button
          type="submit"
          disabled={submitting}
          className="press w-full bg-foreground py-4 text-xs tracking-[0.24em] text-background uppercase disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" search={{ redirect, email }} className="underline-sweep text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  );
}
