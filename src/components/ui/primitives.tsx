import { Flame, Leaf, Loader2, Star } from "lucide-react";
import { EmptyArt, type EmptyArtVariant } from "@/components/empty-art";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ember" | "jade" | "chili" | "gold" | "outline";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-3 text-muted",
    ember: "bg-ember-500/15 text-ember-300",
    jade: "bg-jade-500/15 text-jade-400",
    chili: "bg-chili-500/15 text-chili-400",
    gold: "bg-gold-500/15 text-gold-300",
    outline: "border border-line text-muted",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DietaryTags({
  isVeg,
  isSpicy,
  className,
}: {
  isVeg: boolean;
  isSpicy: boolean;
  className?: string;
}) {
  if (!isVeg && !isSpicy) return null;
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      {isVeg ? (
        <span
          className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-jade-400"
          title="Vegetarian"
        >
          <Leaf className="size-3.5" aria-hidden />
          <span className="sr-only">Vegetarian</span>
        </span>
      ) : null}
      {isSpicy ? (
        <span
          className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-chili-400"
          title="Spicy"
        >
          <Flame className="size-3.5" aria-hidden />
          <span className="sr-only">Spicy</span>
        </span>
      ) : null}
    </span>
  );
}

export function RatingStars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Star className="size-3.5 fill-gold-400 text-gold-400" aria-hidden />
      <span className="text-xs font-semibold text-gold-300">
        {rounded.toFixed(1)}
      </span>
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-400">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />
  );
}

/** Shimmering placeholder used while client-side data hydrates. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-surface-2", className)}
    />
  );
}

export function EmptyState({
  icon,
  art,
  title,
  description,
  action,
  compact = false,
}: {
  icon: React.ReactNode;
  /** Themed illustration shown above the icon. See `EmptyArtVariant`. */
  art?: EmptyArtVariant;
  title: string;
  description: string;
  action?: React.ReactNode;
  /** Denser layout for panels nested inside a page. */
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-card relative flex flex-col items-center overflow-hidden text-center",
        compact ? "px-6 py-10" : "px-6 py-16",
      )}
    >
      {art ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center opacity-90"
          aria-hidden
        >
          <EmptyArt variant={art} className="-mb-6 size-40" />
        </div>
      ) : null}

      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "grid place-items-center rounded-2xl bg-surface-3 text-ember-400",
            art ? "size-11" : "size-14",
          )}
        >
          {icon}
        </div>
        <h2 className={cn("font-semibold", art ? "mt-4 text-base" : "mt-5 text-lg")}>
          {title}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}
