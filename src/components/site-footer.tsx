import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border surface-sand">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr_1fr]">
        <div data-reveal className="reveal">
          <p className="font-display text-3xl tracking-[0.2em] uppercase">MD Attire</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Slow-made clothing in natural fibres. Cut in small runs, finished by hand, made to be
            worn for a decade rather than a season.
          </p>
        </div>

        <div data-reveal className="reveal">
          <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">Shop</p>
          <div className="mt-5 flex flex-col gap-3 text-sm">
            <Link to="/shop" className="underline-sweep w-fit">
              All pieces
            </Link>
            <Link to="/lookbook" className="underline-sweep w-fit">
              Lookbook
            </Link>
            <Link to="/cart" className="underline-sweep w-fit">
              Your bag
            </Link>
            <Link to="/wishlist" className="underline-sweep w-fit">
              Wishlist
            </Link>
          </div>
        </div>

        <div data-reveal className="reveal">
          <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">House</p>
          <div className="mt-5 flex flex-col gap-3 text-sm">
            <Link to="/about" className="underline-sweep w-fit">
              Our story
            </Link>
            <Link to="/care" className="underline-sweep w-fit">
              Care & repairs
            </Link>
            <Link to="/shipping" className="underline-sweep w-fit">
              Shipping & returns
            </Link>
            <Link to="/contact" className="underline-sweep w-fit">
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-border px-6 py-8 text-[11px] tracking-[0.2em] text-muted-foreground uppercase md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} MD Attire</span>
        <span>Made slowly, in natural fibres</span>
      </div>
    </footer>
  );
}
