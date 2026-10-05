"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { OrderSummary } from "@/components/order-summary";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function CartView() {
  const {
    lines,
    ready,
    fulfilment,
    setFulfilment,
    setQuantity,
    setNotes,
    removeItem,
    clearCart,
  } = useCart();

  if (!ready) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        art="cart"
        icon={<ShoppingBag className="size-6" />}
        title="Your cart is empty"
        description="Once you add a dish it will show up here, along with delivery, tax and any promo codes you add."
        action={
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110"
          >
            Browse the menu
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        {/* Fulfilment toggle */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <FulfilmentOption
            active={fulfilment === "DELIVERY"}
            onClick={() => setFulfilment("DELIVERY")}
            icon={<Bike className="size-4" aria-hidden />}
            title="Delivery"
            caption="To your door"
          />
          <FulfilmentOption
            active={fulfilment === "PICKUP"}
            onClick={() => setFulfilment("PICKUP")}
            icon={<Store className="size-4" aria-hidden />}
            title="Pickup"
            caption="Skip the fee"
          />
        </div>

        <ul className="space-y-4">
          <AnimatePresence initial={false} mode="popLayout">
            {lines.map((line) => (
              <motion.li
                key={line.itemId}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
                className="surface-card overflow-hidden p-4"
              >
                <div className="flex gap-4">
                  <Link
                    href={`/menu/${line.slug}`}
                    className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-line"
                  >
                    <Image
                      src={line.image}
                      alt={line.name}
                      fill
                      sizes="6rem"
                      className="object-cover transition duration-500 hover:scale-105"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-faint">
                          {line.categoryName}
                        </p>
                        <Link
                          href={`/menu/${line.slug}`}
                          className="mt-1 block truncate font-display text-base font-bold transition hover:text-ember-300"
                        >
                          {line.name}
                        </Link>
                        <p className="mt-1 text-sm font-semibold text-gold-300">
                          {formatMoney(line.price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(line.itemId)}
                        className="rounded-lg p-1.5 text-faint transition hover:bg-surface-3 hover:text-chili-400"
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-lg border border-line bg-canvas-soft">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.itemId, line.quantity - 1)}
                          className="grid size-9 place-items-center rounded-l-lg text-muted transition hover:text-cream"
                          aria-label={`Decrease quantity of ${line.name}`}
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-sm font-bold tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.itemId, line.quantity + 1)}
                          disabled={line.quantity >= 20}
                          className="grid size-9 place-items-center rounded-r-lg text-muted transition hover:text-cream disabled:opacity-40"
                          aria-label={`Increase quantity of ${line.name}`}
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </div>

                      <span className="font-display text-base font-bold tabular-nums text-cream">
                        {formatMoney(line.price * line.quantity)}
                      </span>
                    </div>

                    <input
                      value={line.notes}
                      onChange={(event) =>
                        setNotes(line.itemId, event.target.value)
                      }
                      placeholder="Add a note for the kitchenâ€¦"
                      aria-label={`Special instructions for ${line.name}`}
                      className="mt-3 w-full rounded-lg border border-line bg-canvas-soft px-3 py-2 text-xs text-cream placeholder:text-faint transition focus:border-ember-500/60 focus:outline-none"
                    />
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/menu"
            className="text-sm font-semibold text-muted transition hover:text-cream"
          >
            â† Keep browsing
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="text-sm font-semibold text-faint transition hover:text-chili-400"
          >
            Clear cart
          </button>
        </div>
      </div>

      <OrderSummary className="lg:sticky lg:top-24">
        <Link
          href="/checkout"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 px-5 py-3.5 text-sm font-bold text-canvas transition hover:brightness-110"
        >
          Go to checkout
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </OrderSummary>
    </div>
  );
}

function FulfilmentOption({
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
        "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
        active
          ? "border-ember-500/60 bg-ember-500/10"
          : "border-line bg-surface hover:border-line-strong",
      )}
    >
      <span className={cn(active ? "text-ember-400" : "text-faint")}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-cream">{title}</span>
        <span className="block text-xs text-faint">{caption}</span>
      </span>
    </button>
  );
}