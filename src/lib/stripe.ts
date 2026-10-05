import "server-only";
import Stripe from "stripe";

/**
 * The site runs in two payment modes:
 *
 *  - **Stripe test mode** — set STRIPE_SECRET_KEY and
 *    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in `.env` to use the real Payment
 *    Element with Stripe's test cards.
 *  - **Demo mode** — with no keys configured, checkout simulates an
 *    authorisation server-side so the whole ordering flow is still usable
 *    out of the box.
 */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env or run without Stripe keys to use demo payments.",
    );
  }
  stripeClient ??= new Stripe(key);
  return stripeClient;
}

/**
 * Creates (or reuses) a PaymentIntent for an order total.
 * `orderNumber` is carried in metadata so the webhook can match the payment
 * back to the order it belongs to.
 */
export async function createPaymentIntent(input: {
  amount: number;
  orderNumber: string;
  customerEmail: string;
}): Promise<{ paymentIntentId: string; clientSecret: string }> {
  const stripe = getStripe();

  const intent = await stripe.paymentIntents.create({
    amount: input.amount,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    receipt_email: input.customerEmail,
    description: `FeastCraft order ${input.orderNumber}`,
    metadata: { orderNumber: input.orderNumber },
  });

  if (!intent.client_secret) {
    throw new Error("Stripe did not return a client secret.");
  }

  return { paymentIntentId: intent.id, clientSecret: intent.client_secret };
}

/** Confirms the current state of a PaymentIntent (used before placing order). */
export async function verifyPaymentIntent(
  paymentIntentId: string,
  expectedAmount: number,
): Promise<{ paid: boolean; message?: string }> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (intent.amount !== expectedAmount) {
    return {
      paid: false,
      message: "Payment amount does not match the order total.",
    };
  }
  if (intent.status !== "succeeded") {
    return { paid: false, message: `Payment is not complete (${intent.status}).` };
  }

  return { paid: true };
}
