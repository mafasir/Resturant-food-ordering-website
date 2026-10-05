import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategories, getMenuItems } from "@/lib/queries";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse the full FeastCraft menu — starters, burgers, mains, wood-fired pizza, bowls, sides, desserts and drinks.",
};

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [categories, items] = await Promise.all([
    getCategories(),
    getMenuItems({ availableOnly: true }),
  ]);

  const initialCategory = firstValue(params.category);
  const initialQuery = firstValue(params.q);
  const initialTag = firstValue(params.tag);
  const initialSort = firstValue(params.sort);

  const validCategory = categories.some((item) => item.slug === initialCategory)
    ? initialCategory
    : "";
  const validSort = ["featured", "rating", "price-asc", "price-desc", "fastest"].includes(
    initialSort,
  )
    ? initialSort
    : "featured";

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
              <li className="text-cream">Menu</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Our menu
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Everything is cooked to order at {SITE.address.line1}. Search by
            dish or ingredient, or browse by section.
          </p>
        </div>
      </section>

      <MenuBrowser
        items={items}
        categories={categories}
        initialCategory={validCategory}
        initialQuery={initialQuery}
        initialTag={initialTag}
        initialSort={validSort}
      />
    </>
  );
}
