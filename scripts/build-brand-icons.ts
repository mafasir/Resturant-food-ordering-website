/**
 * Generates the brand app icons from the same mark the header renders.
 *
 * `src/app/favicon.ico` shipped with the Next.js starter logo, so browser tabs
 * and iOS home screens showed the framework's mark instead of FeastCraft's. This
 * writes the gradient tile plus spark glyph from `src/components/logo.tsx` into
 * every icon slot the app router supports.
 *
 * Output:
 *   src/app/icon.svg         scalable favicon (modern browsers)
 *   src/app/apple-icon.png   180x180 home screen icon
 *   src/app/favicon.ico      32x32, for legacy / bookmark fallback
 *
 * Usage:
 *   npx tsx scripts/build-brand-icons.ts
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const APP_DIR = path.join(process.cwd(), "src", "app");

/** Brand stops, mirroring `from-gold-300 via-ember-400 to-ember-600`. */
const GRADIENT_STOPS: Array<[number, string]> = [
  [0, "#ffd77a"],
  [0.5, "#fb7440"],
  [1, "#d93d0f"],
];

const CANVAS = "#0a0908";

/** Glyph from lucide-react's `Sparkles`, on a 24x24 grid. */
const SPARKLES = `
  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
  <path d="M20 2v4"/>
  <path d="M22 4h-4"/>
  <circle cx="4" cy="20" r="2"/>`;

/**
 * Renders the mark at an arbitrary size. The glyph sits on the canvas colour and
 * is scaled to ~58% of the tile, matching `LogoMark`'s `size-5` on `size-9`.
 */
function markSvg(size: number) {
  const radius = Math.round(size * 0.29);
  const glyph = size * 0.58;
  const offset = (size - glyph) / 2;
  const scale = glyph / 24;

  const stops = GRADIENT_STOPS.map(
    ([stop, colour]) =>
      `    <stop offset="${(stop * 100).toFixed(0)}%" stop-color="${colour}" />`,
  ).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="FeastCraft">
  <defs>
    <linearGradient id="tile" x1="0%" y1="0%" x2="100%" y2="100%">
${stops}
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#tile)" />
  <g transform="translate(${offset.toFixed(2)} ${offset.toFixed(2)}) scale(${scale.toFixed(4)})" fill="${CANVAS}" stroke="${CANVAS}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
${SPARKLES.trim()}
  </g>
</svg>
`;
}

/**
 * Wraps a PNG in an ICO container. Every browser that understands favicon.ico
 * today also understands PNG-compressed icon entries, so this avoids pulling in
 * an encoder just for one 32x32 frame.
 */
function pngToIco(png: Buffer, size: number) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width, 0 means 256
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette size
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.byteLength, 8);
  entry.writeUInt32LE(header.byteLength + entry.byteLength, 12);

  return Buffer.concat([header, entry, png]);
}

async function main() {
  const svg = markSvg(512);
  await writeFile(path.join(APP_DIR, "icon.svg"), svg, "utf8");
  console.log("  icon.svg");

  const apple = await sharp(Buffer.from(svg))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(APP_DIR, "apple-icon.png"), apple);
  console.log(`  apple-icon.png (${apple.byteLength} bytes)`);

  const favicon = await sharp(Buffer.from(svg))
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(APP_DIR, "favicon.ico"), pngToIco(favicon, 32));
  console.log(`  favicon.ico (${favicon.byteLength + 22} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
