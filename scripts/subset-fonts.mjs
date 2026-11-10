// Builds the self-hosted fonts for the homepage.
//
//   npm run fonts
//
// - martian-grotesk-latin.woff2  Latin subset of the brand typeface (variable: weight + width)
// - martian-mono-latin.woff2     Latin subset for labels and data (variable: weight)
// - frontis-hei-900.woff2        Source Han Sans / Noto Sans SC Heavy, limited to the characters
//                                that appear in display text (h1–h3 and [data-d]) on the homepage
//
// Re-run this whenever a Chinese headline changes. A missing glyph is not fatal:
// the browser falls back to the system Chinese font for that character.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import subsetFont from "subset-font";

const require = createRequire(import.meta.url);
const root = process.cwd();
const outDir = path.join(root, "assets/fonts");
const pages = ["index.html", "en.html"].filter((file) => fs.existsSync(path.join(root, file)));

const LATIN =
  Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("") +
  " ·×—–‘’“”•…′″←↑→↓↗≤≥©";

function displayText(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "");
  const chunks = [];
  const tagPattern = /<(h1|h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const attrPattern = /<([a-z0-9]+)\b[^>]*\sdata-d\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const pattern of [tagPattern, attrPattern]) {
    let match;
    while ((match = pattern.exec(body))) chunks.push(match[2]);
  }
  return chunks.join("").replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/gi, "");
}

function cjkOnly(text) {
  const keep = new Set();
  for (const ch of text) {
    const code = ch.codePointAt(0);
    const isCjk =
      (code >= 0x4e00 && code <= 0x9fff) || // unified ideographs
      (code >= 0x3000 && code <= 0x303f) || // CJK punctuation
      (code >= 0xff00 && code <= 0xffef); // full-width forms
    if (isCjk) keep.add(ch);
  }
  return Array.from(keep).sort().join("");
}

async function build() {
  fs.mkdirSync(outDir, { recursive: true });

  const grotesk = fs.readFileSync(path.join(outDir, "src/MartianGrotesk-VF.woff2"));
  const groteskOut = await subsetFont(grotesk, LATIN, {
    targetFormat: "woff2",
    variationAxes: { wght: { min: 300, max: 1000 }, wdth: { min: 100, max: 150 } },
  });
  fs.writeFileSync(path.join(outDir, "martian-grotesk-latin.woff2"), groteskOut);

  const monoSource = require.resolve("@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2");
  const monoOut = await subsetFont(fs.readFileSync(monoSource), LATIN, { targetFormat: "woff2" });
  fs.writeFileSync(path.join(outDir, "martian-mono-latin.woff2"), monoOut);

  const display = cjkOnly(pages.map((file) => displayText(fs.readFileSync(path.join(root, file), "utf8"))).join(""));
  const heiSource = require.resolve("@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-900-normal.woff2");
  const heiOut = await subsetFont(fs.readFileSync(heiSource), display, { targetFormat: "woff2" });
  fs.writeFileSync(path.join(outDir, "frontis-hei-900.woff2"), heiOut);

  const kb = (buffer) => `${(buffer.length / 1024).toFixed(1)} KB`;
  console.log(`martian-grotesk-latin.woff2  ${kb(groteskOut)}`);
  console.log(`martian-mono-latin.woff2     ${kb(monoOut)}`);
  console.log(`frontis-hei-900.woff2        ${kb(heiOut)}  (${Array.from(display).length} characters from ${pages.join(", ")})`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
