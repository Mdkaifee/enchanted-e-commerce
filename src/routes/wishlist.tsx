import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useRequireAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { productsQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { useScrollReveal } from "@/hooks/use-reveal";

function WishlistSkeleton() {
  return (
    <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse bg-secondary" />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [{ title: "Your wishlist — MD Attire" }],
  }),
  component: Wishlist,
});

function Wishlist() {
  const { ready } = useRequireAuth();
  const { productIds, isLoading: wishlistLoading } = useWishlist();
  const { data: products = [], isLoading: productsLoading } = useQuery({
    ...productsQuery,
    enabled: ready,
  });

  const saved = useMemo(() => products.filter((p) => productIds.has(p.id)), [products, productIds]);
  useScrollReveal([saved.length]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const isLoading = wishlistLoading || productsLoading;

  return (
    <div className="mx-auto max-w-7xl px-6 pt-14 pb-24">
      <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">Saved</p>
      <h1 className="rise-in mt-4 font-display text-5xl font-light">Your wishlist</h1>

      {isLoading ? (
        <WishlistSkeleton />
      ) : saved.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          <Link
            to="/shop"
            className="press mt-8 inline-flex bg-foreground px-8 py-4 text-xs tracking-[0.24em] text-background uppercase"
          >
            Explore the collection
          </Link>
        </div>
      ) : (
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
