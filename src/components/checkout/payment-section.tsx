"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { Spinner } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";

const stripePromiseCache = new Map<string, ReturnType<typeof loadStripe>>();

function getStripePromise(key: string) {
  let promise = stripePromiseCache.get(key);
  if (!promise) {
    promise = loadStripe(key);
    stripePromiseCache.set(key, promise);
  }
  return promise;
}

export function PaymentSection({
  publishableKey,
  clientSecret,
  amount,
  onPay,
  paying,
}: {
  publishableKey: string;
  clientSecret: string;
  amount: number;
  onPay: (paymentIntentId: string) => Promise<{ ok: boolean; message?: string }>;
  paying: boolean;
}) {
  const stripePromise = useMemo(
    () => getStripePromise(publishableKey),
    [publishableKey],
  );

  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold">Payment</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-faint">
          <Lock className="size-3.5" aria-hidden />
          Secured by Stripe
        </span>
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#f0803c",
              colorBackground: "#14110f",
              colorText: "#f6efe6",
              colorDanger: "#e4572e",
              borderRadius: "12px",
              fontFamily: "inherit",
            },
          },
        }}
      >
        <StripeForm amount={amount} onPay={onPay} paying={paying} />
      </Elements>
    </div>
  );
}

function StripeForm({
  amount,
  onPay,
  paying,
}: {
  amount: number;
  onPay: (paymentIntentId: string) => Promise<{ ok: boolean; message?: string }>;
  paying: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setBusy(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Your payment could not be completed.");
      setBusy(false);
      return;
    }

    const response = await onPay(result.paymentIntent?.id ?? "");
    if (!response.ok) setError(response.message ?? "Payment failed.");
    setBusy(false);
  }

  const disabled = paying || busy || !stripe;

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <PaymentElement
        options={{
          layout: { type: "tabs", defaultCollapsed: false },
        }}
      />

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-chili-500/40 bg-chili-500/10 px-4 py-3 text-sm text-chili-400"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 px-6 py-3.5 text-sm font-bold text-canvas transition hover:brightness-110 disabled:opacity-60"
      >
        {disabled ? <Spinner /> : <CreditCard className="size-4" aria-hidden />}
        Pay {formatMoney(amount)}
      </button>

      <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-faint">
        Stripe test mode is active. Use card 4242 4242 4242 4242, any future
        expiry and any CVC.
      </p>
    </form>
  );
}

/**
 * Shown when no Stripe keys are configured. It keeps the ordering flow fully
 * testable without pretending to take real card details.
 */
export function DemoPaymentNotice({ amount }: { amount: number }) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold">Payment</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-faint">
          <ShieldCheck className="size-3.5" aria-hidden />
          Demo mode
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden />
        <p className="text-xs leading-relaxed text-muted">
          Stripe keys aren&apos;t configured, so this order will be marked paid
          without a real charge. Add <code className="font-mono text-gold-300">STRIPE_SECRET_KEY</code>{" "}
          and <code className="font-mono text-gold-300">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
          to <code className="font-mono text-gold-300">.env</code> to switch on real
          Stripe test payments.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-line bg-canvas-soft px-4 py-3">
        <CreditCard className="size-4 shrink-0 text-faint" aria-hidden />
        <span className="font-mono text-sm tracking-[0.18em] text-muted">
          •••• •••• •••• 4242
        </span>
        <span className="ml-auto text-[0.7rem] text-faint">test card</span>
      </div>

      <p className="mt-4 text-center text-[0.7rem] text-faint">
        Total to be charged: {formatMoney(amount)}
      </p>
    </div>
  );
}