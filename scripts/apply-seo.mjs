import fs from "node:fs";
import path from "node:path";
import { DEFAULT_IMAGE, SITE_NAME, SITE_URL, canonicalUrl, pages } from "./seo-pages.mjs";

const root = process.cwd();
const markerStart = "<!-- FRONTIS SEO:BEGIN -->";
const markerEnd = "<!-- FRONTIS SEO:END -->";
const analyticsMarkerStart = "<!-- FRONTIS ANALYTICS:BEGIN -->";
const analyticsMarkerEnd = "<!-- FRONTIS ANALYTICS:END -->";
const gtmContainerId = "GTM-K3FKM238";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDescription(html, page) {
  const title = `<title>${escapeHtml(page.title)}</title>`;
  const description = `<meta name="description" content="${escapeAttr(page.description)}" />`;

  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, title);
  } else {
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n${title}`);
  }

  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\s+name=["']description["'][^>]*>/i, description);
  }

  return html.replace(/<title>[\s\S]*?<\/title>/i, `${title}\n  ${description}`);
}

function schemaGraph(page) {
  const url = canonicalUrl(page);
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "衔远科技",
      alternateName: ["Frontis AI", "衔远科技 Frontis AI"],
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/assets/logo-light.svg`,
      email: "xianyuan@frontis.ai",
      sameAs: ["https://ai.frontis.cn/"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: "zh-CN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      inLanguage: "zh-CN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ];

  if (page.schemaType === "SoftwareApplication") {
    graph.push({
      "@type": "SoftwareApplication",
      "@id": `${url}#software`,
      name: page.title.split("|")[0].trim(),
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url,
      description: page.description,
      publisher: { "@id": `${SITE_URL}/#organization` },
    });
  }

  if (page.schemaType === "Service") {
    graph.push({
      "@type": "Service",
      "@id": `${url}#service`,
      name: page.title.split("|")[0].trim(),
      serviceType: page.title.split("|")[0].trim(),
      url,
      description: page.description,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "CN",
    });
  }

  if (Array.isArray(page.breadcrumbs) && page.breadcrumbs.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: page.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

function seoBlock(page) {
  const url = canonicalUrl(page);
  const json = JSON.stringify(schemaGraph(page), null, 2).replace(/</g, "\\u003c");

  return [
    `  ${markerStart}`,
    `  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    `  <meta name="author" content="${escapeAttr(SITE_NAME)}" />`,
    `  <link rel="canonical" href="${escapeAttr(url)}" />`,
    `  <meta property="og:locale" content="zh_CN" />`,
    `  <meta property="og:type" content="website" />`,
    `  <meta property="og:site_name" content="${escapeAttr(SITE_NAME)}" />`,
    `  <meta property="og:title" content="${escapeAttr(page.title)}" />`,
    `  <meta property="og:description" content="${escapeAttr(page.description)}" />`,
    `  <meta property="og:url" content="${escapeAttr(url)}" />`,
    `  <meta property="og:image" content="${escapeAttr(DEFAULT_IMAGE)}" />`,
    `  <meta property="og:image:alt" content="衔远科技 Frontis AI 企业 AI 专家团平台" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:title" content="${escapeAttr(page.title)}" />`,
    `  <meta name="twitter:description" content="${escapeAttr(page.description)}" />`,
    `  <meta name="twitter:image" content="${escapeAttr(DEFAULT_IMAGE)}" />`,
    `  <script type="application/ld+json">`,
    json
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
    `  </script>`,
    `  ${markerEnd}`,
  ].join("\n");
}

function analyticsBlock() {
  return [
    `  ${analyticsMarkerStart}`,
    `  <script src="./components/analytics-config.js"></script>`,
    `  <script src="./components/analytics.js"></script>`,
    `  ${analyticsMarkerEnd}`,
  ].join("\n");
}

function gtmHeadBlock() {
  return [
    `  <!-- Google Tag Manager -->`,
    `  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':`,
    `  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],`,
    `  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=`,
    `  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);`,
    `  })(window,document,'script','dataLayer','${gtmContainerId}');</script>`,
    `  <!-- End Google Tag Manager -->`,
  ].join("\n");
}

function gtmNoscriptBlock() {
  return [
    `  <!-- Google Tag Manager (noscript) -->`,
    `  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmContainerId}"`,
    `  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
    `  <!-- End Google Tag Manager (noscript) -->`,
  ].join("\n");
}

function upsertGtmBlocks(html) {
  const headPattern = /[ \t]*<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->\s*/g;
  const noscriptPattern = /[ \t]*<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->\s*/g;

  html = html.replace(headPattern, "");
  html = html.replace(noscriptPattern, "");

  if (/<head([^>]*)>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, (match) => `${match}\n${gtmHeadBlock()}`);
  }

  if (/<body([^>]*)>/i.test(html)) {
    html = html.replace(/<body([^>]*)>/i, (match) => `${match}\n${gtmNoscriptBlock()}`);
  }

  return html;
}

function upsertSeoBlock(html, page) {
  html = normalizeDescription(html, page);
  const blockPattern = new RegExp(
    `\\s*${escapeRegex(markerStart)}[\\s\\S]*?${escapeRegex(markerEnd)}\\s*`,
    "g",
  );
  html = html.replace(blockPattern, "");
  const analyticsBlockPattern = new RegExp(
    `\\s*${escapeRegex(analyticsMarkerStart)}[\\s\\S]*?${escapeRegex(analyticsMarkerEnd)}\\s*`,
    "g",
  );
  html = html.replace(analyticsBlockPattern, "");
  html = upsertGtmBlocks(html);

  const descriptionPattern = /(<meta\s+name=["']description["'][^>]*>)(\s*)/i;
  if (descriptionPattern.test(html)) {
    return html.replace(descriptionPattern, (match, descriptionTag) => `${descriptionTag}\n${seoBlock(page)}\n${analyticsBlock()}\n  `);
  }

  return html.replace(/<\/head>/i, `${seoBlock(page)}\n${analyticsBlock()}\n</head>`);
}

function fileLastmod(file) {
  const stat = fs.statSync(path.join(root, file));
  const date = stat.mtime;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function writeSitemap() {
  const body = pages
    .map((page) => {
      return [
        "  <url>",
        `    <loc>${canonicalUrl(page)}</loc>`,
        `    <lastmod>${fileLastmod(page.file)}</lastmod>`,
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
}

function writeRobots() {
  const robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /experiments/",
    "Disallow: /outputs/",
    "Disallow: /releases/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");

  fs.writeFileSync(path.join(root, "robots.txt"), robots);
}

for (const page of pages) {
  const filePath = path.join(root, page.file);
  const html = fs.readFileSync(filePath, "utf8");
  const nextHtml = upsertSeoBlock(html, page);
  if (nextHtml !== html) {
    fs.writeFileSync(filePath, nextHtml);
    console.log(`updated ${page.file}`);
  }
}

writeSitemap();
writeRobots();
console.log(`wrote sitemap.xml, robots.txt for ${pages.length} pages`);
