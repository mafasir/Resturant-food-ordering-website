import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  ChevronRight,
  MapPin,
  Package,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserOrders } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS, type OrderView } from "@/lib/types";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

const STATUS_TONE = {
  PENDING: "gold",
  CONFIRMED: "ember",
  PREPARING: "ember",
  OUT_FOR_DELIVERY: "gold",
  DELIVERED: "jade",
  CANCELLED: "chili",
} as const;

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/account/orders");
  const params = await searchParams;
  const filter = Array.isArray(params.filter) ? params.filter[0] : params.filter;

  const orders = await getUserOrders(user.id);
  const visible =
    filter === "active"
      ? orders.filter(
          (order) => order.status !== "DELIVERED" && order.status !== "CANCELLED",
        )
      : orders;

  return (
    <>
      <section className="border-b border-line bg-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-faint">
              <li>
                <Link href="/account" className="transition hover:text-cream">
                  Account
                </Link>
              </li>
              <ChevronRight className="size-3" aria-hidden />
              <li className="text-cream">Orders</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            My orders
          </h1>
          <p className="mt-3 text-base text-muted">
            {orders.length === 0
              ? "You haven't ordered yet."
              : `${orders.length} order${orders.length === 1 ? "" : "s"} placed with FeastCraft.`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {orders.length > 0 ? (
          <div className="mb-6 flex gap-2">
            {[
              { value: "", label: "All orders" },
              { value: "active", label: "In progress" },
            ].map((option) => (
              <Link
                key={option.value || "all"}
                href={option.value ? `/account/orders?filter=${option.value}` : "/account/orders"}
                aria-pressed={(filter ?? "") === option.value}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold transition",
                  (filter ?? "") === option.value
                    ? "border-ember-500/60 bg-ember-500/15 text-ember-300"
                    : "border-line bg-surface text-muted hover:border-line-strong hover:text-cream",
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            art="orders"
            icon={<Package className="size-6" />}
            title={orders.length === 0 ? "No orders yet" : "Nothing in progress"}
            description={
              orders.length === 0
                ? "Once you place an order it will appear here with live status updates."
                : "You don't have any orders on the go right now."
            }
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
        ) : (
          <ul className="space-y-4">
            {visible.map((order) => (
              <li key={order.id}>
                <OrderRow order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function OrderRow({ order }: { order: OrderView }) {
  const isPickup = order.fulfilment === "PICKUP";
  const itemSummary = order.items
    .slice(0, 3)
    .map((item) => `${item.quantity}Ã— ${item.name}`)
    .join(", ");

  return (
    <Link
      href={`/account/orders/${order.orderNumber}`}
      className="group block rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-display text-base font-bold text-cream transition group-hover:text-ember-300">
              {order.orderNumber}
            </span>
            <Badge tone={STATUS_TONE[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
            <Badge tone="outline">
              {isPickup ? (
                <Store className="size-3" aria-hidden />
              ) : (
                <Bike className="size-3" aria-hidden />
              )}
              {isPickup ? "Pickup" : "Delivery"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            {new Date(order.placedAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        <div className="text-right">
          <p className="font-display text-lg font-extrabold tabular-nums text-gold-300">
            {formatMoney(order.total)}
          </p>
          <p className="text-xs text-faint">
            {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
        <UtensilsCrossed className="size-3.5 shrink-0 text-faint" aria-hidden />
        <span className="truncate">
          {itemSummary}
          {order.items.length > 3
            ? ` + ${order.items.length - 3} more`
            : ""}
        </span>
      </div>

      {!isPickup ? (
        <p className="mt-2 flex items-center gap-2 text-xs text-faint">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {order.addressLine1}, {order.city}
          </span>
        </p>
      ) : null}
    </Link>
  );
}