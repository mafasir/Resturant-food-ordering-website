import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bike,
  ChefHat,
  Clock,
  Leaf,
  Quote,
  Sparkles,
  Star,
  Ticket,
  UtensilsCrossed,
} from "lucide-react";
import { getCategories, getMenuItems } from "@/lib/queries";
import { MenuItemCard } from "@/components/menu-item-card";
import { Reveal } from "@/components/ui/reveal";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { CategoryIcon } from "@/components/category-icon";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, formatMoney } from "@/lib/money";
import { SITE } from "@/lib/site";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getMenuItems({ featuredOnly: true, availableOnly: true, limit: 6 }),
  ]);

  const heroItems = await getMenuItems({ availableOnly: true, limit: 3 });

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="noise-overlay relative overflow-hidden">
        <div
          className="pointer-events-none absolute -left-40 -top-40 size-[38rem] animate-[float_9s_ease-in-out_infinite] rounded-full bg-ember-600/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-32 top-24 size-[32rem] animate-[float_10s_ease-in-out_infinite_reverse] rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:px-8 lg:pb-28">
          <div>
            <OpenNowBadge />
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Fire-kissed food,
              <br />
              <span className="text-gradient">delivered hot.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              FeastCraft is a modern neighbourhood kitchen — wood-fired pizza,
              flame-grilled mains, market-fresh bowls and desserts worth the
              detour. Order in under a minute.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/menu"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 px-6 py-3.5 text-sm font-bold text-canvas shadow-[0_18px_40px_-18px_rgba(242,85,31,1)] transition hover:brightness-110 active:scale-[0.98]"
              >
                Start your order
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-6 py-3.5 text-sm font-semibold text-cream transition hover:border-line-strong"
              >
                Our story
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-8">
              {[
                { label: "Dishes on the menu", value: "34+" },
                { label: "Average rating", value: "4.8 / 5" },
                { label: "Delivery", value: `${Math.round(FREE_DELIVERY_THRESHOLD / 60)} min` },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl font-bold text-cream">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-xs leading-relaxed text-faint">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Layered dish collage */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative aspect-square">
              <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-ember-500/20 via-transparent to-gold-500/10 blur-2xl" aria-hidden />
              {heroItems.map((item, index) => {
                const placement = [
                  "left-0 top-4 w-[58%] rotate-[-6deg] z-10",
                  "right-0 top-[26%] w-[52%] rotate-[5deg] z-20",
                  "left-[8%] bottom-2 w-[62%] rotate-[2deg] z-30",
                ][index];
                return (
                  <Reveal
                    key={item.id}
                    delay={0.12 * index}
                    className={`absolute ${placement}`}
                  >
                    <Link
                      href={`/menu/${item.slug}`}
                      className="surface-card group block overflow-hidden shadow-[var(--shadow-lift)] transition-transform duration-300 hover:scale-[1.02]"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="22rem"
                          priority={index === 0}
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 p-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-cream">
                            {item.name}
                          </p>
                          <p className="text-xs text-faint">{item.category.name}</p>
                        </div>
                        <span className="shrink-0 font-display text-sm font-bold text-gold-300">
                          {formatMoney(item.price)}
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>

            <div className="absolute -bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-lift)]">
              <span className="relative flex size-9 items-center justify-center rounded-xl bg-jade-500/15 text-jade-400">
                <Bike className="size-4.5" aria-hidden />
                <span className="absolute inset-0 animate-[pulse-ring_2.6s_ease-out_infinite] rounded-xl" />
              </span>
              <div>
                <p className="text-xs font-semibold text-cream">
                  Free delivery over {formatMoney(FREE_DELIVERY_THRESHOLD)}
                </p>
                <p className="text-[0.7rem] text-faint">
                  Otherwise just {formatMoney(DELIVERY_FEE)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Photo strip */}
      <section className="border-b border-line bg-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Straight from the pass"
              title="What comes out of the kitchen"
              description="No stock photography standing in for the food — these are the plates our riders pick up every evening."
              align="center"
            />
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {[
              {
                src: "/images/site/wood-fired-pizza.jpg",
                alt: "Wood-fired pizza with charred crust",
                caption: "Wood-fired pizza",
              },
              {
                src: "/images/site/smash-burgers.jpg",
                alt: "Stacked cheeseburger with fresh toppings",
                caption: "Smash burgers",
              },
              {
                src: "/images/site/market-bowls.jpg",
                alt: "Colourful grain bowl with fresh vegetables",
                caption: "Market bowls",
              },
              {
                src: "/images/site/desserts.jpg",
                alt: "Creamy dessert served in a glass",
                caption: "Desserts",
              },
            ].map((shot, index) => (
              <Reveal key={shot.src} delay={index * 0.07}>
                <figure className="group relative overflow-hidden rounded-2xl border border-line">
                  <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5]">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      fill
                      sizes="(min-width: 1024px) 20rem, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-canvas/90 via-canvas/10 to-transparent" />
                  </div>
                  <figcaption className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold text-cream">
                    {shot.caption}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Value props */}
      <section className="border-y border-line bg-canvas-soft">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            {
              icon: ChefHat,
              title: "Cooked to order",
              body: "Nothing sits under a lamp. Your ticket hits the pass when you order.",
            },
            {
              icon: Clock,
              title: "35 minute delivery",
              body: "Live tracking from kitchen to doorstep, minute by minute.",
            },
            {
              icon: Leaf,
              title: "Market ingredients",
              body: "Produce bought three times a week from local growers.",
            },
            {
              icon: Award,
              title: "4.8 from 2,400 diners",
              body: "Consistently rated among the top kitchens in the city.",
            },
          ].map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <div className="flex gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-ember-400">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-cream">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Browse"
            title="Eight sections, one kitchen"
            description="From small plates to slow-braised mains â€” find exactly what you are craving."
          />
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Reveal key={category.id} delay={index * 0.04} as="div">
              <Link
                href={`/menu?category=${category.slug}`}
                className="surface-card group flex h-full flex-col justify-between gap-6 p-5 transition duration-300 hover:border-ember-500/40 hover:shadow-[var(--shadow-lift)]"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-surface-3 text-ember-400 transition-transform duration-300 group-hover:scale-110">
                  <CategoryIcon name={category.icon} className="size-5.5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-cream transition group-hover:text-ember-300">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-xs text-faint">
                    {category.tagline ?? "Fresh from our kitchen"}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-3.5">
                  <span className="text-xs font-medium text-muted">
                    {category._count.items} dishes
                  </span>
                  <ArrowRight
                    className="size-4 text-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ember-400"
                    aria-hidden
                  />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Featured */}
      <section className="relative overflow-hidden border-y border-line bg-canvas-soft py-20 lg:py-24">
        <div
          className="pointer-events-none absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-600/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <SectionHeading
                eyebrow="Signature"
                title="The dishes people come back for"
                description="Chef-selected plates that define the FeastCraft kitchen."
              />
            </Reveal>
            <Reveal delay={0.1}>
              <Link
                href="/menu"
                className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-cream transition hover:border-line-strong"
              >
                See full menu
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.05}>
                <MenuItemCard item={item} priority={index < 3} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="Three taps and you're eating"
            align="center"
          />
        </Reveal>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: UtensilsCrossed,
              title: "Build your order",
              body: "Browse the menu, customise notes and quantities, and watch your total update live.",
            },
            {
              step: "02",
              icon: Sparkles,
              title: "Pay securely",
              body: "Card, wallet or cash on delivery. Your card details never touch our servers.",
            },
            {
              step: "03",
              icon: Bike,
              title: "Track & enjoy",
              body: "Follow your order from kitchen to doorstep, then rate the dishes.",
            },
          ].map((item, index) => (
            <Reveal key={item.step} delay={index * 0.08}>
              <div className="surface-card relative h-full overflow-hidden p-6">
                <span className="absolute -right-2 -top-4 font-display text-7xl font-extrabold text-surface-3/60 select-none">
                  {item.step}
                </span>
                <span className="relative grid size-11 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-ember-500 text-canvas">
                  <item.icon className="size-5.5" aria-hidden />
                </span>
                <h3 className="relative mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Promo */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="noise-overlay relative overflow-hidden rounded-[1.75rem] border border-ember-500/25 bg-gradient-to-br from-ember-600/20 via-surface to-surface p-8 sm:p-12">
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-gold-400/20 blur-3xl"
              aria-hidden
            />
            <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <Badge tone="gold">
                  <Ticket className="size-3.5" aria-hidden />
                  New here?
                </Badge>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Take <span className="text-gradient">10% off</span> your first
                  order
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted">
                  Apply the code at checkout. New customers only, one use per
                  account.
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <code className="rounded-2xl border border-dashed border-gold-400/50 bg-canvas/60 px-6 py-4 font-mono text-xl font-bold tracking-[0.2em] text-gold-300">
                  WELCOME10
                </code>
                <Link
                  href="/menu"
                  className="group inline-flex items-center gap-2 rounded-xl bg-cream px-6 py-4 text-sm font-bold text-canvas transition hover:bg-white active:scale-[0.98]"
                >
                  Claim it
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------- Testimonials */}
      <section className="border-y border-line bg-canvas-soft py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Reviews"
              title="What the neighbourhood says"
              align="center"
            />
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                quote:
                  "The short rib is the best thing I've eaten all year. It arrived still bubbling and the packaging was genuinely thoughtful.",
                name: "Priya Raman",
                role: "Regular since 2023",
              },
              {
                quote:
                  "Ordering is faster than making a phone call. Live tracking meant I knew exactly when to grab my bag.",
                name: "Daniel Okafor",
                role: "Orders twice a week",
              },
              {
                quote:
                  "Finally a kitchen that gets the balance right â€” fire, acid and seasoning. The truffle fries alone are a reason.",
                name: "Sofia Marchetti",
                role: "Food writer",
              },
            ].map((testimonial, index) => (
              <Reveal key={testimonial.name} delay={index * 0.07}>
                <figure className="surface-card flex h-full flex-col p-6">
                  <Quote className="size-7 text-ember-500/40" aria-hidden />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-cream/90">
                    â€œ{testimonial.quote}â€
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                    <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-ember-400 to-ember-600 text-xs font-bold text-canvas">
                      {testimonial.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-cream">
                        {testimonial.name}
                      </span>
                      <span className="block text-xs text-faint">
                        {testimonial.role}
                      </span>
                    </span>
                    <span className="ml-auto flex gap-0.5" aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className="size-3 fill-gold-400 text-gold-400"
                          aria-hidden
                        />
                      ))}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="surface-card flex flex-col items-center gap-6 px-6 py-14 text-center">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Hungry? The kitchen is{" "}
              <span className="text-gradient">already firing up.</span>
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-muted">
              {SITE.address.line1}, {SITE.address.city}. Open{" "}
              {SITE.hours[0].time.split(" â€“ ")[0]} most days, or order ahead and
              skip the queue.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/menu"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 px-7 py-3.5 text-sm font-bold text-canvas shadow-[0_18px_40px_-18px_rgba(242,85,31,1)] transition hover:brightness-110 active:scale-[0.98]"
              >
                Browse the menu
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/menu?category=mains"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-7 py-3.5 text-sm font-semibold text-cream transition hover:border-line-strong"
              >
                See tonight&rsquo;s mains
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/** Small animated "open now" pill above the hero headline. */
function OpenNowBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-jade-400 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-jade-400" />
      </span>
      Open now Â· kitchen fires in 12 min
    </span>
  );
}
