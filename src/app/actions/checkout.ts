"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  calculateTotals,
  evaluatePromo,
  orderNumber,
} from "@/lib/money";
import {
  createPaymentIntent,
  isStripeConfigured,
  verifyPaymentIntent,
} from "@/lib/stripe";
import {
  checkoutStartSchema,
  fieldErrors,
} from "@/lib/validation";
import type { MenuItemView } from "@/lib/types";
import { SITE } from "@/lib/site";

export type StartCheckoutResult =
  | { ok: true; status: "placed"; orderNumber: string; demo: boolean }
  | {
      ok: true;
      status: "needs_payment";
      orderNumber: string;
      clientSecret: string;
      publishableKey: string;
      amount: number;
    }
  | { ok: false; errors: Record<string, string>; message?: string };

/**
 * Creates the order and, when card payment is selected, a PaymentIntent.
 *
 * Prices, availability and promo discounts are all recomputed from the database
 * here — the totals sent by the browser are never trusted.
 */
export async function startCheckout(
  payload: unknown,
): Promise<StartCheckoutResult> {
  const parsed = checkoutStartSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: "Please check the highlighted fields.",
    };
  }

  const data = parsed.data;
  const user = await getSessionUser();

  // Cash at the door is a delivery-only concept, so a tampered client cannot
  // push an unpaid pickup through the door and leave the counter to chase it.
  if (data.fulfilment === "PICKUP" && data.paymentMethod === "CASH_ON_DELIVERY") {
    return {
      ok: false,
      errors: { paymentMethod: "Pay online or at the counter for pickup" },
    };
  }

  // ------------------------------------------------- Rebuild the cart from the DB
  const ids = [...new Set(data.lines.map((line) => line.itemId))];
  const rows = await prisma.menuItem.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      isAvailable: true,
    },
  });

  const byId = new Map(rows.map((row) => [row.id, row]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    return {
      ok: false,
      errors: { form: "Some items are no longer on the menu. Refresh your cart." },
    };
  }

  const unavailable = rows.filter((row) => !row.isAvailable);
  if (unavailable.length > 0) {
    return {
      ok: false,
      errors: {
        form: `Currently unavailable: ${unavailable.map((row) => row.name).join(", ")}.`,
      },
    };
  }

  const lines = data.lines.map((line) => {
    const row = byId.get(line.itemId)!;
    return {
      itemId: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      quantity: line.quantity,
      notes: line.notes,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  // ------------------------------------------------------ Promo, re-checked server side
  let discount = 0;
  let promoCode: string | null = null;
  if (data.promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: data.promoCode.trim().toUpperCase() },
    });
    if (promo) {
      const result = evaluatePromo(promo, subtotal);
      if (result.ok) {
        discount = result.discount;
        promoCode = promo.code;
      }
    }
    // An invalid code is simply ignored rather than blocking the order.
  }

  const totals = calculateTotals({
    subtotal,
    fulfilment: data.fulfilment,
    discount,
  });

  const useCard = data.paymentMethod === "CARD";
  const stripeReady = useCard && isStripeConfigured();
  const email = data.email || user?.email || "";

  const number = orderNumber();

  // Pickup orders are handed over at the counter, so the order stores the
  // restaurant address instead of a customer one.
  const isPickup = data.fulfilment === "PICKUP";
  const deliveryAddress = {
    line1: isPickup ? SITE.address.line1 : data.addressLine1,
    line2: isPickup ? "Pickup counter" : data.addressLine2,
    city: isPickup ? SITE.address.city : data.city,
    state: isPickup ? SITE.address.state : data.state,
    postalCode: isPickup ? SITE.address.postalCode : data.postalCode,
  };

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: number,
        userId: user?.id ?? null,
        customerName: data.customerName,
        customerEmail: email || null,
        customerPhone: data.customerPhone,
        addressLine1: deliveryAddress.line1,
        addressLine2: deliveryAddress.line2 || null,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        postalCode: deliveryAddress.postalCode,
        notes: data.notes || null,
        fulfilment: data.fulfilment,
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.deliveryFee,
        tax: totals.tax,
        total: totals.total,
        promoCode,
        paymentMethod: data.paymentMethod,
        // Cash on delivery is confirmed immediately; card orders wait for payment.
        status: stripeReady ? "PENDING" : "CONFIRMED",
        paymentStatus: "PENDING",
        items: {
          create: lines.map((line) => ({
            menuItemId: line.itemId,
            name: line.name,
            price: line.price,
            quantity: line.quantity,
            notes: line.notes || null,
          })),
        },
      },
    });

    if (promoCode) {
      await tx.promoCode.update({
        where: { code: promoCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (user && data.saveAddress && !isPickup) {
      await tx.address.create({
        data: {
          userId: user.id,
          label: "Home",
          fullName: data.customerName,
          phone: data.customerPhone,
          line1: deliveryAddress.line1,
          line2: deliveryAddress.line2 || null,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          postalCode: deliveryAddress.postalCode,
          isDefault: true,
        },
      });
    }

    return created;
  });

  revalidatePath("/account/orders");

  // ------------------------------------------------------------- Card payments
  if (stripeReady) {
    try {
      const intent = await createPaymentIntent({
        amount: totals.total,
        orderNumber: order.orderNumber,
        customerEmail: email || "guest@feastcraft.test",
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentIntentId: intent.paymentIntentId },
      });

      return {
        ok: true,
        status: "needs_payment",
        orderNumber: order.orderNumber,
        clientSecret: intent.clientSecret,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        amount: totals.total,
      };
    } catch (error) {
      // Don't leave a stranded unpaid order if Stripe is unreachable.
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
      return {
        ok: false,
        errors: {
          form:
            error instanceof Error
              ? `Payment could not be started: ${error.message}`
              : "Payment could not be started. Please try again.",
        },
      };
    }
  }

  // Cash on delivery stays unpaid until the driver collects it. Demo mode has
  // no real money involved, so it is settled immediately.
  const isDemoCard = useCard && !isStripeConfigured();

  if (isDemoCard) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID" },
    });
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    });
  }

  return {
    ok: true,
    status: "placed",
    orderNumber: order.orderNumber,
    demo: isDemoCard,
  };
}

export type ConfirmPaymentResult =
  | { ok: true; orderNumber: string }
  | { ok: false; message: string };

/**
 * Second half of the card flow: the browser confirms the PaymentIntent with
 * Stripe, then calls this to mark the order paid. Safe to call twice.
 */
export async function confirmPayment(
  orderNumber: string,
  paymentIntentId: string,
): Promise<ConfirmPaymentResult> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      total: true,
      paymentStatus: true,
      paymentIntentId: true,
      paymentMethod: true,
    },
  });

  if (!order) return { ok: false, message: "Order not found." };
  if (order.paymentStatus === "PAID") return { ok: true, orderNumber };

  // Only card orders can be settled here.
  if (order.paymentMethod !== "CARD") {
    return {
      ok: false,
      message: "This order is not paid by card.",
    };
  }

  if (!isStripeConfigured()) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    return { ok: true, orderNumber };
  }

  if (!paymentIntentId) {
    return { ok: false, message: "Missing payment reference." };
  }

  // Bind the browser's claim to the PaymentIntent this order actually created,
  // so a paid intent for some other order can't be used to settle this one.
  if (!order.paymentIntentId || order.paymentIntentId !== paymentIntentId) {
    return { ok: false, message: "Payment reference does not match this order." };
  }

  const verified = await verifyPaymentIntent(paymentIntentId, order.total);
  if (!verified.paid) {
    return { ok: false, message: verified.message ?? "Payment was not completed." };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", status: "CONFIRMED" },
  });

  return { ok: true, orderNumber };
}

/** Menu items available for quick re-ordering after a successful order. */
export async function getFeaturedMenuItems(): Promise<MenuItemView[]> {
  const { getMenuItems } = await import("@/lib/queries");
  return getMenuItems({ featuredOnly: true, availableOnly: true, limit: 4 });
}