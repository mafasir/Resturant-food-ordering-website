import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { menuPhotos } from "@/lib/menu-photos";
import { getMenuItems } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Photo credits",
  description:
    "Attribution for the openly licensed photography used across the FeastCraft menu and marketing pages.",
};

const SITE_PHOTOS = [
  {
    file: "dining-room.jpg",
    alt: "The warmly lit FeastCraft dining room at night",
    source: "https://unsplash.com/photos/1517248135467-4c7edcad34c4",
  },
  {
    file: "the-pass.jpg",
    alt: "A chef finishing a plate at the pass",
    source: "https://unsplash.com/photos/1556910103-1c02745aae4d",
  },
  {
    file: "counter-seats.jpg",
    alt: "The counter seats with guests dining",
    source: "https://unsplash.com/photos/1414235077428-338989a2e8c0",
  },
  {
    file: "wood-fired-pizza.jpg",
    alt: "Wood-fired pizza with charred crust",
    source: "https://unsplash.com/photos/1604382354936-07c5d9983bd3",
  },
  {
    file: "smash-burgers.jpg",
    alt: "Stacked cheeseburger with fresh toppings",
    source: "https://unsplash.com/photos/1550547660-d9450f859349",
  },
  {
    file: "market-bowls.jpg",
    alt: "Colourful grain bowl with fresh vegetables",
    source: "https://unsplash.com/photos/1546069901-ba9599a7e63c",
  },
  {
    file: "desserts.jpg",
    alt: "Creamy dessert served in a glass",
    source: "https://unsplash.com/photos/1563805042-7684c019e1cb",
  },
];

export default async function CreditsPage() {
  // Sourced from the database so newly added dishes show up here automatically.
  const items = await getMenuItems({ limit: 500 });

  const dishes = items.map((item) => ({
    name: item.name,
    category: item.category.name,
    slug: item.slug,
    photo: menuPhotos[item.slug],
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ember-300"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to {SITE.name}
      </Link>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Photo credits
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
        {SITE.name} is a demo project. Every dish photo below is openly licensed
        artwork found through the{" "}
        <a
          href="https://openverse.org"
          className="text-ember-300 underline underline-offset-4"
        >
          Openverse
        </a>{" "}
        search index, cropped to fit the layout. The marketing shots come from{" "}
        <a
          href="https://unsplash.com/license"
          className="text-ember-300 underline underline-offset-4"
        >
          Unsplash
        </a>
        . Thanks to the photographers who made them available.
      </p>

      {/* ------------------------------------------------------------ Dishes */}
      <h2 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-ember-400">
        Menu photography
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <li
            key={dish.slug}
            className="surface-card overflow-hidden p-3"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              {dish.photo ? (
                <Image
                  src={dish.photo.file}
                  alt={dish.photo.title}
                  fill
                  sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center bg-surface-2 text-xs text-faint">
                  Generated artwork
                </div>
              )}
            </div>
            <div className="px-1 pb-1 pt-3">
              <p className="text-sm font-semibold text-cream">{dish.name}</p>
              <p className="text-xs text-faint">{dish.category}</p>
              {dish.photo ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  &ldquo;{dish.photo.title}&rdquo; by {dish.photo.creator} (CC{" "}
                  {dish.photo.license}) &mdash;{" "}
                  <a
                    href={dish.photo.landing}
                    className="text-ember-300 underline underline-offset-2"
                  >
                    source
                  </a>
                </p>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Deterministic SVG poster generated from the dish slug.
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* -------------------------------------------------------- Site photos */}
      <h2 className="mt-16 text-xs font-semibold uppercase tracking-[0.2em] text-ember-400">
        Editorial photography
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SITE_PHOTOS.map((photo) => (
          <li key={photo.file} className="surface-card overflow-hidden p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={`/images/site/${photo.file}`}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
            <a
              href={photo.source}
              className="mt-3 inline-flex items-center gap-1.5 px-1 text-xs text-ember-300 underline underline-offset-2"
            >
              View on Unsplash
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-12 text-xs leading-relaxed text-faint">
        Dish images are cropped to 1200&times;900 and editorial images to the
        aspect ratio of the slot that renders them. Empty-state illustrations, the
        logo and app icons are original to this project.{" "}
        <Link href="/menu" className="text-ember-300 underline underline-offset-2">
          Back to the menu
        </Link>
        .
      </p>
    </div>
  );
}
