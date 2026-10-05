import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/types";

const trimmedString = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const registerSchema = z.object({
  name: trimmedString(2, 60, "Name"),
  email: z.email("Enter a valid email address").max(160),
  phone: trimmedString(6, 24, "Phone number").optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").max(160),
  password: z.string().min(1, "Enter your password"),
});

export const addressSchema = z.object({
  label: trimmedString(1, 24, "Label"),
  fullName: trimmedString(2, 60, "Full name"),
  phone: trimmedString(6, 24, "Phone number"),
  line1: trimmedString(3, 120, "Address line 1"),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: trimmedString(2, 60, "City"),
  state: trimmedString(2, 40, "State"),
  postalCode: trimmedString(3, 16, "Postal code"),
  isDefault: z.boolean().default(false),
});

export const cartLineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  notes: z.string().trim().max(240).optional().default(""),
});

export const checkoutSchema = z.object({
  lines: z.array(cartLineSchema).min(1, "Your cart is empty"),
  fulfilment: z.enum(["DELIVERY", "PICKUP"]),
  customerName: trimmedString(2, 60, "Full name"),
  customerPhone: trimmedString(6, 24, "Phone number"),
  email: z
    .email("Enter a valid email address")
    .max(160)
    .optional()
    .or(z.literal("")),
  addressLine1: trimmedString(3, 120, "Address line 1"),
  addressLine2: z.string().trim().max(120).optional().default(""),
  city: trimmedString(2, 60, "City"),
  state: trimmedString(2, 40, "State"),
  postalCode: trimmedString(3, 16, "Postal code"),
  notes: z.string().trim().max(500).optional().default(""),
  promoCode: z.string().trim().max(40).optional().default(""),
  paymentMethod: z.enum(["CARD", "CASH_ON_DELIVERY"]).default("CARD"),
  saveAddress: z.boolean().default(false),
  addressId: z.string().trim().max(60).optional().default(""),
  paymentIntentId: z.string().trim().max(120).optional().default(""),
});

export const promoLookupSchema = z.object({
  code: z.string().trim().min(1, "Enter a promo code").max(40),
  subtotal: z.number().int().min(0),
});

/**
 * The JSON body the cart posts when starting checkout.
 *
 * Address fields are only required for delivery — pickup orders hide those
 * inputs, so requiring them would make a fresh guest pickup impossible.
 */
export const checkoutStartSchema = z
  .object({
    lines: z.array(cartLineSchema).min(1, "Your cart is empty"),
    fulfilment: z.enum(["DELIVERY", "PICKUP"]),
    customerName: trimmedString(2, 60, "Full name"),
    customerPhone: trimmedString(6, 24, "Phone number"),
    email: z.email("Enter a valid email address").max(160).optional().or(z.literal("")),
    addressLine1: z.string().trim().max(120).optional().default(""),
    addressLine2: z.string().trim().max(120).optional().default(""),
    city: z.string().trim().max(60).optional().default(""),
    state: z.string().trim().max(40).optional().default(""),
    postalCode: z.string().trim().max(16).optional().default(""),
    notes: z.string().trim().max(500).optional().default(""),
    promoCode: z.string().trim().max(40).optional().default(""),
    paymentMethod: z.enum(["CARD", "CASH_ON_DELIVERY"]).default("CARD"),
    saveAddress: z.boolean().default(false),
    addressId: z.string().trim().max(60).optional().default(""),
  })
  .superRefine((value, ctx) => {
    // The picker hides cash for pickup, but a tampered client could still post it.
    if (value.fulfilment === "PICKUP" && value.paymentMethod === "CASH_ON_DELIVERY") {
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Pay online or at the counter for pickup",
      });
      return;
    }

    if (value.fulfilment !== "DELIVERY") return;

    const required: { key: "addressLine1" | "city" | "state" | "postalCode"; min: number; label: string }[] = [
      { key: "addressLine1", min: 3, label: "Address line 1" },
      { key: "city", min: 2, label: "City" },
      { key: "state", min: 2, label: "State" },
      { key: "postalCode", min: 3, label: "Postal code" },
    ];

    for (const { key, min, label } of required) {
      const current = value[key];
      if (current.length === 0) {
        ctx.addIssue({ code: "custom", path: [key], message: `Enter your ${label.toLowerCase()}` });
      } else if (current.length < min) {
        ctx.addIssue({ code: "custom", path: [key], message: `${label} is too short` });
      }
    }
  });

/** Admin forms submit prices in dollars; we store integer cents. */
export const dollarsToCents = (value: number): number => Math.round(value * 100);

const priceField = z
  .number({ error: "Enter a price" })
  .positive("Price must be greater than 0")
  .max(1000, "Price must be under $1,000");

export const menuItemSchema = z.object({
  name: trimmedString(2, 80, "Name"),
  description: trimmedString(10, 400, "Description"),
  price: priceField,
  categoryId: z.string().min(1, "Choose a category"),
  image: z.string().trim().max(300).default(""),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  isVeg: z.boolean().default(true),
  calories: z.number().int().min(0).max(5000).nullable().default(null),
  prepMinutes: z
    .number()
    .int()
    .min(1, "Prep time must be at least 1 minute")
    .max(240, "Prep time must be under 240 minutes"),
  rating: z.number().min(0).max(5).default(4.5),
  tags: z.string().trim().max(200).default(""),
});

export const categorySchema = z.object({
  name: trimmedString(2, 40, "Name"),
  icon: trimmedString(2, 40, "Icon"),
  tagline: z.string().trim().max(120).optional().default(""),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const promoSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(24, "Code must be at most 24 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, dashes and underscores only")
      .transform((value) => value.toUpperCase()),
    description: z.string().trim().max(140).optional().default(""),
    discountType: z.enum(["PERCENT", "FIXED"]),
    discountValue: z.number().int().positive("Enter a discount value"),
    minOrderAmount: z.number().int().min(0).default(0),
    maxDiscount: z.number().int().positive().nullable().default(null),
    usageLimit: z.number().int().positive().nullable().default(null),
    expiresAt: z.string().optional().default(""),
    active: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "PERCENT" && value.discountValue > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "A percentage discount cannot exceed 100",
      });
    }
    if (value.discountType === "FIXED" && value.discountValue > 100_000) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "A fixed discount cannot exceed $1,000",
      });
    }
  });

export const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutStartInput = z.infer<typeof checkoutStartSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type PromoInputForm = z.infer<typeof promoSchema>;

/** Flattens a Zod error into `{ "field.path": "message" }` for form UIs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
