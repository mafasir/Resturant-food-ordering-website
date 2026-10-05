/**
 * Renders candidate photos into contact sheets so a human (or an agent with
 * vision) can pick the best frame per dish.
 *
 * Usage:
 *   npx tsx scripts/contact-sheet.ts <candidates-dir> <sheets-dir> [perSheet]
 */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

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

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

async function main() {
  const [candidatesDir, sheetsDir, perSheetArg] = process.argv.slice(2);
  if (!candidatesDir || !sheetsDir) {
    console.error("usage: tsx scripts/contact-sheet.ts <candidates-dir> <sheets-dir> [perSheet]");
    process.exitCode = 1;
    return;
  }
  const perSheet = Number(perSheetArg ?? 6);

  const candidates = JSON.parse(
    await readFile(path.join(candidatesDir, "candidates.json"), "utf8"),
  ) as Candidate[];

  const bySlug = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const list = bySlug.get(candidate.slug) ?? [];
    list.push(candidate);
    bySlug.set(candidate.slug, list);
  }
  const slugs = [...bySlug.keys()].sort();

  await mkdir(sheetsDir, { recursive: true });

  const batches: string[][] = [];
  for (let i = 0; i < slugs.length; i += perSheet) {
    batches.push(slugs.slice(i, i + perSheet));
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_CANDIDATES.find(Boolean),
    headless: true,
    args: ["--no-sandbox", "--allow-file-access-from-files", "--hide-scrollbars"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 1 });

  const written: string[] = [];

  for (const [batchIndex, batch] of batches.entries()) {
    const sections = batch
      .map((slug) => {
        const cells = (bySlug.get(slug) ?? [])
          .map((candidate) => {
            const src = `file:///${path
              .join(candidatesDir, candidate.file)
              .replace(/\\/g, "/")}`;
            return `<figure>
        <img src="${src}" />
        <figcaption><b>${slug} #${candidate.index}</b><br/>${escapeHtml(
          candidate.title.slice(0, 70),
        )}<br/><span>${escapeHtml(candidate.creator.slice(0, 28))} · ${escapeHtml(
          candidate.license,
        )}</span></figcaption>
      </figure>`;
          })
          .join("\n");
        return `<section><h2>${escapeHtml(slug)}</h2><div class="grid">${cells}</div></section>`;
      })
      .join("\n");

    const html = `<!doctype html><meta charset="utf-8"/>
<style>
  body { margin:0; background:#111; color:#eee; font:12px/1.3 system-ui, sans-serif; padding:10px; }
  section { margin-bottom: 14px; }
  h2 { font-size:15px; margin:0 0 6px; color:#f9a825; }
  .grid { display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; }
  figure { margin:0; background:#1e1e1e; border-radius:6px; overflow:hidden; }
  img { width:100%; height:150px; object-fit:cover; display:block; background:#333; }
  figcaption { padding:4px 6px; font-size:10px; line-height:1.25; }
  span { color:#999; }
</style>
${sections}`;

    const htmlPath = path.join(sheetsDir, `sheet-${batchIndex + 1}.html`);
    await writeFile(htmlPath, html, "utf8");

    await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
      waitUntil: "networkidle0",
    });
    const pngPath = path.join(sheetsDir, `sheet-${batchIndex + 1}.png`);
    await page.screenshot({ path: pngPath, fullPage: true });
    written.push(pngPath);
    console.log(`  sheet ${batchIndex + 1}/${batches.length} -> ${pngPath}`);
  }

  await browser.close();

  // A machine-readable index so picks can be recorded without re-reading HTML.
  await writeFile(
    path.join(sheetsDir, "index.json"),
    JSON.stringify(
      batches.map((batch, i) => ({
        sheet: `sheet-${i + 1}`,
        png: `sheet-${i + 1}.png`,
        slugs: batch,
      })),
      null,
      2,
    ),
    "utf8",
  );

  const files = await readdir(sheetsDir);
  console.log(`\n${files.length} files in ${sheetsDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
