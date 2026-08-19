import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, PackageCheck } from "lucide-react";
import type { ReactNode } from "react";

import { CATEGORY_IMAGES, formatPrice } from "@/lib/catalog";
import { useRequireAuth } from "@/lib/auth";
import { orderQuery } from "@/lib/orders";

type OrderLine = {
  slug: string;
  name: string;
  price: number;
  category?: string;
  size: string;
  color: string;
  image: string;
  qty: number;
};

const fulfillmentLabels: Record<string, string> = {
  processing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [{ title: "Order details — MD Attire" }],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { ready } = useRequireAuth();
  const { data: order, isLoading } = useQuery({
    ...orderQuery(id),
    enabled: ready,
  });

  if (!ready || isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center text-sm text-muted-foreground">
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl font-light">Order not found</h1>
        <Link
          to="/account"
          className="press mt-8 inline-flex bg-foreground px-8 py-4 text-xs tracking-[0.24em] text-background uppercase"
        >
          Back to account
        </Link>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? (order.items as OrderLine[]) : [];
  const isPaid = order.status === "paid";

  return (
    <div className="mx-auto max-w-5xl px-6 pt-14 pb-24">
      <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        Order #{order.id.slice(0, 8)}
      </p>
      <div className="rise-in mt-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-5xl font-light">Order details</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link to="/account" className="underline-sweep text-sm">
          Back to account
        </Link>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <StatusBlock
          icon={<Clock3 className="size-5" />}
          label="Payment"
          value={isPaid ? "Paid" : order.status}
        />
        <StatusBlock
          icon={<PackageCheck className="size-5" />}
          label="Fulfillment"
          value={fulfillmentLabels[order.fulfillment_status] ?? order.fulfillment_status}
        />
        <StatusBlock
          icon={<CheckCircle2 className="size-5" />}
          label="Total"
          value={formatPrice(order.total)}
        />
      </div>

      <section className="mt-12 grid gap-12 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <h2 className="font-display text-2xl font-light">Pieces</h2>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={`${item.slug}-${item.size}-${item.color}`} className="flex gap-5 py-5">
                <Link
                  to="/product/$slug"
                  params={{ slug: item.slug }}
                  className="w-20 shrink-0 overflow-hidden bg-secondary"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  ) : item.category && CATEGORY_IMAGES[item.category] ? (
                    <img
                      src={CATEGORY_IMAGES[item.category]}
                      alt={item.name}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="flex flex-1 items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display">{item.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.color} · Size {item.size} · Qty {item.qty}
                    </p>
                  </div>
                  <span className="text-sm">{formatPrice(item.price * item.qty)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit border border-border p-6">
          <h2 className="font-display text-xl">Delivery address</h2>
          <div className="mt-5 space-y-1 text-sm text-muted-foreground">
            <p className="text-foreground">{order.full_name}</p>
            <p>{order.email}</p>
            <p>{order.address}</p>
            <p>
              {order.city}, {order.postal_code}
            </p>
          </div>
          {!isPaid && (
            <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              This order is pending payment. Start a fresh checkout from your bag if the Razorpay
              window was closed.
            </p>
          )}
        </aside>
      </section>
    </div>
  );
}

function StatusBlock({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="border border-border p-5">
      <div className="flex items-center gap-3 text-primary">{icon}</div>
      <p className="mt-4 text-[10px] tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 capitalize">{value}</p>
    </div>
  );
}
