"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { Badge, DietaryTags, RatingStars } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import type { MenuItemView } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuItemCard({
  item,
  priority = false,
}: {
  item: MenuItemView;
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const unavailable = !item.isAvailable;

  function handleAdd() {
    addItem(item, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
    toast({
      title: `${item.name} added`,
      description:
        quantity > 1 ? `${quantity} portions added to your cart.` : "Added to your cart.",
      tone: "success",
    });
  }

  return (
    <motion.article
      whileHover={unavailable ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className={cn(
        "surface-card group relative flex h-full flex-col overflow-hidden transition-shadow duration-300",
        unavailable
          ? "opacity-70"
          : "hover:border-line-strong hover:shadow-[var(--shadow-lift)]",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt=""
          fill
          sizes="(min-width: 1280px) 22rem, (min-width: 768px) 33vw, 100vw"
          priority={priority}
          className={cn(
            "object-cover transition-transform duration-700 ease-out",
            unavailable ? "scale-100" : "group-hover:scale-105",
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas/85 via-canvas/10 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          {item.isFeatured ? (
            <Badge tone="ember" className="backdrop-blur-sm">
              Signature
            </Badge>
          ) : null}
          {unavailable ? <Badge tone="neutral">Sold out</Badge> : null}
        </div>

        <div className="absolute right-3 top-3">
          <span className="flex items-center gap-1 rounded-full bg-canvas/80 px-2.5 py-1 backdrop-blur-sm">
            <RatingStars rating={item.rating} />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-faint">
              {item.category.name}
            </p>
            <h3 className="mt-1 truncate text-base font-semibold text-cream">
              <Link
                href={`/menu/${item.slug}`}
                className="transition hover:text-ember-300 focus-visible:outline-none"
              >
                <span className="absolute inset-0" aria-hidden />
                {item.name}
              </Link>
            </h3>
          </div>
          <DietaryTags isVeg={item.isVeg} isSpicy={item.isSpicy} className="mt-1 shrink-0" />
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {item.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-display text-lg font-bold text-gold-300">
            {formatMoney(item.price)}
          </span>
          <span className="text-xs text-faint">{item.prepMinutes} min</span>
        </div>

        <div className="relative z-10 mt-4 flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-line bg-canvas-soft">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={unavailable || quantity <= 1}
              className="grid size-9 place-items-center rounded-l-xl text-muted transition hover:text-cream disabled:opacity-40"
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus className="size-3.5" aria-hidden />
            </button>
            <span
              className="w-7 text-center text-sm font-semibold tabular-nums"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              disabled={unavailable}
              className="grid size-9 place-items-center rounded-r-xl text-muted transition hover:text-cream disabled:opacity-40"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={unavailable}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
              unavailable
                ? "cursor-not-allowed bg-surface-3 text-faint"
                : justAdded
                  ? "bg-jade-500 text-canvas"
                  : "bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 text-canvas hover:brightness-110",
            )}
          >
            {justAdded ? (
              <>
                <Check className="size-4" aria-hidden />
                Added
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" aria-hidden />
                {unavailable ? "Sold out" : "Add"}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
