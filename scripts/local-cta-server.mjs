import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import handler from "../api/cta.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.HOST || "127.0.0.1";
const requestedPort = Number(process.env.PORT || 5173);

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

function safeStaticPath(urlPath) {
  const withoutQuery = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(withoutQuery === "/" ? "/index.html" : withoutQuery);
  const absolutePath = path.join(root, normalized);
  if (!absolutePath.startsWith(root)) return "";
  return absolutePath;
}

function serveStatic(req, res) {
  const staticPath = safeStaticPath(req.url || "/");
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
    res.end(content);
  });
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const hasConfiguredAllowedOrigins = Boolean(process.env.CTA_ALLOWED_ORIGINS);
process.env.CTA_DRY_RUN = process.env.CTA_DRY_RUN || "true";

function createServer() {
  return http.createServer((req, res) => {
    if ((req.url || "").startsWith("/api/cta")) {
      handleApi(req, res).catch(() => {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, message: "本地提交服务异常。" }));
      });
      return;
    }

    serveStatic(req, res);
  });
}

function listen(port, attemptsLeft = 10) {
  const server = createServer();
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && !process.env.PORT && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
      return;
    }
    throw error;
  });

  server.listen(port, host, () => {
    const actualPort = server.address().port;
    if (!hasConfiguredAllowedOrigins) {
      process.env.CTA_ALLOWED_ORIGINS = `http://${host}:${actualPort},http://localhost:${actualPort}`;
    }
    console.log(`Frontis local full server: http://${host}:${actualPort}`);
    console.log(`CTA endpoint: http://${host}:${actualPort}/api/cta`);
    console.log(`CTA_DRY_RUN=${process.env.CTA_DRY_RUN}`);
  });
}

listen(requestedPort);
