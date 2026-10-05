import Link from "next/link";
import {
  AlertCircle,
  Bike,
  Phone,
  Receipt,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { getAllOrders } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/types";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const STATUS_TONE = {
  PENDING: "gold",
  CONFIRMED: "ember",
  PREPARING: "ember",
  OUT_FOR_DELIVERY: "gold",
  DELIVERED: "jade",
  CANCELLED: "chili",
} as const;

const FILTERS = [
  { value: "ALL", label: "All" },
  ...ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
];

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = firstValue(params.status) || "ALL";
  const orders = await getAllOrders(status);

  return (
    <div className="space-y-6">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((filter) => {
          const href =
            filter.value === "ALL" ? "/admin/orders" : `/admin/orders?status=${filter.value}`;
          const active = status === filter.value;

          return (
            <Link
              key={filter.value}
              href={href}
              aria-pressed={active}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition",
                active
                  ? "border-ember-500/60 bg-ember-500/15 text-ember-300"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-cream",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          art="orders"
          icon={<Receipt className="size-6" />}
          title="No orders here"
          description="Nothing matches this filter. Try 'All' to see every order."
          action={
            <Link
              href="/admin/orders"
              className="rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110"
            >
              Show all orders
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            <span className="font-semibold text-cream">{orders.length}</span> order
            {orders.length === 1 ? "" : "s"}
            {status !== "ALL" ? ` with status ${ORDER_STATUS_LABELS[status as OrderStatus]}` : ""}
          </p>

          <ul className="space-y-4">
            {orders.map((order) => {
              const isPickup = order.fulfilment === "PICKUP";
              const locked = order.status === "DELIVERED";

              return (
                <li key={order.id} className="surface-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="font-display text-base font-bold text-cream transition hover:text-ember-300"
                        >
                          {order.orderNumber}
                        </Link>
                        <Badge tone={STATUS_TONE[order.status]}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                        {order.paymentStatus === "PAID" ? (
                          <Badge tone="jade">Paid</Badge>
                        ) : order.paymentStatus === "FAILED" ? (
                          <Badge tone="chili">Payment failed</Badge>
                        ) : (
                          <Badge tone="outline">Awaiting payment</Badge>
                        )}
                        <Badge tone="outline">
                          {isPickup ? (
                            <Store className="size-3" aria-hidden />
                          ) : (
                            <Bike className="size-3" aria-hidden />
                          )}
                          {isPickup ? "Pickup" : "Delivery"}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm text-cream">
                        {order.customerName}
                        <a
                          href={`tel:${order.customerPhone.replace(/[^+\d]/g, "")}`}
                          className="ml-3 inline-flex items-center gap-1 text-xs text-faint transition hover:text-cream"
                        >
                          <Phone className="size-3" aria-hidden />
                          {order.customerPhone}
                        </a>
                      </p>

                      <p className="mt-1 text-xs text-faint">
                        {new Date(order.placedAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {!isPickup ? (
                          <>
                            {" · "}
                            {order.addressLine1}
                            {order.addressLine2 ? `, ${order.addressLine2}` : ""},{" "}
                            {order.city}, {order.state} {order.postalCode}
                          </>
                        ) : null}
                      </p>

                      {order.customerEmail ? (
                        <p className="mt-1 text-xs text-faint">
                          {order.customerEmail}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="font-display text-lg font-extrabold tabular-nums text-gold-300">
                        {formatMoney(order.total)}
                      </p>
                      <p className="text-xs text-faint">
                        {order.paymentMethod === "CASH_ON_DELIVERY"
                          ? "Cash on delivery"
                          : "Card"}
                      </p>
                    </div>
                  </div>

                  {/* Line items */}
                  <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline gap-3 text-sm"
                      >
                        <span className="w-8 shrink-0 tabular-nums text-faint">
                          {item.quantity}×
                        </span>
                        <span className="min-w-0 flex-1 truncate text-cream">
                          {item.name}
                          {item.notes ? (
                            <span className="ml-2 text-xs text-gold-300">
                              “{item.notes}”
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted">
                          {formatMoney(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-4 text-xs">
                    <div className="flex gap-1.5">
                      <dt className="text-faint">Subtotal</dt>
                      <dd className="tabular-nums text-muted">
                        {formatMoney(order.subtotal)}
                      </dd>
                    </div>
                    {order.discount > 0 ? (
                      <div className="flex gap-1.5">
                        <dt className="text-faint">
                          Discount{order.promoCode ? ` (${order.promoCode})` : ""}
                        </dt>
                        <dd className="tabular-nums text-jade-400">
                          −{formatMoney(order.discount)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex gap-1.5">
                      <dt className="text-faint">Delivery</dt>
                      <dd className="tabular-nums text-muted">
                        {order.deliveryFee === 0
                          ? "Free"
                          : formatMoney(order.deliveryFee)}
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-faint">Tax</dt>
                      <dd className="tabular-nums text-muted">
                        {formatMoney(order.tax)}
                      </dd>
                    </div>
                  </dl>

                  {order.notes ? (
                    <p className="mt-4 flex items-start gap-2 rounded-xl border border-gold-500/25 bg-gold-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-gold-300">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      <span>
                        <span className="font-semibold">Customer note: </span>
                        {order.notes}
                      </span>
                    </p>
                  ) : null}

                  {/* Status control */}
                  <form
                    action={updateOrderStatusAction}
                    className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4"
                  >
                    <input type="hidden" name="orderId" value={order.id} />
                    <label
                      htmlFor={`status-${order.id}`}
                      className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
                    >
                      Status
                    </label>
                    <select
                      id={`status-${order.id}`}
                      name="status"
                      defaultValue={order.status}
                      disabled={locked}
                      className="rounded-lg border border-line bg-canvas-soft px-3 py-1.5 text-sm text-cream transition focus:border-ember-500/60 focus:outline-none disabled:opacity-50"
                    >
                      {ORDER_STATUSES.map((option) => (
                        <option key={option} value={option}>
                          {ORDER_STATUS_LABELS[option]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={locked}
                      className="rounded-lg border border-line bg-surface px-4 py-1.5 text-xs font-semibold text-cream transition hover:border-line-strong disabled:opacity-40"
                    >
                      Update
                    </button>
                    {locked ? (
                      <span className="flex items-center gap-1.5 text-xs text-faint">
                        <UtensilsCrossed className="size-3" aria-hidden />
                        Completed orders are locked
                      </span>
                    ) : null}
                  </form>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}