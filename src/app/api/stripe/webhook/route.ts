import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * Stripe webhook — the authoritative source of truth for card payments.
 *
 * The browser also calls `confirmPayment` after `stripe.confirmPayment`, but
 * that call can be lost (closed tab, network drop). This handler is what
 * guarantees an order is eventually marked paid, and it's the only place that
 * trusts Stripe rather than our own client.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 503 },
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // The raw body is required for signature verification.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Signature verification failed: ${error.message}`
            : "Signature verification failed.",
      },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const orderNumber = intent.metadata.orderNumber;
        if (orderNumber) {
          // Settle the payment without rewinding a status the kitchen has
          // already advanced — only a still-pending order gets confirmed.
          await prisma.order.updateMany({
            where: { orderNumber, paymentStatus: { not: "PAID" } },
            data: { paymentStatus: "PAID" },
          });
          await prisma.order.updateMany({
            where: { orderNumber, status: "PENDING" },
            data: { status: "CONFIRMED" },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const orderNumber = intent.metadata.orderNumber;
        if (orderNumber) {
          await prisma.order.updateMany({
            where: { orderNumber, paymentStatus: { not: "PAID" } },
            data: { paymentStatus: "FAILED" },
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const intentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (intentId) {
          await prisma.order.updateMany({
            where: { paymentIntentId: intentId },
            data: { paymentStatus: "REFUNDED" },
          });
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Webhook handler failed.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}