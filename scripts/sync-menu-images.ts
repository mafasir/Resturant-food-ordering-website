/**
 * Points every `MenuItem.image` at the file that actually exists on disk.
 *
 * Dish photography lives in `public/images/menu/<slug>.jpg`, with the generated
 * SVG poster from `src/lib/menu-artwork.ts` as a fallback. Rather than re-running
 * the destructive seed, this walks the existing rows and rewrites only the `image`
 * column, so orders, users and promos are left untouched.
 *
 * Usage:
 *   npx tsx scripts/sync-menu-images.ts
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function resolveDatabaseUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const raw = url.slice("file:".length);
  if (raw.startsWith(":memory:")) return url;
  const absolute = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  return `file:${absolute}`;
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: resolveDatabaseUrl(process.env.DATABASE_URL ?? "file:./prisma/dev.db"),
  }),
});

const IMAGE_DIR = path.join(process.cwd(), "public", "images", "menu");

function resolveImage(slug: string) {
  return existsSync(path.join(IMAGE_DIR, `${slug}.jpg`))
    ? `/images/menu/${slug}.jpg`
    : `/images/menu/${slug}.svg`;
}

async function main() {
  const items = await prisma.menuItem.findMany({
    select: { id: true, slug: true, image: true },
  });

  let changed = 0;
  for (const item of items) {
    const image = resolveImage(item.slug);
    if (item.image === image) continue;
    await prisma.menuItem.update({ where: { id: item.id }, data: { image } });
    changed += 1;
    console.log(`  ${item.slug.padEnd(30)} ${item.image} -> ${image}`);
  }

  console.log(
    changed === 0
      ? `\nall ${items.length} menu items already point at the right file`
      : `\nupdated ${changed} of ${items.length} menu items`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
