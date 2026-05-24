# Frontis 官网 CTA 运维部署配置说明

本文面向运维部署工程师。目标是把官网部署到 `frontis.cn` / `www.frontis.cn` 根目录，并让 CTA 表单同时完成：

1. 公司 SMTP 邮件通知。
2. 飞书群机器人通知。
3. 页面与接口同源提交：`https://frontis.cn/api/cta`。

## 1. 发布包内容

发布包内包含：

- `dist/`：已构建的静态网站产物。
- `api/cta.js`：CTA 提交接口。
- `scripts/serve-production.mjs`：生产 Node 服务，负责同时服务 `dist/` 和 `/api/cta`。
- `package.json` / `package-lock.json`：运行依赖。
- `docs/`：部署和 CTA 配置说明。
- `.env.example`：环境变量模板，不包含真实密钥。
- `components/analytics-config.js`：数据分析前端配置，默认通过 Google Tag Manager 管理。

不要把生产 `.env.production` 提交到 Git，也不要放进前端可访问目录。

## 2. 服务器要求

- Linux 服务器。
- Node.js 20+。
- Nginx。
- 已绑定 DNS：
  - `frontis.cn`
  - `www.frontis.cn`
- 已准备 HTTPS 证书，建议使用 Let's Encrypt。

## 3. 解压与安装

示例部署目录：

```bash
sudo mkdir -p /srv/frontis-site
sudo chown -R www-data:www-data /srv/frontis-site
cd /srv/frontis-site
unzip /tmp/frontis-website-cta-release.zip
```

如果发布包解压后有外层目录，进入该目录，或把内容同步到 `/srv/frontis-site`。

安装运行依赖：

```bash
npm ci --omit=dev
```

如果需要在服务器上重新构建，则使用：

```bash
npm ci
npm run build
```

## 4. 生产环境变量

在 `/srv/frontis-site/.env.production` 写入：

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
CTA_TO_EMAIL_HORIZON=
CTA_TO_EMAIL_LEADEEP=
CTA_TO_EMAIL_ECOSYSTEM=
CTA_TO_EMAIL_OTHER=

CTA_FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxx
CTA_FEISHU_SIGN_SECRET=
CTA_REQUIRE_FEISHU=false

CTA_ALLOWED_ORIGINS=https://frontis.cn,https://www.frontis.cn
CTA_DRY_RUN=false
```

权限建议：

```bash
sudo chown www-data:www-data /srv/frontis-site/.env.production
sudo chmod 600 /srv/frontis-site/.env.production
```

SMTP 说明：

- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` 由公司邮箱管理员提供。
- `SMTP_PASS` 通常是授权码或应用专用密码，不一定是网页登录密码。
- 端口 `465` 通常配 `SMTP_SECURE=true`。
- 端口 `587` 通常配 `SMTP_SECURE=false`，由服务端走 STARTTLS。

飞书说明：

- 在飞书线索通知群中添加“自定义机器人”，复制 webhook 到 `CTA_FEISHU_WEBHOOK_URL`。
- 如果机器人开启签名校验，填写 `CTA_FEISHU_SIGN_SECRET`。
- 如果没有开启签名校验，删除或留空 `CTA_FEISHU_SIGN_SECRET`。
- 推荐保持 `CTA_REQUIRE_FEISHU=false`：飞书临时失败时，不影响邮件兜底和用户提交成功态。

## 4.1 Google Tag Manager / GA4 配置

官网已安装 Google Tag Manager，容器 ID：

```txt
GTM-K3FKM238
```

所有公开页面 `<head>` 顶部已安装 GTM script，`<body>` 起始处已安装 noscript iframe。

当前 GA4 由 GTM 后台负责上报，直接 GA4 fallback 已关闭：

```js
window.FRONTIS_GA_MEASUREMENT_ID = "G-0C4VHZ14XL";
window.FRONTIS_ANALYTICS_OPTIONS = {
  enabled: true,
  enableDirectGa4: false,
  disableDirectGa4OnLocalhost: true,
  sendPageView: true,
  debug: false,
};
```

只要 GTM 后台的 `Google 代码 G-0C4VHZ14XL` 使用 All Pages 或 Initialization - All Pages 触发器，就保持 `enableDirectGa4: false`，避免重复上报页面访问。

前端会向 `dataLayer` 推送 CTA 点击、CTA 提交成功 `generate_lead`、CTA 提交失败、邮箱点击、导航点击和站外链接点击。前端分析事件不发送姓名、手机、邮箱、公司名和留言正文。

详细说明见 `docs/analytics-config.md`。

## 5. systemd 服务

创建 `/etc/systemd/system/frontis-site.service`：

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

启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now frontis-site
sudo systemctl status frontis-site
```

查看日志：

```bash
sudo journalctl -u frontis-site -f
```

## 6. Nginx 配置

示例：

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

应用配置：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. 上线前验证

先在服务器本机验证 Node 服务：

```bash
curl -I http://127.0.0.1:3000/
curl -X POST http://127.0.0.1:3000/api/cta \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://frontis.cn' \
  -d '{"name":"测试用户","company":"衔远测试公司","phone":"13800138000","interest":"horizon","message":"服务器本机联调"}'
```

再从公网验证：

```bash
curl -I https://frontis.cn/
curl -I https://www.frontis.cn/
curl -X POST https://frontis.cn/api/cta \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://frontis.cn' \
  -d '{"name":"测试用户","company":"衔远测试公司","phone":"13800138000","interest":"horizon","message":"公网联调"}'
```

预期：

- 接口返回 `{"ok":true,...}`。
- `channels` 包含 `email` 和 `feishu`。
- `CTA_TO_EMAIL` 邮箱收到线索邮件。
- 飞书群收到线索通知。

## 8. 常见问题

如果返回“SMTP 邮件发送失败”：

- 检查 `SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE` 是否与邮箱管理员提供的一致。
- 检查 `SMTP_USER` 和 `SMTP_PASS` 是否正确。
- 确认服务器防火墙或云安全组允许访问 SMTP 端口。
- 查看 `journalctl -u frontis-site -f` 中的详细错误。

如果接口返回“当前来源不允许提交”：

- 检查 `CTA_ALLOWED_ORIGINS` 是否只包含并完整包含：
  - `https://frontis.cn`
  - `https://www.frontis.cn`

如果页面能打开但 CTA 404：

- 确认 Nginx 不是只服务静态文件，而是把 `/api/cta` 也代理到 `127.0.0.1:3000`。
- 确认 `npm run start` 进程正在运行。

## 9. 回滚

建议每次发布保留上一版目录，例如：

```bash
/srv/frontis-site/releases/20260519-cta
/srv/frontis-site/current -> /srv/frontis-site/releases/20260519-cta
```

回滚时切换 `current` 软链接并重启：

```bash
sudo systemctl restart frontis-site
```
