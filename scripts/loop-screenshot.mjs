import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const [page = "index", round = "1"] = process.argv.slice(2);
const base = process.env.LOOP_BASE_URL ?? "http://127.0.0.1:5173";
const url = `${base}/${page === "index" ? "" : `${page}.html`}`;
const outDir = path.join("outputs", "loop", page, `round-${round}`);
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.name === "mobile",
  });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  // 滚到底再回顶，触发懒加载/滚动入场动画后定格
  await p.evaluate(async () => {
    await new Promise((done) => {
      let y = 0;
      const step = () => {
        y += 800;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) setTimeout(step, 120);
        else {
          window.scrollTo(0, 0);
          setTimeout(done, 600);
        }
      };
      step();
    });
    // 入场动画按 100ms/元素 级联，直接定格为动画完成后的最终状态
    document
      .querySelectorAll(".animate-in, .animate-up, .section-enter")
      .forEach((el) => el.classList.add("visible"));
    document
      .querySelectorAll(".reveal")
      .forEach((el) => el.classList.add("in-view"));
    document
      .querySelectorAll("section")
      .forEach((el) => el.classList.add("section-enter", "visible"));
    // fullPage 截图不绘制运行中/带 filter 的 CSS animation，直接禁用并强制终态
    const st = document.createElement("style");
    st.textContent =
      "*,*::before,*::after{animation:none!important;}" +
      "[data-anim]{opacity:1!important;filter:none!important;transform:none!important;}";
    document.head.appendChild(st);
    await new Promise((r) => setTimeout(r, 400));
  });
  await p.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: true });
  await ctx.close();
}
await browser.close();
console.log(`Saved screenshots to ${outDir}`);
