import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review your FeastCraft order before checkout.",
};

export default function CartPage() {
  return (
    <>
      <section className="border-b border-line bg-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-faint">
              <li>
                <Link href="/" className="transition hover:text-cream">
                  Home
                </Link>
              </li>
              <ChevronRight className="size-3" aria-hidden />
              <li className="text-cream">Cart</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your cart
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted">
            Adjust quantities, add notes for the kitchen, then head to checkout.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CartView />
      </div>
    </>
  );
}