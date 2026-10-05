"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addressSchema, fieldErrors } from "@/lib/validation";

export type AddressState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveAddressAction(
  _prevState: AddressState,
  formData: FormData,
): Promise<AddressState> {
  const user = await requireUser("/account");

  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    isDefault: formData.get("isDefault") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      // Only one address can be the default.
      await tx.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }
    await tx.address.create({
      data: {
        userId: user.id,
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        isDefault: data.isDefault,
      },
    });
  });

  revalidatePath("/account");
  return {};
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await requireUser("/account");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  // Scoped by userId so a crafted id can't remove somebody else's address.
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/account");
}

export async function makeDefaultAddressAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser("/account");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
    await tx.address.updateMany({
      where: { id, userId: user.id },
      data: { isDefault: true },
    });
  });

  revalidatePath("/account");
}

export async function updateProfileAction(
  _prevState: AddressState,
  formData: FormData,
): Promise<AddressState> {
  const user = await requireUser("/account");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (name.length < 2 || name.length > 60) {
    return { fieldErrors: { name: "Name must be between 2 and 60 characters" } };
  }
  if (phone && (phone.length < 6 || phone.length > 24)) {
    return { fieldErrors: { phone: "Enter a valid phone number" } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone: phone || null },
  });

  revalidatePath("/account");
  redirect("/account?saved=profile");
}