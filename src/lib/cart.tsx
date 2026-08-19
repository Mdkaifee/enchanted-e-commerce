import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type CartLine = {
  slug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (slug: string, size: string, color: string) => void;
  setQty: (slug: string, size: string, color: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "md-attire-cart";
const STORAGE_OWNER_KEY = "md-attire-cart-owner";

const keyOf = (l: { slug: string; size: string; color: string }) =>
  `${l.slug}|${l.size}|${l.color}`;

function mergeCartLines(primary: CartLine[], secondary: CartLine[]) {
  const byKey = new Map<string, CartLine>();

  for (const line of primary) {
    byKey.set(keyOf(line), line);
  }

  for (const line of secondary) {
    const key = keyOf(line);
    const existing = byKey.get(key);
    byKey.set(key, existing ? { ...existing, qty: existing.qty + line.qty } : line);
  }

  return Array.from(byKey.values());
}

function cartLineFromRow(row: {
  slug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  qty: number;
}): CartLine {
  return {
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    size: row.size,
    color: row.color,
    image: row.image,
    qty: row.qty,
  };
}

async function replaceRemoteCart(userId: string, nextLines: CartLine[]) {
  const { error: deleteError } = await supabase.from("cart_items").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (nextLines.length === 0) return;

  const { error: insertError } = await supabase.from("cart_items").insert(
    nextLines.map((line) => ({
      user_id: userId,
      slug: line.slug,
      name: line.name,
      price: line.price,
      size: line.size,
      color: line.color,
      image: line.image,
      qty: line.qty,
      updated_at: new Date().toISOString(),
    })),
  );

  if (insertError) throw insertError;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [remoteHydrating, setRemoteHydrating] = useState(false);
  const linesRef = useRef<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore corrupt storage */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    if (!hydrated || loading) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
      localStorage.setItem(STORAGE_OWNER_KEY, user?.id ?? "guest");
    } catch {
      /* ignore quota errors */
    }
  }, [hydrated, lines, loading, user?.id]);

  useEffect(() => {
    if (!hydrated || loading) return;

    const userId = user?.id;
    if (!userId) {
      setRemoteUserId(null);
      setRemoteHydrating(false);
      return;
    }

    let active = true;

    async function syncInitialRemoteCart() {
      setRemoteHydrating(true);
      try {
        const localOwner = localStorage.getItem(STORAGE_OWNER_KEY);
        const localLines = linesRef.current;

        const { data, error } = await supabase
          .from("cart_items")
          .select("slug, name, price, size, color, image, qty")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (!active) return;

        const remoteLines = (data ?? []).map(cartLineFromRow);
        const nextLines =
          localOwner === userId
            ? remoteLines.length > 0
              ? remoteLines
              : localLines
            : mergeCartLines(remoteLines, localLines);

        setLines(nextLines);
        setRemoteUserId(userId);
        await replaceRemoteCart(userId, nextLines);
      } catch (error) {
        console.error("[Cart] Could not sync saved cart", error);
        if (active) setRemoteUserId(userId);
      } finally {
        if (active) setRemoteHydrating(false);
      }
    }

    syncInitialRemoteCart();

    return () => {
      active = false;
    };
  }, [hydrated, loading, user?.id]);

  useEffect(() => {
    if (!hydrated || loading || !user?.id || remoteHydrating || remoteUserId !== user.id) return;

    const timeout = window.setTimeout(() => {
      replaceRemoteCart(user.id, linesRef.current).catch((error) => {
        console.error("[Cart] Could not save cart", error);
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [hydrated, lines, loading, remoteHydrating, remoteUserId, user?.id]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => keyOf(l) === keyOf(line));
      if (existing) {
        return prev.map((l) => (keyOf(l) === keyOf(line) ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { ...line, qty }];
    });
  }, []);

  const remove = useCallback((slug: string, size: string, color: string) => {
    setLines((prev) => prev.filter((l) => keyOf(l) !== keyOf({ slug, size, color })));
  }, []);

  const setQty = useCallback((slug: string, size: string, color: string, qty: number) => {
    setLines((prev) =>
      prev.flatMap((l) =>
        keyOf(l) === keyOf({ slug, size, color }) ? (qty <= 0 ? [] : [{ ...l, qty }]) : [l],
      ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.price, 0),
      add,
      remove,
      setQty,
      clear,
    }),
    [lines, add, remove, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
