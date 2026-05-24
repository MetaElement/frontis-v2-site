# CTA 信息提交方案

## 目标

官网 CTA 表单不再只做前端成功态，而是统一进入一个轻后端提交链路：

1. 前端共享表单收集姓名、公司、手机、邮箱、兴趣方向、留言、来源页面和 UTM 参数。
2. `api/cta.js` 统一校验、反垃圾、来源白名单和格式清洗。
3. 后端投递到邮件，也可以同步转发到 Feishu、CRM、表格或自动化中间层。
4. 本地和上线前可以用 dry-run 测试，不发送真实邮件。

## 前端接入

所有页面通过共享占位符挂载 CTA：

```html
<section id="contact" data-site-cta></section>
```

`frontis.cn` / `www.frontis.cn` 根目录部署时，页面直接提交到同源 `/api/cta`。生产页面不需要额外配置 `frontis-cta-endpoint`。

如果未来有静态预览页和 API 不在同一个域名，需要在页面加载 `components/site-shell.js` 之前配置 endpoint：

```html
<meta name="frontis-cta-endpoint" content="https://your-api-domain.com/api/cta">
```

也可以在单个 CTA 占位符上配置：

```html
<section id="contact" data-site-cta data-cta-endpoint="https://your-api-domain.com/api/cta"></section>
```

## 生产根域部署

目标部署形态：

1. `https://frontis.cn/` 直接打开 `index.html`。
2. `https://www.frontis.cn/` 指向同一套部署。
3. `https://frontis.cn/api/cta` 和 `https://www.frontis.cn/api/cta` 都由 `api/cta.js` 响应。
4. 页面和 API 同源，浏览器请求路径保持 `/api/cta`。

当前 `vercel.json` 已按这个形态配置：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/cta.js": {
      "maxDuration": 10
    }
  }
}
```

部署平台需要绑定两个域名：

- `frontis.cn`
- `www.frontis.cn`

如果平台支持 apex redirect，建议把 `www.frontis.cn` 和 `frontis.cn` 都绑定到同一项目，避免表单跨域。不要把页面单独放到纯静态对象存储而把 API 放到另一个域名，除非同步配置 endpoint override 和 CORS。

## 自有服务器部署

如果不使用 Vercel，而是部署到公司自己的 Linux 服务器，推荐形态是：

1. Node 进程只监听内网地址，例如 `127.0.0.1:3000`。
2. Nginx 对外绑定 `frontis.cn` 和 `www.frontis.cn`，负责 HTTPS、HTTP 跳转和反向代理。
3. Nginx 把所有页面请求和 `/api/cta` 都代理到同一个 Node 进程，保持浏览器同源。

服务器准备：

```bash
cd /srv/frontis-site
npm ci
npm run test:cta
npm run check
npm run build
```

生产环境变量写入 `.env.production`，或由 systemd/进程管理器注入：

```bash
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=website@frontis.cn
SMTP_PASS=your-smtp-password-or-authorization-code
SMTP_FROM_EMAIL="Frontis Website <website@frontis.cn>"
CTA_TO_EMAIL=xianyuan@frontis.ai
CTA_ALLOWED_ORIGINS=https://frontis.cn,https://www.frontis.cn
CTA_DRY_RUN=false
```

启动生产服务：

```bash
npm run start
```

`npm run start` 会服务 `dist/`，同时响应 `/api/cta`。如果还没有执行 `npm run build`，启动会直接失败并提示缺少 `dist/index.html`。

Nginx 示例：

```nginx
server {
  listen 80;
  server_name frontis.cn www.frontis.cn;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name frontis.cn www.frontis.cn;

  ssl_certificate /etc/letsencrypt/live/frontis.cn/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/frontis.cn/privkey.pem;

  client_max_body_size 1m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

systemd 示例：

```ini
[Unit]
Description=Frontis website
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/frontis-site
EnvironmentFile=/srv/frontis-site/.env.production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now frontis-site
sudo systemctl status frontis-site
```

部署后验证：

```bash
curl -I https://frontis.cn/
curl -I https://www.frontis.cn/
curl -X POST https://frontis.cn/api/cta \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://frontis.cn' \
  -d '{"name":"测试用户","company":"衔远测试公司","phone":"13800138000","interest":"horizon","message":"部署后测试"}'
```

最后用浏览器在 `frontis.cn` 和 `www.frontis.cn` 各提交一次测试线索，确认邮件或 webhook 到达。

## 后端环境变量

基础邮件投递使用公司 SMTP：

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=website@frontis.cn
SMTP_PASS=your-smtp-password-or-authorization-code
SMTP_FROM_EMAIL="Frontis Website <website@frontis.cn>"
CTA_TO_EMAIL=xianyuan@frontis.ai
CTA_ALLOWED_ORIGINS=https://frontis.cn,https://www.frontis.cn
```

说明：

- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` 由公司邮箱管理员提供。
- `SMTP_PASS` 通常是邮箱授权码或应用专用密码，不一定是网页登录密码。
- 如果公司邮箱使用 465，通常 `SMTP_SECURE=true`；如果使用 587，通常 `SMTP_SECURE=false`，由服务器走 STARTTLS。
- 如果 SMTP 暂不可用，仍可配置 `RESEND_API_KEY` 和 `CTA_FROM_EMAIL` 作为备用邮件通道。

可选线索分流：

```bash
CTA_TO_EMAIL_HORIZON=horizon-owner@frontis.cn
CTA_TO_EMAIL_LEADEEP=leadeep-owner@frontis.cn
CTA_TO_EMAIL_ECOSYSTEM=ecosystem-owner@frontis.cn
CTA_TO_EMAIL_OTHER=partner@frontis.cn
```

可选 webhook 转发：

```bash
CTA_WEBHOOK_URL=https://example.com/frontis-leads
CTA_WEBHOOK_SECRET=change-me
CTA_REQUIRE_WEBHOOK=false
```

可选飞书群通知：

```bash
CTA_FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxx
CTA_FEISHU_SIGN_SECRET=change-me
CTA_REQUIRE_FEISHU=false
```

测试模式：

```bash
CTA_DRY_RUN=true
```

`CTA_DRY_RUN=true` 时接口会接受并校验提交，但不会调用 SMTP、Resend、webhook 或飞书机器人。

## 飞书通知

最快落地方式是使用飞书群自定义机器人：

1. 在飞书里新建或选择一个线索通知群。
2. 群设置中添加自定义机器人，复制 webhook 地址。
3. 如果机器人开启了签名校验，把签名密钥填入 `CTA_FEISHU_SIGN_SECRET`。
4. 在服务器环境变量中配置 `CTA_FEISHU_WEBHOOK_URL`。

接口会向飞书发送文本消息，字段包括姓名、公司、手机、邮箱、沟通方向、来源页面、UTM 参数和留言。

如果希望“飞书通知失败时也让官网提交失败”，设置：

```bash
CTA_REQUIRE_FEISHU=true
```

如果邮箱或通用 webhook 已经成功，默认不会因为飞书通知失败而让访客看到失败；接口会在开发环境返回 warning，便于排查。

## CRM 后台方案

有三种层级：

1. 轻量通知：只配置 `CTA_FEISHU_WEBHOOK_URL`，飞书群实时收到线索。优点是最快；缺点是不能筛选、去重、统计。
2. 飞书表格型 CRM：把 `CTA_WEBHOOK_URL` 指向自动化中间层，由中间层写入飞书多维表格，同时群机器人通知。优点是低成本、有表格视图；缺点是权限、字段、状态流转依赖飞书。
3. 自建 CRM 后台：`/api/cta` 写入数据库，再做 `/admin` 后台查看、筛选、备注、负责人、跟进状态和导出。推荐字段包括 `id`、`name`、`company`、`phone`、`email`、`interest`、`message`、`source_page`、`utm_*`、`status`、`owner`、`notes`、`created_at`、`updated_at`。

如果用自有服务器部署，最简单的自建后台技术路线是：

- 数据库：Postgres 或 SQLite。生产建议 Postgres。
- 后台认证：先用 Basic Auth 或一个内部登录账号，不公开注册。
- 页面：`/admin/leads` 列表，`/admin/leads/:id` 详情和备注。
- API：`GET /api/admin/leads`、`PATCH /api/admin/leads/:id`、`GET /api/admin/leads.csv`。

我建议当前阶段先走“飞书群通知 + 邮件”，同时预留 `CTA_WEBHOOK_URL` 给飞书多维表格或后续 CRM。这样不会拖慢官网上线，后续再补后台数据层。

## 本地服务器

本地有两种运行方式：

### 纯视觉预览

```bash
npm run dev
```

这会启动 Vite 静态预览。适合看页面和样式，但 Vite 不会运行 `api/cta.js`，所以 CTA 表单提交会因为没有 `/api/cta` 而失败。

### 表单全链路预览

```bash
npm run dev:full
```

打开：

```text
http://127.0.0.1:5173
```

这个本地服务器会同时服务页面文件和 `/api/cta`，因此与生产根域的同源提交路径一致。默认 `CTA_DRY_RUN=true`，可以验证表单校验、CORS、honeypot 和成功状态，但不会发真实邮件。如果 `5173` 已被占用，会自动尝试后续端口并在终端输出实际地址。

如果要本地真实发邮件，在 `.env.local` 中配置：

```bash
CTA_DRY_RUN=false
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=website@frontis.cn
SMTP_PASS=your-smtp-password-or-authorization-code
SMTP_FROM_EMAIL="Frontis Website <website@frontis.cn>"
CTA_TO_EMAIL=xianyuan@frontis.ai
CTA_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

本地真实发信前，确认公司邮箱允许该账号通过 SMTP 发信，并且服务器网络可以访问 SMTP 端口。

## Webhook Payload

`CTA_WEBHOOK_URL` 会收到结构化 JSON：

```json
{
  "event": "frontis.website.cta_submitted",
  "receivedAt": "2026-05-18T00:00:00.000Z",
  "lead": {
    "name": "张三",
    "company": "某某公司",
    "phone": "13800138000",
    "email": "name@example.com",
    "interest": "horizon",
    "interestLabel": "Frontis Horizon（企业级）",
    "message": "希望预约演示",
    "sourcePage": "https://frontis.cn/?utm_source=launch",
    "pageTitle": "FRONTIS 衔远科技",
    "referrer": "",
    "tracking": {
      "utm_source": "launch"
    },
    "submittedAt": "2026-05-18T00:00:00.000Z",
    "userAgent": "...",
    "ip": "..."
  }
}
```

如果 webhook 接收端需要验签，可读取请求头 `X-Frontis-Webhook-Secret`。

## 上线检查

1. 在服务器配置环境变量，不要把 `SMTP_PASS` 写入前端页面或提交到 Git。
2. 确认公司邮箱账号已开启 SMTP，并拿到授权码或应用专用密码。
3. 确认 `CTA_ALLOWED_ORIGINS=https://frontis.cn,https://www.frontis.cn`。
4. 确认生产 HTML 中没有配置 `frontis-cta-endpoint`，让表单直接走同源 `/api/cta`。
5. 执行：

```bash
npm run test:cta
npm run check
npm run build
```

6. 部署后用真实浏览器提交一条测试线索，确认邮件或 webhook 到达。
