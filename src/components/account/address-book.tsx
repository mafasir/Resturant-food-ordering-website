"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, MapPin, Plus, Star, Trash2 } from "lucide-react";
import {
  deleteAddressAction,
  makeDefaultAddressAction,
  saveAddressAction,
  type AddressState,
} from "@/app/actions/account";
import { EmptyArt } from "@/components/empty-art";
import { Spinner } from "@/components/ui/primitives";
import { inputClass } from "@/lib/utils";
import { cn } from "@/lib/utils";

const INITIAL: AddressState = {};
/** Marks the first render, before any submission has happened. */
const FIRST_RENDER = Symbol("first-render");

export function AddressBook({
  addresses,
}: {
  addresses: {
    id: string;
    label: string;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    isDefault: boolean;
  }[];
}) {
  const [adding, setAdding] = useState(addresses.length === 0);

  return (
    <section className="surface-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <MapPin className="size-4 text-ember-400" aria-hidden />
          Saved addresses
        </h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold transition hover:border-line-strong"
          >
            <Plus className="size-3.5" aria-hidden />
            Add address
          </button>
        ) : null}
      </div>

      {addresses.length > 0 ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "rounded-xl border p-4",
                address.isDefault
                  ? "border-ember-500/50 bg-ember-500/5"
                  : "border-line bg-canvas-soft",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                  {address.label}
                  {address.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[0.6rem] text-gold-300">
                      <Star className="size-2.5 fill-gold-400 text-gold-400" aria-hidden />
                      Default
                    </span>
                  ) : null}
                </span>
                <div className="flex items-center gap-1">
                  {!address.isDefault ? (
                    <form action={makeDefaultAddressAction}>
                      <input type="hidden" name="id" value={address.id} />
                      <button
                        type="submit"
                        className="rounded-md p-1 text-faint transition hover:text-gold-300"
                        aria-label={`Make ${address.label} the default address`}
                        title="Make default"
                      >
                        <Star className="size-3.5" aria-hidden />
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="id" value={address.id} />
                    <button
                      type="submit"
                      className="rounded-md p-1 text-faint transition hover:text-chili-400"
                      aria-label={`Delete ${address.label} address`}
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </form>
                </div>
              </div>

              <p className="mt-2.5 text-sm font-medium text-cream">
                {address.fullName}
              </p>
              <address className="mt-1 text-xs not-italic leading-relaxed text-muted">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.postalCode}
                <br />
                <span className="text-faint">{address.phone}</span>
              </address>
            </li>
          ))}
        </ul>
      ) : !adding ? (
        <div className="mt-5">
          <EmptyArt variant="addresses" className="size-24" />
          <p className="mt-2 text-sm text-muted">
            No saved addresses yet. Add one to check out in two taps.
          </p>
        </div>
      ) : null}

      {adding ? <AddressForm onDone={() => setAdding(false)} /> : null}
    </section>
  );
}

function AddressForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(saveAddressAction, INITIAL);
  const [lastState, setLastState] = useState<AddressState | typeof FIRST_RENDER>(
    FIRST_RENDER,
  );

  // Only collapse once the action has actually returned a successful result,
  // tracked by identity so the untouched initial state is never mistaken for one.
  if (state !== lastState) {
    setLastState(state);
    if (!pending && !state.error && !state.fieldErrors && lastState !== FIRST_RENDER) {
      onDone();
    }
  }

  return (
    <form action={formAction} className="mt-6 border-t border-line pt-6">
      <h3 className="text-sm font-semibold text-cream">New address</h3>

      {state.error ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-chili-500/40 bg-chili-500/10 px-4 py-3 text-sm text-chili-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          label="Label"
          name="label"
          defaultValue="Home"
          error={state.fieldErrors?.label}
          required
        />
        <Field
          label="Full name"
          name="fullName"
          autoComplete="name"
          error={state.fieldErrors?.fullName}
          required
        />
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          error={state.fieldErrors?.phone}
          required
        />
        <div className="sm:col-span-2">
          <Field
            label="Address line 1"
            name="line1"
            autoComplete="address-line1"
            error={state.fieldErrors?.line1}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Apartment, suite (optional)"
            name="line2"
            autoComplete="address-line2"
            error={state.fieldErrors?.line2}
          />
        </div>
        <Field
          label="City"
          name="city"
          autoComplete="address-level2"
          error={state.fieldErrors?.city}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="State"
            name="state"
            autoComplete="address-level1"
            error={state.fieldErrors?.state}
            required
          />
          <Field
            label="Postal code"
            name="postalCode"
            autoComplete="postal-code"
            error={state.fieldErrors?.postalCode}
            required
          />
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-xs text-muted">
        <input
          type="checkbox"
          name="isDefault"
          className="size-4 rounded border-line bg-canvas-soft accent-ember-500"
        />
        Make this my default delivery address
      </label>

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? <Spinner /> : <Check className="size-4" aria-hidden />}
          Save address
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold transition hover:border-line-strong"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={`address-${name}`}
        className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
      >
        {label}
      </label>
      <input
        id={`address-${name}`}
        name={name}
        aria-invalid={Boolean(error)}
        className={cn(
          inputClass(Boolean(error)),
          "pl-3.5",
        )}
        {...rest}
      />
      {error ? <p className="mt-1.5 text-xs text-chili-400">{error}</p> : null}
    </div>
  );
}