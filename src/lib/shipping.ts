export const DEFAULT_FREE_SHIPPING_THRESHOLD = 200;
export const DEFAULT_SHIPPING_FEE = 50;

function readNumberEnv(name: string, fallback: number) {
  const value = import.meta.env[name] ?? process.env[name];
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getShippingConfig() {
  return {
    freeShippingThreshold: readNumberEnv(
      "VITE_FREE_SHIPPING_THRESHOLD",
      DEFAULT_FREE_SHIPPING_THRESHOLD,
    ),
    shippingFee: readNumberEnv("VITE_SHIPPING_FEE", DEFAULT_SHIPPING_FEE),
  };
}

export function calculateShipping(subtotal: number, config = getShippingConfig()) {
  if (subtotal <= 0) return 0;
  return subtotal < config.freeShippingThreshold ? config.shippingFee : 0;
}
