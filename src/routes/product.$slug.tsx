import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Heart, Minus, Plus } from "lucide-react";

import { CATEGORY_IMAGES, formatPrice, productImage, productsQuery } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/product-card";
import { useScrollReveal } from "@/hooks/use-reveal";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { getShippingConfig } from "@/lib/shipping";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const title = `${params.slug.replace(/-/g, " ")} — MD Attire`;
    const description =
      "A slow-made piece from the MD Attire collection, cut in natural fibres and finished by hand.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const navigate = Route.useNavigate();
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const { add, lines, setQty } = useCart();
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();
  const shippingConfig = getShippingConfig();

  const product = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
  const related = useMemo(
    () => products.filter((p) => p.slug !== slug && p.category === product?.category).slice(0, 3),
    [products, slug, product],
  );

  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const selectedLine = useMemo(
    () =>
      product
        ? lines.find(
            (line) => line.slug === product.slug && line.size === size && line.color === color,
          )
        : undefined,
    [lines, product, size, color],
  );

  useEffect(() => {
    if (product) {
      setSize(product.sizes[0] ?? "One size");
      setColor(product.colors[0] ?? "Natural");
    }
  }, [product]);

  useScrollReveal([product?.id, related.length]);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2">
        <div className="aspect-[3/4] animate-pulse bg-secondary" />
        <div className="space-y-4">
          <div className="h-10 w-2/3 animate-pulse bg-secondary" />
          <div className="h-4 w-full animate-pulse bg-secondary" />
          <div className="h-4 w-5/6 animate-pulse bg-secondary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl font-light">Piece not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This piece may have sold out or been retired from the collection.
        </p>
        <Link
          to="/shop"
          className="press mt-8 inline-flex bg-foreground px-7 py-3 text-xs tracking-[0.2em] text-background uppercase"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const fallbackImage = CATEGORY_IMAGES[product.category] ?? productImage(product);
  const detailImage = productImage(product, color);

  return (
    <div className="mx-auto max-w-7xl px-6 pt-10 pb-24">
      <nav className="rise-in text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
        <Link to="/shop" className="underline-sweep hover:text-foreground">
          Shop
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{product.category}</span>
      </nav>

      <div className="mt-8 grid gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]">
        <div className="overflow-hidden bg-secondary">
          <div
            className="relative aspect-[4/5] min-h-[420px] overflow-hidden bg-cover bg-center sm:aspect-[3/4] lg:min-h-[620px]"
            style={{ backgroundImage: `url(${fallbackImage})` }}
          >
            <img
              src={detailImage}
              alt={product.name}
              width={1200}
              height={1600}
              onError={(event) => {
                if (event.currentTarget.src !== fallbackImage) {
                  event.currentTarget.src = fallbackImage;
                }
              }}
              className="absolute inset-0 size-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-background/75 to-transparent px-5 pt-5 pb-16 text-[10px] tracking-[0.22em] text-foreground uppercase">
              <span>{product.category}</span>
              <span>MD Attire</span>
            </div>
          </div>
        </div>

        <div className="rise-in lg:pt-6">
          {product.badge && (
            <span className="inline-block border border-border px-3 py-1 text-[10px] tracking-[0.24em] uppercase">
              {product.badge}
            </span>
          )}
          <h1 className="mt-5 font-display text-4xl font-light sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-lg">{formatPrice(product.price)}</p>
          <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-10">
            <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">Colour</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`press border px-4 py-2 text-[11px] tracking-[0.16em] uppercase ${
                    color === c
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`press min-w-12 border px-4 py-2 text-[11px] tracking-[0.16em] uppercase ${
                    size === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {selectedLine ? (
            <div className="mt-10 flex h-14 items-center border border-foreground bg-foreground text-background">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() =>
                  setQty(product.slug, size || "One size", color || "Natural", selectedLine.qty - 1)
                }
                className="press grid h-full w-16 place-items-center hover:bg-background/10"
              >
                <Minus className="size-4" />
              </button>
              <div className="flex flex-1 items-center justify-center gap-3 text-xs tracking-[0.22em] uppercase">
                <span>{selectedLine.qty}</span>
                <span>in bag</span>
              </div>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() =>
                  setQty(product.slug, size || "One size", color || "Natural", selectedLine.qty + 1)
                }
                className="press grid h-full w-16 place-items-center hover:bg-background/10"
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                add({
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  size: size || "One size",
                  color: color || "Natural",
                  image: detailImage,
                });
                toast.success(`${product.name} added to your bag`);
              }}
              className="press mt-10 w-full bg-foreground py-4 text-xs tracking-[0.24em] text-background uppercase transition-opacity hover:opacity-90"
            >
              Add to bag
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!user) {
                navigate({
                  to: "/login",
                  search: { redirect: `/product/${product.slug}` },
                });
                return;
              }
              toggle(product.id);
            }}
            className="press mt-3 inline-flex w-full items-center justify-center gap-2 border border-border py-4 text-xs tracking-[0.24em] uppercase hover:bg-secondary"
          >
            <Heart className={`size-4 ${isSaved(product.id) ? "fill-primary text-primary" : ""}`} />
            {isSaved(product.id) ? "Saved to wishlist" : "Save to wishlist"}
          </button>

          <dl className="mt-10 divide-y divide-border border-y border-border text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-muted-foreground">Category</dt>
              <dd>{product.category}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>Complimentary from {formatPrice(shippingConfig.freeShippingThreshold)}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-muted-foreground">Returns</dt>
              <dd>30 days, unworn</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-28">
          <h2 className="font-display text-2xl font-light">You may also like</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
