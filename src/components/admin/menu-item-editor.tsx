"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Plus, X } from "lucide-react";
import { saveMenuItemAction, type AdminState } from "@/app/actions/admin";
import { Spinner } from "@/components/ui/primitives";
import { cn, inputClass } from "@/lib/utils";

export type MenuItemDraft = {
  id: string;
  name: string;
  description: string;
  /** Dollars, because that's what admins type. */
  price: number;
  categoryId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isSpicy: boolean;
  isVeg: boolean;
  calories: number | null;
  prepMinutes: number;
  rating: number;
  tags: string;
};

const EMPTY: MenuItemDraft = {
  id: "",
  name: "",
  description: "",
  price: 0,
  categoryId: "",
  isAvailable: true,
  isFeatured: false,
  isSpicy: false,
  isVeg: true,
  calories: null,
  prepMinutes: 20,
  rating: 4.5,
  tags: "",
};

const INITIAL: AdminState = {};

export function MenuItemEditor({
  categories,
  draft,
}: {
  categories: { id: string; name: string }[];
  /** `null` opens a blank form; an object edits that dish. */
  draft: MenuItemDraft | null;
}) {
  const [open, setOpen] = useState(draft !== null);
  const [state, formAction, pending] = useActionState(saveMenuItemAction, INITIAL);

  // The edit target arrives as a prop, so track it during render and reopen
  // the panel when it changes. Saving redirects, so no close is needed here.
  const [lastDraftId, setLastDraftId] = useState(draft?.id ?? null);
  if ((draft?.id ?? null) !== lastDraftId) {
    setLastDraftId(draft?.id ?? null);
    setOpen(draft !== null);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-4 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110"
      >
        <Plus className="size-4" aria-hidden />
        New dish
      </button>
    );
  }

  const item = draft ?? EMPTY;
  const isEdit = Boolean(item.id);

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold">
          {isEdit ? `Edit ${item.name}` : "Add a new dish"}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-faint transition hover:text-cream"
          aria-label="Close editor"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <form action={formAction} className="mt-5">
        {isEdit ? <input type="hidden" name="id" value={item.id} /> : null}

        {state.error ? (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-chili-500/40 bg-chili-500/10 px-4 py-3 text-sm text-chili-400"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" error={state.fieldErrors?.name}>
            <input
              id="menu-name"
              name="name"
              defaultValue={item.name}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              className={cn(inputClass(Boolean(state.fieldErrors?.name)), "pl-3.5")}
            />
          </Field>

          <Field label="Category" name="categoryId" error={state.fieldErrors?.categoryId}>
            <select
              id="menu-category"
              name="categoryId"
              defaultValue={item.categoryId || categories[0]?.id || ""}
              aria-invalid={Boolean(state.fieldErrors?.categoryId)}
              className={cn(inputClass(Boolean(state.fieldErrors?.categoryId)), "pl-3.5")}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="bg-surface">
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description" name="description" error={state.fieldErrors?.description}>
              <textarea
                id="menu-description"
                name="description"
                rows={3}
                defaultValue={item.description}
                aria-invalid={Boolean(state.fieldErrors?.description)}
                className={cn(
                  inputClass(Boolean(state.fieldErrors?.description)),
                  "resize-none pl-3.5",
                )}
              />
            </Field>
          </div>

          <Field
            label="Price (USD)"
            name="price"
            error={state.fieldErrors?.price}
          >
            <input
              id="menu-price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item.price ? (item.price / 100).toFixed(2) : ""}
              aria-invalid={Boolean(state.fieldErrors?.price)}
              className={cn(inputClass(Boolean(state.fieldErrors?.price)), "pl-3.5")}
              placeholder="12.50"
            />
          </Field>

          <Field
            label="Prep minutes"
            name="prepMinutes"
            error={state.fieldErrors?.prepMinutes}
          >
            <input
              id="menu-prep"
              name="prepMinutes"
              type="number"
              min="1"
              defaultValue={item.prepMinutes}
              aria-invalid={Boolean(state.fieldErrors?.prepMinutes)}
              className={cn(inputClass(Boolean(state.fieldErrors?.prepMinutes)), "pl-3.5")}
            />
          </Field>

          <Field
            label="Calories (optional)"
            name="calories"
            error={state.fieldErrors?.calories}
          >
            <input
              id="menu-calories"
              name="calories"
              type="number"
              min="0"
              defaultValue={item.calories ?? ""}
              aria-invalid={Boolean(state.fieldErrors?.calories)}
              className={cn(inputClass(Boolean(state.fieldErrors?.calories)), "pl-3.5")}
            />
          </Field>

          <Field
            label="Rating (0–5)"
            name="rating"
            error={state.fieldErrors?.rating}
          >
            <input
              id="menu-rating"
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              defaultValue={item.rating}
              aria-invalid={Boolean(state.fieldErrors?.rating)}
              className={cn(inputClass(Boolean(state.fieldErrors?.rating)), "pl-3.5")}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Tags (comma separated)"
              name="tags"
              error={state.fieldErrors?.tags}
            >
              <input
                id="menu-tags"
                name="tags"
                defaultValue={item.tags}
                aria-invalid={Boolean(state.fieldErrors?.tags)}
                className={cn(inputClass(Boolean(state.fieldErrors?.tags)), "pl-3.5")}
                placeholder="spicy, signature, gluten-free"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
          <Toggle name="isAvailable" defaultChecked={item.isAvailable} label="Available" />
          <Toggle name="isFeatured" defaultChecked={item.isFeatured} label="Featured" />
          <Toggle name="isVeg" defaultChecked={item.isVeg} label="Vegetarian" />
          <Toggle name="isSpicy" defaultChecked={item.isSpicy} label="Spicy" />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? <Spinner /> : null}
            {isEdit ? "Save changes" : "Create dish"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold transition hover:border-line-strong"
          >
            Cancel
          </button>
        </div>

        {!isEdit ? (
          <p className="mt-4 text-xs text-faint">
            Artwork is generated automatically from the dish name, and the
            slug is derived from it too.
          </p>
        ) : null}
      </form>
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 rounded border-line bg-canvas-soft accent-ember-500"
      />
      {label}
    </label>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={`menu-${name}`}
        className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
      >
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-1.5 text-xs text-chili-400">{error}</p> : null}
    </div>
  );
}