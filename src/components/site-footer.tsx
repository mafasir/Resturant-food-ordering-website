import Link from "next/link";
import { Clock, MapPin, Phone, Sparkles } from "lucide-react";
import { InstagramIcon, XIcon } from "@/components/brand-icons";
import { SITE } from "@/lib/site";
import { formatMoney } from "@/lib/money";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/money";

const FOOTER_LINKS = [
  {
    heading: "Order",
    links: [
      { href: "/menu", label: "Full menu" },
      { href: "/cart", label: "Your cart" },
      { href: "/account/orders", label: "Track an order" },
      { href: "/account", label: "Your account" },
    ],
  },
  {
    heading: "FeastCraft",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/credits", label: "Photo credits" },
      { href: "/menu?tag=vegetarian", label: "Vegetarian" },
      { href: "/menu?tag=spicy", label: "Spicy" },
      { href: "/menu?sort=rating", label: "Chef's picks" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-canvas-soft">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-ember-600/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600">
                <Sparkles className="size-5 text-canvas" aria-hidden />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">
                {SITE.name}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              A modern neighbourhood kitchen. We cook over live fire, source
              seasonally and deliver hot.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted">
              Free delivery on orders over {formatMoney(FREE_DELIVERY_THRESHOLD)}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialLink label="FeastCraft on Instagram" href="#">
                <InstagramIcon className="size-4" />
              </SocialLink>
              <SocialLink label="FeastCraft on X" href="#">
                <XIcon className="size-3.5" />
              </SocialLink>
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">
                {group.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition hover:text-ember-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">
              Visit us
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ember-400" aria-hidden />
                <span>
                  {SITE.address.line1}
                  <br />
                  {SITE.address.city}, {SITE.address.state}{" "}
                  {SITE.address.postalCode}
                </span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-ember-400" aria-hidden />
                <a href={`tel:${SITE.phone}`} className="transition hover:text-cream">
                  {SITE.phone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-ember-400" aria-hidden />
                <span className="space-y-1">
                  {SITE.hours.map((slot) => (
                    <span key={slot.days} className="block">
                      {slot.days}
                      <span className="block text-faint">{slot.time}</span>
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-faint">
            © {new Date().getFullYear()} {SITE.name}. Demo project — payments run
            in test mode.
          </p>
          <p className="text-xs text-faint">
            Built with Next.js, Prisma &amp; Tailwind CSS. Dish photography under
            Creative Commons &mdash;{" "}
            <Link href="/credits" className="underline underline-offset-2">
              credits
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:border-ember-500/50 hover:text-ember-300"
    >
      {children}
    </a>
  );
}
