"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bike,
  Check,
  CreditCard,
  MapPin,
  Phone,
  Store,
  User,
  Wallet,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { OrderSummary } from "@/components/order-summary";
import { DemoPaymentNotice, PaymentSection } from "@/components/checkout/payment-section";
import { Spinner } from "@/components/ui/primitives";
import { confirmPayment, startCheckout } from "@/app/actions/checkout";
import type { SessionUser } from "@/lib/types";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

type FormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
};

const EMPTY: FormState = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  notes: "",
};

export function CheckoutForm({
  user,
  addresses,
  stripeEnabled,
}: {
  user: SessionUser | null;
  addresses: SavedAddress[];
  stripeEnabled: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { lines, ready, fulfilment, setFulfilment, promo, totals, clearCart } = useCart();

  const [form, setForm] = useState<FormState>({
    ...EMPTY,
    customerName: user?.name ?? "",
    customerEmail: user?.email ?? "",
  });
  const [addressId, setAddressId] = useState(
    addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH_ON_DELIVERY">(
    "CARD",
  );
  const [saveAddress, setSaveAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<{
    clientSecret: string;
    publishableKey: string;
    amount: number;
    orderNumber: string;
  } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

/** Picking a saved address copies its fields into the form. */
function applyAddress(id: string) {
    setAddressId(id);
    const address = addresses.find((item) => item.id === id);
    if (!address) return;
    setForm((current) => ({
      ...current,
      customerName: address.fullName,
      customerPhone: address.phone,
      addressLine1: address.line1,
      addressLine2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    }));
    setErrors({});
  }

  function editManually() {
    setAddressId("");
  }

  async function handlePlaceOrder(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const result = await startCheckout({
        lines: lines.map((line) => ({
          itemId: line.itemId,
          quantity: line.quantity,
          notes: line.notes,
        })),
        fulfilment,
        ...form,
        promoCode: promo?.code ?? "",
        paymentMethod,
        saveAddress: saveAddress && Boolean(user),
        addressId,
      });

      if (!result.ok) {
        setErrors(result.errors);
        if (result.message) toast({ title: "Check your details", description: result.message, tone: "error" });
        return;
      }

      if (result.status === "needs_payment") {
        setPayment({
          clientSecret: result.clientSecret,
          publishableKey: result.publishableKey,
          amount: result.amount,
          orderNumber: result.orderNumber,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Cash on delivery, or demo mode: the order is already confirmed.
      clearCart();
      toast({
        title: `Order ${result.orderNumber} confirmed`,
        description: result.demo
          ? "Demo payment accepted — no card was charged."
          : "Pay the driver on arrival.",
        tone: "success",
      });
      router.push(`/checkout/success?order=${result.orderNumber}`);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description:
          error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStripePay(paymentIntentId: string) {
    const result = await confirmPayment(payment!.orderNumber, paymentIntentId);
    if (!result.ok) {
      return { ok: false, message: result.message };
    }
    clearCart();
    toast({
      title: "Payment received",
      description: `Order ${result.orderNumber} is confirmed.`,
      tone: "success",
    });
    router.push(`/checkout/success?order=${result.orderNumber}`);
    return { ok: true };
  }

  if (!ready) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />
        <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  if (lines.length === 0 && !payment) {
    return (
      <div className="surface-card flex flex-col items-center px-6 py-16 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-surface-3 text-ember-400">
          <MapPin className="size-6" aria-hidden />
        </div>
        <h2 className="mt-5 text-lg font-semibold">Nothing to check out</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Add a dish to your cart and come back — we&apos;ll keep your basket
          saved on this device.
        </p>
        <button
          type="button"
          onClick={() => router.push("/menu")}
          className="mt-6 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110"
        >
          Browse the menu
        </button>
      </div>
    );
  }

  // ------------------------------------------------- Stripe step (after order created)
  if (payment) {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-jade-500/30 bg-jade-500/10 px-5 py-4">
            <Check className="size-5 shrink-0 text-jade-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-jade-400">
                Order {payment.orderNumber} reserved
              </p>
              <p className="text-xs text-muted">
                Complete your payment below to confirm it with the kitchen.
              </p>
            </div>
          </div>

          <PaymentSection
            publishableKey={payment.publishableKey}
            clientSecret={payment.clientSecret}
            amount={payment.amount}
            paying={submitting}
            onPay={async (paymentIntentId) => {
              setSubmitting(true);
              const response = await handleStripePay(paymentIntentId);
              setSubmitting(false);
              return response;
            }}
          />

          <button
            type="button"
            onClick={() => setPayment(null)}
            className="mt-4 w-full text-center text-xs text-faint transition hover:text-cream"
          >
            ← Back to payment method
          </button>
        </motion.div>
      </div>
    );
  }

  // ---------------------------------------------------------------- Main checkout form
  return (
    <form onSubmit={handlePlaceOrder} className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="space-y-6">
        {/* Fulfilment */}
        <section className="surface-card p-6">
          <h2 className="font-display text-lg font-bold">How would you like it?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MethodOption
              active={fulfilment === "DELIVERY"}
              onClick={() => setFulfilment("DELIVERY")}
              icon={<Bike className="size-4" aria-hidden />}
              title="Delivery"
              caption={`${formatDeliveryCaption(totals.deliveryFee)}`}
            />
            <MethodOption
              active={fulfilment === "PICKUP"}
              onClick={() => setFulfilment("PICKUP")}
              icon={<Store className="size-4" aria-hidden />}
              caption="Ready in about 25 minutes"
              title="Pickup · always free"
            />
          </div>
        </section>

        {/* Saved addresses */}
        {addresses.length > 0 ? (
          <section className="surface-card p-6">
            <h2 className="font-display text-lg font-bold">Saved addresses</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => applyAddress(address.id)}
                  aria-pressed={addressId === address.id}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition",
                    addressId === address.id
                      ? "border-ember-500/60 bg-ember-500/10"
                      : "border-line bg-canvas-soft hover:border-line-strong",
                  )}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                    {address.label}
                    {address.isDefault ? (
                      <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[0.6rem] text-gold-300">
                        Default
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 block text-sm text-cream">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                  </span>
                  <span className="block text-xs text-faint">
                    {address.city}, {address.state} {address.postalCode}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={editManually}
                aria-pressed={addressId === ""}
                className={cn(
                  "rounded-xl border border-dashed px-4 py-3 text-left text-sm transition",
                  addressId === ""
                    ? "border-ember-500/60 bg-ember-500/10 text-cream"
                    : "border-line text-muted hover:border-line-strong hover:text-cream",
                )}
              >
                Use a different address
              </button>
            </div>
          </section>
        ) : null}

        {/* Contact details */}
        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <User className="size-4 text-ember-400" aria-hidden />
            Contact details
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Full name"
              value={form.customerName}
              onChange={(value) => set("customerName", value)}
              error={errors.customerName}
              autoComplete="name"
              required
            />
            <TextField
              label="Phone number"
              value={form.customerPhone}
              onChange={(value) => set("customerPhone", value)}
              error={errors.customerPhone}
              autoComplete="tel"
              type="tel"
              required
            />
            <TextField
              label="Email for your receipt"
              value={form.customerEmail}
              onChange={(value) => set("customerEmail", value)}
              error={errors.customerEmail}
              autoComplete="email"
              type="email"
              hint={user ? "Signed in with this address" : "We'll send your receipt here"}
              className="sm:col-span-2"
            />
          </div>
        </section>

        {/* Delivery address */}
        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <MapPin className="size-4 text-ember-400" aria-hidden />
            {fulfilment === "DELIVERY" ? "Delivery address" : "Pickup details"}
          </h2>

          {fulfilment === "PICKUP" ? (
            <div className="mt-4 rounded-xl border border-line bg-canvas-soft px-4 py-4 text-sm leading-relaxed text-muted">
              <p className="font-semibold text-cream">FeastCraft Kitchen</p>
              <p>
                {SITE.address.line1}, {SITE.address.city}
              </p>
              <p className="mt-1 text-faint">
                We&apos;ll text you the moment your order is boxed and ready.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Address line 1"
                value={form.addressLine1}
                onChange={(value) => set("addressLine1", value)}
                error={errors.addressLine1}
                autoComplete="address-line1"
                className="sm:col-span-2"
                required
              />
              <TextField
                label="Apartment, suite (optional)"
                value={form.addressLine2}
                onChange={(value) => set("addressLine2", value)}
                error={errors.addressLine2}
                autoComplete="address-line2"
                className="sm:col-span-2"
              />
              <TextField
                label="City"
                value={form.city}
                onChange={(value) => set("city", value)}
                error={errors.city}
                autoComplete="address-level2"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="State"
                  value={form.state}
                  onChange={(value) => set("state", value)}
                  error={errors.state}
                  autoComplete="address-level1"
                  required
                />
                <TextField
                  label="Postal code"
                  value={form.postalCode}
                  onChange={(value) => set("postalCode", value)}
                  error={errors.postalCode}
                  autoComplete="postal-code"
                  required
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <label
              htmlFor="order-notes"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
            >
              Notes for the kitchen
            </label>
            <textarea
              id="order-notes"
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
              rows={3}
              placeholder="Delivery instructions, allergies…"
              className="mt-2 w-full resize-none rounded-xl border border-line bg-canvas-soft px-3.5 py-3 text-sm text-cream placeholder:text-faint transition focus:border-ember-500/60 focus:outline-none"
            />
          </div>

          {user && fulfilment === "DELIVERY" ? (
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(event) => setSaveAddress(event.target.checked)}
                className="size-4 rounded border-line bg-canvas-soft accent-ember-500"
              />
              Save this address to my account
            </label>
          ) : null}
        </section>

        {/* Payment method */}
        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Wallet className="size-4 text-ember-400" aria-hidden />
            Payment method
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MethodOption
              active={paymentMethod === "CARD"}
              onClick={() => setPaymentMethod("CARD")}
              icon={<CreditCard className="size-4" aria-hidden />}
              title="Card"
              caption={stripeEnabled ? "Stripe secure checkout" : "Demo payment"}
            />
            {fulfilment === "DELIVERY" ? (
              <MethodOption
                active={paymentMethod === "CASH_ON_DELIVERY"}
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                icon={<Phone className="size-4" aria-hidden />}
                title="Cash on delivery"
                caption="Pay the driver on arrival"
              />
            ) : null}
          </div>

          {fulfilment === "PICKUP" ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-canvas-soft px-4 py-3 text-xs leading-relaxed text-muted">
              <Phone className="mt-0.5 size-3.5 shrink-0 text-faint" aria-hidden />
              Pickup orders are paid by card now. Cash on delivery is only
              available for delivery.
            </p>
          ) : null}

          {!stripeEnabled && paymentMethod === "CARD" ? (
            <div className="mt-4">
              <DemoPaymentNotice amount={totals.total} />
            </div>
          ) : null}
        </section>

        {errors.form ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-chili-500/40 bg-chili-500/10 px-4 py-3 text-sm text-chili-400"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {errors.form}
          </p>
        ) : null}
      </div>

      <OrderSummary className="lg:sticky lg:top-24">
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 px-5 py-3.5 text-sm font-bold text-canvas transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? <Spinner /> : null}
          {submitting ? "Placing order…" : formatMethodCaption(paymentMethod)}
        </button>
        <p className="mt-3 text-center text-[0.7rem] leading-relaxed text-faint">
          By placing this order you agree to our terms of service and privacy
          policy.
        </p>
      </OrderSummary>
    </form>
  );
}

function formatDeliveryCaption(deliveryFee: number): string {
  return deliveryFee === 0 ? "Free on this order" : "Flat $3.99 fee";
}

function formatMethodCaption(paymentMethod: "CARD" | "CASH_ON_DELIVERY"): string {
  return paymentMethod === "CASH_ON_DELIVERY" ? "Place order" : "Continue to payment";
}

function MethodOption({
  active,
  onClick,
  icon,
  title,
  caption,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  caption: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition",
        active
          ? "border-ember-500/60 bg-ember-500/10"
          : "border-line bg-canvas-soft hover:border-line-strong",
      )}
    >
      <span className={cn("mt-0.5", active ? "text-ember-400" : "text-faint")}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-cream">{title}</span>
        <span className="block text-xs text-faint">{caption}</span>
      </span>
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  className,
  required,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  className?: string;
  required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className={className}>
      <label
        htmlFor={`field-${label.replace(/\s+/g, "-").toLowerCase()}`}
        className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
      >
        {label}
        {required ? <span className="ml-1 text-ember-400">*</span> : null}
      </label>
      <input
        id={`field-${label.replace(/\s+/g, "-").toLowerCase()}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={cn(
          "mt-2 w-full rounded-xl border bg-canvas-soft px-3.5 py-2.5 text-sm text-cream transition placeholder:text-faint focus:outline-none",
          error
            ? "border-chili-500/60 focus:border-chili-500"
            : "border-line focus:border-ember-500/60",
        )}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-chili-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}