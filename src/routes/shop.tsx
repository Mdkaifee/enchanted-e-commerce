import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { CATEGORIES, productsQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { useScrollReveal } from "@/hooks/use-reveal";

type ShopSearch = { category?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop all pieces — Atelier Sand" },
      {
        name: "description",
        content:
          "Browse the full Atelier Sand collection: linen shirting, merino knitwear, tailored trousers, silk dresses, outerwear and accessories.",
      },
      { property: "og:title", content: "Shop all pieces — Atelier Sand" },
      {
        property: "og:description",
        content: "The full collection of slow-made clothing in natural fibres.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");

  const visible = useMemo(() => {
    const list = category ? products.filter((p) => p.category === category) : products;
    const sorted = [...list];
    if (sort === "low") sorted.sort((a, b) => a.price - b.price);
    if (sort === "high") sorted.sort((a, b) => b.price - a.price);
    if (sort === "featured") sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    return sorted;
  }, [products, category, sort]);

  useScrollReveal([visible.map((p) => p.id).join(","), sort]);

  return (
    <div className="mx-auto max-w-7xl px-6 pt-14 pb-24">
      <header className="rise-in">
        <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
          The collection
        </p>
        <h1 className="mt-4 font-display text-5xl font-light sm:text-6xl">
          {category ?? "All pieces"}
        </h1>
      </header>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-y border-border py-4">
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={!category}
            onClick={() => navigate({ search: {} })}
            label="All"
          />
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => navigate({ search: { category: c } })}
              label={c}
            />
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="border border-border bg-background px-4 py-2 text-xs tracking-[0.16em] uppercase outline-none focus:border-primary"
        >
          <option value="featured">Featured</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>

      {isLoading ? (
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}

      {!isLoading && visible.length === 0 && (
        <p className="mt-20 text-center text-sm text-muted-foreground">
          Nothing in this category yet.
        </p>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press border px-4 py-2 text-[11px] tracking-[0.18em] uppercase ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}
