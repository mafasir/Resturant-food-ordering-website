import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/** The gradient tile with the spark glyph, sized by the caller. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 shadow-[0_10px_30px_-12px_rgba(242,85,31,0.9)] transition-transform duration-300 group-hover:scale-105",
        className,
      )}
    >
      <Sparkles className="size-5 text-canvas" aria-hidden />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex shrink-0 items-center gap-2.5", className)}
      aria-label={`${SITE.name} home`}
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.05rem] font-extrabold tracking-tight">
          {SITE.name}
        </span>
        <span className="mt-0.5 hidden text-[0.6rem] font-medium uppercase tracking-[0.18em] text-faint sm:block">
          {SITE.tagline}
        </span>
      </span>
    </Link>
  );
}