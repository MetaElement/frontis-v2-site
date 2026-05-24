import fs from "node:fs";
import path from "node:path";
import { DEFAULT_IMAGE, SITE_URL, canonicalUrl, pages as seoPages } from "./seo-pages.mjs";

const root = process.cwd();
const gtmContainerId = "GTM-K3FKM238";
const gaMeasurementId = "G-0C4VHZ14XL";
const pages = seoPages.map((page) => page.file);
const seoByFile = new Map(seoPages.map((page) => [page.file, page]));

const requiredAssets = [
  "robots.txt",
  "sitemap.xml",
  "assets/og-frontis.svg",
  "assets/beian-police.png",
  "components/analytics-config.js",
  "components/analytics.js",
  "assets/favicon.png",
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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateSeo(page, html) {
  const seo = seoByFile.get(page);
  const canonical = canonicalUrl(seo);

  if (!new RegExp(`<title>${escapeRegex(seo.title)}</title>`, "i").test(html)) {
    errors.push(`${page}: SEO title does not match central config`);
  }

  if (!new RegExp(`<meta\\s+name=["']description["']\\s+content=["']${escapeRegex(seo.description)}["']\\s*/?>`, "i").test(html)) {
    errors.push(`${page}: SEO description does not match central config`);
  }

  if (!html.includes("<!-- FRONTIS SEO:BEGIN -->") || !html.includes("<!-- FRONTIS SEO:END -->")) {
    errors.push(`${page}: missing managed SEO block`);
  }

  const requiredPatterns = [
    ["canonical", new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']${escapeRegex(canonical)}["']\\s*/?>`, "i")],
    ["robots meta", /<meta\s+name=["']robots["'][^>]*index,\s*follow/i],
    ["og title", new RegExp(`<meta\\s+property=["']og:title["']\\s+content=["']${escapeRegex(seo.title)}["']\\s*/?>`, "i")],
    ["og description", new RegExp(`<meta\\s+property=["']og:description["']\\s+content=["']${escapeRegex(seo.description)}["']\\s*/?>`, "i")],
    ["og url", new RegExp(`<meta\\s+property=["']og:url["']\\s+content=["']${escapeRegex(canonical)}["']\\s*/?>`, "i")],
    ["og image", new RegExp(`<meta\\s+property=["']og:image["']\\s+content=["']${escapeRegex(DEFAULT_IMAGE)}["']\\s*/?>`, "i")],
    ["twitter card", /<meta\s+name=["']twitter:card["']\s+content=["']summary_large_image["']\s*\/?>/i],
  ];

  for (const [label, pattern] of requiredPatterns) {
    if (!pattern.test(html)) {
      errors.push(`${page}: missing ${label}`);
    }
  }

  const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  if (!jsonLdMatch) {
    errors.push(`${page}: missing JSON-LD structured data`);
    return;
  }

  try {
    const jsonLd = JSON.parse(jsonLdMatch[1]);
    const graph = Array.isArray(jsonLd["@graph"]) ? jsonLd["@graph"] : [];
    if (!graph.some((entry) => entry["@type"] === "WebPage" && entry.url === canonical)) {
      errors.push(`${page}: JSON-LD missing canonical WebPage`);
    }
    if (!graph.some((entry) => entry["@type"] === "Organization" && entry.url === `${SITE_URL}/`)) {
      errors.push(`${page}: JSON-LD missing Organization`);
    }
  } catch {
    errors.push(`${page}: invalid JSON-LD structured data`);
  }
}

function validateGtm(page, html) {
  const headIndex = html.search(/<head[^>]*>/i);
  const firstMetaIndex = html.search(/<meta\s/i);
  const gtmHeadIndex = html.indexOf("<!-- Google Tag Manager -->");
  const gtmNoscriptIndex = html.indexOf("<!-- Google Tag Manager (noscript) -->");
  const bodyIndex = html.search(/<body[^>]*>/i);

  if (gtmHeadIndex < 0 || !html.includes(`googletagmanager.com/gtm.js?id='+i+dl`) || !html.includes(`'${gtmContainerId}'`)) {
    errors.push(`${page}: missing Google Tag Manager head snippet`);
  }

  if (headIndex >= 0 && firstMetaIndex >= 0 && !(gtmHeadIndex > headIndex && gtmHeadIndex < firstMetaIndex)) {
    errors.push(`${page}: Google Tag Manager head snippet is not near the top of <head>`);
  }

  if (gtmNoscriptIndex < 0 || !html.includes(`googletagmanager.com/ns.html?id=${gtmContainerId}`)) {
    errors.push(`${page}: missing Google Tag Manager noscript snippet`);
  }

  if (bodyIndex >= 0 && !(gtmNoscriptIndex > bodyIndex)) {
    errors.push(`${page}: Google Tag Manager noscript snippet is not after <body>`);
  }
}

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

  if (!html.includes("./components/analytics-config.js") || !html.includes("./components/analytics.js")) {
    errors.push(`${page}: missing analytics scripts`);
  }

  validateGtm(page, html);
  validateSeo(page, html);

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

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const page of seoPages) {
  const canonical = canonicalUrl(page);
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) {
    errors.push(`sitemap.xml: missing ${canonical}`);
  }
}

const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
  errors.push("robots.txt: missing sitemap directive");
}

const shellJs = fs.readFileSync(path.join(root, "components/site-shell.js"), "utf8");
if (!shellJs.includes("generate_lead") || !shellJs.includes("frontis_cta_submit")) {
  errors.push("Shared shell is missing CTA analytics events");
}
if (!shellJs.includes("京公网安备11010802042925号") || !shellJs.includes("beian.mps.gov.cn/#/query/webSearch?code=11010802042925") || !shellJs.includes("./assets/beian-police.png")) {
  errors.push("Shared shell is missing the public security record footer link");
}

const analyticsConfig = fs.readFileSync(path.join(root, "components/analytics-config.js"), "utf8");
if (!analyticsConfig.includes(gtmContainerId)) {
  errors.push("Analytics config is missing the GTM container ID");
}
if (!analyticsConfig.includes(gaMeasurementId) || !analyticsConfig.includes("enableDirectGa4: false")) {
  errors.push("Analytics config should keep direct GA4 disabled because GA4 is configured in GTM");
}

const analyticsJs = fs.readFileSync(path.join(root, "components/analytics.js"), "utf8");
if (!analyticsJs.includes("window.dataLayer.push") || !analyticsJs.includes("frontis_cta_click")) {
  errors.push("Analytics script is missing dataLayer event tracking");
}

for (const match of shellJs.matchAll(/href:\s*["']\.\/([^"']+\.html)(?:#[^"']*)?["']/g)) {
  if (!fs.existsSync(path.join(root, match[1]))) {
    errors.push(`Shared shell links to missing page: ${match[1]}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Checked ${pages.length} pages, SEO metadata, sitemap, robots, and ${requiredAssets.length} assets.`);
