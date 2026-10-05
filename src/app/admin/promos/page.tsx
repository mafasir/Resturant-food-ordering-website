import Link from "next/link";
import { Pencil, Power, Ticket, Trash2 } from "lucide-react";
import { getAllPromos } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { deletePromoAction, togglePromoAction } from "@/app/actions/admin";
import { PromoEditorShell } from "@/components/admin/promo-editor-shell";
import type { PromoDraft } from "@/components/admin/promo-editor";
import { Badge, EmptyState } from "@/components/ui/primitives";

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const AS_OF = Date.now();

export default async function AdminPromosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const promos = await getAllPromos();

  const editId = firstValue(params.edit);
  const target = promos.find((promo) => promo.id === editId);
  const draft: PromoDraft | null = target
    ? {
        id: target.id,
        code: target.code,
        description: target.description ?? "",
        discountType: target.discountType,
        discountValue: target.discountValue,
        minOrderAmount: target.minOrderAmount,
        maxDiscount: target.maxDiscount,
        usageLimit: target.usageLimit,
        expiresAt: target.expiresAt
          ? new Date(target.expiresAt).toISOString().slice(0, 10)
          : "",
        active: target.active,
      }
    : null;

  const now = AS_OF;

  return (
    <div>
      {params.saved ? (
        <p className="mb-5 rounded-xl border border-jade-500/30 bg-jade-500/10 px-4 py-3 text-sm text-jade-400">
          Promo code saved.
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="font-semibold text-cream">{promos.length}</span> promo
          codes
        </p>
        <PromoEditorShell draft={draft} />
      </div>

      <ul className="space-y-3">
        {promos.map((promo) => {
          const expired = promo.expiresAt
            ? promo.expiresAt.getTime() < now
            : false;
          const exhausted =
            promo.usageLimit !== null && promo.usedCount >= promo.usageLimit;
          const usable = promo.active && !expired && !exhausted;

          return (
            <li key={promo.id} className="surface-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-surface-3 px-2.5 py-1 font-mono text-sm font-semibold tracking-wide text-gold-300">
                      {promo.code}
                    </span>
                    {usable ? (
                      <Badge tone="jade">Live</Badge>
                    ) : (
                      <Badge tone="chili">
                        {!promo.active
                          ? "Disabled"
                          : expired
                            ? "Expired"
                            : "Limit reached"}
                      </Badge>
                    )}
                    <Badge tone="outline">
                      {promo.discountType === "PERCENT"
                        ? `${promo.discountValue}% off`
                        : `${formatMoney(promo.discountValue)} off`}
                    </Badge>
                  </div>

                  {promo.description ? (
                    <p className="mt-2 text-sm text-muted">{promo.description}</p>
                  ) : null}

                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint">
                    {promo.minOrderAmount > 0 ? (
                      <span>Min order {formatMoney(promo.minOrderAmount)}</span>
                    ) : (
                      <span>No minimum</span>
                    )}
                    {promo.maxDiscount ? (
                      <span>Max {formatMoney(promo.maxDiscount)}</span>
                    ) : null}
                    <span>
                      Used {promo.usedCount}
                      {promo.usageLimit ? ` / ${promo.usageLimit}` : ""}
                    </span>
                    {promo.expiresAt ? (
                      <span>
                        Expires{" "}
                        {new Date(promo.expiresAt).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </span>
                    ) : (
                      <span>No expiry</span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <form action={togglePromoAction}>
                    <input type="hidden" name="id" value={promo.id} />
                    <button
                      type="submit"
                      title={promo.active ? "Disable code" : "Enable code"}
                      aria-label={
                        promo.active
                          ? `Disable promo code ${promo.code}`
                          : `Enable promo code ${promo.code}`
                      }
                      className="rounded-lg p-2 text-faint transition hover:bg-surface-3 hover:text-cream"
                    >
                      <Power className="size-4" aria-hidden />
                    </button>
                  </form>

                  <Link
                    href={`/admin/promos?edit=${promo.id}`}
                    aria-label={`Edit promo code ${promo.code}`}
                    className="rounded-lg p-2 text-faint transition hover:bg-surface-3 hover:text-ember-300"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Link>

                  <form action={deletePromoAction}>
                    <input type="hidden" name="id" value={promo.id} />
                    <button
                      type="submit"
                      aria-label={`Delete promo code ${promo.code}`}
                      className="rounded-lg p-2 text-faint transition hover:bg-surface-3 hover:text-chili-400"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {promos.length === 0 ? (
        <EmptyState
          art="promos"
          compact
          icon={<Ticket className="size-5" />}
          title="No promo codes yet"
          description="Create one to reward your customers — percentage, fixed amount or free delivery."
        />
      ) : null}
    </div>
  );
}