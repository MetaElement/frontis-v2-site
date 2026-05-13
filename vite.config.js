import { defineConfig } from "vite";
import { resolve } from "node:path";

const pages = [
  "index",
  "horizon",
  "leadeep",
  "scene",
  "scene-strategy",
  "scene-supply",
  "scene-sales",
  "scene-ops",
  "scene-research",
  "technology",
  "ecosystem",
  "about",
];

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [
          page,
          resolve(__dirname, page === "index" ? "index.html" : `${page}.html`),
        ]),
      ),
    },
  },
});
