const MAX_FIELD_LENGTH = 2000;
const DEFAULT_ALLOWED_ORIGINS = [
  "https://frontis.cn",
  "https://www.frontis.cn",
  "https://metaelement.github.io",
  "https://frontis-v2-site.vercel.app",
];

const INTEREST_LABELS = {
  horizon: "Frontis Horizon（企业级）",
  leadeep: "Leadeep AI（个人 / 老板）",
  ecosystem: "城市生态合作",
  other: "其他",
};

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
    `提交时间：${lead.submittedAt}`,
    `IP：${lead.ip || "未知"}`,
    `User-Agent：${lead.userAgent || "未知"}`,
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

async function sendLeadEmail(lead) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CTA_FROM_EMAIL;
  const to = (process.env.CTA_TO_EMAIL || "partner@frontis.cn")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

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

    const emailResult = await sendLeadEmail(lead);
    if (!emailResult.ok) {
      return json(res, emailResult.status, {
        ok: false,
        message: emailResult.message,
        detail: process.env.NODE_ENV === "development" ? emailResult.detail : undefined,
      });
    }

    return json(res, 200, { ok: true, id: emailResult.id });
  } catch (error) {
    const isBadPayload = error && (error instanceof SyntaxError || error.message === "Payload too large");
    return json(res, isBadPayload ? 400 : 500, {
      ok: false,
      message: isBadPayload ? "提交内容格式不正确。" : "提交失败，请稍后重试。",
    });
  }
}
