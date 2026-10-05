"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { formatMoney } from "@/lib/money";
import type { MenuItemView } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ItemPurchasePanel({ item }: { item: MenuItemView }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);

  const unavailable = !item.isAvailable;

  function handleAdd() {
    addItem(item, quantity, notes.trim());
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    toast({
      title: `${item.name} added to cart`,
      description:
        quantity > 1
          ? `${quantity} portions${notes.trim() ? " with your notes" : ""}.`
          : notes.trim()
            ? "Saved with your notes."
            : "Ready when you are.",
      tone: "success",
    });
  }

  return (
    <div className="surface-card p-6">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-3xl font-extrabold text-gold-300">
          {formatMoney(item.price)}
        </span>
        <span className="text-xs text-faint">
          {formatMoney(item.price * quantity)} total
        </span>
      </div>

      <div className="mt-6">
        <label
          htmlFor="item-notes"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
        >
          Special instructions
        </label>
        <textarea
          id="item-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value.slice(0, 240))}
          rows={3}
          disabled={unavailable}
          placeholder="Allergies, spice level, sauce on the side…"
          className="mt-2 w-full resize-none rounded-xl border border-line bg-canvas-soft px-3.5 py-3 text-sm text-cream placeholder:text-faint transition focus:border-ember-500/60 focus:outline-none disabled:opacity-50"
        />
        <p className="mt-1.5 text-right text-[0.7rem] text-faint">
          {notes.length}/240
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center rounded-xl border border-line bg-canvas-soft">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={unavailable || quantity <= 1}
            className="grid size-11 place-items-center rounded-l-xl text-muted transition hover:text-cream disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-9 text-center font-display text-base font-bold tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(20, value + 1))}
            disabled={unavailable}
            className="grid size-11 place-items-center rounded-r-xl text-muted transition hover:text-cream disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>

        <motion.button
          type="button"
          onClick={handleAdd}
          disabled={unavailable}
          whileTap={unavailable ? undefined : { scale: 0.97 }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition",
            unavailable
              ? "cursor-not-allowed bg-surface-3 text-faint"
              : added
                ? "bg-jade-500 text-canvas"
                : "bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 text-canvas hover:brightness-110",
          )}
        >
          {added ? (
            <>
              <Check className="size-4.5" aria-hidden />
              Added to cart
            </>
          ) : (
            <>
              <ShoppingBag className="size-4.5" aria-hidden />
              {unavailable ? "Currently unavailable" : "Add to cart"}
            </>
          )}
        </motion.button>
      </div>

      {unavailable ? (
        <p className="mt-4 rounded-xl border border-line bg-canvas-soft px-4 py-3 text-xs leading-relaxed text-muted">
          This dish is off the menu right now. Check back shortly — our kitchen
          changes the board every service.
        </p>
      ) : null}
    </div>
  );
}
