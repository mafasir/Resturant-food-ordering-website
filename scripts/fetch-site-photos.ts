/**
 * Downloads the editorial photography used on the marketing pages.
 *
 * These used to be hotlinked straight from Unsplash, which meant the site broke
 * whenever the network was unavailable and shipped third-party requests to every
 * visitor. They are now vendored into `public/images/site` and cropped to the
 * exact aspect ratio of the slot that renders them.
 *
 * Usage:
 *   npx tsx scripts/fetch-site-photos.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type SitePhoto = {
  /** File name inside `public/images/site`. */
  name: string;
  /** Unsplash photo id, without the `photo-` prefix. */
  id: string;
  alt: string;
  width: number;
  height: number;
};

const PHOTOS: SitePhoto[] = [
  {
    name: "dining-room",
    id: "1517248135467-4c7edcad34c4",
    alt: "The warmly lit FeastCraft dining room at night",
    width: 2100,
    height: 900,
  },
  {
    name: "the-pass",
    id: "1556910103-1c02745aae4d",
    alt: "A chef finishing a plate at the pass",
    width: 1200,
    height: 800,
  },
  {
    name: "counter-seats",
    id: "1414235077428-338989a2e8c0",
    alt: "The counter seats with guests dining",
    width: 1200,
    height: 800,
  },
  {
    name: "wood-fired-pizza",
    id: "1604382354936-07c5d9983bd3",
    alt: "Wood-fired pizza with charred crust",
    width: 1000,
    height: 1250,
  },
  {
    name: "smash-burgers",
    id: "1550547660-d9450f859349",
    alt: "Stacked cheeseburger with fresh toppings",
    width: 1000,
    height: 1250,
  },
  {
    name: "market-bowls",
    id: "1546069901-ba9599a7e63c",
    alt: "Colourful grain bowl with fresh vegetables",
    width: 1000,
    height: 1250,
  },
  {
    name: "desserts",
    id: "1563805042-7684c019e1cb",
    alt: "Creamy dessert served in a glass",
    width: 1000,
    height: 1250,
  },
];

const OUT_DIR = path.join(process.cwd(), "public", "images", "site");
const UA = "feastcraft-image-fetch/1.0 (local dev script)";

function sourceUrl(id: string, width: number) {
  return `https://images.unsplash.com/photo-${id}?q=85&w=${width}&auto=format&fit=crop`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const photo of PHOTOS) {
    const destination = path.join(OUT_DIR, `${photo.name}.jpg`);
    const response = await fetch(sourceUrl(photo.id, photo.width * 2), {
      headers: { "User-Agent": UA },
    });
    if (!response.ok) {
      throw new Error(`${photo.name}: Unsplash responded ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    await sharp(buffer, { failOn: "none" })
      .resize(photo.width, photo.height, { fit: "cover", position: sharp.strategy.attention })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(destination);

    console.log(`  ${photo.name}.jpg  ${photo.width}x${photo.height}`);
  }

  await writeFile(
    path.join(OUT_DIR, "CREDITS.md"),
    `# Site photography credits

Editorial shots used on the home and about pages, served from this directory.
Originally hotlinked from [Unsplash](https://unsplash.com), now vendored so the
site renders without a third-party request. Unsplash licence:
<https://unsplash.com/license>.

| File | Alt text | Source |
| --- | --- | --- |
${PHOTOS.map(
  (photo) =>
    `| \`${photo.name}.jpg\` | ${photo.alt} | https://unsplash.com/photos/${photo.id} |`,
).join("\n")}

Regenerate with:

\`\`\`
npx tsx scripts/fetch-site-photos.ts
\`\`\`
`,
    "utf8",
  );

  console.log(`\n${PHOTOS.length} photos -> ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
