/**
 * One-off helper that pulls candidate photography for every seeded menu item.
 *
 * Photos come from the Openverse API, which aggregates openly licensed images
 * from Flickr and Wikimedia Commons. Nothing here runs at request time — the
 * picked files are committed to `public/images/menu` and the chosen credits are
 * recorded in `prisma/menu-photos.ts`.
 *
 * Usage:
 *   npx tsx scripts/fetch-menu-photos.ts --out <dir> --per-item 8
 *
 * It writes `<dir>/<slug>/<n>.jpg` plus `<dir>/candidates.json`, which is what
 * the contact-sheet page reads.
 */
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import { menu } from "../prisma/menu-data";

type Candidate = {
  index: number;
  slug: string;
  query: string;
  title: string;
  creator: string;
  license: string;
  foreignLandingUrl: string;
  sourceUrl: string;
  width: number | null;
  height: number | null;
  file: string;
};

const API = "https://api.openverse.org/v1/images/";
const UA = "feastcraft-image-fetch/1.0 (local dev script)";

/** Hand-tuned queries. `queries` are tried in order until one yields results. */
const SEARCH_TERMS: Record<string, string[]> = {
  "truffle-parmesan-fries": ["truffle parmesan fries", "truffle fries"],
  "charred-corn-ribs": ["grilled corn ribs", "charred corn on the cob"],
  "crispy-chicken-wings": ["buffalo chicken wings", "fried chicken wings"],
  "burrata-heirloom-tomato": ["burrata tomato salad", "burrata cheese"],
  "crispy-calamari": ["fried calamari", "crispy squid rings"],

  "feastcraft-smash-burger": ["smash burger", "cheeseburger"],
  "crispy-chicken-burger": ["crispy chicken burger", "chicken burger"],
  "mushroom-swiss-melt": ["mushroom swiss burger", "mushroom sandwich"],
  "spicy-chicken-tacos": ["chicken tacos", "spicy tacos"],

  "miso-glazed-salmon": ["miso glazed salmon", "glazed salmon fillet"],
  "slow-braised-short-rib": ["braised beef short ribs", "beef short rib"],
  "thai-green-curry": ["thai green curry", "green curry chicken"],
  "wild-mushroom-risotto": ["mushroom risotto", "risotto"],
  "chargrilled-chicken-steak": ["grilled chicken steak", "grilled chicken breast plate"],

  "truffle-mushroom-pizza": ["mushroom pizza", "funghi pizza"],
  "spicy-pepperoni-pizza": ["pepperoni pizza", "pizza margherita"],
  "spicy-vodka-rigatoni": ["rigatoni vodka sauce", "penne vodka sauce"],
  carbonara: ["carbonara", "spaghetti carbonara"],

  "harvest-grain-bowl": ["grain bowl quinoa", "harvest bowl"],
  "grilled-chicken-caesar": ["chicken caesar salad", "caesar salad"],
  "prawn-avocado-salad": ["prawn avocado salad", "shrimp avocado salad"],
  "roast-cauliflower-bowl": ["roast cauliflower", "cauliflower bowl"],

  "shoestring-fries": ["french fries", "french fries plate"],
  "garlic-butter-greens": ["sauteed greens spinach", "grilled greens vegetables"],
  "loaded-cheese-fries": ["cheese fries", "loaded fries"],
  "spicy-buffalo-wings": ["buffalo wings", "spicy chicken wings plate"],

  "molten-chocolate-torte": ["molten chocolate cake", "chocolate lava cake"],
  "basque-cheesecake": ["basque cheesecake", "burnt cheesecake"],
  "pistachio-tiramisu": ["tiramisu", "tiramisu pistachio"],
  "salted-caramel-cheesecake-jar": ["cheesecake jar", "cheesecake slice"],

  "salted-caramel-cold-brew": ["cold brew coffee", "iced coffee glass"],
  "blood-orange-soda": ["blood orange drink", "orange soda glass"],
  "mango-lassi": ["mango lassi", "mango smoothie glass"],
  "fresh-lemonade": ["lemonade glass", "fresh lemonade"],
};

function parseArgs() {
  const argv = process.argv.slice(2);
  const read = (flag: string, fallback: string) => {
    const at = argv.indexOf(flag);
    return at === -1 ? fallback : argv[at + 1];
  };
  return {
    out: read("--out", path.join(process.cwd(), ".photo-candidates")),
    perItem: Number(read("--per-item", "8")),
    delay: Number(read("--delay", "3200")),
    only: read("--only", "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    /** `--search "slug=terms, slug=terms"` overrides the query table. */
    searchOverrides: parseOverrides(read("--search", "")),
    /** `--reset slug1,slug2` drops earlier candidates for those dishes. */
    reset: read("--reset", "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

/** Parses `slug=term one|term two, other=term` into slug -> queries. */
function parseOverrides(raw: string): Record<string, string[]> {
  const overrides: Record<string, string[]> = {};
  if (!raw.trim()) return overrides;
  for (const pair of raw.split(",")) {
    const [slug, terms] = pair.split("=");
    if (!slug || !terms) continue;
    overrides[slug.trim()] = terms.split("|").map((term) => term.trim()).filter(Boolean);
  }
  return overrides;
}

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function search(query: string, pageSize: number) {
  const url =
    `${API}?q=${encodeURIComponent(query)}` +
    `&page_size=${pageSize}` +
    `&license_type=commercial,modification` +
    `&mature=false`;

  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) throw new Error(`Openverse ${response.status} for "${query}"`);
  const json = (await response.json()) as {
    results?: Array<{
      title?: string;
      creator?: string;
      license?: string;
      license_version?: string;
      foreign_landing_url?: string;
      url?: string;
      width?: number;
      height?: number;
    }>;
  };
  return json.results ?? [];
}

/**
 * Flickr only serves downsized derivatives from predictable URL suffixes, and
 * which ones exist depends on the original upload. Try the big ones first.
 */
function sizeVariants(url: string) {
  if (!/_[a-z]\.jpg$/i.test(url)) return [url];
  return [
    url.replace(/_[a-z]\.jpg$/i, "_k.jpg"),
    url.replace(/_[a-z]\.jpg$/i, "_h.jpg"),
    url.replace(/_[a-z]\.jpg$/i, "_b.jpg"),
    url,
  ];
}

async function download(url: string, dest: string) {
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) throw new Error(`download ${response.status} ${url}`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`not an image (${type}) ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.byteLength < 12_000) throw new Error("too small to be useful");
  await writeFile(dest, body);
  return body.byteLength;
}

async function downloadFirstAvailable(url: string, dest: string) {
  let lastError: unknown;
  for (const variant of sizeVariants(url)) {
    try {
      return await download(variant, dest);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const { out, perItem, delay, only, searchOverrides, reset } = parseArgs();
  const manifestPath = path.join(out, "candidates.json");
  const previous = (await exists(manifestPath))
    ? (JSON.parse(await readFile(manifestPath, "utf8")) as Candidate[])
    : [];
  const dropped = new Set(reset);
  const collected: Candidate[] = previous.filter((entry) => !dropped.has(entry.slug));
  const done = new Set(collected.map((entry) => `${entry.slug}#${entry.index}`));

  await mkdir(out, { recursive: true });
  const slugs = menu
    .flatMap((category) => category.items.map((item) => item.slug))
    .filter((slug) => only.length === 0 || only.includes(slug));

  for (const slug of slugs) {
    const queries = searchOverrides[slug] ?? SEARCH_TERMS[slug] ?? [slug.replace(/-/g, " ")];
    let index = dropped.has(slug) ? 0 : collected.filter((e) => e.slug === slug).length;

    for (const query of queries) {
      if (collected.filter((entry) => entry.slug === slug).length >= perItem) break;

      let results: Awaited<ReturnType<typeof search>> = [];
      try {
        await sleep(delay);
        results = await search(query, perItem + 10);
      } catch (error) {
        console.warn(`  ! ${slug} / "${query}" — ${(error as Error).message}`);
        continue;
      }

      for (const result of results) {
        if (collected.filter((entry) => entry.slug === slug).length >= perItem) break;
        if (!result.url) continue;
        if (index > 0 && done.has(`${slug}#${index}`)) continue;

        const dir = path.join(out, slug);
        const file = path.join(dir, `${index}.jpg`);
        try {
          await mkdir(dir, { recursive: true });
          await downloadFirstAvailable(result.url, file);
        } catch {
          index += 1;
          continue;
        }

        collected.push({
          index,
          slug,
          query,
          title: result.title ?? slug,
          creator: result.creator ?? "Unknown",
          license: `${(result.license ?? "cc0").toUpperCase()} ${result.license_version ?? ""}`.trim(),
          foreignLandingUrl: result.foreign_landing_url ?? "",
          sourceUrl: result.url,
          width: result.width ?? null,
          height: result.height ?? null,
          file: path.relative(out, file).replace(/\\/g, "/"),
        });
        done.add(`${slug}#${index}`);
        index += 1;
      }

      if (collected.filter((entry) => entry.slug === slug).length >= perItem) break;
    }

    const have = collected.filter((entry) => entry.slug === slug).length;
    console.log(`  ${have >= perItem ? "ok  " : "thin"} ${slug} (${have})`);

    await writeFile(manifestPath, JSON.stringify(collected, null, 2), "utf8");
  }

  console.log(`\n${collected.length} candidates across ${slugs.length} dishes -> ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
