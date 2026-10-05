import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { LoginForm, DemoCredentials } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/account";
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const next = safeNext(params.next);

  if (user) redirect(next);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16">
      <div className="text-center">
        <Link href="/" className="inline-flex justify-center">
          <LogoMark className="size-11" />
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to track orders and check out faster.
        </p>
      </div>

      <div className="surface-card mt-8 p-6">
        <LoginForm next={next} />
      </div>

      <DemoCredentials />

      <Link
        href="/menu"
        className="mt-6 text-center text-xs text-faint transition hover:text-cream"
      >
        ← Continue as guest
      </Link>
    </div>
  );
}