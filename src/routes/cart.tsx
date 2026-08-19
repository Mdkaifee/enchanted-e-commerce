import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";

import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your bag — Atelier Sand" },
      {
        name: "description",
        content: "Review the pieces in your Atelier Sand bag and complete your order.",
      },
      { property: "og:title", content: "Your bag — Atelier Sand" },
      { property: "og:description", content: "Review your selection and check out." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, setQty, remove, clear } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    address: "",
    city: "",
    postal_code: "",
  });

  const shipping = subtotal > 200 || subtotal === 0 ? 0 : 18;
  const total = subtotal + shipping;

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setPlacing(true);
    const { error } = await supabase.from("orders").insert({
      ...form,
      items: lines,
      total,
    });
    setPlacing(false);
    if (error) {
      toast.error("We couldn't place your order. Please try again.");
      return;
    }
    clear();
    toast.success("Order placed — a confirmation is on its way.");
    navigate({ to: "/shop" });
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="rise-in font-display text-5xl font-light">Your bag is empty</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Nothing here yet — the collection is waiting.
        </p>
        <Link
          to="/shop"
          className="press mt-10 inline-flex bg-foreground px-8 py-4 text-xs tracking-[0.24em] text-background uppercase"
        >
          Explore the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pt-14 pb-24">
      <h1 className="rise-in font-display text-5xl font-light sm:text-6xl">Your bag</h1>

      <div className="mt-14 grid gap-14 lg:grid-cols-[1.4fr_1fr]">
        <ul className="divide-y divide-border border-y border-border">
          {lines.map((line, i) => (
            <li
              key={`${line.slug}-${line.size}-${line.color}`}
              className="rise-in flex gap-5 py-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <Link
                to="/product/$slug"
                params={{ slug: line.slug }}
                className="w-24 shrink-0 overflow-hidden bg-secondary sm:w-28"
              >
                <img
                  src={line.image}
                  alt={line.name}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg">{line.name}</h2>
                    <p className="mt-1 text-xs tracking-wide text-muted-foreground">
                      {line.color} · Size {line.size}
                    </p>
                  </div>
                  <span className="text-sm">{formatPrice(line.price * line.qty)}</span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center border border-border">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQty(line.slug, line.size, line.color, line.qty - 1)}
                      className="press grid size-9 place-items-center hover:bg-secondary"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{line.qty}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQty(line.slug, line.size, line.color, line.qty + 1)}
                      className="press grid size-9 place-items-center hover:bg-secondary"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.slug, line.size, line.color)}
                    className="press inline-flex items-center gap-2 text-[11px] tracking-[0.18em] text-muted-foreground uppercase hover:text-foreground"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="rise-in h-fit border border-border p-7 lg:sticky lg:top-28">
          <h2 className="font-display text-xl">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "Complimentary" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          <form onSubmit={placeOrder} className="mt-8 space-y-3">
            <Field
              label="Full name"
              value={form.full_name}
              onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
            <Field
              label="Address"
              value={form.address}
              onChange={(v) => setForm((f) => ({ ...f, address: v }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="City"
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              />
              <Field
                label="Postal code"
                value={form.postal_code}
                onChange={(v) => setForm((f) => ({ ...f, postal_code: v }))}
              />
            </div>
            <button
              type="submit"
              disabled={placing}
              className="press w-full bg-foreground py-4 text-xs tracking-[0.24em] text-background uppercase disabled:opacity-60"
            >
              {placing ? "Placing order…" : "Place order"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}
