import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import handler from "../api/cta.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(root, "dist");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleApi(req, res) {
  const rawBody = await readBody(req);
  let body = {};

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }
  }

  await handler(
    {
      method: req.method,
      headers: req.headers,
      body,
    },
    res,
  );
}

function resolveStaticPath(urlPath) {
  const withoutQuery = decodeURIComponent(urlPath.split("?")[0]);
  const routePath = withoutQuery === "/" ? "/index.html" : withoutQuery;
  const normalized = path.normalize(routePath);
  const absolutePath = path.join(distRoot, normalized);
  if (!absolutePath.startsWith(distRoot)) return "";
  return absolutePath;
}

function serveStatic(req, res) {
  const staticPath = resolveStaticPath(req.url || "/");
  if (!staticPath) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  fs.readFile(staticPath, (error, content) => {
    if (error) {
      res.statusCode = error.code === "ENOENT" ? 404 : 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(res.statusCode === 404 ? "Not Found" : "Server Error");
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", MIME_TYPES[path.extname(staticPath)] || "application/octet-stream");
    res.setHeader("Cache-Control", path.extname(staticPath) === ".html" ? "no-cache" : "public, max-age=31536000, immutable");
    res.end(content);
  });
}

loadEnvFile(path.join(root, ".env.production.local"));
loadEnvFile(path.join(root, ".env.production"));
loadEnvFile(path.join(root, ".env"));

if (!fs.existsSync(path.join(distRoot, "index.html"))) {
  console.error("Missing dist/index.html. Run npm run build before npm run start.");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if ((req.url || "").startsWith("/api/cta")) {
    handleApi(req, res).catch(() => {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, message: "提交服务异常。" }));
    });
    return;
  }

  serveStatic(req, res);
});

server.listen(port, host, () => {
  console.log(`Frontis production server: http://${host}:${port}`);
  console.log(`Serving ${distRoot}`);
  console.log(`CTA endpoint: http://${host}:${port}/api/cta`);
});
