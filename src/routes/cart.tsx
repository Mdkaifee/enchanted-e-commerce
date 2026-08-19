import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";

import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { createCheckoutOrder, verifyRazorpayPayment } from "@/lib/payments";
import { calculateShipping, getShippingConfig } from "@/lib/shipping";
import { getFreshSupabaseSession } from "@/lib/supabase-session";

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  handler: (response: RazorpayCheckoutResponse) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your bag — MD Attire" },
      {
        name: "description",
        content: "Review the pieces in your MD Attire bag and complete your order.",
      },
      { property: "og:title", content: "Your bag — MD Attire" },
      { property: "og:description", content: "Review your selection and check out." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, setQty, remove, clear } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const createCheckout = useServerFn(createCheckoutOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    address: "",
    city: "",
    postal_code: "",
  });

  const shippingConfig = getShippingConfig();
  const shipping = calculateShipping(subtotal, shippingConfig);
  const total = subtotal + shipping;

  useEffect(() => {
    const metadata = user?.user_metadata as { full_name?: string } | undefined;
    setForm((current) => ({
      ...current,
      full_name: current.full_name || metadata?.full_name || "",
      email: current.email || user?.email || "",
    }));
  }, [user?.email, user?.user_metadata]);

  async function loadRazorpayCheckout() {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/cart" } });
      return;
    }

    setPlacing(true);
    try {
      const session = await getFreshSupabaseSession();
      if (!session) {
        setPlacing(false);
        await signOut();
        navigate({ to: "/login", search: { redirect: "/cart" } });
        toast.error("Please sign in again to checkout.");
        return;
      }

      const checkout = await createCheckout({
        data: {
          customer: form,
          lines: lines.map(({ slug, size, color, qty }) => ({ slug, size, color, qty })),
        },
      });

      const loaded = await loadRazorpayCheckout();
      if (!loaded || !window.Razorpay) {
        throw new Error("Razorpay checkout could not load. Check your connection and try again.");
      }

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: "MD Attire",
        description: "Slow-made clothing order",
        order_id: checkout.razorpayOrderId,
        prefill: {
          name: form.full_name,
          email: form.email,
        },
        notes: {
          order_id: checkout.orderId,
        },
        theme: {
          color: "#8b7355",
        },
        handler: async (response) => {
          try {
            const paid = await verifyPayment({
              data: {
                orderId: checkout.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });
            clear();
            toast.success("Payment verified. Your order is confirmed.");
            navigate({ to: "/order/$id", params: { id: paid.orderId } });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payment verification failed.");
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            toast.message("Payment window closed. Your order is still pending.");
          },
        },
      });

      razorpay.open();
    } catch (error) {
      setPlacing(false);
      const message = error instanceof Error ? error.message : "Checkout could not start.";
      if (message.toLowerCase().includes("unauthorized")) {
        await signOut();
        toast.error("Your login expired. Please sign in again to checkout.");
        navigate({ to: "/login", search: { redirect: "/cart" } });
        return;
      }
      toast.error(message);
    }
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

          <div className="mt-6 grid gap-3 border-y border-border py-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Payment is verified server-side before the order is marked paid.
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Razorpay test mode is enabled for cards, UPI and wallets.
            </div>
            <div>
              Orders below {formatPrice(shippingConfig.freeShippingThreshold)} include a{" "}
              {formatPrice(shippingConfig.shippingFee)} shipping fee.
            </div>
          </div>

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
              {placing ? "Opening Razorpay..." : user ? "Pay with Razorpay" : "Sign in to checkout"}
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
