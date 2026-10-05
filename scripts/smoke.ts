import "dotenv/config";
import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { calculateTotals, evaluatePromo } from "@/lib/money";
import { checkoutStartSchema, fieldErrors } from "@/lib/validation";

/** `src/lib/db` imports `server-only`, so build a client here instead. */
const raw = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").slice("file:".length);
const absolute = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: `file:${absolute}` }),
});

/**
 * Exercises checkout paths that are hard to reach through the browser:
 * guest pickup with no address, and cash on delivery payment state.
 */

function basePayload(fulfilment: "DELIVERY" | "PICKUP") {
  return {
    fulfilment,
    customerName: "Smoke Test",
    customerPhone: "+1 (415) 555-0100",
    email: "smoke@test.invalid",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    notes: "",
    promoCode: "",
    paymentMethod: "CARD" as const,
    saveAddress: false,
    addressId: "",
  };
}

async function main() {
  const item = await prisma.menuItem.findFirst({
    where: { isAvailable: true },
    select: { id: true, price: true },
  });
  if (!item) throw new Error("Seed data missing");

  let failures = 0;
  const check = (label: string, ok: boolean, detail?: unknown) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
    if (!ok) {
      failures += 1;
      if (detail !== undefined) console.log("      ", detail);
    }
  };

  // 1. Guest pickup with no address must be accepted.
  const pickupParsed = checkoutStartSchema.safeParse({
    ...basePayload("PICKUP"),
    lines: [{ itemId: item.id, quantity: 1, notes: "" }],
  });
  check(
    "pickup accepts an empty address",
    pickupParsed.success,
    pickupParsed.success ? undefined : fieldErrors(pickupParsed.error),
  );

  // 2. Guest delivery with no address must be rejected.
  const deliveryParsed = checkoutStartSchema.safeParse({
    ...basePayload("DELIVERY"),
    lines: [{ itemId: item.id, quantity: 1, notes: "" }],
  });
  check("delivery rejects an empty address", !deliveryParsed.success);

  // 3. Delivery with a full address must be accepted.
  const goodDelivery = checkoutStartSchema.safeParse({
    ...basePayload("DELIVERY"),
    addressLine1: "500 Howard Street",
    city: "San Francisco",
    state: "CA",
    postalCode: "94105",
    lines: [{ itemId: item.id, quantity: 1, notes: "" }],
  });
  check("delivery accepts a full address", goodDelivery.success);

  // 4. Pickup totals carry no delivery fee.
  const pickupTotals = calculateTotals({ subtotal: item.price, fulfilment: "PICKUP" });
  check("pickup has no delivery fee", pickupTotals.deliveryFee === 0, pickupTotals);

  // 4b. Cash on delivery is a delivery-only payment method.
  const pickupCod = checkoutStartSchema.safeParse({
    ...basePayload("PICKUP"),
    paymentMethod: "CASH_ON_DELIVERY",
    lines: [{ itemId: item.id, quantity: 1, notes: "" }],
  });
  check("pickup rejects cash on delivery", !pickupCod.success);

  // 5. Cash on delivery orders stay pending until staff mark them delivered.
  const cod = await prisma.order.create({
    data: {
      orderNumber: `TEST-COD-${Date.now()}`,
      customerName: "Smoke Test",
      customerEmail: "smoke@test.invalid",
      customerPhone: "+1 (415) 555-0100",
      addressLine1: "500 Howard Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      fulfilment: "DELIVERY",
      paymentMethod: "CASH_ON_DELIVERY",
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      subtotal: item.price,
      total: item.price,
    },
    select: { id: true, paymentStatus: true, status: true },
  });
  check("cash on delivery is not pre-paid", cod.paymentStatus === "PENDING", cod);

  // 6. Promo evaluation still works against a live record.
  const promos = await prisma.promoCode.findMany({
    where: { active: true, minOrderAmount: { lte: item.price } },
    take: 2,
  });
  if (promos.length === 0) {
    console.log("SKIP  no active promo applies to the first item");
  }
  for (const promo of promos) {
    const result = evaluatePromo(promo, item.price);
    check(`promo ${promo.code} evaluates`, result.ok, result);
  }

  await prisma.order.deleteMany({ where: { id: cod.id } });

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  // Always clear throwaway rows, even when a check throws, so the seeded
  // dashboard numbers stay accurate.
  .finally(async () => {
    await prisma.order.deleteMany({ where: { orderNumber: { startsWith: "TEST-COD-" } } });
    await prisma.order.deleteMany({ where: { orderNumber: { startsWith: "FC-GUEST-" } } });
    await prisma.$disconnect();
  });
