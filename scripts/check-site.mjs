import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pages = [
  "index.html",
  "horizon.html",
  "leadeep.html",
  "scene.html",
  "scene-strategy.html",
  "scene-supply.html",
  "scene-sales.html",
  "scene-ops.html",
  "scene-research.html",
  "technology.html",
  "ecosystem.html",
  "about.html",
];

const requiredAssets = [
  "assets/logo-light.svg",
  "assets/logo-dark.svg",
  "components/site-shell.css",
  "components/site-shell.js",
  "api/cta.js",
];
const errors = [];

for (const file of [...pages, ...requiredAssets]) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing required file: ${file}`);
  }
}

const localHtmlLinks = new Set();

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");

  if (html.includes("frontis-public-1313914583.cos.ap-beijing.myqcloud.com/frontis-v2/logo")) {
    errors.push(`${page}: logo still points to remote COS`);
  }

  if (!html.includes("./components/site-shell.css")) {
    errors.push(`${page}: missing shared shell stylesheet`);
  }

  if (!html.includes("data-site-header")) {
    errors.push(`${page}: missing shared header mount`);
  }

  if (!html.includes("data-site-footer")) {
    errors.push(`${page}: missing shared footer mount`);
  }

  if (!html.includes("./components/site-shell.js")) {
    errors.push(`${page}: missing shared shell script`);
  }

  for (const match of html.matchAll(/href=["']\.\/([^"']+\.html)(?:#[^"']*)?["']/g)) {
    localHtmlLinks.add(match[1]);
  }

  for (const match of html.matchAll(/src=["']\.\/([^"']+)["']/g)) {
    const asset = match[1].split("?")[0].split("#")[0];
    if (!fs.existsSync(path.join(root, asset))) {
      errors.push(`${page}: missing local asset ${asset}`);
    }
  }
}

for (const link of localHtmlLinks) {
  if (!fs.existsSync(path.join(root, link))) {
    errors.push(`Missing linked page: ${link}`);
  }
}

const shellJs = fs.readFileSync(path.join(root, "components/site-shell.js"), "utf8");
for (const match of shellJs.matchAll(/href:\s*["']\.\/([^"']+\.html)(?:#[^"']*)?["']/g)) {
  if (!fs.existsSync(path.join(root, match[1]))) {
    errors.push(`Shared shell links to missing page: ${match[1]}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Checked ${pages.length} pages and ${requiredAssets.length} assets.`);
