import fs from "node:fs";
import path from "node:path";

const staticFiles = [
  "components/site-shell.js",
  "assets/logo-dark.svg",
  "assets/logo-light.svg",
];

const staticDirs = [
  "assets/leadeep-ai",
  "assets/scene-agents",
];

for (const file of staticFiles) {
  const source = path.join(process.cwd(), file);
  const target = path.join(process.cwd(), "dist", file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`copied ${file}`);
}

for (const dir of staticDirs) {
  const source = path.join(process.cwd(), dir);
  const target = path.join(process.cwd(), "dist", dir);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
  console.log(`copied ${dir}`);
}
