import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/cart";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/lookbook", label: "Lookbook" },
  { to: "/about", label: "Atelier" },
];

export function SiteHeader() {
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-500 ${
        scrolled
          ? "border-border bg-background/85 py-3 backdrop-blur-xl"
          : "border-transparent bg-transparent py-6"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6">
        <Link
          to="/"
          className="font-display text-xl font-medium tracking-[0.28em] uppercase press"
        >
          Atelier
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="underline-sweep text-sm tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="press relative inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs tracking-[0.18em] uppercase hover:bg-secondary"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Bag</span>
            {count > 0 && (
              <span
                key={count}
                className="pop-in absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
              >
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="press grid size-9 place-items-center rounded-full border border-border md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="rise-in mx-6 mt-4 flex flex-col gap-1 rounded-md border border-border bg-card p-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-sm px-3 py-3 text-sm tracking-wide transition-colors hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
