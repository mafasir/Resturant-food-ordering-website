"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Mail } from "lucide-react";
import { Spinner } from "@/components/ui/primitives";
import { loginAction, type AuthState } from "@/app/actions/auth";
import { inputClass } from "@/lib/utils";

const INITIAL: AuthState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);
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
          htmlFor="email"
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
            id="email"
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
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
        >
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
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
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 px-5 py-3 text-sm font-bold text-canvas transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Signing inâ€¦" : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted">
        New to FeastCraft?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="font-semibold text-ember-400 transition hover:text-ember-300"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

/** Demo credentials shown on the login screen for reviewers. */
export function DemoCredentials() {
  return (
    <div className="mt-6 rounded-xl border border-line bg-canvas-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
        Demo accounts
      </p>
      <dl className="mt-3 space-y-2 text-xs">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Customer</dt>
          <dd className="font-mono text-muted">
            demo@feastcraft.test Â· customer1234
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Admin</dt>
          <dd className="font-mono text-muted">
            admin@feastcraft.test Â· admin1234
          </dd>
        </div>
      </dl>
    </div>
  );
}