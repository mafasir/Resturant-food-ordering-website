import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrderByNumber } from "@/lib/queries";
import { OrderDetailView } from "@/components/order/order-detail-view";
import { EmptyState } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await requireUser("/account/orders");
  const { orderNumber } = await params;

  // Scoped to the signed-in user, so one customer can never read another's order.
  const order = await getOrderByNumber(orderNumber, user.id);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          art="not-found"
          icon={<Package className="size-6" />}
          title="Order not found"
          description="We couldn't find that order on your account. It may belong to a different account."
          action={
            <Link
              href="/account/orders"
              className="rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110"
            >
              Back to my orders
            </Link>
          }
        />
      </div>
    );
  }

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
              <li>
                <Link href="/account/orders" className="transition hover:text-cream">
                  Orders
                </Link>
              </li>
              <ChevronRight className="size-3" aria-hidden />
              <li className="truncate text-cream">{order.orderNumber}</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {order.orderNumber}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <OrderDetailView order={order} />
      </div>
    </>
  );
}