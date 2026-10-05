import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Star, Trash2, UtensilsCrossed } from "lucide-react";
import { getCategories, getMenuItems } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import {
  deleteMenuItemAction,
  toggleMenuItemAction,
} from "@/app/actions/admin";
import {
  MenuItemEditor,
  type MenuItemDraft,
} from "@/components/admin/menu-item-editor";
import { Badge, DietaryTags, EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [categories, items] = await Promise.all([
    getCategories(),
    getMenuItems(),
  ]);

  const editId = firstValue(params.edit);
  const draft: MenuItemDraft | null = editId
    ? (() => {
        const item = items.find((candidate) => candidate.id === editId);
        if (!item) return null;
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          categoryId: item.categoryId,
          isAvailable: item.isAvailable,
          isFeatured: item.isFeatured,
          isSpicy: item.isSpicy,
          isVeg: item.isVeg,
          calories: item.calories,
          prepMinutes: item.prepMinutes,
          rating: item.rating,
          tags: item.tags.join(", "),
        };
      })()
    : null;

  return (
    <div>
      {params.saved ? (
        <p className="mb-5 rounded-xl border border-jade-500/30 bg-jade-500/10 px-4 py-3 text-sm text-jade-400">
          Dish saved.
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="font-semibold text-cream">{items.length}</span> dishes
          across {categories.length} categories
        </p>
        <MenuItemEditor
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          draft={draft}
        />
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "surface-card flex flex-wrap items-center gap-4 p-4",
              !item.isAvailable && "opacity-60",
            )}
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-line">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="4rem"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/menu/${item.slug}`}
                  className="font-display text-base font-bold text-cream transition hover:text-ember-300"
                >
                  {item.name}
                </Link>
                {item.isFeatured ? <Badge tone="ember">Featured</Badge> : null}
                {!item.isAvailable ? <Badge tone="chili">Hidden</Badge> : null}
                <DietaryTags isVeg={item.isVeg} isSpicy={item.isSpicy} />
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted">
                {item.description}
              </p>
              <p className="mt-1 flex items-center gap-3 text-xs text-faint">
                <span className="font-semibold text-gold-300">
                  {formatMoney(item.price)}
                </span>
                <span>{item.category.name}</span>
                <span>{item.prepMinutes} min</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3 fill-gold-400 text-gold-400" aria-hidden />
                  {item.rating.toFixed(1)}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <form action={toggleMenuItemAction}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  title={item.isAvailable ? "Hide from menu" : "Show on menu"}
                  aria-label={
                    item.isAvailable
                      ? `Hide ${item.name} from the menu`
                      : `Show ${item.name} on the menu`
                  }
                  className="rounded-lg p-2 text-faint transition hover:bg-surface-3 hover:text-cream"
                >
                  {item.isAvailable ? (
                    <Eye className="size-4" aria-hidden />
                  ) : (
                    <EyeOff className="size-4" aria-hidden />
                  )}
                </button>
              </form>

              <Link
                href={`/admin/menu?edit=${item.id}`}
                aria-label={`Edit ${item.name}`}
                className="rounded-lg p-2 text-faint transition hover:bg-surface-3 hover:text-ember-300"
              >
                <Pencil className="size-4" aria-hidden />
              </Link>

              <form action={deleteMenuItemAction}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${item.name}`}
                  className="rounded-lg p-2 text-faint transition hover:bg-surface-3 hover:text-chili-400"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <EmptyState
          art="dishes"
          compact
          icon={<UtensilsCrossed className="size-5" />}
          title="No dishes yet"
          description="Add your first one above and it will appear on the menu straight away."
        />
      ) : null}
    </div>
  );
}