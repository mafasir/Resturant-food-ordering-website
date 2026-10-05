/**
 * Builds the static Open Graph / Twitter card at `public/images/site/og.png`.
 *
 * Next's `ImageResponse` would need font binaries wired into the build, so the
 * card is rendered once with headless Chrome and committed as a plain PNG. The
 * dish thumbnails are the real menu photos, so the share image always matches
 * what is actually on the menu.
 *
 * Usage:
 *   npx tsx scripts/build-og-image.ts
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";

const WIDTH = 1200;
const HEIGHT = 630;

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Real menu photos, so the card reflects the current menu. */
const DISHES = [
  { file: "menu/truffle-mushroom-pizza.jpg", alt: "Truffle mushroom pizza" },
  { file: "menu/feastcraft-smash-burger.jpg", alt: "Smash burger" },
  { file: "menu/miso-glazed-salmon.jpg", alt: "Miso glazed salmon" },
];

const fileUrl = (...segments: string[]) =>
  `file:///${path.join(...segments).replace(/\\/g, "/")}`;

async function main() {
  const outputDir = path.join(PUBLIC_DIR, "images", "site");
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "og.png");

  // Verify every asset exists before spending time in the browser.
  await readFile(path.join(PUBLIC_DIR, "images", "site", "dining-room.jpg"));
  for (const dish of DISHES) {
    await readFile(path.join(PUBLIC_DIR, "images", dish.file));
  }

  const background = fileUrl(PUBLIC_DIR, "images", "site", "dining-room.jpg");
  const thumbnails = await Promise.all(
    DISHES.map(async (dish) => ({
      alt: dish.alt,
      src: fileUrl(PUBLIC_DIR, "images", dish.file),
    })),
  );

  const cards = thumbnails
    .map(
      (dish, index) => `
      <figure class="card card-${index + 1}">
        <img src="${dish.src}" alt="${dish.alt}" />
      </figure>`,
    )
    .join("\n");

  const html = `<!doctype html><meta charset="utf-8" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    background: #0a0908;
    color: #f7f1e7;
    font-family: Inter, system-ui, sans-serif;
    position: relative;
  }
  .bg {
    position: absolute; inset: 0;
    background-image: url('${background}');
    background-size: cover;
    background-position: center 58%;
    filter: saturate(0.85) brightness(0.42);
  }
  .scrim {
    position: absolute; inset: 0;
    background:
      linear-gradient(100deg, #0a0908 26%, rgba(10,9,8,0.92) 48%, rgba(10,9,8,0.35) 100%),
      linear-gradient(to top, rgba(10,9,8,0.95), rgba(10,9,8,0) 55%);
  }
  .glow {
    position: absolute; border-radius: 999px; filter: blur(90px); opacity: 0.5;
  }
  .glow-a { width: 460px; height: 460px; left: -140px; top: -170px; background: #f2551f; }
  .glow-b { width: 340px; height: 340px; left: 180px; bottom: -200px; background: #e5a12c; opacity: 0.35; }

  .content { position: relative; display: flex; flex-direction: column; justify-content: center; height: 100%; padding: 0 64px; max-width: 720px; }

  .eyebrow {
    display: flex; align-items: center; gap: 12px;
    font-size: 15px; font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase;
    color: #fb7440;
  }
  .eyebrow::before { content: ''; width: 34px; height: 2px; background: #fb7440; }

  h1 {
    margin-top: 22px;
    font-family: Sora, Inter, sans-serif;
    font-size: 62px; line-height: 1.06; font-weight: 800; letter-spacing: -0.025em;
  }
  h1 span {
    background: linear-gradient(100deg, #ffd77a, #fb7440 55%, #ff7a8a);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }

  p.sub { margin-top: 20px; font-size: 22px; line-height: 1.45; color: #cfc5b8; max-width: 560px; }

  .cta {
    margin-top: 34px; align-self: flex-start;
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 26px; border-radius: 14px;
    background: linear-gradient(135deg, #ffd77a, #f2551f);
    color: #0a0908; font-size: 18px; font-weight: 700;
  }

  .collage { position: absolute; right: 56px; top: 50%; width: 470px; height: 400px; transform: translateY(-50%); }
  .card {
    position: absolute; width: 250px; height: 186px; overflow: hidden;
    border-radius: 20px; border: 1px solid rgba(247,241,231,0.14);
    box-shadow: 0 28px 60px -30px rgba(0,0,0,0.9);
    background: #16130f;
  }
  .card img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-1 { left: 0; top: 26px; transform: rotate(-6deg); z-index: 3; }
  .card-2 { left: 96px; top: 118px; transform: rotate(4deg); z-index: 2; }
  .card-3 { left: 186px; top: 208px; transform: rotate(-2deg); z-index: 1; }

  .footer {
    position: absolute; left: 64px; bottom: 34px;
    font-size: 16px; color: #7a7167; letter-spacing: 0.02em;
  }
</style>
<div class="bg"></div>
<div class="scrim"></div>
<div class="glow glow-a"></div>
<div class="glow glow-b"></div>

<div class="content">
  <div class="eyebrow">FeastCraft</div>
  <h1>Fire-kissed food,<br /><span>delivered hot.</span></h1>
  <p class="sub">Wood-fired pizza, flame-grilled mains, market bowls and desserts worth the detour.</p>
  <div class="cta">Order online in under a minute</div>
</div>

<div class="collage">
${cards}
</div>

<div class="footer">Open daily &middot; Free delivery over $35 &middot; feastcraft.test</div>`;

  // The intermediate markup is scratch, so keep it out of `public`.
  const htmlPath = path.join(os.tmpdir(), "feastcraft-og-source.html");
  await writeFile(htmlPath, html, "utf8");

  const browser = await puppeteer.launch({
    executablePath: CHROME_CANDIDATES.find(Boolean),
    headless: true,
    args: ["--no-sandbox", "--allow-file-access-from-files", "--hide-scrollbars"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
      waitUntil: "networkidle0",
    });
    await page.screenshot({ path: outputPath });
  } finally {
    await browser.close();
  }

  console.log(`  og card -> ${outputPath}`);
  console.log(`  editable source -> ${htmlPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
