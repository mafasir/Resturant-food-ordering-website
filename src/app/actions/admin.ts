"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { renderMenuArtwork } from "@/lib/menu-artwork";
import {
  categorySchema,
  dollarsToCents,
  fieldErrors,
  menuItemSchema,
  orderStatusSchema,
  promoSchema,
} from "@/lib/validation";

export type AdminState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const MENU_IMAGE_DIR = path.join(process.cwd(), "public", "images", "menu");

/**
 * Writes the generated poster for a brand new dish and returns the public path to
 * store on the row. Seeded dishes already have photography on disk, so this only
 * runs for items an admin creates by hand.
 */
async function writeFallbackArtwork(slug: string, categoryName: string) {
  await mkdir(MENU_IMAGE_DIR, { recursive: true });
  await writeFile(
    path.join(MENU_IMAGE_DIR, `${slug}.svg`),
    renderMenuArtwork(slug, categoryName),
    "utf8",
  );
  return `/images/menu/${slug}.svg`;
}

/** URL friendly slug; always regenerates so renames can't collide with history. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function formNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formBool(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

// --------------------------------------------------------------- Menu items

export async function saveMenuItemAction(
  _prevState: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = menuItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formNumber(formData.get("price")),
    categoryId: formData.get("categoryId"),
    isAvailable: formBool(formData.get("isAvailable")),
    isFeatured: formBool(formData.get("isFeatured")),
    isSpicy: formBool(formData.get("isSpicy")),
    isVeg: formBool(formData.get("isVeg")),
    calories: nullableString(formData.get("calories")),
    prepMinutes: formNumber(formData.get("prepMinutes"), 20),
    rating: formNumber(formData.get("rating"), 4.5),
    tags: formData.get("tags") ?? "",
  });

  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const data = parsed.data;
  const priceCents = dollarsToCents(data.price);

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { name: true },
  });
  if (!category) return { fieldErrors: { categoryId: "Choose a category" } };

  // Prices are entered in dollars by admins but stored in cents.
  const payload = {
    name: data.name,
    description: data.description,
    price: priceCents,
    categoryId: data.categoryId,
    isAvailable: data.isAvailable,
    isFeatured: data.isFeatured,
    isSpicy: data.isSpicy,
    isVeg: data.isVeg,
    calories: data.calories,
    prepMinutes: data.prepMinutes,
    rating: data.rating,
    tags: data.tags,
  };

  if (id) {
    await prisma.menuItem.update({ where: { id }, data: payload });
  } else {
    const baseSlug = slugify(data.name) || `dish-${Date.now()}`;
    const slug = await uniqueSlug(baseSlug);
    await prisma.menuItem.create({
      data: {
        ...payload,
        slug,
        image: await writeFallbackArtwork(slug, category.name),
      },
    });
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
  redirect("/admin/menu?saved=1");
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  // Slugs are unique, so keep appending until we find a free one.
  while (await prisma.menuItem.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function deleteMenuItemAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  // Order items keep their name and price snapshot, so history is preserved.
  await prisma.menuItem.delete({ where: { id } });

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function toggleMenuItemAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const item = await prisma.menuItem.findUnique({
    where: { id },
    select: { isAvailable: true },
  });
  if (!item) return;

  await prisma.menuItem.update({
    where: { id },
    data: { isAvailable: !item.isAvailable },
  });

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

// --------------------------------------------------------------- Categories

export async function saveCategoryAction(
  _prevState: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
    tagline: formData.get("tagline") ?? "",
    sortOrder: formNumber(formData.get("sortOrder")),
  });

  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const data = parsed.data;
  const slug = slugify(data.name);
  if (!slug) return { fieldErrors: { name: "Name must contain letters or numbers" } };

  const clash = await prisma.category.findFirst({
    where: { slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) return { fieldErrors: { name: "A category already uses that name" } };

  if (id) {
    await prisma.category.update({ where: { id }, data: { ...data, slug } });
  } else {
    await prisma.category.create({ data: { ...data, slug } });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  redirect("/admin/categories?saved=1");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(
        "Move or delete this category's dishes before removing it.",
      )}`,
    );
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
}

// --------------------------------------------------------------- Promo codes

export async function savePromoAction(
  _prevState: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = promoSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description") ?? "",
    discountType: formData.get("discountType"),
    // Percentages are sent as-is; fixed amounts arrive in dollars.
    discountValue:
      formData.get("discountType") === "FIXED"
        ? dollarsToCents(formNumber(formData.get("discountValue")))
        : formNumber(formData.get("discountValue")),
    minOrderAmount: dollarsToCents(formNumber(formData.get("minOrderAmount"))),
    maxDiscount: nullableString(formData.get("maxDiscount"))
      ? dollarsToCents(formNumber(formData.get("maxDiscount")))
      : null,
    usageLimit: nullableString(formData.get("usageLimit")),
    expiresAt: formData.get("expiresAt") ?? "",
    active: formBool(formData.get("active")),
  });

  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const data = parsed.data;

  if (data.discountType === "PERCENT" && data.discountValue < 1) {
    return { fieldErrors: { discountValue: "Enter a percentage of at least 1" } };
  }

  const expiresAt = data.expiresAt
    ? new Date(`${data.expiresAt}T23:59:59`)
    : null;

  const payload = {
    code: data.code,
    description: data.description || null,
    discountType: data.discountType,
    discountValue: data.discountValue,
    minOrderAmount: data.minOrderAmount,
    maxDiscount: data.maxDiscount,
    usageLimit: data.usageLimit,
    expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
    active: data.active,
  };

  const clash = await prisma.promoCode.findFirst({
    where: { code: payload.code, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) return { fieldErrors: { code: "That code already exists" } };

  if (id) {
    await prisma.promoCode.update({ where: { id }, data: payload });
  } else {
    await prisma.promoCode.create({ data: payload });
  }

  revalidatePath("/admin/promos");
  redirect("/admin/promos?saved=1");
}

export async function deletePromoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await prisma.promoCode.delete({ where: { id } });
  revalidatePath("/admin/promos");
}

export async function togglePromoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const promo = await prisma.promoCode.findUnique({
    where: { id },
    select: { active: true },
  });
  if (!promo) return;

  await prisma.promoCode.update({
    where: { id },
    data: { active: !promo.active },
  });

  revalidatePath("/admin/promos");
}

// ------------------------------------------------------------------ Orders

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const { orderId, status } = parsed.data;

  // A delivered order can't silently become pending again, and cancelling a
  // paid order is a refund decision — both need the payment state respected.
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      fulfilment: true,
      orderNumber: true,
    },
  });
  if (!order) return;

  if (order.status === "DELIVERED" && status !== "CANCELLED") return;

  // Cash on delivery is settled in person, so completing the handover is what
  // marks it paid.
  const collectedCash =
    order.paymentMethod === "CASH_ON_DELIVERY" &&
    order.paymentStatus === "PENDING" &&
    (status === "DELIVERED" || (status === "OUT_FOR_DELIVERY" && order.fulfilment === "PICKUP"));

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(collectedCash ? { paymentStatus: "PAID" } : {}),
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  revalidatePath(`/admin/orders/${order.orderNumber}`);
}