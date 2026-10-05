import Link from "next/link";
import { AlertCircle, Pencil, Tags, Trash2 } from "lucide-react";
import { getCategories } from "@/lib/queries";
import { deleteCategoryAction } from "@/app/actions/admin";
import { CategoryIcon } from "@/components/category-icon";
import { CategoryEditorShell } from "@/components/admin/category-editor-shell";
import type { CategoryDraft } from "@/components/admin/category-editor";

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const categories = await getCategories();

  const editId = firstValue(params.edit);
  const target = categories.find((category) => category.id === editId);
  const draft: CategoryDraft | null = target
    ? {
        id: target.id,
        name: target.name,
        icon: target.icon,
        tagline: target.tagline ?? "",
        sortOrder: target.sortOrder,
      }
    : null;

  return (
    <div>
      {params.saved ? (
        <p className="mb-5 rounded-xl border border-jade-500/30 bg-jade-500/10 px-4 py-3 text-sm text-jade-400">
          Category saved.
        </p>
      ) : null}

      {params.error ? (
        <p
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-chili-500/40 bg-chili-500/10 px-4 py-3 text-sm text-chili-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {params.error}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="font-semibold text-cream">{categories.length}</span>{" "}
          categories, ordered by sort order
        </p>
        <CategoryEditorShell draft={draft} />
      </div>

      <ul className="space-y-3">
        {categories.map((category) => (
          <li key={category.id} className="surface-card flex items-center gap-4 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-3 text-ember-400">
              <CategoryIcon name={category.icon} className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold text-cream">
                {category.name}
              </p>
              <p className="mt-0.5 text-xs text-faint">
                {category.tagline ?? "No tagline"}
                {" · "}
                /{category.slug}
                {" · "}
                sort {category.sortOrder}
              </p>
            </div>

            <span className="shrink-0 text-sm tabular-nums text-muted">
              {category._count.items}{" "}
              <span className="text-xs text-faint">
                {category._count.items === 1 ? "dish" : "dishes"}
              </span>
            </span>

            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href={`/admin/categories?edit=${category.id}`}
                aria-label={`Edit ${category.name}`}
                className="rounded-lg p-2 text-faint transition hover:bg-surface-3 hover:text-ember-300"
              >
                <Pencil className="size-4" aria-hidden />
              </Link>

              {category._count.items === 0 ? (
                <form action={deleteCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <button
                    type="submit"
                    aria-label={`Delete ${category.name}`}
                    className="rounded-lg p-2 text-faint transition hover:bg-surface-3 hover:text-chili-400"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </form>
              ) : (
                <span
                  className="rounded-lg p-2 text-faint/40"
                  title="Move or delete this category's dishes first"
                >
                  <Tags className="size-4" aria-hidden />
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}