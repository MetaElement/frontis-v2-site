# Frontis 官网 Google Tag Manager 配置说明

本文面向运维和市场运营同事。当前官网已安装 Google Tag Manager，容器 ID 为：

```txt
GTM-K3FKM238
```

## 1. 已安装代码

所有公开页面 `<head>` 顶部已安装 GTM script，`<body>` 起始处已安装 noscript iframe。

## 2. 在 GTM 中配置 GA4

当前官网已在 GTM 容器中配置 GA4，并在 `components/analytics-config.js` 中关闭直接 GA4 上报，避免重复 page_view：

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

这意味着页面访问由 GTM 中的 `Google 代码 G-0C4VHZ14XL` 负责上报，官网前端只继续向 `dataLayer` 推送 CTA、联系点击和转化事件。

如果需要复核或重建 GTM 后台配置，按下面方式检查：

1. 打开容器 `GTM-K3FKM238`。
2. 确认存在 Google tag / Google 代码，Measurement ID 为 `G-0C4VHZ14XL`。
3. 确认触发器为 All Pages 或 Initialization - All Pages。
4. 确认容器已经发布。

只要 GTM 里存在 Google tag / GA4 tag，并使用 All Pages 或 Initialization - All Pages 触发器，就应保持 `enableDirectGa4: false`。

## 3. 已推送到 dataLayer 的事件

前端会把以下自定义事件推送到 `window.dataLayer`，可在 GTM 中创建 Custom Event 触发器：

- `frontis_cta_click`：点击“开启跃迁”或产品体验入口。
- `navigation_click`：顶部导航和页脚导航点击。
- `outbound_click`：站外链接点击。
- `contact_click`：邮箱联系点击。
- `frontis_cta_submit`：用户提交 CTA 表单。
- `generate_lead`：CTA 表单提交成功。
- `frontis_cta_validation_error`：前端校验失败。
- `frontis_cta_submit_error`：提交接口不可用或提交失败。

常用事件参数：

- `page_path`
- `page_title`
- `cta_location`
- `link_text`
- `link_url`
- `interest`
- `error_type`

## 4. 直接 GA4 兜底

当前直接 GA4 已关闭：

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

只有在 GTM 不再负责 GA4 页面访问时，才把 `enableDirectGa4` 改为 `true`。

## 5. 隐私边界

前端事件不会向 GA4 发送姓名、手机号、邮箱、公司名、留言正文等线索字段。线索明细仍只走 `/api/cta` 的邮件和飞书通知链路。

## 6. 验证

1. 部署网站。
2. 用 GTM Preview / Tag Assistant 连接 `frontis.cn`。
3. 确认页面加载 `GTM-K3FKM238`。
4. 点击“开启跃迁”、邮箱链接或提交一条测试 CTA。
5. 在 GTM Preview 中确认对应 `dataLayer` 事件出现。
