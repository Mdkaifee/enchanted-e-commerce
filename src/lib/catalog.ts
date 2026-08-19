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
  color_images: Record<string, string>;
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

export function productImage(
  product: Pick<Product, "image_url" | "category"> & {
    color_images?: Record<string, string> | null;
  },
  color?: string,
) {
  if (color && product.color_images?.[color]?.trim()) {
    return product.color_images[color].trim();
  }

  const imageUrl = product.image_url.trim();
  const firstColorImage = product.color_images
    ? Object.values(product.color_images).find((value) => value.trim())
    : undefined;

  return imageUrl || firstColorImage || CATEGORY_IMAGES[product.category] || shirts;
}

export function productCategories(products: Pick<Product, "category">[]) {
  return Array.from(new Set([...CATEGORIES, ...products.map((product) => product.category)]))
    .map((category) => category.trim())
    .filter(Boolean);
}

export function categoryImage(category: string, products: Product[] = []) {
  const categoryProduct = products.find((product) => product.category === category);
  return CATEGORY_IMAGES[category] || (categoryProduct ? productImage(categoryProduct) : shirts);
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
    color_images:
      row.color_images && typeof row.color_images === "object" && !Array.isArray(row.color_images)
        ? Object.fromEntries(
            Object.entries(row.color_images)
              .filter(([, value]) => typeof value === "string")
              .map(([key, value]) => [key, String(value)]),
          )
        : {},
  })) as Product[];
}

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000,
});
