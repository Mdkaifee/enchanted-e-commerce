import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import heroImage from "@/assets/hero.jpg";
import storyImage from "@/assets/story.jpg";
import { CATEGORIES, CATEGORY_IMAGES, productsQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { Marquee } from "@/components/marquee";
import { useParallax, useScrollReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier Sand — Slow-made clothing in natural fibres" },
      {
        name: "description",
        content:
          "Linen shirting, merino knitwear, tailored trousers and silk dresses, cut in small runs and finished by hand.",
      },
      { property: "og:title", content: "Atelier Sand — Slow-made clothing" },
      {
        property: "og:description",
        content:
          "Linen shirting, merino knitwear and tailored trousers, cut in small runs and finished by hand.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products = [] } = useQuery(productsQuery);
  const [scrollY, setScrollY] = useState(0);
  useParallax(setScrollY);
  useScrollReveal([products.length]);

  const featured = products.filter((p) => p.featured);
  const [lead, ...rest] = featured;

  return (
    <div>
      {/* Hero — editorial split */}
      <section className="relative overflow-hidden surface-sand">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p
              className="drift-x text-[11px] tracking-[0.34em] text-muted-foreground uppercase"
              style={{ animationDelay: "80ms" }}
            >
              Volume 04 — Natural fibres
            </p>
            <h1
              className="rise-in mt-6 font-display text-5xl leading-[0.95] font-light sm:text-7xl lg:text-8xl"
              style={{ animationDelay: "160ms" }}
            >
              Clothes that
              <br />
              <span className="italic text-primary">soften</span> with time
            </h1>
            <p
              className="rise-in mt-8 max-w-md text-base leading-relaxed text-muted-foreground"
              style={{ animationDelay: "280ms" }}
            >
              Linen, merino and silk cut in small runs. Nothing shouted, nothing
              disposable — just quiet clothing you'll keep reaching for.
            </p>
            <div
              className="rise-in mt-10 flex flex-wrap gap-4"
              style={{ animationDelay: "380ms" }}
            >
              <Link
                to="/shop"
                className="press group inline-flex items-center gap-3 bg-foreground px-8 py-4 text-[11px] tracking-[0.24em] text-background uppercase"
              >
                Shop the collection
                <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1.5" />
              </Link>
              <Link
                to="/lookbook"
                className="press inline-flex items-center border border-foreground px-8 py-4 text-[11px] tracking-[0.24em] uppercase hover:bg-foreground hover:text-background"
              >
                Lookbook
              </Link>
            </div>
          </div>

          <div className="curtain-up relative">
            <img
              src={heroImage}
              alt="Model wearing a sand linen overshirt"
              width={1408}
              height={1760}
              className="aspect-[4/5] w-full object-cover"
              style={{ transform: `translateY(${Math.min(scrollY * 0.06, 60)}px)` }}
            />
            <div className="float-slow absolute -bottom-6 -left-6 hidden bg-background px-6 py-5 shadow-[var(--shadow-soft)] sm:block">
              <p className="font-display text-3xl">12</p>
              <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                pieces this season
              </p>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "Small-run production",
          "Natural fibres only",
          "Free shipping over $200",
          "Repairs for life",
        ]}
      />

      {/* Magazine feature */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div data-reveal className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
              Featured
            </p>
            <h2 className="mt-3 font-display text-4xl font-light sm:text-5xl">
              The season in six pieces
            </h2>
          </div>
          <Link to="/shop" className="underline-sweep text-sm">
            View everything
          </Link>
        </div>

        {lead && (
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
            <Link
              to="/product/$slug"
              params={{ slug: lead.slug }}
              data-reveal
              className="reveal-mask group relative block overflow-hidden bg-secondary"
            >
              <img
                src={CATEGORY_IMAGES[lead.category] ?? heroImage}
                alt={lead.name}
                loading="lazy"
                width={900}
                height={1200}
                className="aspect-[4/5] w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 lg:aspect-[4/4.4]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent p-8">
                <p className="text-[10px] tracking-[0.26em] text-background/80 uppercase">
                  Piece of the season
                </p>
                <h3 className="mt-2 font-display text-3xl text-background">{lead.name}</h3>
                <p className="mt-2 max-w-md text-sm text-background/80">
                  {lead.description}
                </p>
              </div>
            </Link>

            <div className="grid gap-10 sm:grid-cols-2">
              {rest.slice(0, 4).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="surface-sand border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 data-reveal className="reveal font-display text-4xl font-light">
            Browse by category
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category, i) => (
              <Link
                key={category}
                to="/shop"
                search={{ category }}
                data-reveal
                className="reveal group relative block aspect-[4/3] overflow-hidden"
                style={{ transitionDelay: `${(i % 3) * 90}ms` }}
              >
                <img
                  src={CATEGORY_IMAGES[category]}
                  alt={category}
                  loading="lazy"
                  width={900}
                  height={1200}
                  className="size-full object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-foreground/15 transition-colors duration-500 group-hover:bg-foreground/40" />
                <span className="absolute bottom-6 left-6 font-display text-2xl text-background transition-transform duration-500 group-hover:translate-x-2">
                  {category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
        <div data-reveal className="reveal-mask overflow-hidden">
          <img
            src={storyImage}
            alt="Folded natural linen fabric"
            loading="lazy"
            width={1400}
            height={900}
            className="w-full object-cover"
          />
        </div>
        <div data-reveal className="reveal">
          <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
            The atelier
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight font-light sm:text-5xl">
            Cut in small runs, finished by hand
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Every garment starts as a bolt of undyed cloth chosen with the mill. We cut
            forty to eighty pieces at a time, press each seam by hand, and stop when the
            cloth runs out.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {[
              ["04", "Fibres used"],
              ["80", "Pieces per run"],
              ["10y", "Repair promise"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-3xl">{value}</p>
                <p className="mt-1 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <Link to="/about" className="underline-sweep mt-10 inline-block text-sm">
            Read our story
          </Link>
        </div>
      </section>
    </div>
  );
}
