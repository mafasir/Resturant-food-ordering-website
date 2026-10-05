import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · FeastCraft Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gate â€” the nav is only ever rendered for a real admin.
  const user = await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-400">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Kitchen control
          </h1>
        </div>
        <p className="text-sm text-muted">
          Signed in as{" "}
          <span className="font-semibold text-cream">{user.name}</span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[13rem_1fr] lg:items-start">
        <nav aria-label="Admin sections" className="lg:sticky lg:top-24">
          <AdminNav />
          <p className="mt-6 hidden rounded-xl border border-line bg-surface-2 p-4 text-xs leading-relaxed text-faint lg:block">
            Price changes, availability toggles and order status updates all take
            effect immediately for customers.
          </p>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}