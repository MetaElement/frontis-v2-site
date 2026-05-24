import handler from "../api/cta.js";

const touchedEnvKeys = [
  "CTA_DRY_RUN",
  "CTA_ALLOWED_ORIGINS",
  "RESEND_API_KEY",
  "CTA_FROM_EMAIL",
  "CTA_TO_EMAIL",
  "CTA_WEBHOOK_URL",
  "CTA_REQUIRE_WEBHOOK",
  "CTA_FEISHU_WEBHOOK_URL",
  "CTA_FEISHU_SIGN_SECRET",
  "CTA_REQUIRE_FEISHU",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM_EMAIL",
];
const originalEnv = Object.fromEntries(touchedEnvKeys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;

function createReq({ method = "POST", origin = "http://localhost:5173", body = {} } = {}) {
  return {
    method,
    headers: {
      origin,
      "content-type": "application/json",
      "user-agent": "frontis-cta-api-test",
    },
    body,
  };
}

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(payload = "") {
      this.body = payload;
    },
  };
}

async function callApi(reqOptions) {
  const req = createReq(reqOptions);
  const res = createRes();
  await handler(req, res);
  let json = {};
  try {
    json = res.body ? JSON.parse(res.body) : {};
  } catch {
    json = { raw: res.body };
  }
  return { statusCode: res.statusCode, headers: res.headers, json };
}

async function expectCase(name, reqOptions, expectedStatus, expectedOk) {
  const result = await callApi(reqOptions);
  if (result.statusCode !== expectedStatus || result.json.ok !== expectedOk) {
    throw new Error(
      `${name} failed: expected ${expectedStatus}/${expectedOk}, got ${result.statusCode}/${result.json.ok}. ${JSON.stringify(result.json)}`,
    );
  }
  console.log(`ok ${name}`);
}

try {
  process.env.CTA_DRY_RUN = "true";
  process.env.CTA_ALLOWED_ORIGINS = "http://localhost:5173,https://frontis.cn";

  await expectCase(
    "accepts valid dry-run submission",
    {
      body: {
        name: "测试用户",
        company: "衔远测试公司",
        phone: "13800138000",
        email: "test@example.com",
        interest: "horizon",
        message: "希望预约演示",
        sourcePage: "https://frontis.cn/?utm_source=qa",
      },
    },
    200,
    true,
  );

  await expectCase(
    "rejects missing required fields",
    {
      body: {
        name: "测试用户",
        company: "",
        phone: "",
      },
    },
    400,
    false,
  );

  await expectCase(
    "silently accepts honeypot spam",
    {
      body: {
        name: "Spam",
        company: "Bot",
        phone: "123456",
        website: "https://spam.example",
      },
    },
    200,
    true,
  );

  await expectCase(
    "rejects disallowed origin",
    {
      origin: "https://evil.example",
      body: {
        name: "测试用户",
        company: "衔远测试公司",
        phone: "13800138000",
      },
    },
    403,
    false,
  );

  process.env.CTA_DRY_RUN = "false";
  delete process.env.RESEND_API_KEY;
  delete process.env.CTA_FROM_EMAIL;
  delete process.env.CTA_TO_EMAIL;
  delete process.env.CTA_WEBHOOK_URL;
  delete process.env.CTA_REQUIRE_WEBHOOK;
  delete process.env.CTA_FEISHU_WEBHOOK_URL;
  delete process.env.CTA_FEISHU_SIGN_SECRET;
  delete process.env.CTA_REQUIRE_FEISHU;
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_SECURE;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.SMTP_FROM_EMAIL;

  await expectCase(
    "rejects missing delivery configuration",
    {
      body: {
        name: "测试用户",
        company: "衔远测试公司",
        phone: "13800138000",
      },
    },
    500,
    false,
  );

  process.env.CTA_FEISHU_WEBHOOK_URL = "https://open.feishu.cn/open-apis/bot/v2/hook/test";
  process.env.CTA_REQUIRE_FEISHU = "true";
  globalThis.fetch = async (url, options) => {
    const payload = JSON.parse(options.body);
    if (!String(url).includes("open.feishu.cn") || payload.msg_type !== "text" || !payload.content?.text) {
      return new Response(JSON.stringify({ code: 1, msg: "bad payload" }), { status: 400 });
    }
    return new Response(JSON.stringify({ code: 0, msg: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await expectCase(
    "accepts Feishu-only delivery",
    {
      body: {
        name: "测试用户",
        company: "衔远测试公司",
        phone: "13800138000",
        interest: "horizon",
      },
    },
    200,
    true,
  );
} finally {
  globalThis.fetch = originalFetch;
  for (const key of touchedEnvKeys) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
}
