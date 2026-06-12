# 风格基线清单（随页面完成逐步追加）

每页打磨完成后，把可复用的结论追加到这里（间距规则、字号修正、
组件样式决定等）。后续页面的评审子代理与修改都要参照本清单。

## index

评分轨迹：7.0 → 7.7 → 7.5 → 7.8 → 7.9 → 7.5（6 轮上限，最终态含收尾清理）

### 间距 / 节奏
- 区块内衬：`padding: 96px 0 80px`（桌面），移动 82px 20px；避免按钮后出现 >150px 空白
- 大区块标题与正文区间距 ~44-76px；行动链接 margin-top 44px
- 黑/白区块交界用 1px 分隔线（黑上白下 `rgba(255,255,255,0.12)`，白上黑下 `rgba(0,16,19,0.12)`）

### 排版
- 区块标题 40px/750，kicker 11px mono 字距 3px 格式 `0N / LABEL`
- 中文标题 `word-break: keep-all` 防断词；副标题统一以句号结尾
- 黑底正文用 `rgba(255,255,255,0.7)`，弱化文字不得低于 0.52；白底弱化 `rgba(0,16,19,0.56-0.58)`

### 组件决定（共享 site-shell，勿回退）
- CTA 表单：双列栅格 gap 20px、输入框 64px 高 1px #3D4145 边框、提交按钮通栏 100%、单选区 gap 16px 28px（移动单列纵排）
- 表单/联系栏栅格 `minmax(0,1fr) 320px`，gap 56px
- 页脚：品牌列含 tagline；“产品与技术”合并为一列；移动端两列、品牌通栏
- hero CTA 必须放在白底文案下方（黑底填充按钮），不要漂在分割带上

### 图形语言
- 工程线框 SVG：网格线 `rgba(0,16,19,0.07)`（白底）；主线 1.2px、青色强调 1.6-1.8px、橙点为单一焦点
- 卡片内绝对定位装饰图：移动端垂直居中（top 50% + translateY），透明度 ~0.5
- 大面积渐变区不要叠加扫描线/横纹纹理（评审两轮判为 banding）

### 评审防误判提示（每轮评审 prompt 必带）
- 截图前已定格入场动画，黑色区块非加载失败
- 表单实测双列有边框；如评审报与实测矛盾的 high 问题，先用 Playwright evaluate 验证再决定是否修改

## horizon

评分轨迹：6.4 → 7.5 → 7.8 → 8.0 → 8.2（连续两轮提升 <0.3 判停，round-5 即峰值）

### 截图工具（已修入 scripts/loop-screenshot.mjs，全站通用）
- fullPage 截图不绘制带 blur filter / 运行中的 CSS animation：截图前注入样式禁用全部 animation，并对 `[data-anim]` 强制 `opacity:1; filter:none; transform:none`
- `waitUntil: "domcontentloaded"` + fonts.ready + 1.5s 等待（GTM 长连接会让 networkidle 超时）
- vite 改 CSS 后第一次截图可能因热重载导航失败，重试即可
- 子代理评审大图易超时：用 sips 生成 1x 降采样版（desktop-1x/mobile-1x）供整体判断，2x 原图留作局部核验

### 图形 / 色板
- 黑底装饰环线/线框透明度 ≥0.3（1px 青线），层级递进 0.3/0.42/0.55
- 状态点限定色板：青=可用、橙=单一焦点强调、层级灰=暂缺；禁红绿语义色
- 图标用 mono 缩写（CON/SCM/FIN）替代 emoji；11px/800/0.08em/青色
- 设备 mockup 底座扁平深灰（#23272B/#2A2E33），禁金属渐变；移动端隐藏底座

### 布局 / 移动端
- detail 双栏区移动端必须文先图后：`order: 2 !important` 覆盖桌面的 inline order:-1
- 移动区块 padding 76px 0 60px；移除区块 inline padding，全部走 CSS 以便媒体查询覆盖
- 移动 hero 统计行用 3 列 grid + 隐藏 scroll hint，防孤行
- 卡片内绝对定位装饰（手机模型等）旁的文字/标签限宽避让 `max-width: calc(100% - Npx)`
- 定价卡：白卡 1px rgba(0,16,19,0.12) 边框；卡体 flex column、CTA `margin-top:auto` 锚底

### 共享组件更新（全站生效，勿回退）
- site-cta 单选/复选选中态：青底 + 白色 SVG 对勾（非白色小方块）
- site-cta textarea `resize: none`（工程线框质感，不露原生手柄）

## leadeep

评分轨迹：6.2 → 7.4 → 7.8 → 8.0 → 8.3 → 8.4（6 轮上限到，round-6 即峰值，收尾含移动统计带三列改造）

### 死代码治理（先决条件）
- 改版页若残留旧版 CSS，必须先整体删除再进入评审循环——死代码两次误导评审报不存在的渲染问题

### 工程线框 SVG（内联替代位图的范式）
- 位图示意图（金字塔/流程图）一律换内联 SVG：网格 rgba(0,16,19,0.07)、灰主线 1.2px、青强调 1.6px、单橙点焦点
- SVG 内文案双层：CN 14px/600 #001013 + mono 微标签 ≥10-11px letter-spacing 1.5（9px 移动端缩放后不可读）
- SVG 容器下补 mono 注脚行（左灰右青，10px/1.5px 字距，上 1px 分隔线）：平衡留白并增强工程感
- viewBox 裁掉四周空白边可放大图形密度约 10%，比改节点坐标安全

### 双栏图文平衡
- 右栏示意卡与左栏长列表：`align-items: stretch` + 卡内 flex column + SVG `margin: auto 0` + 注脚锚底，等高不空
- hero 行动区最多两层级：1 个填充主按钮 + 1 个 ghost，第三按钮稀释主行动

### 位图素材入系处理
- App 截图位图 `filter: saturate(0.6-0.65) contrast(1.05)` 收敛彩色渐变模板感
- 写实摄影：`saturate(0.78)` + inset 16px 青色 1px 描边框线 + 左上 mono 角标（11px/2px 字距，青字黑底半透明）
- 位图质感是细节分上限（~8 分），评审会持续扣分但属素材问题非样式缺陷

### 移动端
- 高卡片列表（截图+文案竖排）改横排缩略图布局：`grid-template-columns: minmax(96px,0.36fr) 1fr`、图限高 200px，大幅压缩纵向节奏
- hero 副题硬 `<br>` 在 720px 下 `display:none` 防不规则断行
- hero 设备图：能量灰底板承托、92%/330px 居中、saturate(0.82)
- 统计带保持 3 列横排（同 horizon），span 取消 nowrap 允许换行



