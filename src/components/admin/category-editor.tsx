"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Plus, X } from "lucide-react";
import { saveCategoryAction, type AdminState } from "@/app/actions/admin";
import { CATEGORY_ICON_CHOICES } from "@/components/category-icon";
import { Spinner } from "@/components/ui/primitives";
import { cn, inputClass } from "@/lib/utils";

export type CategoryDraft = {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  sortOrder: number;
};

const INITIAL: AdminState = {};

export function CategoryEditor({
  draft,
  isOpen,
  onOpen,
  onClose,
}: {
  draft: CategoryDraft | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveCategoryAction, INITIAL);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-4 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110"
      >
        <Plus className="size-4" aria-hidden />
        New category
      </button>
    );
  }

  const isEdit = Boolean(draft);

  return (
    <form
      action={formAction}
      className="mb-5 rounded-2xl border border-line bg-surface p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold">
          {isEdit ? `Edit ${draft!.name}` : "New category"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-faint transition hover:text-cream"
          aria-label="Close editor"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {isEdit ? <input type="hidden" name="id" value={draft!.id} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-chili-500/40 bg-chili-500/10 px-4 py-3 text-sm text-chili-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="category-name"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Name
          </label>
          <input
            id="category-name"
            name="name"
            defaultValue={draft?.name ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            className={cn(
              inputClass(Boolean(state.fieldErrors?.name)),
              "mt-2 pl-3.5",
            )}
            placeholder="Starters"
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1.5 text-xs text-chili-400">
              {state.fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="category-icon"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Icon
          </label>
          <select
            id="category-icon"
            name="icon"
            defaultValue={draft?.icon ?? CATEGORY_ICON_CHOICES[0]}
            aria-invalid={Boolean(state.fieldErrors?.icon)}
            className={cn(inputClass(Boolean(state.fieldErrors?.icon)), "mt-2 pl-3.5")}
          >
            {CATEGORY_ICON_CHOICES.map((icon) => (
              <option key={icon} value={icon} className="bg-surface">
                {icon}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="category-tagline"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Tagline (optional)
          </label>
          <input
            id="category-tagline"
            name="tagline"
            defaultValue={draft?.tagline ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.tagline)}
            className={cn(
              inputClass(Boolean(state.fieldErrors?.tagline)),
              "mt-2 pl-3.5",
            )}
            placeholder="Small plates to start"
          />
          {state.fieldErrors?.tagline ? (
            <p className="mt-1.5 text-xs text-chili-400">
              {state.fieldErrors.tagline}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="category-order"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Sort order
          </label>
          <input
            id="category-order"
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={draft?.sortOrder ?? 0}
            aria-invalid={Boolean(state.fieldErrors?.sortOrder)}
            className={cn(inputClass(Boolean(state.fieldErrors?.sortOrder)), "mt-2 pl-3.5")}
          />
          {state.fieldErrors?.sortOrder ? (
            <p className="mt-1.5 text-xs text-chili-400">
              {state.fieldErrors.sortOrder}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? <Spinner /> : <Check className="size-4" aria-hidden />}
          {isEdit ? "Save changes" : "Create category"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold transition hover:border-line-strong"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}