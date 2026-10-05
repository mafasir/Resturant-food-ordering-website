"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Lock, User } from "lucide-react";
import { updateProfileAction, type AddressState } from "@/app/actions/account";
import { Spinner } from "@/components/ui/primitives";
import { cn, inputClass } from "@/lib/utils";

const INITIAL: AddressState = {};

export function ProfileForm({
  defaultName,
  defaultPhone,
  memberSince,
}: {
  defaultName: string;
  defaultPhone: string;
  memberSince: Date;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, INITIAL);

  return (
    <form action={formAction} className="mt-5">
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
        <div>
          <label
            htmlFor="profile-name"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Full name
          </label>
          <div className="relative mt-2">
            <User
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
              aria-hidden
            />
            <input
              id="profile-name"
              name="name"
              defaultValue={defaultName}
              autoComplete="name"
              aria-invalid={Boolean(state.fieldErrors?.name)}
              className={inputClass(Boolean(state.fieldErrors?.name))}
            />
          </div>
          {state.fieldErrors?.name ? (
            <p className="mt-1.5 text-xs text-chili-400">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="profile-phone"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
          >
            Phone <span className="normal-case">(optional)</span>
          </label>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            defaultValue={defaultPhone}
            autoComplete="tel"
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            className={cn(
              inputClass(Boolean(state.fieldErrors?.phone)),
              "mt-2 pl-3.5",
            )}
          />
          {state.fieldErrors?.phone ? (
            <p className="mt-1.5 text-xs text-chili-400">{state.fieldErrors.phone}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-faint">
          Member since{" "}
          {new Date(memberSince).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-2.5 text-sm font-bold text-canvas transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? <Spinner /> : <Check className="size-4" aria-hidden />}
          Save changes
        </button>
      </div>

      <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs text-faint">
        <Lock className="size-3.5" aria-hidden />
        Email changes require contacting support@feastcraft.test
      </p>
    </form>
  );
}