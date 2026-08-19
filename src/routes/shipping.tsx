import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import { getShippingConfig } from "@/lib/shipping";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [{ title: "Shipping & returns — MD Attire" }],
  }),
  component: Shipping,
});

function Shipping() {
  const shippingConfig = getShippingConfig();
  const policies = [
    {
      icon: <Truck className="size-5" />,
      title: "Shipping",
      body: `Orders ship in 2-4 working days. Shipping is complimentary from ${formatPrice(
        shippingConfig.freeShippingThreshold,
      )}; orders below that include a ${formatPrice(shippingConfig.shippingFee)} shipping fee.`,
    },
    {
      icon: <RefreshCcw className="size-5" />,
      title: "Returns",
      body: "Return unworn pieces within 30 days. We inspect the garment before issuing the refund.",
    },
    {
      icon: <ShieldCheck className="size-5" />,
      title: "Payments",
      body: "Razorpay test checkout is enabled. Orders are confirmed only after server-side payment verification.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 pt-14 pb-24">
      <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        Shipping & returns
      </p>
      <h1 className="rise-in mt-4 max-w-3xl font-display text-5xl font-light sm:text-6xl">
        Clear order timelines from checkout to delivery
      </h1>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {policies.map((policy) => (
          <article key={policy.title} className="border border-border p-6">
            <div className="text-primary">{policy.icon}</div>
            <h2 className="mt-5 font-display text-xl">{policy.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{policy.body}</p>
          </article>
        ))}
      </div>

      <section className="mt-16 grid gap-10 border-y border-border py-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-light">Need order help?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Use your account order history for current payment and fulfillment status. Admins can
            update fulfillment from the management dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3 md:justify-end">
          <Link
            to="/account"
            className="press inline-flex border border-border px-6 py-3 text-xs tracking-[0.22em] uppercase hover:bg-secondary"
          >
            View account
          </Link>
          <Link
            to="/contact"
            className="press inline-flex bg-foreground px-6 py-3 text-xs tracking-[0.22em] text-background uppercase"
          >
            Contact support
          </Link>
        </div>
      </section>
    </div>
  );
}
