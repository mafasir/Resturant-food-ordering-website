import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  Lock,
  Mail,
  Package,
  User,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAddresses, getUserOrders } from "@/lib/queries";
import { AddressBook } from "@/components/account/address-book";
import { ProfileForm } from "@/components/account/profile-form";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/account");
  const params = await searchParams;

  const [profile, addresses, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, phone: true, createdAt: true },
    }),
    getUserAddresses(user.id),
    getUserOrders(user.id),
  ]);

  const recent = orders.slice(0, 3);
  const lifetimeSpend = orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <>
      <section className="border-b border-line bg-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-400">
                My account
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                {user.name}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <Mail className="size-3.5" aria-hidden />
                {user.email}
                {user.role === "ADMIN" ? (
                  <Badge tone="ember" className="ml-2">
                    <LayoutDashboard className="size-3" aria-hidden />
                    Admin
                  </Badge>
                ) : null}
              </p>
            </div>

            <div className="flex gap-6">
              <Stat label="Orders" value={String(orders.length)} />
              <Stat label="Lifetime spend" value={formatMoney(lifetimeSpend)} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {params.saved === "profile" ? (
          <p className="mb-6 flex items-center gap-2 rounded-xl border border-jade-500/30 bg-jade-500/10 px-4 py-3 text-sm text-jade-400">
            Your profile has been updated.
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="surface-card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <User className="size-4 text-ember-400" aria-hidden />
                Profile
              </h2>
              <ProfileForm
                defaultName={profile?.name ?? user.name}
                defaultPhone={profile?.phone ?? ""}
                memberSince={profile?.createdAt ?? new Date()}
              />
            </section>

            <AddressBook addresses={addresses} />
          </div>

          <aside className="space-y-6">
            <section className="surface-card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Package className="size-4 text-ember-400" aria-hidden />
                Recent orders
              </h2>

              {recent.length === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    art="orders"
                    compact
                    icon={<Package className="size-5" />}
                    title="No orders yet"
                    description="Your order history will show up here."
                    action={
                      <Link
                        href="/menu"
                        className="rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-4 py-2 text-xs font-bold text-canvas transition hover:brightness-110"
                      >
                        Order now
                      </Link>
                    }
                  />
                </div>
              ) : (
                <>
                  <ul className="mt-5 space-y-3">
                    {recent.map((order) => (
                      <li key={order.id}>
                        <Link
                          href={`/account/orders/${order.orderNumber}`}
                          className="group block rounded-xl border border-line bg-canvas-soft px-4 py-3 transition hover:border-line-strong"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-cream transition group-hover:text-ember-300">
                              {order.orderNumber}
                            </span>
                            <span className="text-sm font-semibold tabular-nums text-gold-300">
                              {formatMoney(order.total)}
                            </span>
                          </div>
                          <p className="mt-1 text-[0.7rem] text-faint">
                            {new Date(order.placedAt).toLocaleDateString("en-US", {
                              dateStyle: "medium",
                            })}{" "}
                            · {ORDER_STATUS_LABELS[order.status]}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {orders.length > recent.length ? (
                    <Link
                      href="/account/orders"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ember-400 transition hover:text-ember-300"
                    >
                      View all {orders.length} orders
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  ) : null}
                </>
              )}
            </section>

            <section className="surface-card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Lock className="size-4 text-ember-400" aria-hidden />
                Security
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Your password is hashed with bcrypt and never stored in plain
                text. Sessions use signed, httpOnly cookies.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">
        {value}
      </p>
    </div>
  );
}