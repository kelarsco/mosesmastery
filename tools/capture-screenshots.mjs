// Captures a homepage screenshot of every brand in tools/brands.json
// and saves it to asset/brands/<slug>.jpg (the gallery on index.html picks them up automatically).
//
// Run from the project root, on a computer with normal internet access:
//   npm i -D playwright
//   npx playwright install chromium
//   node tools/capture-screenshots.mjs            # all brands
//   node tools/capture-screenshots.mjs coofandy   # only the slugs you list
//
// Env: BRANDS_FILE=path/to/other.json to use a different list.

import { chromium } from "playwright";
import { readFileSync, mkdirSync, existsSync, statSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const listFile = process.env.BRANDS_FILE || path.join(root, "tools", "brands.json");
const outDir = path.join(root, "asset", "brands");
mkdirSync(outDir, { recursive: true });

const { brands } = JSON.parse(readFileSync(listFile, "utf8"));
const only = new Set(process.argv.slice(2));
const todo = only.size ? brands.filter((b) => only.has(b.slug)) : brands;

const DISMISS = [
  /^(accept|accept all|allow all|agree|i agree|got it|ok|okay|no thanks|no, thanks|close|dismiss|continue)$/i,
];

async function tidy(page) {
  // best-effort: close cookie banners / newsletter popups so the screenshot shows the store
  for (const re of DISMISS) {
    const btns = page.getByRole("button", { name: re });
    const n = Math.min(await btns.count().catch(() => 0), 3);
    for (let i = 0; i < n; i++) await btns.nth(i).click({ timeout: 800 }).catch(() => {});
  }
  await page.keyboard.press("Escape").catch(() => {});
  await page.addStyleTag({
    content: `[id*="chat" i], [class*="chat-widget" i], iframe[title*="chat" i], [class*="klaviyo" i], [id*="shopify-section-popup" i]{display:none!important}`,
  }).catch(() => {});
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
});

const failed = [];
const report = [];
const MIN_BYTES = 25000; // smaller JPEGs at 1440x900 are blank or error pages
const CHALLENGE = /just a moment|attention required|access denied|verify you are human|failed to verify|security checkpoint|captcha|are you a robot|403 forbidden|pardon our interruption|store is currently unavailable/;

for (const b of todo) {
  const file = path.join(outDir, `${b.slug}.jpg`);
  if (!process.env.FORCE && !only.size && existsSync(file) && statSync(file).size >= MIN_BYTES) { console.log("keep ", b.slug); continue; }
  let ok = false, why = "";
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    const page = await ctx.newPage();
    try {
      try { await page.goto(b.url, { waitUntil: "load", timeout: 60000 }); }
      catch { await page.goto(b.url, { waitUntil: "domcontentloaded", timeout: 60000 }); }
      await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2500 + attempt * 2500);
      await tidy(page);
      await page.evaluate(() => window.scrollTo(0, 400)).catch(() => {});
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
      await page.waitForTimeout(1200);
      const title = (await page.title().catch(() => "")).toLowerCase();
      const body = (await page.locator("body").innerText({ timeout: 3000 }).catch(() => "")).slice(0, 800).toLowerCase();
      if (CHALLENGE.test(title + " " + body)) { why = "bot-check or unavailable page"; break; } // not bypassed on purpose
      const buf = await page.screenshot({ type: "jpeg", quality: 82 });
      if (buf.length < MIN_BYTES) { why = `blank render (${buf.length} bytes), attempt ${attempt}`; continue; }
      writeFileSync(file, buf); ok = true;
    } catch (e) {
      why = String(e.message).split("\n")[0];
    } finally {
      await page.close();
    }
  }
  report.push(`${ok ? "ok  " : "FAIL"} ${b.slug}${ok ? "" : " - " + why}`);
  console.log(report[report.length - 1]);
  if (!ok) { failed.push(b.slug); if (existsSync(file) && statSync(file).size < MIN_BYTES) unlinkSync(file); }
}
await browser.close();
writeFileSync(path.join(root, "tools", "capture-report.txt"), report.join("\n") + "\n");
console.log(`\nDone: ${todo.length - failed.length} ok, failed: ${failed.join(", ") || "none"}`);
process.exit(0);
