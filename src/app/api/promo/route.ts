import { NextResponse } from "next/server";
import { getPromoByCode } from "@/lib/queries";
import { evaluatePromo } from "@/lib/money";
import { promoLookupSchema } from "@/lib/validation";

/**
 * Validates a promo code for the cart. The client uses this for instant feedback,
 * but the same `evaluatePromo` check runs again on the server during checkout so
 * a tampered client can never grant itself a discount.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "Invalid request body" }, { status: 400 });
  }

  const parsed = promoLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: parsed.error.issues[0]?.message ?? "Invalid promo code" },
      { status: 400 },
    );
  }

  const promo = await getPromoByCode(parsed.data.code);
  if (!promo) {
    return NextResponse.json(
      { ok: false, reason: "We couldn't find that promo code" },
      { status: 404 },
    );
  }

  const result = evaluatePromo(promo, parsed.data.subtotal);
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    code: promo.code,
    description: result.description,
    discount: result.discount,
  });
}