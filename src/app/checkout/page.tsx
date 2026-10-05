import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getSessionUser } from "@/lib/auth";
import { getUserAddresses } from "@/lib/queries";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your FeastCraft order.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await getSessionUser();
  const addresses = user ? await getUserAddresses(user.id) : [];

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
              <li>
                <Link href="/cart" className="transition hover:text-cream">
                  Cart
                </Link>
              </li>
              <ChevronRight className="size-3" aria-hidden />
              <li className="text-cream">Checkout</li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Checkout
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-faint">
              <Lock className="size-3" aria-hidden />
              Encrypted
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-base text-muted">
            {user
              ? `Signed in as ${user.email}.`
              : "Checking out as a guest — create an account afterwards to track this order."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CheckoutForm
          user={user}
          addresses={addresses.map((address) => ({
            id: address.id,
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            isDefault: address.isDefault,
          }))}
          stripeEnabled={isStripeConfigured()}
        />
      </div>
    </>
  );
}