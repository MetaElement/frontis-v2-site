import fs from "node:fs";
import path from "node:path";

const staticFiles = [
  "components/site-shell.js",
  "assets/logo-dark.svg",
  "assets/logo-light.svg",
];

for (const file of staticFiles) {
  const source = path.join(process.cwd(), file);
  const target = path.join(process.cwd(), "dist", file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`copied ${file}`);
}
