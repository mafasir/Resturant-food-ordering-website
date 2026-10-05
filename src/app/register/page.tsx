import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { RegisterForm } from "@/components/auth/register-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";

  if (user) redirect(next);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16">
      <div className="text-center">
        <Link href="/" className="inline-flex justify-center">
          <LogoMark className="size-11" />
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Save addresses, keep your order history and get first access to new
          dishes.
        </p>
      </div>

      <div className="surface-card mt-8 p-6">
        <RegisterForm next={next} />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-faint">
        You can also check out as a guest — an account is only needed to track
        orders.
      </p>
    </div>
  );
}