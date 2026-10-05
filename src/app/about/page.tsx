import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Clock,
  Heart,
  Leaf,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { getCategories, getMenuItems } from "@/lib/queries";
import { CategoryIcon } from "@/components/category-icon";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/primitives";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE.name} — seasonal small plates, wood-fired mains and slow-fermented dough, cooked in ${SITE.address.city}.`,
};

const VALUES = [
  {
    icon: Leaf,
    title: "Season first",
    body: "Our menu is rewritten every six weeks around what the growers actually deliver that week. If it's not in season, it isn't on the board.",
  },
  {
    icon: Sparkles,
    title: "Fire does the work",
    body: "No gas salamanders. Pizzas go into a 480°C wood oven, and vegetables hit the grill until they char honestly.",
  },
  {
    icon: Clock,
    title: "Made to order",
    body: "Nothing is held under a lamp. Your ticket starts when we accept it, which is why our prep times are honest about the wait.",
  },
  {
    icon: Heart,
    title: "Feed everyone",
    body: "A rotating vegan board, a gluten-free base that we mill ourselves, and half portions for the table that can't commit.",
  },
];

const TIMELINE = [
  {
    year: "2016",
    title: "A 12-seat counter on Pier Lane",
    body: "Marcus Vane opened FeastCraft with one wood oven, six stools and a menu he could recite by heart.",
  },
  {
    year: "2019",
    title: "The dining room",
    body: "We took the room next door, kept the counter, and added a pastry section after a regular asked for something sweet.",
  },
  {
    year: "2022",
    title: "Delivery, properly",
    body: "Our own riders, our own packaging, and a promise that food arrives the way it left the pass.",
  },
  {
    year: "Today",
    title: "Eight categories, one kitchen",
    body: "Thirty-four dishes cooked to order, all of them traceable to a supplier within a hundred miles.",
  },
];

export default async function AboutPage() {
  const [categories, items] = await Promise.all([
    getCategories(),
    getMenuItems({ availableOnly: true }),
  ]);

  const chefs = [
    { name: "Marcus Vane", role: "Head chef & founder", years: "18 years cooking" },
    { name: "Ana Okonjo", role: "Pastry & desserts", years: "11 years cooking" },
    { name: "Rafael Lima", role: "Pizzaiolo", years: "14 years cooking" },
  ];

  return (
    <>
      {/* ------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60rem 30rem at 15% -10%, rgba(242,85,31,0.18), transparent 60%), radial-gradient(40rem 24rem at 90% 10%, rgba(217,164,65,0.14), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember-400">
            Since 2016
          </p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">
            A neighbourhood kitchen that
            <span className="bg-gradient-to-r from-gold-300 via-ember-300 to-chili-400 bg-clip-text text-transparent">
              {" "}
              never stopped caring
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            FeastCraft started as twelve seats and one wood oven. The oven never
            got bigger, but the team behind it did — and everything we serve is
            still cooked the same way, to order, all night.
          </p>

          <Reveal delay={0.15} className="mt-12">
            <div className="relative aspect-[21/9] overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-lift)]">
              <Image
                src="/images/site/dining-room.jpg"
                alt="The warmly lit FeastCraft dining room at night"
                fill
                sizes="(min-width: 1280px) 72rem, 100vw"
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-canvas/80 via-canvas/10 to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------------------- Values */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="How we work"
            title="Four things we refuse to compromise on"
            description="These aren't slogans on the wall — they're the reason some dishes get cut when a supplier has a bad week."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 0.08}>
              <div className="surface-card h-full p-6">
                <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-ember-500/20 to-gold-500/10 text-ember-400">
                  <value.icon className="size-6" aria-hidden />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">
                  {value.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  {value.body}
                </p>
              </div>
            </Reveal>
          ))}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {[
              {
                src: "/images/site/the-pass.jpg",
                alt: "A chef finishing a plate at the pass",
                caption: "The pass, mid-service",
              },
              {
                src: "/images/site/counter-seats.jpg",
                alt: "The counter seats with guests dining",
                caption: "Where it all started in 2016",
              },
            ].map((shot, index) => (
              <Reveal key={shot.src} delay={index * 0.08}>
                <figure className="group relative overflow-hidden rounded-2xl border border-line">
                  <div className="relative aspect-[3/2]">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      fill
                      sizes="(min-width: 1024px) 34rem, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-canvas/85 via-transparent to-transparent" />
                  </div>
                  <figcaption className="absolute inset-x-0 bottom-0 p-5 text-sm font-semibold text-cream">
                    {shot.caption}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
      </section>

      {/* --------------------------------------------------------- Timeline */}
      <section className="border-y border-line bg-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading eyebrow="Our story" title="Ten years, four rooms" />
          </Reveal>

          <ol className="mt-12 space-y-0">
            {TIMELINE.map((entry, index) => (
              <Reveal key={entry.year} delay={index * 0.08}>
                <li className="relative flex gap-6 pb-10 last:pb-0">
                  {index < TIMELINE.length - 1 ? (
                    <span
                      className="absolute left-[1.4rem] top-14 h-[calc(100%-2.5rem)] w-px bg-line"
                      aria-hidden
                    />
                  ) : null}
                  <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full border border-ember-500/40 bg-canvas font-display text-sm font-extrabold text-ember-300">
                    {entry.year}
                  </span>
                  <div className="min-w-0 pt-1">
                    <h3 className="font-display text-lg font-bold">
                      {entry.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                      {entry.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------- Team */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="The pass"
            title="Who you'll meet in the kitchen"
            align="center"
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {chefs.map((chef, index) => (
            <Reveal key={chef.name} delay={index * 0.08}>
              <div className="surface-card h-full p-6 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-gold-300/20 to-ember-500/15 font-display text-xl font-extrabold text-gold-300">
                  {chef.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <h3 className="mt-4 font-display text-base font-bold">
                  {chef.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-ember-400">
                  {chef.role}
                </p>
                <p className="mt-3 text-xs text-faint">{chef.years}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- Kitchen */}
      <section className="border-y border-line bg-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <Reveal>
              <SectionHeading
                eyebrow="On the menu tonight"
                title={`${items.length} dishes across ${categories.length} sections`}
                description="The board changes with the seasons, but these sections are always here — which means there's always something for a first-timer and everything for a regular."
              />
              <Link
                href="/menu"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-5 py-3 text-sm font-bold text-canvas transition hover:brightness-110"
              >
                See the full menu
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Reveal>

            <Reveal delay={0.1}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/menu?category=${category.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 transition hover:border-line-strong"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-ember-400">
                        <CategoryIcon name={category.icon} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-cream transition group-hover:text-ember-300">
                          {category.name}
                        </span>
                        {category.tagline ? (
                          <span className="block truncate text-xs text-faint">
                            {category.tagline}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-faint">
                        {category._count.items}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Visit us */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="surface-card overflow-hidden p-8 text-center sm:p-12">
            <Award className="mx-auto size-10 text-gold-400" aria-hidden />
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Come and eat with us
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
              We cook from lunch until late on Friday and Saturday, and we stop
              taking orders fifteen minutes before the kitchen closes.
            </p>

            <div className="mx-auto mt-10 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
              <InfoCard
                icon={<MapPin className="size-4" />}
                label="Find us"
                value={`${SITE.address.line1}, ${SITE.address.city}, ${SITE.address.state}`}
              />
              <InfoCard
                icon={<Phone className="size-4" />}
                label="Call us"
                value={SITE.phone}
                href={`tel:${SITE.phone.replace(/[^+\d]/g, "")}`}
              />
              <InfoCard
                icon={<Clock className="size-4" />}
                label="Hours"
                value={SITE.hours
                  .map((slot) => `${slot.days} ${slot.time}`)
                  .join(" · ")}
              />
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/menu"
                className="rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 px-6 py-3 text-sm font-bold text-canvas transition hover:brightness-110"
              >
                Order for delivery
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-semibold transition hover:border-line-strong"
              >
                Create an account
              </Link>
            </div>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-faint">
              <Star className="size-3 fill-gold-400 text-gold-400" aria-hidden />
              <Users className="size-3" aria-hidden />
              Serving {SITE.address.city} since 2016
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function InfoCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
        <span className="text-ember-400">{icon}</span>
        {label}
      </span>
      <span className="mt-2 block text-sm leading-relaxed text-cream">
        {value}
      </span>
    </>
  );

  return href ? (
    <a
      href={href}
      className="rounded-xl border border-line bg-canvas-soft p-4 transition hover:border-line-strong"
    >
      {body}
    </a>
  ) : (
    <div className="rounded-xl border border-line bg-canvas-soft p-4">{body}</div>
  );
}