"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, Plus, X } from "lucide-react";
import { savePromoAction, type AdminState } from "@/app/actions/admin";
import { Spinner } from "@/components/ui/primitives";
import { cn, inputClass } from "@/lib/utils";

export type PromoDraft = {
  id: string;
  code: string;
  description: string;
  discountType: string;
  /** Dollars for FIXED codes, percent for PERCENT. */
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  expiresAt: string;
  active: boolean;
};

const INITIAL: AdminState = {};

export function PromoEditor({
  draft,
  isOpen,
  onOpen,
  onClose,
}: {
  draft: PromoDraft | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(savePromoAction, INITIAL);
  const [type, setType] = useState(draft?.discountType ?? "PERCENT");

  // The discount unit depends on the code being edited, so track which one is
  // loaded and reset the type during render when it changes.
  const [lastDraftId, setLastDraftId] = useState(draft?.id ?? null);
  if ((draft?.id ?? null) !== lastDraftId) {
    setLastDraftId(draft?.id ?? null);
    setType(draft?.discountType ?? "PERCENT");
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-4 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110"
      >
        <Plus className="size-4" aria-hidden />
        New promo code
      </button>
    );
  }

  const isEdit = Boolean(draft);
  const isFixed = type === "FIXED";

  return (
    <form
      action={formAction}
      className="mb-5 rounded-2xl border border-line bg-surface p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold">
          {isEdit ? `Edit ${draft!.code}` : "New promo code"}
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
            htmlFor="promo-code"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Code
          </label>
          <input
            id="promo-code"
            name="code"
            defaultValue={draft?.code ?? ""}
            placeholder="SUMMER20"
            aria-invalid={Boolean(state.fieldErrors?.code)}
            className={cn(
              inputClass(Boolean(state.fieldErrors?.code)),
              "mt-2 pl-3.5 font-mono uppercase tracking-wide",
            )}
          />
          {state.fieldErrors?.code ? (
            <p className="mt-1.5 text-xs text-chili-400">{state.fieldErrors.code}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="promo-type"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Discount type
          </label>
          <select
            id="promo-type"
            name="discountType"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="input-class mt-2 w-full rounded-xl border border-line bg-canvas-soft px-3.5 py-2.5 text-sm text-cream transition focus:border-ember-500/60 focus:outline-none"
          >
            <option value="PERCENT" className="bg-surface">
              Percentage off
            </option>
            <option value="FIXED" className="bg-surface">
              Fixed amount off
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="promo-value"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            {isFixed ? "Amount off (USD)" : "Percentage off"}
          </label>
          <input
            id="promo-value"
            name="discountValue"
            type="number"
            min="1"
            step="0.01"
            defaultValue={
              draft
                ? isFixed
                  ? (draft.discountValue / 100).toFixed(2)
                  : draft.discountValue
                : ""
            }
            aria-invalid={Boolean(state.fieldErrors?.discountValue)}
            className={cn(
              inputClass(Boolean(state.fieldErrors?.discountValue)),
              "mt-2 pl-3.5",
            )}
          />
          {state.fieldErrors?.discountValue ? (
            <p className="mt-1.5 text-xs text-chili-400">
              {state.fieldErrors.discountValue}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="promo-min"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Minimum order (USD)
          </label>
          <input
            id="promo-min"
            name="minOrderAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={
              draft ? (draft.minOrderAmount / 100).toFixed(2) : "0.00"
            }
            className={cn(inputClass(false), "mt-2 pl-3.5")}
          />
        </div>

        {isFixed ? (
          <div>
            <label
              htmlFor="promo-max"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
            >
              Max discount (USD, optional)
            </label>
            <input
              id="promo-max"
              name="maxDiscount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                draft?.maxDiscount ? (draft.maxDiscount / 100).toFixed(2) : ""
              }
              className={cn(inputClass(false), "mt-2 pl-3.5")}
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="promo-max-percent"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
            >
              Max discount (USD, optional)
            </label>
            <input
              id="promo-max-percent"
              name="maxDiscount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                draft?.maxDiscount ? (draft.maxDiscount / 100).toFixed(2) : ""
              }
              className={cn(inputClass(false), "mt-2 pl-3.5")}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="promo-limit"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Usage limit (optional)
          </label>
          <input
            id="promo-limit"
            name="usageLimit"
            type="number"
            min="1"
            defaultValue={draft?.usageLimit ?? ""}
            className={cn(inputClass(false), "mt-2 pl-3.5")}
          />
        </div>

        <div>
          <label
            htmlFor="promo-expiry"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Expires (optional)
          </label>
          <input
            id="promo-expiry"
            name="expiresAt"
            type="date"
            defaultValue={draft?.expiresAt ?? ""}
            className={cn(inputClass(false), "mt-2 pl-3.5")}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="promo-description"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Description (shown to customers)
          </label>
          <input
            id="promo-description"
            name="description"
            defaultValue={draft?.description ?? ""}
            className={cn(inputClass(false), "mt-2 pl-3.5")}
            placeholder="10% off your first order"
          />
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-muted">
        <input
          type="checkbox"
          name="active"
          defaultChecked={draft?.active ?? true}
          className="size-4 rounded border-line bg-canvas-soft accent-ember-500"
        />
        Active and redeemable
      </label>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? <Spinner /> : <Check className="size-4" aria-hidden />}
          {isEdit ? "Save changes" : "Create promo code"}
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