import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Flame, Gauge, Star, UtensilsCrossed } from "lucide-react";
import { getMenuItemBySlug, getRelatedItems } from "@/lib/queries";
import { ItemPurchasePanel } from "@/components/menu/item-purchase-panel";
import { MenuItemCard } from "@/components/menu-item-card";
import { Reveal } from "@/components/ui/reveal";
import { Badge, DietaryTags, SectionHeading } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";

type PageParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getMenuItemBySlug(slug);
  if (!item) return { title: "Dish not found" };

  return {
    title: item.name,
    description: item.description,
    openGraph: {
      title: `${item.name} · FeastCraft`,
      description: item.description,
      images: [{ url: item.image }],
    },
  };
}

export default async function MenuItemPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const item = await getMenuItemBySlug(slug);

  if (!item) notFound();

  const related = await getRelatedItems(item.categoryId, item.id);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-faint">
            <li>
              <Link href="/" className="transition hover:text-cream">
                Home
              </Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li>
              <Link href="/menu" className="transition hover:text-cream">
                Menu
              </Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li>
              <Link
                href={`/menu?category=${item.category.slug}`}
                className="transition hover:text-cream"
              >
                {item.category.name}
              </Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li className="truncate text-cream">{item.name}</li>
          </ol>
        </nav>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-12">
        <Reveal className="relative">
          <div className="surface-card relative aspect-[4/3] overflow-hidden lg:sticky lg:top-24">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(min-width: 1024px) 40rem, 100vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-canvas/70 via-transparent to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {item.isFeatured ? <Badge tone="ember">Signature</Badge> : null}
              {item.isSpicy ? <Badge tone="chili">Spicy</Badge> : null}
              {item.isVeg ? <Badge tone="jade">Vegetarian</Badge> : null}
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ember-400">
              <UtensilsCrossed className="size-3.5" aria-hidden />
              {item.category.name}
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {item.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-4 fill-gold-400 text-gold-400" aria-hidden />
                <span className="font-semibold text-gold-300">
                  {item.rating.toFixed(1)}
                </span>
                <span className="text-faint">rating</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Clock className="size-4 text-faint" aria-hidden />
                {item.prepMinutes} minutes
              </span>
              {item.calories ? (
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Gauge className="size-4 text-faint" aria-hidden />
                  {item.calories} kcal
                </span>
              ) : null}
              <DietaryTags isVeg={item.isVeg} isSpicy={item.isSpicy} />
            </div>

            <p className="mt-6 text-lg leading-relaxed text-muted">
              {item.description}
            </p>

            {item.tags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </Reveal>

          <Reveal delay={0.1} className="mt-8">
            <ItemPurchasePanel item={item} />
          </Reveal>

          {related.length > 0 ? (
            <div className="mt-10 border-t border-line pt-8">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-faint">
                <Flame className="size-3.5 text-ember-400" aria-hidden />
                More from {item.category.name}
              </p>
              <ul className="mt-4 space-y-2">
                {related.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      href={`/menu/${sibling.slug}`}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-line-strong"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-cream transition group-hover:text-ember-300">
                          {sibling.name}
                        </span>
                        <span className="block text-xs text-faint">
                          {sibling.prepMinutes} min · ★ {sibling.rating.toFixed(1)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-gold-300">
                        {formatMoney(sibling.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading title="You might also like" />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((sibling, index) => (
              <Reveal key={sibling.id} delay={index * 0.06}>
                <MenuItemCard item={sibling} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
