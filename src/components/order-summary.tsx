"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgePercent, Check, Tag, Ticket, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { Spinner } from "@/components/ui/primitives";
import {
  FREE_DELIVERY_THRESHOLD,
  TAX_RATE,
  formatMoney,
} from "@/lib/money";
import { cn } from "@/lib/utils";

export function OrderSummary({
  children,
  className,
}: {
  /** Rendered as the primary call to action at the bottom of the summary. */
  children?: React.ReactNode;
  className?: string;
}) {
  const { totals, promo, clearPromo, applyPromo, promoChecking, fulfilment, subtotal } =
    useCart();
  const { toast } = useToast();
  const [code, setCode] = useState("");

  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  async function handleApply(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      await applyPromo(trimmed);
      toast({
        title: `${trimmed.toUpperCase()} applied`,
        description: "Your discount has been added to this order.",
        tone: "success",
      });
      setCode("");
    } catch (error) {
      toast({
        title: "Code not applied",
        description:
          error instanceof Error ? error.message : "That code is not valid.",
        tone: "error",
      });
    }
  }

  return (
    <div className={cn("surface-card p-6", className)}>
      <h2 className="font-display text-lg font-bold">Order summary</h2>

      <dl className="mt-5 space-y-3 text-sm">
        <Row
          label={`Subtotal${fulfilment === "DELIVERY" ? "" : " (pickup)"}`}
          value={formatMoney(totals.subtotal)}
        />
        {totals.discount > 0 ? (
          <Row
            label={`Discount${promo ? ` Â· ${promo.code}` : ""}`}
            value={`âˆ’ ${formatMoney(totals.discount)}`}
            valueClassName="text-jade-400"
          />
        ) : null}
        <Row
          label="Delivery"
          value={
            fulfilment === "PICKUP"
              ? "Free"
              : totals.deliveryFee === 0
                ? "Free"
                : formatMoney(totals.deliveryFee)
          }
          valueClassName={
            fulfilment === "DELIVERY" && totals.deliveryFee === 0
              ? "text-jade-400"
              : undefined
          }
        />
        <Row
          label="Tax"
          value={formatMoney(totals.tax)}
          hint={`${(TAX_RATE * 100).toFixed(2)}%`}
        />
      </dl>

      {fulfilment === "DELIVERY" && remainingForFree > 0 ? (
        <div className="mt-4 rounded-xl border border-line bg-canvas-soft px-4 py-3">
          <p className="text-xs leading-relaxed text-muted">
            Add{" "}
            <span className="font-semibold text-gold-300">
              {formatMoney(remainingForFree)}
            </span>{" "}
            more for free delivery.
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-300 to-ember-500"
              initial={false}
              animate={{
                width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
              }}
              transition={{ type: "spring", stiffness: 160, damping: 26 }}
            />
          </div>
        </div>
      ) : null}

      {/* Promo code */}
      <div className="mt-5 border-t border-line pt-5">
        <AnimatePresence mode="wait" initial={false}>
          {promo ? (
            <motion.div
              key="applied"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3 rounded-xl border border-jade-500/30 bg-jade-500/10 px-4 py-3"
            >
              <Check className="size-4 shrink-0 text-jade-400" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-jade-400">{promo.code}</p>
                {promo.description ? (
                  <p className="truncate text-xs text-muted">{promo.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={clearPromo}
                className="rounded-md p-1 text-faint transition hover:text-chili-400"
                aria-label="Remove promo code"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleApply}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Tag
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                  aria-hidden
                />
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  className="w-full rounded-xl border border-line bg-canvas-soft py-2.5 pl-9 pr-3 text-sm uppercase tracking-wide text-cream placeholder:normal-case placeholder:tracking-normal placeholder:text-faint transition focus:border-ember-500/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={promoChecking || !code.trim()}
                className="shrink-0 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-cream transition hover:border-line-strong disabled:opacity-50"
              >
                {promoChecking ? <Spinner /> : "Apply"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {!promo ? (
          <p className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] text-faint">
            <BadgePercent className="size-3" aria-hidden />
            Try <span className="font-mono font-semibold text-muted">WELCOME10</span>{" "}
            for 10% off your first order
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
        <span className="text-sm font-semibold text-muted">Total</span>
        <span className="font-display text-2xl font-extrabold text-cream">
          {formatMoney(totals.total)}
        </span>
      </div>

      {children ? <div className="mt-5">{children}</div> : null}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.7rem] text-faint">
        <Ticket className="size-3" aria-hidden />
        Taxes calculated at 8.75%
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">
        {label}
        {hint ? <span className="ml-1 text-xs text-faint">({hint})</span> : null}
      </dt>
      <dd className={cn("font-medium tabular-nums text-cream", valueClassName)}>
        {value}
      </dd>
    </div>
  );
}
