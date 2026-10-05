import { cn } from "@/lib/utils";

/**
 * Empty-state artwork.
 *
 * Every empty slot in the product used to be a bare icon in a grey square, which
 * left the cart, order history, search results and admin panels feeling like
 * dead ends. These are lightweight inline illustrations instead — no network
 * request, and they pick up the brand palette from the same CSS custom
 * properties as the rest of the UI.
 */
export type EmptyArtVariant =
  | "cart"
  | "orders"
  | "search"
  | "dishes"
  | "addresses"
  | "promos"
  | "sales"
  | "not-found";

const VARIANTS: Record<EmptyArtVariant, React.ReactNode> = {
  /* An empty plate with a crumb or two still sitting on it. */
  cart: (
    <>
      <ellipse cx="60" cy="88" rx="40" ry="7" className="fill-line-strong" />
      <circle cx="60" cy="66" r="32" className="fill-surface-3 stroke-line-strong stroke-[1.5]" />
      <circle cx="60" cy="66" r="22" className="fill-surface-2 stroke-line stroke-[1.5]" />
      <circle cx="60" cy="66" r="11" className="fill-ember-500/10 stroke-ember-500/30 stroke-[1.5] stroke-dasharray-3 4" />
      <circle cx="52" cy="59" r="2" className="fill-gold-400/70" />
      <circle cx="68" cy="71" r="1.6" className="fill-gold-400/50" />
      <circle cx="64" cy="56" r="1.4" className="fill-gold-400/40" />
      <path
        d="M60 22v8M44 27l5 6M76 27l-5 6"
        className="stroke-line-strong stroke-[2] stroke-linecap-round"
      />
    </>
  ),

  /* A paper bag with the top folded over, waiting to be filled. */
  orders: (
    <>
      <ellipse cx="60" cy="96" rx="32" ry="6" className="fill-line-strong" />
      <path
        d="M36 38h48l-4 56a4 4 0 0 1-4 4H44a4 4 0 0 1-4-4z"
        className="fill-surface-3 stroke-line-strong stroke-[1.5] stroke-linejoin-round"
      />
      <path
        d="M32 30h56v10H32z"
        className="fill-ember-500/15 stroke-ember-500/40 stroke-[1.5] stroke-linejoin-round"
      />
      <path
        d="M48 30c0-8 5-13 12-13s12 5 12 13"
        className="stroke-line-strong stroke-[1.5] fill-none"
      />
      <path
        d="M52 62h16M52 72h16M52 82h10"
        className="stroke-line-strong stroke-[2] stroke-linecap-round"
      />
    </>
  ),

  /* A magnifier resting over a menu card. */
  search: (
    <>
      <rect
        x="26"
        y="30"
        width="56"
        height="66"
        rx="7"
        className="fill-surface-3 stroke-line-strong stroke-[1.5]"
      />
      <path
        d="M36 46h36M36 58h36M36 70h22"
        className="stroke-line-strong stroke-[2] stroke-linecap-round"
      />
      <circle
        cx="74"
        cy="74"
        r="19"
        className="fill-canvas/70 stroke-ember-400 stroke-[2.5]"
      />
      <path
        d="M88 88l14 14"
        className="stroke-ember-400 stroke-[3.5] stroke-linecap-round"
      />
    </>
  ),

  /* A serving cloche with nothing under it yet. */
  dishes: (
    <>
      <ellipse cx="60" cy="94" rx="38" ry="7" className="fill-line-strong" />
      <path
        d="M22 86h76a4 4 0 0 1-4 6H26a4 4 0 0 1-4-6z"
        className="fill-surface-3 stroke-line-strong stroke-[1.5] stroke-linejoin-round"
      />
      <path
        d="M26 82a34 26 0 0 1 68 0z"
        className="fill-surface-3 stroke-line-strong stroke-[1.5] stroke-linejoin-round"
      />
      <circle cx="60" cy="50" r="4" className="fill-ember-500/70" />
      <path
        d="M60 40v-8"
        className="stroke-ember-500/50 stroke-[2] stroke-linecap-round"
      />
    </>
  ),

  /* A map pin dropped on a saved-address card. */
  addresses: (
    <>
      <rect
        x="22"
        y="44"
        width="62"
        height="50"
        rx="7"
        className="fill-surface-3 stroke-line-strong stroke-[1.5]"
      />
      <path
        d="M22 60h62"
        className="stroke-line-strong stroke-[1.5]"
      />
      <path
        d="M32 74h26M32 84h18"
        className="stroke-line-strong stroke-[2] stroke-linecap-round"
      />
      <path
        d="M92 22c-9 0-16 7-16 16 0 11 16 26 16 26s16-15 16-26c0-9-7-16-16-16z"
        className="fill-ember-500/20 stroke-ember-400 stroke-[2] stroke-linejoin-round"
      />
      <circle cx="92" cy="38" r="6" className="fill-ember-400/60" />
    </>
  ),

  /* A promo tag with a punched hole. */
  promos: (
    <>
      <path
        d="M30 26h30l30 30a8 8 0 0 1 0 11L69 88a8 8 0 0 1-11 0L28 58a8 8 0 0 1-2-5V32a6 6 0 0 1 4-6z"
        className="fill-surface-3 stroke-line-strong stroke-[1.5] stroke-linejoin-round"
      />
      <circle cx="46" cy="42" r="6" className="fill-canvas stroke-ember-500/60 stroke-[2]" />
      <path
        d="M62 74l14-14M70 82l14-14"
        className="stroke-ember-500/50 stroke-[3] stroke-linecap-round"
      />
    </>
  ),

  /* A chart card for the admin revenue panel. */
  sales: (
    <>
      <rect
        x="22"
        y="28"
        width="76"
        height="66"
        rx="8"
        className="fill-surface-3 stroke-line-strong stroke-[1.5]"
      />
      <path
        d="M34 80V62M48 80V52M62 80V68M76 80V44"
        className="stroke-line-strong stroke-[5] stroke-linecap-round"
      />
      <path
        d="M34 56l14-12 14 8 14-16"
        className="stroke-ember-400 stroke-[2.5] fill-none stroke-linecap-round stroke-linejoin-round"
      />
      <circle cx="76" cy="36" r="4" className="fill-ember-400" />
    </>
  ),

  /* An empty box for a lookup that came up short. */
  "not-found": (
    <>
      <ellipse cx="60" cy="94" rx="32" ry="6" className="fill-line-strong" />
      <path
        d="M28 52l32-16 32 16v34l-32 12-32-12z"
        className="fill-surface-3 stroke-line-strong stroke-[1.5] stroke-linejoin-round"
      />
      <path
        d="M28 52l32 14 32-14M60 66v32"
        className="stroke-line-strong stroke-[1.5] stroke-linejoin-round"
      />
      <circle cx="84" cy="34" r="13" className="fill-canvas stroke-ember-400 stroke-[2.5]" />
      <path d="M79 29l10 10M89 29l-10 10" className="stroke-ember-400 stroke-[2.5] stroke-linecap-round" />
    </>
  ),
};

export function EmptyArt({
  variant,
  className,
}: {
  variant: EmptyArtVariant;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="presentation"
      aria-hidden
      className={cn("size-32", className)}
    >
      {VARIANTS[variant]}
    </svg>
  );
}
