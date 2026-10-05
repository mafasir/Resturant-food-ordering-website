/**
 * All monetary values in this app are integer cents. Never use floats for
 * money — these helpers are the single source of truth for pricing maths and
 * are shared by both the client (display) and the server (authoritative).
 */

export const TAX_RATE = 0.0875;
export const DELIVERY_FEE = 399;
export const FREE_DELIVERY_THRESHOLD = 3500;
export const PICKUP_FEE = 0;

export type Fulfilment = "DELIVERY" | "PICKUP";

export type Totals = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatMoney(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function calculateTotals(input: {
  subtotal: number;
  fulfilment: Fulfilment;
  /** Already-validated absolute discount in cents. */
  discount?: number;
}): Totals {
  const subtotal = Math.max(0, Math.round(input.subtotal));
  const discount = Math.min(Math.max(0, Math.round(input.discount ?? 0)), subtotal);
  const taxable = subtotal - discount;

  let deliveryFee = PICKUP_FEE;
  if (input.fulfilment === "DELIVERY") {
    deliveryFee =
      subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  }

  const tax = Math.round(taxable * TAX_RATE);
  const total = taxable + tax + deliveryFee;

  return { subtotal, discount, deliveryFee, tax, total };
}

export type PromoInput = {
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  active: boolean;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
};

export type PromoResult =
  | { ok: true; discount: number; description: string | null }
  | { ok: false; reason: string };

/**
 * Evaluates a promo code against a subtotal. Pure and synchronous so the
 * server can re-check it at checkout time — client-side totals are never
 * trusted.
 */
export function evaluatePromo(promo: PromoInput, subtotal: number): PromoResult {
  if (!promo.active) {
    return { ok: false, reason: "This code is no longer active." };
  }
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "This code has expired." };
  }
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return { ok: false, reason: "This code has reached its usage limit." };
  }
  if (subtotal < promo.minOrderAmount) {
    return {
      ok: false,
      reason: `Spend ${formatMoney(promo.minOrderAmount - subtotal)} more to use this code.`,
    };
  }

  let discount =
    promo.discountType === "FIXED"
      ? promo.discountValue
      : Math.round((subtotal * promo.discountValue) / 100);

  if (promo.discountType === "PERCENT" && promo.maxDiscount !== null) {
    discount = Math.min(discount, promo.maxDiscount);
  }

  discount = Math.min(discount, subtotal);

  if (discount <= 0) {
    return { ok: false, reason: "This code gives no discount on this order." };
  }

  return { ok: true, discount, description: promo.description ?? null };
}

export function orderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `FC-${stamp}-${suffix}`;
}
