"use client";

import { motion } from "framer-motion";
import { Check, Clock, PackageCheck, Bike, Home, XCircle } from "lucide-react";
import {
  ORDER_STATUS_LABELS,
  ORDER_TRACKING_STEPS,
  type OrderStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<OrderStatus, React.ReactNode> = {
  PENDING: <Clock className="size-4" aria-hidden />,
  CONFIRMED: <Check className="size-4" aria-hidden />,
  PREPARING: <PackageCheck className="size-4" aria-hidden />,
  OUT_FOR_DELIVERY: <Bike className="size-4" aria-hidden />,
  DELIVERED: <Home className="size-4" aria-hidden />,
  CANCELLED: <XCircle className="size-4" aria-hidden />,
};

/** Steps that make sense for the chosen fulfilment method. */
function stepsFor(fulfilment: string): OrderStatus[] {
  if (fulfilment === "PICKUP") {
    return ORDER_TRACKING_STEPS.filter((step) => step !== "OUT_FOR_DELIVERY");
  }
  return ORDER_TRACKING_STEPS;
}

export function OrderTimeline({
  order,
}: {
  order: { status: string; fulfilment: string; placedAt: Date | string };
}) {
  const status = order.status as OrderStatus;
  const cancelled = status === "CANCELLED";
  const steps = stepsFor(order.fulfilment);
  const currentIndex = steps.indexOf(status);

  if (cancelled) {
    return (
      <div className="surface-card flex items-center gap-4 p-6">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-chili-500/15 text-chili-400">
          <XCircle className="size-5" aria-hidden />
        </div>
        <div>
          <p className="font-semibold text-chili-400">This order was cancelled</p>
          <p className="text-sm text-muted">
            Any payment taken will be refunded to your original method within 5–10
            business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="surface-card p-6">
      <h2 className="font-display text-lg font-bold">Order status</h2>
      <p className="mt-1 text-xs text-faint">
        Placed{" "}
        {new Date(order.placedAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>

      <ol className="mt-6 space-y-0">
        {steps.map((step, index) => {
          const done = currentIndex >= index;
          const active = currentIndex === index;
          const last = index === steps.length - 1;

          return (
            <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
              {!last ? (
                <span className="absolute left-[0.9375rem] top-8 h-[calc(100%-1rem)] w-0.5 bg-line">
                  <motion.span
                    className="block w-full bg-gradient-to-b from-jade-500 to-ember-500"
                    initial={{ height: 0 }}
                    animate={{ height: done ? "100%" : 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </span>
              ) : null}

              <motion.span
                initial={{ scale: 0.7, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.08 }}
                className={cn(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border transition",
                  done
                    ? "border-jade-500/60 bg-jade-500/20 text-jade-400"
                    : "border-line bg-surface text-faint",
                  active && "ring-4 ring-jade-500/10",
                )}
              >
                {STEP_ICONS[step]}
              </motion.span>

              <div className="min-w-0 pt-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    done ? "text-cream" : "text-faint",
                  )}
                >
                  {ORDER_STATUS_LABELS[step]}
                </p>
                {active ? (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-0.5 text-xs text-jade-400"
                  >
                    Happening now
                  </motion.p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}