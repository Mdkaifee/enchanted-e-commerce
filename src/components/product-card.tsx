import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Heart } from "lucide-react";
import { CATEGORY_IMAGES, formatPrice, productImage, type Product } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();
  const navigate = useNavigate();
  const saved = isSaved(product.id);
  const fallbackImage = CATEGORY_IMAGES[product.category] ?? productImage(product);

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      data-reveal
      className="reveal lift-card group block"
      style={{ transitionDelay: `${(index % 3) * 90}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <img
          src={productImage(product)}
          alt={product.name}
          loading="lazy"
          width={900}
          height={1200}
          onError={(event) => {
            if (event.currentTarget.src !== fallbackImage) {
              event.currentTarget.src = fallbackImage;
            }
          }}
          className="size-full object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
        />
        {product.badge && (
          <span className="absolute top-4 left-4 bg-background/90 px-3 py-1 text-[10px] tracking-[0.2em] uppercase backdrop-blur">
            {product.badge}
          </span>
        )}
        <button
          type="button"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) {
              navigate({ to: "/login", search: { redirect: "/shop" } });
              return;
            }
            toggle(product.id);
          }}
          className="press absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-background/90 backdrop-blur"
        >
          <Heart
            className={`size-4 transition-colors ${saved ? "fill-primary text-primary" : "text-foreground"}`}
          />
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-foreground/45 via-foreground/12 to-transparent" />
          <div className="relative m-4 flex items-center justify-between border border-background/45 bg-background/88 px-4 py-3 text-foreground shadow-[0_18px_45px_rgba(44,37,31,0.18)] backdrop-blur-md">
            <span className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              View details
            </span>
            <ArrowUpRight className="size-4 text-primary transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4 pb-4">
        <div>
          <h3 className="font-display text-base">{product.name}</h3>
          <p className="mt-1 text-xs tracking-wide text-muted-foreground">
            {product.category} · {product.colors.join(" / ")}
          </p>
        </div>
        <span className="text-sm">{formatPrice(product.price)}</span>
      </div>
    </Link>
  );
}
