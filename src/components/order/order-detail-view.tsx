import Image from "next/image";
import { Bike, Clock, Home, PackageCheck, Store } from "lucide-react";
import { OrderTimeline } from "@/components/order-timeline";
import { Badge } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS, type OrderView } from "@/lib/types";
import { SITE } from "@/lib/site";

/**
 * Full order breakdown — shared by the post-checkout confirmation page and the
 * order history detail page so both always render identical figures.
 */
export function OrderDetailView({ order }: { order: OrderView }) {
  const isPickup = order.fulfilment === "PICKUP";
  const paid = order.paymentStatus === "PAID";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="space-y-6">
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">
              Order
            </p>
            <p className="mt-1 font-display text-xl font-extrabold">
              {order.orderNumber}
            </p>
            <p className="mt-1 text-xs text-faint">
              Placed{" "}
              {new Date(order.placedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              tone={
                paid ? "jade" : order.paymentStatus === "FAILED" ? "chili" : "gold"
              }
            >
              {paid ? "Paid" : ORDER_STATUS_LABELS[order.status]}
            </Badge>
            <span className="text-xs text-faint">
              {order.paymentMethod === "CASH_ON_DELIVERY"
                ? "Cash on delivery"
                : "Card"}
            </span>
          </div>
        </div>

        <OrderTimeline order={order} />

        <section className="surface-card p-6">
          <h2 className="font-display text-lg font-bold">Your items</h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3.5">
                {item.image ? (
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-line">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="3.5rem"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-surface-3 text-faint">
                    <span className="text-xs font-bold">×{item.quantity}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-cream">
                    {item.name}
                  </p>
                  {item.notes ? (
                    <p className="truncate text-xs text-faint">“{item.notes}”</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-faint">×{item.quantity}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-gold-300">
                  {formatMoney(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            <Line label="Subtotal" value={formatMoney(order.subtotal)} />
            {order.discount > 0 ? (
              <Line
                label={`Discount${order.promoCode ? ` · ${order.promoCode}` : ""}`}
                value={`− ${formatMoney(order.discount)}`}
                accent="text-jade-400"
              />
            ) : null}
            <Line
              label={isPickup ? "Pickup" : "Delivery"}
              value={
                order.deliveryFee === 0 ? "Free" : formatMoney(order.deliveryFee)
              }
            />
            <Line label="Tax" value={formatMoney(order.tax)} />
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-xl font-extrabold tabular-nums">
                {formatMoney(order.total)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            {isPickup ? (
              <Store className="size-4 text-ember-400" aria-hidden />
            ) : (
              <Home className="size-4 text-ember-400" aria-hidden />
            )}
            {isPickup ? "Pickup location" : "Delivering to"}
          </h2>
          {isPickup ? (
            <address className="mt-3 text-sm not-italic leading-relaxed text-muted">
              <span className="block font-medium text-cream">
                FeastCraft Kitchen
              </span>
              {SITE.address.line1}
              <br />
              {SITE.address.city}, {SITE.address.state} {SITE.address.postalCode}
            </address>
          ) : (
            <address className="mt-3 text-sm not-italic leading-relaxed text-muted">
              <span className="block font-medium text-cream">
                {order.customerName}
              </span>
              {order.addressLine1}
              {order.addressLine2 ? (
                <>
                  <br />
                  {order.addressLine2}
                </>
              ) : null}
              <br />
              {order.city}, {order.state} {order.postalCode}
              <br />
              <span className="text-faint">{order.customerPhone}</span>
            </address>
          )}

          {order.notes ? (
            <p className="mt-4 rounded-xl border border-line bg-canvas-soft px-3.5 py-3 text-xs leading-relaxed text-muted">
              <span className="font-semibold text-cream">Your note: </span>
              {order.notes}
            </p>
          ) : null}
        </section>

        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            {order.status === "DELIVERED" ? (
              <PackageCheck className="size-4 text-ember-400" aria-hidden />
            ) : (
              <Clock className="size-4 text-ember-400" aria-hidden />
            )}
            What happens next
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {order.status === "DELIVERED"
              ? "This order was completed. We hope it hit the spot — we'd love to cook for you again."
              : isPickup
                ? "We start cooking as soon as you order. Come to the counter in about 25 minutes and quote your order number."
                : "Our riders leave the kitchen within 15 minutes and typically arrive in 30–40 minutes. You'll get a text with live status."}
          </p>
          {!isPickup && order.status !== "DELIVERED" ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
              <Bike className="size-3.5" aria-hidden />
              Average delivery time tonight: 32 minutes
            </p>
          ) : null}
        </section>
      </aside>
    </div>
  );
}

function Line({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`tabular-nums ${accent ?? "text-cream"}`}>{value}</dd>
    </div>
  );
}