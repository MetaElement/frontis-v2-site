const MAX_FIELD_LENGTH = 2000;
const DEFAULT_ALLOWED_ORIGINS = [
  "https://frontis.cn",
  "https://www.frontis.cn",
];
const DEFAULT_TO_EMAIL = "xianyuan@frontis.ai";

const INTEREST_LABELS = {
  horizon: "Frontis Horizon（企业级）",
  leadeep: "Leadeep AI（个人 / 老板）",
  ecosystem: "城市生态合作",
  other: "其他",
};
const INTEREST_RECIPIENT_ENVS = {
  horizon: "CTA_TO_EMAIL_HORIZON",
  leadeep: "CTA_TO_EMAIL_LEADEEP",
  ecosystem: "CTA_TO_EMAIL_ECOSYSTEM",
  other: "CTA_TO_EMAIL_OTHER",
};
const TRACKING_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function getHeader(req, name) {
  if (!req || !req.headers) return "";
  const direct = req.headers[name];
  const lower = req.headers[name.toLowerCase()];
  return Array.isArray(direct || lower) ? (direct || lower)[0] : direct || lower || "";
}

function getAllowedOrigins() {
  const configured = (process.env.CTA_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return true;
  return getAllowedOrigins().includes(origin);
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function envFlag(name) {
  return /^(1|true|yes|on)$/i.test(String(process.env[name] || "").trim());
}

function extractTracking(body, sourcePage) {
  const tracking = {};

  if (body && typeof body.tracking === "object") {
    for (const field of TRACKING_FIELDS) {
      const value = clean(body.tracking[field], 160);
      if (value) tracking[field] = value;
    }
  }

  try {
    const url = new URL(sourcePage);
    for (const field of TRACKING_FIELDS) {
      if (!tracking[field]) {
        const value = clean(url.searchParams.get(field), 160);
        if (value) tracking[field] = value;
      }
    }
  } catch {
    // Source page may be a relative path in local tests.
  }

  return tracking;
}

function formatTracking(tracking) {
  const entries = Object.entries(tracking || {});
  if (entries.length === 0) return "未填写";
  return entries.map(([key, value]) => `${key}=${value}`).join("\n");
}

function setCorsHeaders(req, res) {
  const origin = getHeader(req, "origin");
  if (isAllowedOrigin(origin) && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};

  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20000) {
      throw new Error("Payload too large");
    }
  }

  return raw ? JSON.parse(raw) : {};
}

function clean(value, maxLength = MAX_FIELD_LENGTH) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeLead(body, req) {
  const interest = clean(body.interest, 40);
  const sourcePage = clean(body.sourcePage || getHeader(req, "referer"), 500);
  const tracking = extractTracking(body, sourcePage);

  return {
    name: clean(body.name, 80),
    company: clean(body.company, 120),
    phone: clean(body.phone, 80),
    email: clean(body.email, 120).toLowerCase(),
    interest: INTEREST_LABELS[interest] ? interest : "horizon",
    message: clean(body.message, 1200),
    website: clean(body.website, 120),
    sourcePage,
    pageTitle: clean(body.pageTitle, 160),
    referrer: clean(body.referrer, 500),
    tracking,
    submittedAt: clean(body.submittedAt, 80) || new Date().toISOString(),
    userAgent: clean(getHeader(req, "user-agent"), 300),
    ip:
      clean(getHeader(req, "x-forwarded-for"), 120).split(",")[0] ||
      clean(getHeader(req, "x-real-ip"), 120),
  };
}

function validateLead(lead) {
  if (lead.website) return { ok: true, silent: true };
  if (!lead.name || !lead.company || !lead.phone) {
    return { ok: false, status: 400, message: "请补充姓名、公司和手机号码。" };
  }
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return { ok: false, status: 400, message: "请填写有效的邮箱地址，或暂时留空。" };
  }
  return { ok: true };
}

function formatLeadText(lead) {
  return [
    "官网 CTA 新线索",
    "",
    `姓名：${lead.name}`,
    `公司：${lead.company}`,
    `手机：${lead.phone}`,
    `邮箱：${lead.email || "未填写"}`,
    `沟通方向：${INTEREST_LABELS[lead.interest]}`,
    `来源页面：${lead.sourcePage || "未知"}`,
    `页面标题：${lead.pageTitle || "未知"}`,
    `上一页：${lead.referrer || "无"}`,
    `提交时间：${lead.submittedAt}`,
    `IP：${lead.ip || "未知"}`,
    `User-Agent：${lead.userAgent || "未知"}`,
    "",
    "追踪参数：",
    formatTracking(lead.tracking),
    "",
    "留言：",
    lead.message || "未填写",
  ].join("\n");
}

function formatLeadHtml(lead) {
  const rows = [
    ["姓名", lead.name],
    ["公司", lead.company],
    ["手机", lead.phone],
    ["邮箱", lead.email || "未填写"],
    ["沟通方向", INTEREST_LABELS[lead.interest]],
    ["来源页面", lead.sourcePage || "未知"],
    ["页面标题", lead.pageTitle || "未知"],
    ["上一页", lead.referrer || "无"],
    ["追踪参数", formatTracking(lead.tracking)],
    ["提交时间", lead.submittedAt],
    ["IP", lead.ip || "未知"],
    ["User-Agent", lead.userAgent || "未知"],
  ];

  return `<!doctype html>
<html lang="zh-CN">
  <body style="margin:0;background:#f0f2f4;color:#000;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:32px;">
      <div style="background:#000;color:#fff;padding:28px 32px;border-top:4px solid #00c1d4;">
        <div style="font-size:12px;letter-spacing:0.12em;color:#00c1d4;font-weight:700;">FRONTIS WEBSITE LEAD</div>
        <h1 style="margin:14px 0 0;font-size:28px;line-height:1.25;">官网 CTA 新线索</h1>
      </div>
      <div style="background:#fff;padding:0 32px 32px;">
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${rows
            .map(
              ([label, value]) => `<tr>
                <th style="width:120px;padding:18px 0;border-bottom:1px solid #e3e6e8;text-align:left;color:#5c6268;font-weight:600;">${escapeHtml(label)}</th>
                <td style="padding:18px 0;border-bottom:1px solid #e3e6e8;color:#000;">${escapeHtml(value)}</td>
              </tr>`,
            )
            .join("")}
        </table>
        <h2 style="margin:26px 0 10px;font-size:16px;">留言</h2>
        <div style="white-space:pre-wrap;line-height:1.7;color:#30343a;">${escapeHtml(lead.message || "未填写")}</div>
      </div>
    </div>
  </body>
</html>`;
}

function getLeadRecipients(lead) {
  const baseRecipients = parseList(process.env.CTA_TO_EMAIL || DEFAULT_TO_EMAIL);
  const interestEnv = INTEREST_RECIPIENT_ENVS[lead.interest];
  const interestRecipients = interestEnv ? parseList(process.env[interestEnv]) : [];
  return uniqueList([...baseRecipients, ...interestRecipients]);
}

function getMailFrom() {
  return process.env.SMTP_FROM_EMAIL || process.env.CTA_FROM_EMAIL;
}

function hasSmtpConfig(lead) {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      getMailFrom() &&
      getLeadRecipients(lead).length > 0,
  );
}

function hasResendConfig(lead) {
  return Boolean(process.env.RESEND_API_KEY && process.env.CTA_FROM_EMAIL && getLeadRecipients(lead).length > 0);
}

function hasEmailConfig(lead) {
  return hasSmtpConfig(lead) || hasResendConfig(lead);
}

function hasWebhookConfig() {
  return Boolean(process.env.CTA_WEBHOOK_URL);
}

function hasFeishuConfig() {
  return Boolean(process.env.CTA_FEISHU_WEBHOOK_URL);
}

async function sendLeadViaSmtp(lead) {
  const { default: nodemailer } = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE ? envFlag("SMTP_SECURE") : port === 465;
  const from = getMailFrom();
  const to = getLeadRecipients(lead);

  if (!hasSmtpConfig(lead)) {
    return {
      ok: false,
      status: 500,
      message: "SMTP 邮件服务尚未配置，请检查 SMTP_HOST、SMTP_USER、SMTP_PASS、SMTP_FROM_EMAIL 和 CTA_TO_EMAIL。",
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `官网线索｜${lead.company}｜${lead.name}`,
      text: formatLeadText(lead),
      html: formatLeadHtml(lead),
      replyTo: lead.email || undefined,
    });

    return { ok: true, id: info.messageId || "smtp" };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      message: "SMTP 邮件发送失败，请稍后重试。",
      detail: error && error.message,
    };
  }
}

async function sendLeadViaResend(lead) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CTA_FROM_EMAIL;
  const to = getLeadRecipients(lead);

  if (!apiKey || !from || to.length === 0) {
    return {
      ok: false,
      status: 500,
      message: "邮件服务尚未配置，请检查 RESEND_API_KEY、CTA_FROM_EMAIL 和 CTA_TO_EMAIL。",
    };
  }

  const subject = `官网线索｜${lead.company}｜${lead.name}`;
  const payload = {
    from,
    to,
    subject,
    text: formatLeadText(lead),
    html: formatLeadHtml(lead),
    tags: [{ name: "source", value: "frontis_website" }],
  };

  if (lead.email) payload.reply_to = lead.email;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const resultText = await response.text();
  let result = {};
  try {
    result = resultText ? JSON.parse(resultText) : {};
  } catch {
    result = { message: resultText };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      message: "邮件发送失败，请稍后重试。",
      detail: result && (result.message || result.error),
    };
  }

  return { ok: true, id: result.id };
}

async function sendLeadEmail(lead) {
  if (hasSmtpConfig(lead)) {
    return sendLeadViaSmtp(lead);
  }

  return sendLeadViaResend(lead);
}

async function forwardLeadWebhook(lead) {
  const webhookUrl = process.env.CTA_WEBHOOK_URL;
  if (!webhookUrl) return { ok: true, skipped: true };

  const payload = {
    event: "frontis.website.cta_submitted",
    receivedAt: new Date().toISOString(),
    lead: {
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email,
      interest: lead.interest,
      interestLabel: INTEREST_LABELS[lead.interest],
      message: lead.message,
      sourcePage: lead.sourcePage,
      pageTitle: lead.pageTitle,
      referrer: lead.referrer,
      tracking: lead.tracking,
      submittedAt: lead.submittedAt,
      userAgent: lead.userAgent,
      ip: lead.ip,
    },
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (process.env.CTA_WEBHOOK_SECRET) {
    headers["X-Frontis-Webhook-Secret"] = process.env.CTA_WEBHOOK_SECRET;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const resultText = await response.text();
  let result = {};
  try {
    result = resultText ? JSON.parse(resultText) : {};
  } catch {
    result = { message: resultText };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      message: "线索转发失败，请稍后重试。",
      detail: result && (result.message || result.error),
    };
  }

  return { ok: true, id: result.id || result.message_id || "webhook" };
}

async function createFeishuSignature(timestamp, secret) {
  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", `${timestamp}\n${secret}`).digest("base64");
}

function formatFeishuLeadText(lead) {
  return [
    "官网 CTA 新线索",
    "",
    `姓名：${lead.name}`,
    `公司：${lead.company}`,
    `手机：${lead.phone}`,
    `邮箱：${lead.email || "未填写"}`,
    `沟通方向：${INTEREST_LABELS[lead.interest]}`,
    `来源页面：${lead.sourcePage || "未知"}`,
    `页面标题：${lead.pageTitle || "未知"}`,
    `上一页：${lead.referrer || "无"}`,
    `提交时间：${lead.submittedAt}`,
    "",
    "追踪参数：",
    formatTracking(lead.tracking),
    "",
    "留言：",
    lead.message || "未填写",
  ].join("\n");
}

async function sendFeishuNotification(lead) {
  const webhookUrl = process.env.CTA_FEISHU_WEBHOOK_URL;
  if (!webhookUrl) return { ok: true, skipped: true };

  const payload = {
    msg_type: "text",
    content: {
      text: formatFeishuLeadText(lead),
    },
  };

  if (process.env.CTA_FEISHU_SIGN_SECRET) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    payload.timestamp = timestamp;
    payload.sign = await createFeishuSignature(timestamp, process.env.CTA_FEISHU_SIGN_SECRET);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const resultText = await response.text();
  let result = {};
  try {
    result = resultText ? JSON.parse(resultText) : {};
  } catch {
    result = { message: resultText };
  }

  if (!response.ok || result.code || result.StatusCode) {
    return {
      ok: false,
      status: 502,
      message: "飞书通知发送失败，请稍后重试。",
      detail: result && (result.msg || result.StatusMessage || result.message || result.error),
    };
  }

  return { ok: true, id: "feishu" };
}

async function deliverLead(lead) {
  if (envFlag("CTA_DRY_RUN")) {
    return { ok: true, id: "dry_run", channels: ["dry_run"] };
  }

  const emailConfigured = hasEmailConfig(lead);
  const webhookConfigured = hasWebhookConfig();
  const feishuConfigured = hasFeishuConfig();

  if (!emailConfigured && !webhookConfigured && !feishuConfigured) {
    return {
      ok: false,
      status: 500,
      message: "提交服务尚未配置，请至少配置 Resend 邮件、CTA_WEBHOOK_URL 或 CTA_FEISHU_WEBHOOK_URL。",
    };
  }

  const channels = [];
  let emailResult = { ok: true, skipped: true };
  let webhookResult = { ok: true, skipped: true };
  let feishuResult = { ok: true, skipped: true };

  if (emailConfigured) {
    emailResult = await sendLeadEmail(lead);
    if (!emailResult.ok) return emailResult;
    channels.push("email");
  }

  if (webhookConfigured) {
    webhookResult = await forwardLeadWebhook(lead);
    if (!webhookResult.ok && (envFlag("CTA_REQUIRE_WEBHOOK") || !emailConfigured)) return webhookResult;
    channels.push(webhookResult.ok ? "webhook" : "webhook_failed");
  }

  if (feishuConfigured) {
    feishuResult = await sendFeishuNotification(lead);
    if (!feishuResult.ok && (envFlag("CTA_REQUIRE_FEISHU") || (!emailConfigured && !webhookConfigured))) {
      return feishuResult;
    }
    channels.push(feishuResult.ok ? "feishu" : "feishu_failed");
  }

  return {
    ok: true,
    id: emailResult.id || webhookResult.id || feishuResult.id || "accepted",
    channels,
    warning: [webhookResult, feishuResult].filter((result) => !result.ok).map((result) => result.message).join("；") || undefined,
  };
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  const origin = getHeader(req, "origin");
  if (!isAllowedOrigin(origin)) {
    return json(res, 403, { ok: false, message: "当前来源不允许提交。" });
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return json(res, 405, { ok: false, message: "Method Not Allowed" });
  }

  try {
    const body = await readJsonBody(req);
    const lead = normalizeLead(body, req);
    const validation = validateLead(lead);

    if (!validation.ok) {
      return json(res, validation.status, { ok: false, message: validation.message });
    }

    if (validation.silent) {
      return json(res, 200, { ok: true });
    }

    const deliveryResult = await deliverLead(lead);
    if (!deliveryResult.ok) {
      return json(res, deliveryResult.status, {
        ok: false,
        message: deliveryResult.message,
        detail: process.env.NODE_ENV === "development" ? deliveryResult.detail : undefined,
      });
    }

    return json(res, 200, {
      ok: true,
      id: deliveryResult.id,
      channels: deliveryResult.channels,
      warning: process.env.NODE_ENV === "development" ? deliveryResult.warning : undefined,
    });
  } catch (error) {
    const isBadPayload = error && (error instanceof SyntaxError || error.message === "Payload too large");
    return json(res, isBadPayload ? 400 : 500, {
      ok: false,
      message: isBadPayload ? "提交内容格式不正确。" : "提交失败，请稍后重试。",
    });
  }
}
