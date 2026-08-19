import { Link, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatPrice, productImage, type Product } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();
  const navigate = useNavigate();
  const saved = isSaved(product.id);

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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-foreground/90 py-4 text-center text-[11px] tracking-[0.24em] text-background uppercase transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0">
          View piece
        </div>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
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
