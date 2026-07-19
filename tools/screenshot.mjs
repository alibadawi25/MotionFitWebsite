#!/usr/bin/env node
/* Headless capture & style inspection for the MotionFit landing page.
 *
 * Drives the system Chrome via puppeteer-core (no bundled browser download).
 *
 * Setup:  cd tools && npm install
 * Usage:  node tools/screenshot.mjs [url] [options]
 *
 * With no url, loads index.html from disk via file://.
 *
 * Options:
 *   --out <file>       output PNG (default tools/shots/page.png or <selector>.png)
 *   --selector <css>   capture a single element, scrolled into view first
 *   --styles <css>     print computed styles for the element instead of a shot
 *   --props <a,b,c>    with --styles: only print these properties
 *   --full             full-page capture (scrolls through first so once-only
 *                      reveals have fired)
 *   --width <px>       viewport width  (default 1440)
 *   --height <px>      viewport height (default 900)
 *   --settle <ms>      extra wait after load/scroll for animations (default 800)
 *   --intro            play the full READY-SET-GO intro (skipped by default via
 *                      the mf-intro sessionStorage flag)
 *   --reduced-motion   emulate prefers-reduced-motion: reduce (static page path)
 *   --no-vendor        block vendor/ scripts (IntersectionObserver fallback path)
 */

import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const here = dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const die = (msg) => { console.error(`error: ${msg}`); process.exit(1); };

/* --- args --- */
const argv = process.argv.slice(2);
const opts = {
  url: "", out: "", selector: "", styles: "", props: [],
  full: false, width: 1440, height: 900, settle: 800,
  intro: false, reducedMotion: false, noVendor: false,
};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => argv[++i] ?? die(`${a} needs a value`);
  if (a === "--out") opts.out = next();
  else if (a === "--selector") opts.selector = next();
  else if (a === "--styles") opts.styles = next();
  else if (a === "--props") opts.props = next().split(",").map((s) => s.trim()).filter(Boolean);
  else if (a === "--full") opts.full = true;
  else if (a === "--width") opts.width = Number(next());
  else if (a === "--height") opts.height = Number(next());
  else if (a === "--settle") opts.settle = Number(next());
  else if (a === "--intro") opts.intro = true;
  else if (a === "--reduced-motion") opts.reducedMotion = true;
  else if (a === "--no-vendor") opts.noVendor = true;
  else if (a.startsWith("--")) die(`unknown option ${a}`);
  else opts.url = a;
}
if (!opts.url) opts.url = pathToFileURL(join(here, "..", "index.html")).href;

/* --- find Chrome --- */
const chrome = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
].filter(Boolean).find(existsSync);
if (!chrome) die("Chrome not found — set CHROME_PATH to chrome.exe");

/* --- drive the page --- */
const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: opts.width, height: opts.height });

  if (opts.reducedMotion) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  if (!opts.intro) {
    await page.evaluateOnNewDocument(() => {
      try { sessionStorage.setItem("mf-intro", "1"); } catch (_) {}
    });
  }
  if (opts.noVendor) {
    await page.setRequestInterception(true);
    page.on("request", (req) =>
      req.url().includes("/vendor/") ? req.abort() : req.continue());
  }

  await page.goto(opts.url, { waitUntil: "networkidle0", timeout: 30000 });

  // the preloader removes itself when the intro finishes — wait for that
  await page.waitForFunction(() => {
    const el = document.getElementById("loader");
    if (!el) return true;
    const cs = getComputedStyle(el);
    return cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0;
  }, { timeout: 15000 }).catch(() =>
    console.warn("warning: preloader still visible after 15s — continuing anyway"));
  await sleep(opts.settle);

  /* --- computed-style dump --- */
  if (opts.styles) {
    const dump = await page.evaluate((sel, props) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const names = props.length ? props : Array.from(cs).sort();
      const out = {};
      for (const p of names) out[p] = cs.getPropertyValue(p);
      return out;
    }, opts.styles, opts.props);
    if (!dump) die(`no element matches ${opts.styles}`);
    for (const [k, v] of Object.entries(dump)) console.log(`${k}: ${v}`);
  }

  /* --- screenshot (skipped in --styles mode) --- */
  if (!opts.styles) {
    const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "page";
    const out = resolve(opts.out || join(here, "shots", `${slug(opts.selector) || "page"}.png`));
    mkdirSync(dirname(out), { recursive: true });

    if (opts.selector) {
      const handle = await page.$(opts.selector);
      if (!handle) die(`no element matches ${opts.selector}`);
      await page.evaluate((el) => el.scrollIntoView({ block: "center" }), handle);
      await sleep(opts.settle);
      await handle.screenshot({ path: out });
    } else {
      if (opts.full) {
        // reveals are once:true — one pass down the page fires them all
        await page.evaluate(async () => {
          const step = Math.max(200, window.innerHeight * 0.7);
          for (let y = 0; y <= document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 180));
          }
          window.scrollTo(0, 0);
        });
        await sleep(opts.settle);
      }
      await page.screenshot({ path: out, fullPage: opts.full });
    }
    console.log(out);
  }
} finally {
  await browser.close();
}
