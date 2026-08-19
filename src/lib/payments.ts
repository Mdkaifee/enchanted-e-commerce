import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { calculateShipping, getShippingConfig } from "@/lib/shipping";

const DEFAULT_SUPABASE_URL = "https://qrzaczktouanbpvogfzs.supabase.co";
const accessTokenSchema = z
  .string()
  .min(1)
  .refine((token) => token.split(".").length === 3, "Please sign in again to checkout.");

const checkoutLineSchema = z.object({
  slug: z.string().min(1),
  size: z.string().min(1),
  color: z.string().min(1),
  qty: z.number().int().min(1).max(20),
});

const customerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(2),
  postal_code: z.string().min(3),
});

const verifyPaymentSchema = z.object({
  accessToken: accessTokenSchema,
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

type SupabaseAccessTokenClaims = {
  aud?: string;
  exp?: number;
  iss?: string;
  sub?: string;
};

function serverEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  if (typeof atob === "function") return atob(padded);
  return Buffer.from(padded, "base64").toString("utf8");
}

function supabaseUrlFromToken(accessToken: string) {
  try {
    const claims = claimsFromAccessToken(accessToken);
    const issuer = claims.iss;
    if (issuer?.startsWith("https://")) {
      return issuer.replace(/\/auth\/v1\/?$/, "");
    }
  } catch {
    /* token shape is validated separately */
  }
  return undefined;
}

function claimsFromAccessToken(accessToken: string) {
  const [, payload] = accessToken.split(".");
  return JSON.parse(decodeBase64Url(payload ?? "")) as SupabaseAccessTokenClaims;
}

function isUuid(value: string | undefined) {
  return Boolean(
    value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
  );
}

function encodeBasicAuth(user: string, password: string) {
  const raw = `${user}:${password}`;
  if (typeof btoa === "function") return btoa(raw);
  return Buffer.from(raw).toString("base64");
}

function toPaise(value: number) {
  return Math.round(value * 100);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

async function hmacSha256Hex(message: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function getAuthenticatedUserId(accessToken: string) {
  try {
    const claims = claimsFromAccessToken(accessToken);
    const tokenUrl = supabaseUrlFromToken(accessToken);
    const allowedUrls = new Set(
      [
        DEFAULT_SUPABASE_URL,
        process.env["APP_PUBLIC_SUPABASE_URL"],
        process.env["APP_SUPABASE_URL"],
      ]
        .filter(Boolean)
        .map((url) => url!.replace(/\/$/, "")),
    );

    if (!tokenUrl || !allowedUrls.has(tokenUrl.replace(/\/$/, ""))) {
      console.error("[Checkout auth] Token issuer is not allowed", { tokenUrl });
      throw new Error("Invalid token issuer.");
    }
    if (claims.aud !== "authenticated") {
      console.error("[Checkout auth] Token audience is not authenticated", { aud: claims.aud });
      throw new Error("Invalid token audience.");
    }
    if (!claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) {
      console.error("[Checkout auth] Token is expired");
      throw new Error("Expired token.");
    }
    if (!isUuid(claims.sub)) {
      console.error("[Checkout auth] Token subject is missing or invalid");
      throw new Error("Invalid token subject.");
    }

    return claims.sub!;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid token")) {
      throw new Error("Please sign in again to checkout.");
    }
    if (error instanceof Error && error.message === "Expired token.") {
      throw new Error("Please sign in again to checkout.");
    }
    throw new Error("Please sign in again to checkout.");
  }
}

export const createCheckoutOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      accessToken: accessTokenSchema,
      lines: z.array(checkoutLineSchema).min(1),
      customer: customerSchema,
    }),
  )
  .handler(async ({ data }) => {
    const keyId = serverEnv("RAZORPAY_KEY_ID");
    const keySecret = serverEnv("RAZORPAY_KEY_SECRET");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await getAuthenticatedUserId(data.accessToken);
    const slugs = Array.from(new Set(data.lines.map((line) => line.slug)));

    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, slug, name, price, image_url, category, colors, sizes")
      .in("slug", slugs);

    if (productsError) throw productsError;
    if (!products || products.length !== slugs.length) {
      throw new Error("One or more pieces in your bag are no longer available.");
    }

    const bySlug = new Map(products.map((product) => [product.slug, product]));
    const orderLines = data.lines.map((line) => {
      const product = bySlug.get(line.slug);
      if (!product) throw new Error("A piece in your bag is no longer available.");
      if (product.sizes.length > 0 && !product.sizes.includes(line.size)) {
        throw new Error(`${product.name} is not available in size ${line.size}.`);
      }
      if (product.colors.length > 0 && !product.colors.includes(line.color)) {
        throw new Error(`${product.name} is not available in ${line.color}.`);
      }
      return {
        slug: product.slug,
        name: product.name,
        price: Number(product.price),
        category: product.category,
        size: line.size,
        color: line.color,
        image: product.image_url,
        qty: line.qty,
      };
    });

    const subtotal = roundMoney(orderLines.reduce((sum, line) => sum + line.price * line.qty, 0));
    const shipping = calculateShipping(subtotal, getShippingConfig());
    const total = roundMoney(subtotal + shipping);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        ...data.customer,
        user_id: userId,
        items: orderLines,
        total,
        status: "pending",
        fulfillment_status: "processing",
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodeBasicAuth(keyId, keySecret)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: toPaise(total),
        currency: "INR",
        receipt: order.id,
        notes: {
          site_order_id: order.id,
          user_id: userId,
        },
      }),
    });

    if (!razorpayResponse.ok) {
      await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);
      throw new Error("Razorpay could not start this checkout. Please try again.");
    }

    const razorpayOrder = (await razorpayResponse.json()) as RazorpayOrderResponse;

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", order.id);

    if (updateError) throw updateError;

    return {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator(verifyPaymentSchema)
  .handler(async ({ data }) => {
    const keySecret = serverEnv("RAZORPAY_KEY_SECRET");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await getAuthenticatedUserId(data.accessToken);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status, razorpay_order_id")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) throw new Error("Order not found.");
    if (order.status !== "pending") throw new Error("This order is not pending payment.");
    if (order.razorpay_order_id !== data.razorpayOrderId) {
      throw new Error("Payment does not match this order.");
    }

    const expected = await hmacSha256Hex(
      `${data.razorpayOrderId}|${data.razorpayPaymentId}`,
      keySecret,
    );

    if (!constantTimeEqual(expected, data.razorpaySignature)) {
      throw new Error("Payment verification failed.");
    }

    const { data: paidOrder, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
      })
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .eq("status", "pending")
      .select("id")
      .single();

    if (updateError || !paidOrder) throw new Error("Could not mark this order paid.");

    return { orderId: paidOrder.id };
  });
