/**
 * Scores downloaded photo candidates so the best-looking frame per dish can be
 * picked without eyeballing all 340 of them.
 *
 * There is no vision model in the loop, so the ranking leans on measurable
 * signals that correlate with "this looks like a decent photo of food":
 * sharpness, colourfulness, mid-range exposure, warm cast, subject contrast,
 * plus title heuristics that push down diagrams, packaging shots and scans.
 * Near-duplicates within a dish are collapsed using a difference hash.
 *
 * Usage:
 *   npx tsx scripts/score-photo-candidates.ts [candidates-dir] [out-dir]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

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

type Metrics = {
  sharpness: number;
  colorfulness: number;
  brightness: number;
  warmth: number;
  contrast: number;
  clipping: number;
  hueSpread: number;
};

type Scored = Candidate & { metrics: Metrics; score: number; hash: string };

/** Words that mark an image as "not a photo of the dish". */
const REJECT_WORDS = [
  "diagram",
  "chart",
  "graph",
  "map",
  "logo",
  "icon",
  "poster",
  "sign",
  "label",
  "packaging",
  "package",
  "box",
  "bottle",
  "can ",
  "canned",
  "menu",
  "infographic",
  "screenshot",
  "cover",
  "album",
  "book",
  "illustration",
  "drawing",
  "painting",
  "clipart",
  "mold",
  "blueprint",
  "recipe",
  "raw",
  "macro",
  "microscopic",
  "specimen",
  "herbarium",
  "botanical",
  "press",
  "presse",
  "scan",
  "page",
  "news",
  "advert",
  "poster",
];

/** Words that hint the subject really is plated food. */
const FOOD_WORDS = [
  "food",
  "dish",
  "plate",
  "plated",
  "meal",
  "restaurant",
  "cuisine",
  "cooked",
  "fresh",
  "homemade",
  "kitchen",
  "chef",
  "recipe",
  "menu",
  "delicious",
  "tasty",
  "lunch",
  "dinner",
  "breakfast",
  "brunch",
  "dessert",
  "grill",
  "grilled",
  "fried",
  "baked",
  "roasted",
];

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / (values.length || 1);

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

/** Bell curve peaking at `ideal`, falling off over `spread`. */
function bell(value: number, ideal: number, spread: number) {
  const z = (value - ideal) / spread;
  return Math.exp(-0.5 * z * z);
}

async function metricsFor(file: string): Promise<Metrics> {
  const image = sharp(file, { failOn: "none" });

  const small = await image
    .clone()
    .resize(112, 84, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = small;
  const channels = info.channels;

  const greys: number[] = [];
  const rg: number[] = [];
  const yb: number[] = [];
  const hues: number[] = [];

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const grey = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    greys.push(grey);
    yb.push(b);
    rg.push(r - g);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 24 && max - min > 12) {
      let hue: number;
      if (max === r) hue = ((g - b) / (max - min)) * 60;
      else if (max === g) hue = 60 + ((b - r) / (max - min)) * 60;
      else hue = 120 + ((r - g) / (max - min)) * 60;
      if (hue < 0) hue += 360;
      hues.push(hue);
    }
    if (grey < 0.02 || grey > 0.98) rg.push(0);
  }

  // Sobel edge energy: separates "photograph" from "flat graphic".
  let edgeEnergy = 0;
  let edges = 0;
  for (let y = 1; y < info.height - 1; y += 1) {
    for (let x = 1; x < info.width - 1; x += 1) {
      const at = (px: number, py: number) =>
        greys[py * info.width + px] ?? 0;
      const gx =
        -at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1) +
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) +
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
      edgeEnergy += Math.hypot(gx, gy);
      edges += 1;
    }
  }
  const sharpness = edgeEnergy / (edges || 1);

  // Hasler-Susstrunk colourfulness.
  const mrg = mean(rg);
  const mrb = mean(yb);
  let rootSum = 0;
  for (let i = 0; i < greys.length; i += 1) {
    rootSum += Math.hypot(rg[i] - mrg, yb[i] - mrb);
  }
  const colorfulness =
    Math.sqrt(rootSum / (greys.length || 1)) +
    0.3 * Math.hypot(mrg, mrb);

  const brightness = mean(greys);
  const variance = mean(greys.map((value) => (value - brightness) ** 2));
  const contrast = Math.sqrt(variance);

  const sortedHues = [...hues].sort((a, b) => a - b);
  const hueSpread =
    sortedHues.length > 4
      ? (sortedHues[Math.floor(sortedHues.length * 0.95)] -
          sortedHues[Math.floor(sortedHues.length * 0.05)]) /
        180
      : 0;

  return {
    sharpness: Number(sharpness.toFixed(4)),
    colorfulness: Number(colorfulness.toFixed(4)),
    brightness: Number(brightness.toFixed(4)),
    warmth: Number(mrb.toFixed(4)),
    contrast: Number(contrast.toFixed(4)),
    clipping: Number(
      (greys.filter((v) => v < 0.02 || v > 0.98).length / (greys.length || 1)).toFixed(4),
    ),
    hueSpread: Number(hueSpread.toFixed(4)),
  };
}

async function dHash(file: string) {
  const { data, info } = await sharp(file, { failOn: "none" })
    .resize(9, 8, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = "";
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      bits += data[y * info.width + x] > data[y * info.width + x + 1] ? "1" : "0";
    }
  }
  let hex = "";
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

function hamming(a: string, b: string) {
  let distance = 0;
  for (let i = 0; i < a.length; i += 1) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      distance += x & 1;
      x >>= 1;
    }
  }
  return distance;
}

function scoreCandidate(candidate: Candidate, metrics: Metrics) {
  const title = candidate.title.toLowerCase();

  let score = 0;

  // Photographic feel.
  score += bell(metrics.sharpness, 0.14, 0.07) * 22;
  score += bell(metrics.colorfulness, 0.42, 0.22) * 16;
  score += bell(metrics.brightness, 0.45, 0.16) * 14;
  score += bell(metrics.contrast, 0.2, 0.09) * 12;
  score += bell(metrics.hueSpread, 0.45, 0.25) * 6;

  // Warm cast reads as food; heavy blue/green cast usually does not.
  score += clamp(0.5 + metrics.warmth * 3) * 8;
  score -= clamp(-metrics.warmth * 4) * 8;

  // Blown or crushed pixels.
  score -= clamp(metrics.clipping - 0.02) * 90;

  // Resolution floor.
  const width = candidate.width ?? 0;
  const height = candidate.height ?? 0;
  if (width < 640 || height < 480) score -= 25;
  if (width >= 1400) score += 5;

  // Title signals.
  const rejected = REJECT_WORDS.filter((word) => title.includes(word));
  score -= rejected.length * 26;
  const foodHits = FOOD_WORDS.filter((word) => title.includes(word)).length;
  score += Math.min(foodHits, 3) * 5;

  // Relevance: dish words appearing in the title.
  const words = candidate.query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  const hits = words.filter((word) => title.includes(word)).length;
  score += (hits / (words.length || 1)) * 14;

  if (title.trim().length < 8) score -= 10;

  // Landscape or square framing suits the 4:3 slots.
  if (width && height) {
    const ratio = width / height;
    score += bell(ratio, 1.33, 0.45) * 8;
    if (ratio > 2.1 || ratio < 0.7) score -= 12;
  }

  return Number(score.toFixed(2));
}

async function main() {
  const [, , candidatesDirArg, outDirArg] = process.argv.slice(2);
  const candidatesDir = candidatesDirArg ?? path.join(process.cwd(), ".photo-candidates");
  const outDir = outDirArg ?? path.join(process.cwd(), ".photo-ranked");

  const candidates = JSON.parse(
    await readFile(path.join(candidatesDir, "candidates.json"), "utf8"),
  ) as Candidate[];

  await mkdir(outDir, { recursive: true });

  const scored: Scored[] = [];
  for (const candidate of candidates) {
    const file = path.join(candidatesDir, candidate.file);
    try {
      const metrics = await metricsFor(file);
      scored.push({
        ...candidate,
        metrics,
        score: scoreCandidate(candidate, metrics),
        hash: await dHash(file),
      });
    } catch (error) {
      console.warn(`  ! ${candidate.slug} #${candidate.index} — ${(error as Error).message}`);
    }
  }

  const bySlug = new Map<string, Scored[]>();
  for (const entry of scored) {
    const list = bySlug.get(entry.slug) ?? [];
    list.push(entry);
    bySlug.set(entry.slug, list);
  }

  const ranking: Record<string, unknown> = {};
  for (const [slug, list] of bySlug) {
    list.sort((a, b) => b.score - a.score);

    // Collapse visually identical frames, keeping the highest scoring one.
    const deduped: Scored[] = [];
    for (const entry of list) {
      if (deduped.some((kept) => hamming(kept.hash, entry.hash) <= 6)) continue;
      deduped.push(entry);
    }

    const best = deduped[0];
    ranking[slug] = {
      pick: best
        ? {
            index: best.index,
            file: best.file,
            score: best.score,
            title: best.title,
            creator: best.creator,
            license: best.license,
            foreignLandingUrl: best.foreignLandingUrl,
            sourceUrl: best.sourceUrl,
          }
        : null,
      confidence: best ? Number(clamp(best.score / 70).toFixed(2)) : 0,
      runnersUp: deduped.slice(1, 4).map((entry) => ({
        index: entry.index,
        file: entry.file,
        score: entry.score,
        title: entry.title,
      })),
    };
  }

  await writeFile(path.join(outDir, "ranking.json"), JSON.stringify(ranking, null, 2), "utf8");

  for (const [slug, entry] of Object.entries(ranking)) {
    const typed = entry as { pick: { title: string; score: number } | null; confidence: number };
    console.log(
      `${slug.padEnd(30)} ${typed.pick ? typed.pick.score.toFixed(1).padStart(6) : "  none"}  ${typed.pick?.title.slice(0, 58) ?? ""}`,
    );
  }
  console.log(`\n${Object.keys(ranking).length} dishes ranked -> ${outDir}/ranking.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
