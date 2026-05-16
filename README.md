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

## Build

```bash
npm run build
```

## Check

```bash
npm run check
```

## CTA Email API

Shared CTA forms are rendered from `components/site-shell.js` and submit to `/api/cta` by default on HTTP(S) pages. The backend endpoint is implemented as a Vercel serverless function in `api/cta.js`.

Required server-side environment variables:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CTA_FROM_EMAIL="Frontis Website <website@frontis.cn>"
CTA_TO_EMAIL=partner@frontis.cn
CTA_ALLOWED_ORIGINS=https://frontis.cn,https://www.frontis.cn,https://metaelement.github.io
```

Notes:

- `RESEND_API_KEY` and `CTA_FROM_EMAIL` must only be configured on the backend deployment platform.
- `CTA_FROM_EMAIL` should use a verified sending domain in Resend.
- If the static site remains on GitHub Pages while the API is deployed elsewhere, set `window.FRONTIS_CTA_ENDPOINT` before loading `components/site-shell.js`, or add `<meta name="frontis-cta-endpoint" content="https://your-api-domain.com/api/cta">` to the pages.
- Direct `file://` previews will keep the form visible but will not submit until an API endpoint is configured.
