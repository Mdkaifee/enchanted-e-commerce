import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import shirts from "@/assets/shirts.jpg";
import knitwear from "@/assets/knitwear.jpg";
import trousers from "@/assets/trousers.jpg";
import dresses from "@/assets/dresses.jpg";
import outerwear from "@/assets/outerwear.jpg";
import accessories from "@/assets/accessories.jpg";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  colors: string[];
  sizes: string[];
  image_url: string;
  badge: string | null;
  featured: boolean;
};

export const CATEGORY_IMAGES: Record<string, string> = {
  Shirts: shirts,
  Knitwear: knitwear,
  Trousers: trousers,
  Dresses: dresses,
  Outerwear: outerwear,
  Accessories: accessories,
};

export const CATEGORIES = Object.keys(CATEGORY_IMAGES);

export function productImage(product: Pick<Product, "image_url" | "category">) {
  return product.image_url || CATEGORY_IMAGES[product.category] || shirts;
}

export function formatPrice(value: number) {
  return `₹${value.toFixed(0)}`;
}

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    price: Number(row.price),
  })) as Product[];
}

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000,
});
