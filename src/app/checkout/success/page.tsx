import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { toOrderView } from "@/lib/queries";
import { OrderDetailView } from "@/components/order/order-detail-view";
import { Badge } from "@/components/ui/primitives";

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = firstValue(params.order);

  if (!/^FC-[A-Z0-9]+-\d{3}$/.test(orderNumber)) notFound();

  const user = await getSessionUser();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { menuItem: { select: { image: true } } } } },
  });

  if (!order) notFound();

  // A signed-in customer must never see somebody else's order.
  if (user && order.userId && order.userId !== user.id) notFound();

  const paid = order.paymentStatus === "PAID";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-col items-center text-center">
        <div className="relative grid size-16 place-items-center rounded-2xl bg-jade-500/15 text-jade-400">
          <CheckCircle2 className="size-8" aria-hidden />
          <span className="absolute inset-0 animate-ping rounded-2xl bg-jade-500/10" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {paid ? "Order confirmed" : "Order received"}
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted">
          {paid
            ? `Thanks ${order.customerName.split(" ")[0]} — the kitchen has your ticket.`
            : "We're confirming your payment and will email you the moment it's settled."}
        </p>
        <div className="mt-5">
          <Badge tone="gold">
            <Receipt className="size-3" aria-hidden />
            {order.orderNumber}
          </Badge>
        </div>
      </div>

      <div className="mt-12">
        <OrderDetailView order={toOrderView(order)} />
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/menu"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-3 text-sm font-bold text-canvas transition hover:brightness-110"
        >
          Order something else
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href={user ? "/account/orders" : "/register?next=%2Faccount%2Forders"}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold transition hover:border-line-strong"
        >
          {user ? "View all my orders" : "Create an account to track orders"}
        </Link>
      </div>
    </div>
  );
}