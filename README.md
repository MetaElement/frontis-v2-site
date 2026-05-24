# Frontis V2 Website

High-fidelity static implementation of the Frontis public website prototype.

## Pages

- `index.html`
- `horizon.html`
- `leadeep.html`
- `scene.html`
- `scene-strategy.html`
- `scene-supply.html`
- `scene-sales.html`
- `scene-ops.html`
- `scene-research.html`
- `technology.html`
- `ecosystem.html`
- `about.html`

## Run

```bash
npm install
npm run dev
```

The site is also fully static, so `index.html` can be opened directly in a browser.

For local end-to-end CTA testing, run the full local server instead:

```bash
npm run dev:full
```

Open `http://127.0.0.1:5173`. This serves the pages and `/api/cta` from the same local origin. It defaults to `CTA_DRY_RUN=true`, so test submissions validate the payload without sending real email.

## Build

```bash
npm run build
```

Run the production server from the built output:

```bash
npm run start
```

By default this listens on `127.0.0.1:3000`, serves `dist/`, and handles same-origin `/api/cta`.

## Check

```bash
npm run check
```

## Analytics

The site has Google Tag Manager installed with container:

```txt
GTM-K3FKM238
```

Custom frontend events are pushed to `window.dataLayer`, including CTA clicks, CTA submit/success/error states, contact clicks, navigation clicks, and outbound links. Configure GA4 inside the GTM container with an All Pages trigger.

The optional direct GA4 fallback is configured in:

```bash
components/analytics-config.js
```

The GA4 Measurement ID is recorded for reference:

```txt
G-0C4VHZ14XL
```

Direct GA4 is disabled because GA4 is configured in GTM:

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

Keep `enableDirectGa4` as `false` while the GTM container has a Google tag / GA4 tag firing on All Pages or Initialization - All Pages.

The frontend analytics layer does not send lead PII such as name, phone, email, company, or message text.

See `docs/analytics-config.md` for the operations checklist.

## CTA Submission API

Shared CTA forms are rendered from `components/site-shell.js` and submit to `/api/cta` by default on HTTP(S) pages. The backend endpoint is implemented as a Vercel serverless function in `api/cta.js`.

Production target:

- deploy the site to the root of `https://frontis.cn` and `https://www.frontis.cn`
- keep the API on the same deployment/domain at `/api/cta`
- do not add `frontis-cta-endpoint` on production root pages

The form collects:

- name, company, phone, optional email
- interest area: Horizon, Leadeep, ecosystem, or other
- optional message, source page, referrer, and UTM parameters

Run the local API smoke test without sending real email:

```bash
npm run test:cta
```

Required server-side environment variables for company SMTP:

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

Optional routing and integration variables:

```bash
CTA_TO_EMAIL_HORIZON=horizon-owner@frontis.cn
CTA_TO_EMAIL_LEADEEP=leadeep-owner@frontis.cn
CTA_TO_EMAIL_ECOSYSTEM=ecosystem-owner@frontis.cn
CTA_TO_EMAIL_OTHER=partner@frontis.cn
CTA_WEBHOOK_URL=https://example.com/frontis-leads
CTA_WEBHOOK_SECRET=change-me
CTA_REQUIRE_WEBHOOK=false
CTA_FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxx
CTA_FEISHU_SIGN_SECRET=change-me
CTA_REQUIRE_FEISHU=false
RESEND_API_KEY=
CTA_FROM_EMAIL=
CTA_DRY_RUN=false
```

Notes:

- `SMTP_PASS` must only be configured on the backend deployment platform; do not commit it.
- `SMTP_PASS` is often an app password or authorization code, not the normal mailbox login password.
- If SMTP is unavailable, `RESEND_API_KEY` and `CTA_FROM_EMAIL` remain supported as a fallback mail provider.
- `CTA_TO_EMAIL_*` adds interest-specific recipients while keeping `CTA_TO_EMAIL` as the central inbox.
- `CTA_WEBHOOK_URL` receives a normalized JSON lead payload for Feishu, CRM, Sheets, or automation middleware.
- `CTA_FEISHU_WEBHOOK_URL` sends a formatted text notification to a Feishu custom bot group.
- For the `frontis.cn` / `www.frontis.cn` root deployment, forms submit to same-origin `/api/cta`; no endpoint override is needed.
- If a non-root/static preview uses a different API domain, set `window.FRONTIS_CTA_ENDPOINT` before loading `components/site-shell.js`, or add `<meta name="frontis-cta-endpoint" content="https://your-api-domain.com/api/cta">` to the pages.
- Direct `file://` previews will keep the form visible but will not submit until an API endpoint is configured.

See `docs/cta-submission.md` for the deployment and operations checklist.
