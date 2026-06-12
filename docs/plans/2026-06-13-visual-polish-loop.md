# Frontis 官网视觉打磨循环 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 对 frontis.cn 的 5 个核心页面执行"截图 → AI 评审 → 修改"的评分驱动自动循环，在保留黑/青/橙设计语言的前提下全面打磨视觉细节。

**Architecture:** Vite 静态多页站。新增一个 Playwright 截图脚本作为循环基础设施；每轮派发全新评审子代理（只看截图与评分标准）输出 JSON 评分与问题清单，主会话据此修改页面并提交；评分达标或收敛即停。页面串行执行，先完成的页面沉淀风格基线供后续页面参照。

**Tech Stack:** Vite 8、Playwright 1.58（已全局安装）、原生 HTML/CSS/JS（样式内联于各页面）、共享组件 `components/site-shell.{css,js}`。

**设计文档:** `docs/plans/2026-06-13-visual-polish-loop-design.md`

**工作分支:** `visual-polish-loop`（已创建）。所有提交使用作者 `MetaElement <138388961+MetaElement@users.noreply.github.com>`（通过 GIT_AUTHOR_* / GIT_COMMITTER_* 环境变量，不改 git config）。

---

## 关键事实（执行者必读）

- 仓库位置：`~/projects/frontis-v2-site`
- 本次范围页面（按执行顺序）：`index.html` → `horizon.html` → `leadeep.html` → `scene.html` → `about.html`
- 每页 CSS 内联在该页 `<style>` 中；`components/frontis-page-normalize.css`、`components/site-shell.css` 为多页共享，改动它们必须对已完成页面做回归截图
- dev 服务器：`npm run dev`（vite，127.0.0.1:5173）
- 站点校验：`npm run check`（校验 SEO 标记、必需资源、内链）——**当前在 leadeep.html 上是失败状态**（上次提交用 scene-strategy 副本替换 leadeep 时丢失 SEO），Task 1 先修复
- SEO 中央配置：`scripts/seo-pages.mjs`；`npm run seo` 会按配置把 SEO 块注入各页面
- `outputs/` 目录已存在且被 git 跟踪；循环截图放 `outputs/loop/`（Task 2 加入 .gitignore）
- 设计 token（评审与修改的红线，定义于各页 `:root`）：
  - `--quantum-black: #000000`、`--threshold-cyan: #00C1D4`、`--pure-white: #FFFFFF`
  - `--level-gray: #3D4145`、`--energy-gray: #F0F2F4`、`--energy-orange: #FA5F26`
  - 英文 Space Grotesk、等宽 JetBrains Mono、中文思源黑体系
- 文案结构可以重组（无内容硬约束），但 SEO 标记块（`FRONTIS SEO:BEGIN/END`）与埋点（GTM/GA、`FRONTIS ANALYTICS`）必须原样保留，否则 `npm run check` 会失败

---

### Task 1: 修复 check 基线（leadeep SEO）

**Files:**
- Modify: `leadeep.html`（由脚本注入）

**Step 1: 确认失败现状**

Run: `cd ~/projects/frontis-v2-site && npm run check`
Expected: 输出 7 条 leadeep.html SEO 错误

**Step 2: 运行 SEO 注入脚本**

Run: `npm run seo`

**Step 3: 验证 check 通过**

Run: `npm run check`
Expected: 无错误输出，退出码 0。若仍有错误，对照 `scripts/seo-pages.mjs` 中 leadeep 条目手工补齐缺失标记后重跑。

**Step 4: 验证页面未被破坏**

Run: `git diff --stat leadeep.html`
Expected: 仅 head 区 SEO 块变化。浏览器打开确认页面正常渲染（可跳过，diff 仅限 head 即可）。

**Step 5: Commit**

```bash
git add leadeep.html && git commit -m "fix(leadeep): restore SEO block via apply-seo"
```

---

### Task 2: 截图脚本 + 目录准备

**Files:**
- Create: `scripts/loop-screenshot.mjs`
- Modify: `.gitignore`

**Step 1: 写截图脚本**

`scripts/loop-screenshot.mjs`：

```js
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
        else { window.scrollTo(0, 0); setTimeout(done, 600); }
      };
      step();
    });
  });
  await p.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: true });
  await ctx.close();
}
await browser.close();
console.log(`Saved screenshots to ${outDir}`);
```

注意：playwright 为全局安装（`/usr/local/bin/playwright`），若 `import "playwright"` 解析失败，改用 `npm i -D playwright`（浏览器已缓存，不会重新下载）。

**Step 2: .gitignore 追加**

在 `.gitignore` 末尾加一行：`outputs/loop/`

**Step 3: 启动 dev 服务器（后台常驻，整个循环期间不关）**

Run: `npm run dev`（后台运行）
Expected: vite 输出 `Local: http://127.0.0.1:5173/`

**Step 4: 冒烟测试**

Run: `node scripts/loop-screenshot.mjs index 0`
Expected: `outputs/loop/index/round-0/desktop.png` 与 `mobile.png` 存在，desktop 高度 > 5000px（全页很长）。用 Read 工具查看两张图确认渲染正常（字体已加载、无空白块）。

**Step 5: Commit**

```bash
git add scripts/loop-screenshot.mjs .gitignore
git commit -m "feat: add loop screenshot script for visual polish pipeline"
```

---

### Task 3: 评审材料（rubric + 风格基线文件）

**Files:**
- Create: `docs/plans/loop-review-rubric.md`
- Create: `docs/plans/loop-style-baseline.md`

**Step 1: 写评分标准文件**

`docs/plans/loop-review-rubric.md`：

```markdown
# Frontis 官网视觉评审标准（评审子代理专用）

你是一位顶级 B2B/AI 官网视觉设计评审。仅依据给你的截图评分，对标
Anthropic、Linear、Stripe 等一线官网的视觉水准。

## 设计语言（红线——偏离即扣分，不是加分项）
- 色彩仅限：量子黑 #000000、阈值青 #00C1D4、纯白 #FFFFFF、
  层级灰 #3D4145、能量灰 #F0F2F4、能量橙 #FA5F26（点缀）
- 字体：英文 Space Grotesk / 等宽 JetBrains Mono / 中文黑体系
- 气质：克制、精密、工程感；忌花哨渐变与廉价阴影

## 评分维度（10 分制加权）
| 维度 | 权重 |
|---|---|
| 排版与层级（字号节奏、行高、信息层级） | 25% |
| 间距与对齐（留白节奏、栅格、呼吸感） | 20% |
| 色彩运用（克制与强调时机） | 15% |
| 细节质感（边框、阴影、圆角、图标） | 15% |
| 移动端适配（390px 布局、触控目标、字号） | 15% |
| 整体印象（高级感、对标一线官网差距） | 10% |

## 输出格式（严格 JSON，不要输出其他内容）
{
  "total": 8.2,
  "dimensions": { "typography": 8, "spacing": 8, "color": 9,
                  "detail": 7, "mobile": 8, "overall": 8 },
  "issues": [
    { "location": "hero 区主标题", "severity": "high|medium|low",
      "viewport": "desktop|mobile|both",
      "problem": "…", "suggestion": "…" }
  ]
}

评分务必严格：8 分 = 优秀但仍有可见瑕疵；9 分 = 对标一线官网不逊色。
issues 按 severity 降序，最多列 10 条，聚焦最能提分的问题。
```

**Step 2: 写风格基线空文件**

`docs/plans/loop-style-baseline.md`：

```markdown
# 风格基线清单（随页面完成逐步追加）

每页打磨完成后，把可复用的结论追加到这里（间距规则、字号修正、
组件样式决定等）。后续页面的评审子代理与修改都要参照本清单。

## index
（待填）
```

**Step 3: Commit**

```bash
git add docs/plans/loop-review-rubric.md docs/plans/loop-style-baseline.md
git commit -m "docs: add review rubric and style baseline for polish loop"
```

---

## 循环流程（Task 4-8 共用，此处定义一次）

对页面 `{page}` 执行，轮次 n 从 1 起，**硬上限 6 轮**：

1. **截图**：`node scripts/loop-screenshot.mjs {page} {n}`
2. **评审**：用 Agent 工具派发全新子代理（subagent_type=claude），prompt 必须包含：
   - 指示其先 Read `docs/plans/loop-review-rubric.md` 与 `docs/plans/loop-style-baseline.md`
   - 再 Read 两张截图 `outputs/loop/{page}/round-{n}/desktop.png`、`mobile.png`
   - 按 rubric 输出严格 JSON（评审代理**只读**，不许改任何文件）
3. **记录**：把 JSON 存入 `outputs/loop/{page}/round-{n}/review.json`（Write 工具）
4. **判停**（满足其一即转"收尾"）：
   - total ≥ 9.0
   - 连续两轮 total 提升 < 0.3（即 round n − round n-1 < 0.3 且 round n-1 − round n-2 < 0.3）
   - n = 6
5. **修改**：主会话按 issues 从 high 到 low 修改 `{page}.html`（及必要时 `components/*`）；保持设计 token，不删 SEO/埋点块
6. **校验**：`npm run check` 必须通过；失败则修复或 `git checkout -- {page}.html` 回滚本轮
7. **提交**：`git add -A && git commit -m "polish({page}): round {n} — {一句话摘要}"`（带 MetaElement 环境变量）
8. 回到 1，n+1

**页面收尾**：
- 若历史最高分不在最后一轮，恢复最高分轮次的页面文件（`git checkout {该轮commit} -- {page}.html` 后再 commit）
- 把本页可复用结论追加到 `docs/plans/loop-style-baseline.md` 并 commit
- 若本页改过 `components/*`：对所有已完成页面重新截图（round 标记 `regression-{page}`），派评审代理快速确认无回归（只需确认"无新增 high 问题"，不打全分）

---

### Task 4: index.html 打磨循环

**Files:** Modify: `index.html`（必要时 `components/site-shell.css`、`components/frontis-page-normalize.css`）

按上述循环流程执行。index 是 5996 行的最大页面、决定全站调性，预期 3-5 轮。完成后**必须**认真填写风格基线（这是后续 4 页的一致性锚点），至少包含：模块垂直间距规则、标题字号阶梯、卡片样式（边框/圆角/hover）、移动端字号与边距规则。

### Task 5: horizon.html 打磨循环

**Files:** Modify: `horizon.html`

按循环流程执行，评审与修改均参照风格基线。预期 2-3 轮。

### Task 6: leadeep.html 打磨循环

**Files:** Modify: `leadeep.html`

同上。注意：该页是 scene-strategy 的副本改造，警惕残留的复制痕迹（错误的标题/链接/文案归属），发现后一并修正。预期 2-3 轮。

### Task 7: scene.html 打磨循环

**Files:** Modify: `scene.html`

同上。预期 2-3 轮。该页链接到 5 个 scene-* 子页（不在本次范围），只需保证出链样式一致。

### Task 8: about.html 打磨循环

**Files:** Modify: `about.html`

同上。预期 2-3 轮。该页有客户 logo 墙动画（marquee），截图只能定格——动画连贯性人工把关，不交给评审代理判断。

---

### Task 9: 收尾交付

**Step 1: 全站回归**

Run: `npm run check && npm run build`
Expected: 两者均成功（build 产物在 dist/，不提交）

**Step 2: 最终截图留档**

对 5 个页面各跑一次 `node scripts/loop-screenshot.mjs {page} final`

**Step 3: 推送分支**

```bash
git push -u origin visual-polish-loop
```

**Step 4: 变更摘要**

向用户汇报：每页轮数、起始分 → 最终分、主要改动点、建议在浏览器实测的项目（动效、CTA 表单）。**不创建 PR、不合并 main**——由用户验收后自行处理。

---

## 风险与兜底（来自设计文档）

| 风险 | 对策 |
|---|---|
| 静态截图看不到滚动动效 | 评审仅覆盖静态视觉；动效改动时人工把关 |
| 评分震荡不收敛 | 6 轮硬上限；取最高分轮次为最终版 |
| 修改破坏功能/SEO | 每轮 `npm run check`；失败即回滚本轮 |
| 共享组件改动影响已完成页 | 回归截图 + 评审代理确认无新增 high 问题 |
| dev 服务器中途挂掉 | 截图脚本报错即检查 5173 端口，重启 `npm run dev` |
