"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Mail, Phone, User } from "lucide-react";
import { Spinner } from "@/components/ui/primitives";
import { registerAction, type AuthState } from "@/app/actions/auth";
import { inputClass } from "@/lib/utils";

const INITIAL: AuthState = {};

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(registerAction, INITIAL);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-chili-500/40 bg-chili-500/10 px-4 py-3 text-sm text-chili-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="name"
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
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
            className={inputClass(Boolean(state.fieldErrors?.name))}
            placeholder="Alex Mercer"
          />
        </div>
        {state.fieldErrors?.name ? (
          <p className="mt-1.5 text-xs text-chili-400">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="register-email"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
        >
          Email
        </label>
        <div className="relative mt-2">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className={inputClass(Boolean(state.fieldErrors?.email))}
            placeholder="you@example.com"
          />
        </div>
        {state.fieldErrors?.email ? (
          <p className="mt-1.5 text-xs text-chili-400">{state.fieldErrors.email}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="phone"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
        >
          Phone <span className="text-faint normal-case">(optional)</span>
        </label>
        <div className="relative mt-2">
          <Phone
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            className={inputClass(Boolean(state.fieldErrors?.phone))}
            placeholder="+1 555 010 4477"
          />
        </div>
        {state.fieldErrors?.phone ? (
          <p className="mt-1.5 text-xs text-chili-400">{state.fieldErrors.phone}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="register-password"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
        >
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            className={inputClass(
              Boolean(state.fieldErrors?.password),
              "pr-11",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition hover:text-cream"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {state.fieldErrors?.password ? (
          <p className="mt-1.5 text-xs text-chili-400">{state.fieldErrors.password}</p>
        ) : (
          <p className="mt-1.5 text-xs text-faint">At least 8 characters</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 px-5 py-3 text-sm font-bold text-canvas transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-semibold text-ember-400 transition hover:text-ember-300"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}