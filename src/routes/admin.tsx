import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Package, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { toast } from "sonner";

import {
  CATEGORIES,
  categoryImage,
  formatPrice,
  productCategories,
  productsQuery,
  type Product,
} from "@/lib/catalog";
import { allOrdersQuery } from "@/lib/orders";
import { useRequireAdmin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ProductForm = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  category: string;
  colors: string;
  color_images: string;
  sizes: string;
  image_url: string;
  badge: string;
  featured: boolean;
};

type AdminTab = "products" | "orders" | "messages";
type ContactMessage = Tables<"contact_messages">;

const fulfillmentOptions = [
  { value: "processing", label: "Preparing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentLabels: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
};

const emptyProduct: ProductForm = {
  slug: "",
  name: "",
  description: "",
  price: "",
  category: CATEGORIES[0] ?? "Shirts",
  colors: "",
  color_images: "",
  sizes: "",
  image_url: "",
  badge: "",
  featured: false,
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — MD Attire" }],
  }),
  component: Admin,
});

function Admin() {
  const { ready } = useRequireAdmin();
  const [tab, setTab] = useState<AdminTab>("products");

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center text-sm text-muted-foreground">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pt-14 pb-24">
      <div className="rise-in flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">Admin</p>
          <h1 className="mt-4 font-display text-5xl font-light">Store management</h1>
        </div>
        <Link to="/account" className="underline-sweep text-sm">
          Back to account
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap gap-2 border-b border-border pb-4">
        <TabButton active={tab === "products"} onClick={() => setTab("products")}>
          Products
        </TabButton>
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
          Orders
        </TabButton>
        <TabButton active={tab === "messages"} onClick={() => setTab("messages")}>
          Messages
        </TabButton>
      </div>

      {tab === "products" && <ProductsAdmin />}
      {tab === "orders" && <OrdersAdmin />}
      {tab === "messages" && <MessagesAdmin />}
    </div>
  );
}

function ProductsAdmin() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const categories = productCategories(products);
  const imagePreview = form.image_url.trim() || categoryImage(form.category, products);

  const saveProduct = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug.trim() || slugify(form.name),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        colors: splitList(form.colors),
        color_images: parseColorImages(form.color_images),
        sizes: splitList(form.sizes),
        image_url: form.image_url.trim(),
        badge: form.badge.trim() || null,
        featured: form.featured,
      };

      if (!payload.name || !payload.slug || !payload.category || !Number.isFinite(payload.price)) {
        throw new Error("Name, slug, category and price are required.");
      }

      if (form.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id);
        if (error) throw error;
        return "updated";
      }

      const { error } = await supabase.from("products").insert(payload);
      if (error) throw error;
      return "created";
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: productsQuery.queryKey });
      setForm(emptyProduct);
      toast.success(action === "created" ? "Product created" : "Product updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (product: Product) => {
      if (!window.confirm(`Delete ${product.name}?`)) return;
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQuery.queryKey });
      toast.success("Product deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="mt-10 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          saveProduct.mutate();
        }}
        className="h-fit border border-border p-6 lg:sticky lg:top-28"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-light">
            {form.id ? "Edit product" : "Add product"}
          </h2>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyProduct)}
              className="underline-sweep text-xs"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-6 grid gap-4">
          <AdminField
            label="Name"
            value={form.name}
            onChange={(name) => setFormValue(setForm, { name, slug: form.slug || slugify(name) })}
          />
          <AdminField
            label="Slug"
            value={form.slug}
            onChange={(slug) => setFormValue(setForm, { slug })}
          />
          <AdminField
            label="Description"
            value={form.description}
            onChange={(description) => setFormValue(setForm, { description })}
            multiline
          />
          <div className="grid grid-cols-2 gap-3">
            <AdminField
              label="Price"
              value={form.price}
              onChange={(price) => setFormValue(setForm, { price })}
            />
            <label className="block">
              <span className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                Category
              </span>
              <input
                value={form.category}
                onChange={(event) => setFormValue(setForm, { category: event.target.value })}
                list="admin-product-categories"
                placeholder="Shirts, Sarees, Footwear"
                className="mt-1 w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <datalist id="admin-product-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>
          </div>
          <AdminField
            label="Colors"
            value={form.colors}
            onChange={(colors) => setFormValue(setForm, { colors })}
            placeholder="Sand, Ivory, Clay"
          />
          <AdminField
            label="Color image URLs"
            value={form.color_images}
            onChange={(color_images) => setFormValue(setForm, { color_images })}
            placeholder={"Sand: https://...\nIvory: https://...\nClay: https://..."}
            multiline
            required={false}
          />
          <AdminField
            label="Sizes"
            value={form.sizes}
            onChange={(sizes) => setFormValue(setForm, { sizes })}
            placeholder="XS, S, M, L"
          />
          <AdminField
            label="Image URL"
            value={form.image_url}
            onChange={(image_url) => setFormValue(setForm, { image_url })}
          />
          <div>
            <span className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              Current image
            </span>
            <div className="mt-2 grid grid-cols-[88px_1fr] items-center gap-3 border border-border p-2">
              <img
                src={imagePreview}
                alt=""
                className="aspect-square w-full bg-secondary object-cover"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {form.image_url.trim()
                  ? "Using the saved product image URL."
                  : "Image URL is optional. Blank products use the category/default image."}
              </p>
            </div>
          </div>
          <AdminField
            label="Badge"
            value={form.badge}
            onChange={(badge) => setFormValue(setForm, { badge })}
            placeholder="New, Limited"
          />
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => setFormValue(setForm, { featured: event.target.checked })}
              className="size-4 accent-primary"
            />
            Featured on home
          </label>
          <button
            type="submit"
            disabled={saveProduct.isPending}
            className="press inline-flex items-center justify-center gap-2 bg-foreground px-5 py-3 text-xs tracking-[0.2em] text-background uppercase disabled:opacity-60"
          >
            {form.id ? <Save className="size-4" /> : <Plus className="size-4" />}
            {saveProduct.isPending ? "Saving..." : form.id ? "Save product" : "Add product"}
          </button>
        </div>
      </form>

      <div>
        <h2 className="font-display text-2xl font-light">Products</h2>
        {isLoading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse bg-secondary" />
            ))}
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="font-display">{product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.category} · {formatPrice(product.price)} · /{product.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(productToForm(product))}
                    className="press grid size-9 place-items-center border border-border hover:bg-secondary"
                    aria-label={`Edit ${product.name}`}
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct.mutate(product)}
                    className="press grid size-9 place-items-center border border-border text-destructive hover:bg-secondary"
                    aria-label={`Delete ${product.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function OrdersAdmin() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery(allOrdersQuery());

  const updateOrder = useMutation({
    mutationFn: async ({ id, fulfillment_status }: { id: string; fulfillment_status: string }) => {
      const { error } = await supabase.from("orders").update({ fulfillment_status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "all"] });
      toast.success("Order updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <Package className="size-5 text-primary" />
        <h2 className="font-display text-2xl font-light">Orders</h2>
      </div>
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse bg-secondary" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto border-y border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              <tr>
                <th className="py-3 pr-4 font-normal">Order</th>
                <th className="py-3 pr-4 font-normal">Customer</th>
                <th className="py-3 pr-4 font-normal">Payment</th>
                <th className="py-3 pr-4 font-normal">Total</th>
                <th className="py-3 pr-4 font-normal">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="py-4 pr-4">
                    <Link to="/order/$id" params={{ id: order.id }} className="underline-sweep">
                      #{order.id.slice(0, 8)}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <p>{order.full_name}</p>
                    <p className="text-xs text-muted-foreground">{order.email}</p>
                  </td>
                  <td className="py-4 pr-4">{paymentLabels[order.status] ?? order.status}</td>
                  <td className="py-4 pr-4">{formatPrice(order.total)}</td>
                  <td className="py-4 pr-4">
                    <select
                      value={order.fulfillment_status}
                      disabled={order.status !== "paid" || updateOrder.isPending}
                      onChange={(event) =>
                        updateOrder.mutate({
                          id: order.id,
                          fulfillment_status: event.target.value,
                        })
                      }
                      className="border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary disabled:opacity-50"
                    >
                      {fulfillmentOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    {order.status !== "paid" && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Fulfillment starts after payment.
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MessagesAdmin() {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async (): Promise<ContactMessage[]> => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-light">Customer messages</h2>
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse bg-secondary" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {messages.map((message) => (
            <li key={message.id} className="border border-border p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-display">{message.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{message.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {message.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press border px-4 py-2 text-[11px] tracking-[0.18em] uppercase ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function AdminField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const className =
    "mt-1 w-full border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">{label}</span>
      {multiline ? (
        <textarea
          required={required}
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          required={required && label !== "Image URL" && label !== "Badge"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </label>
  );
}

function setFormValue(setForm: Dispatch<SetStateAction<ProductForm>>, patch: Partial<ProductForm>) {
  setForm((current) => ({ ...current, ...patch }));
}

function productToForm(product: Product): ProductForm {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: String(product.price),
    category: product.category,
    colors: product.colors.join(", "),
    color_images: formatColorImages(product.color_images),
    sizes: product.sizes.join(", "),
    image_url: product.image_url,
    badge: product.badge ?? "",
    featured: product.featured,
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseColorImages(value: string) {
  return Object.fromEntries(
    value
      .split(/\n|,/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.search(/[:=]/);
        if (separatorIndex === -1) return null;
        const color = line.slice(0, separatorIndex).trim();
        const imageUrl = line.slice(separatorIndex + 1).trim();
        return color && imageUrl ? [color, imageUrl] : null;
      })
      .filter((entry): entry is [string, string] => Boolean(entry)),
  );
}

function formatColorImages(colorImages: Record<string, string>) {
  return Object.entries(colorImages)
    .map(([color, imageUrl]) => `${color}: ${imageUrl}`)
    .join("\n");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
