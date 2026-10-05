import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getOrderByNumber } from "@/lib/queries";
import { OrderDetailView } from "@/components/order/order-detail-view";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await requireAdmin();
  const { orderNumber } = await params;

  // Staff can open any order, so this lookup is deliberately not user-scoped.
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  return (
    <>
      <section className="border-b border-line bg-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-faint">
              <li>
                <Link href="/admin/orders" className="transition hover:text-cream">
                  Orders
                </Link>
              </li>
              <ChevronRight className="size-3" aria-hidden />
              <li className="flex items-center gap-1.5 truncate text-cream">
                <Package className="size-3.5" aria-hidden />
                {order.orderNumber}
              </li>
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