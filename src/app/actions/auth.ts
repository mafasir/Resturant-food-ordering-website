"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  fieldErrors,
  loginSchema,
  registerSchema,
} from "@/lib/validation";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function safeNextPath(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  // Only allow same-origin relative paths to avoid an open redirect.
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Run a hash comparison even when the user is missing so response timing
  // does not reveal which emails are registered.
  const hash =
    user?.passwordHash ??
    "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const valid = await verifyPassword(password, hash);

  if (!user || !valid) {
    return { error: "That email and password combination is not correct." };
  }

  await claimGuestOrders(user.id, user.email);
  await createSession(user);
  redirect(safeNextPath(formData.get("next")));
}

/**
 * Attaches guest orders to an account when the email matches. Checkout stores
 * the customer email even when no account exists, so this is what makes the
 * "create an account to track orders" promise true.
 */
async function claimGuestOrders(userId: string, email: string): Promise<void> {
  await prisma.order.updateMany({
    where: { userId: null, customerEmail: email.toLowerCase() },
    data: { userId },
  });
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const { name, email, phone, password } = parsed.data;
  const normalisedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalisedEmail },
    select: { id: true },
  });
  if (existing) {
    return { fieldErrors: { email: "An account already uses this email." } };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: normalisedEmail,
      phone: phone || null,
      passwordHash: await hashPassword(password),
      role: "CUSTOMER",
    },
  });

  await claimGuestOrders(user.id, user.email);
  await createSession(user);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
