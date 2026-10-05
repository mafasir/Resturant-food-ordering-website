import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Clock,
  Receipt,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { getAdminStats } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { Badge, EmptyState } from "@/components/ui/primitives";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const maxRevenue = Math.max(1, ...stats.revenueByDay.map((day) => day.revenue));

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------ KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Banknote className="size-4" />}
          label="Revenue"
          value={formatMoney(stats.revenue)}
          hint={`${stats.orderCount} orders all time`}
          accent="jade"
        />
        <KpiCard
          icon={<Clock className="size-4" />}
          label="Awaiting action"
          value={String(stats.pendingCount)}
          hint="Orders awaiting confirmation"
          accent={stats.pendingCount > 0 ? "ember" : "neutral"}
        />
        <KpiCard
          icon={<TrendingUp className="size-4" />}
          label="Average order"
          value={formatMoney(stats.averageOrderValue)}
          hint={`${stats.deliveredCount} delivered`}
          accent="gold"
        />
        <KpiCard
          icon={<Users className="size-4" />}
          label="Customers"
          value={String(stats.customerCount)}
          hint={`${stats.menuItemCount} dishes on the menu`}
          accent="neutral"
        />
      </div>

      {stats.unavailableCount > 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-300">
          <UtensilsCrossed className="size-4 shrink-0" aria-hidden />
          {stats.unavailableCount} dish
          {stats.unavailableCount === 1 ? " is" : "es are"} currently marked
          unavailable.
          <Link
            href="/admin/menu"
            className="ml-auto shrink-0 font-semibold underline underline-offset-4"
          >
            Review
          </Link>
        </p>
      ) : null}

      {/* --------------------------------------------------------- Chart row */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold">Last 7 days</h2>
            <span className="text-xs text-faint">
              {formatMoney(
                stats.revenueByDay.reduce((sum, day) => sum + day.revenue, 0),
              )}{" "}
              taken
            </span>
          </div>

          <div className="mt-8 flex h-44 items-end gap-3">
            {stats.revenueByDay.map((day) => (
              <div
                key={day.day}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="text-[0.65rem] tabular-nums text-faint">
                  {day.revenue > 0 ? formatMoney(day.revenue) : ""}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-ember-600/40 to-gold-300 transition-all duration-500"
                  style={{
                    height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%`,
                  }}
                  title={`${day.day}: ${formatMoney(day.revenue)} across ${day.orders} orders`}
                />
                <span className="text-[0.65rem] text-faint">{day.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-6">
          <h2 className="font-display text-lg font-bold">Top sellers</h2>
          {stats.topItems.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No sales recorded yet.</p>
          ) : (
            <ol className="mt-6 space-y-4">
              {stats.topItems.map((item, index) => (
                <li key={item.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-cream">
                      <span className="mr-2 text-xs tabular-nums text-faint">
                        {index + 1}
                      </span>
                      {item.name}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-gold-300">
                      {formatMoney(item.revenue)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-jade-500 to-ember-500"
                        style={{
                          width: `${(item.revenue / stats.topItems[0].revenue) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[0.65rem] text-faint">
                      {item.quantity} sold
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* ------------------------------------------------------- Recent orders */}
      <section className="surface-card p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ember-400 transition hover:text-ember-300"
          >
            Manage all orders
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              art="sales"
              compact
              icon={<Receipt className="size-5" />}
              title="No orders yet"
              description="Orders placed on the site will appear here in real time."
            />
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-line">
            {stats.recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cream">
                    {order.orderNumber}
                    <span className="ml-2 font-normal text-faint">
                      {order.customerName}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-faint">
                    {new Date(order.placedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {" · "}
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={order.status === "CANCELLED" ? "chili" : "ember"}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <span className="text-sm font-semibold tabular-nums text-gold-300">
                    {formatMoney(order.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: "jade" | "ember" | "gold" | "neutral";
}) {
  const tones = {
    jade: "bg-jade-500/15 text-jade-400",
    ember: "bg-ember-500/15 text-ember-300",
    gold: "bg-gold-500/15 text-gold-300",
    neutral: "bg-surface-3 text-muted",
  } as const;

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-3">
        <span className={`grid size-9 place-items-center rounded-lg ${tones[accent]}`}>
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
          {label}
        </span>
      </div>
      <p className="mt-4 font-display text-2xl font-extrabold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-faint">{hint}</p>
    </div>
  );
}