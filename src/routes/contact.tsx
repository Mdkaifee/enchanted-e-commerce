import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Field } from "@/components/form-field";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "Contact — MD Attire" }],
  }),
  component: Contact,
});

function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setSubmitting(false);
    if (error) {
      toast.error("Message could not be sent. Please try again.");
      return;
    }
    setForm({ name: "", email: "", message: "" });
    toast.success("Message sent. We will reply soon.");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pt-14 pb-24">
      <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        Support
      </p>
      <h1 className="rise-in mt-4 max-w-3xl font-display text-5xl font-light sm:text-6xl">
        Ask about sizing, orders, repairs or returns
      </h1>

      <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-4">
          <InfoBlock
            icon={<Mail className="size-5" />}
            title="Email"
            body="mdkaifeeeminence@gmail.com"
          />
          <InfoBlock
            icon={<MessageSquare className="size-5" />}
            title="Response time"
            body="We usually reply within one working day."
          />
        </aside>

        <form onSubmit={onSubmit} className="border border-border p-6">
          <h2 className="font-display text-2xl font-light">Send a message</h2>
          <div className="mt-6 grid gap-4">
            <Field
              label="Name"
              value={form.name}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(email) => setForm((current) => ({ ...current, email }))}
            />
            <label className="block">
              <span className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                Message
              </span>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                className="mt-1 w-full border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="press inline-flex items-center justify-center gap-2 bg-foreground px-6 py-4 text-xs tracking-[0.24em] text-background uppercase disabled:opacity-60"
            >
              <Send className="size-4" />
              {submitting ? "Sending..." : "Send message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="border border-border p-6">
      <div className="text-primary">{icon}</div>
      <h2 className="mt-5 font-display text-xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
