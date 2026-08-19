import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Field, PasswordField } from "@/components/form-field";

type SignupSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): SignupSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "Create an account — MD Attire" }],
  }),
  component: Signup,
});

function Signup() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created — welcome to MD Attire");
      navigate({ to: redirect || "/account" });
      return;
    }
    toast.success("Check your inbox to confirm your email, then sign in.");
    navigate({ to: "/login", search: { redirect } });
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
        <Link to="/login" search={{ redirect }} className="underline-sweep text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  );
}
