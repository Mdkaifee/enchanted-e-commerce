import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { productImage, productsQuery } from "@/lib/catalog";
import { useScrollReveal } from "@/hooks/use-reveal";
import { Marquee } from "@/components/marquee";

export const Route = createFileRoute("/lookbook")({
  head: () => ({
    meta: [
      { title: "Lookbook — Atelier Sand" },
      {
        name: "description",
        content:
          "An editorial view of the Atelier Sand season: linen, merino and silk photographed in natural light.",
      },
      { property: "og:title", content: "Lookbook — Atelier Sand" },
      {
        property: "og:description",
        content: "An editorial view of the season in natural light.",
      },
    ],
  }),
  component: Lookbook,
});

function Lookbook() {
  const { data: products = [], isLoading } = useQuery(productsQuery);
  useScrollReveal([products.length]);

  return (
    <div className="pb-24">
      <header className="mx-auto max-w-7xl px-6 pt-16">
        <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
          Season one
        </p>
        <h1 className="rise-in mt-4 max-w-3xl font-display text-5xl leading-[1.05] font-light sm:text-7xl">
          Light, linen and the long afternoon
        </h1>
        <p className="rise-in mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Photographed over two days in an empty stone house. No stylists, no retouching — just the
          cloth as it falls.
        </p>
      </header>

      <div className="mt-16">
        <Marquee items={["Natural fibres", "Small runs", "Made slowly", "Worn daily"]} />
      </div>

      <div className="mx-auto mt-20 max-w-7xl space-y-24 px-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[16/9] animate-pulse bg-secondary" />
            ))
          : products.slice(0, 8).map((product, i) => (
              <figure
                key={product.id}
                data-reveal
                className={`reveal grid items-center gap-10 md:grid-cols-2 ${
                  i % 2 === 1 ? "md:[&>figcaption]:order-first" : ""
                }`}
              >
                <div className="overflow-hidden bg-secondary">
                  <img
                    src={productImage(product)}
                    alt={`${product.name} editorial look`}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.06]"
                  />
                </div>
                <figcaption>
                  <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
                    Look {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-4 font-display text-3xl font-light sm:text-4xl">
                    {product.name}
                  </h2>
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="underline-sweep mt-6 inline-block text-xs tracking-[0.24em] uppercase"
                  >
                    Shop the piece
                  </Link>
                </figcaption>
              </figure>
            ))}
      </div>
    </div>
  );
}
