import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth, useRequireAuth } from "@/lib/auth";
import { myOrdersQuery } from "@/lib/orders";
import { formatPrice } from "@/lib/catalog";

const fulfillmentLabels: Record<string, string> = {
  processing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const paymentLabels: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
};

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "Your account — MD Attire" }],
  }),
  component: Account,
});

function Account() {
  const { ready } = useRequireAuth();
  const { user, isAdmin, signOut } = useAuth();
  const { data: orders = [], isLoading } = useQuery({
    ...myOrdersQuery(user?.id),
    enabled: ready,
  });

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const fullName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name;

  return (
    <div className="mx-auto max-w-4xl px-6 pt-14 pb-24">
      <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        Your account
      </p>
      <h1 className="rise-in mt-4 font-display text-5xl font-light">
        {fullName ? `Welcome, ${fullName}` : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/wishlist"
          className="press inline-flex border border-border px-5 py-2.5 text-xs tracking-[0.2em] uppercase hover:bg-secondary"
        >
          Your wishlist
        </Link>
        {isAdmin && (
          <Link
            to="/admin"
            className="press inline-flex border border-border px-5 py-2.5 text-xs tracking-[0.2em] uppercase hover:bg-secondary"
          >
            Admin dashboard
          </Link>
        )}
        <button
          type="button"
          onClick={async () => {
            await signOut();
            toast.success("Signed out");
          }}
          className="press inline-flex border border-border px-5 py-2.5 text-xs tracking-[0.2em] uppercase hover:bg-secondary"
        >
          Sign out
        </button>
      </div>

      <h2 className="mt-16 font-display text-2xl font-light">Order history</h2>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-secondary" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No orders yet.{" "}
          <Link to="/shop" className="underline-sweep text-foreground">
            Start shopping
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <Link to="/order/$id" params={{ id: order.id }} className="underline-sweep text-sm">
                  Order #{order.id.slice(0, 8)}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()} ·{" "}
                  {paymentLabels[order.status] ?? order.status}
                  {order.status === "paid" && (
                    <>
                      {" "}
                      · Delivery:{" "}
                      {fulfillmentLabels[order.fulfillment_status] ?? order.fulfillment_status}
                    </>
                  )}
                </p>
              </div>
              <span className="text-sm">{formatPrice(order.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
