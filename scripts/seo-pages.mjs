export const SITE_URL = "https://frontis.cn";
export const SITE_NAME = "衔远科技 Frontis AI";
export const DEFAULT_IMAGE = `${SITE_URL}/assets/og-frontis.svg`;

export const pages = [
  {
    file: "index.html",
    path: "/",
    title: "衔远科技 Frontis AI | 企业 AI 专家团与 AI 原生组织平台",
    description:
      "衔远科技 Frontis AI 为企业打造持续进化的 AI 专家团与 AI 原生组织平台，覆盖战略管理、生产研发、供应链运营、营销增长与领导者数字分身。",
    priority: "1.0",
    changefreq: "weekly",
    breadcrumbs: [{ name: "首页", path: "/" }],
  },
  {
    file: "horizon.html",
    path: "/horizon.html",
    title: "Frontis Horizon 衔远大观 | 企业级 AI 专家团平台",
    description:
      "Frontis Horizon 衔远大观面向企业构建 AI 专家团、知识沉淀、流程协同与组织进化能力，帮助关键业务从工具使用跃迁到 AI 原生运营。",
    priority: "0.9",
    changefreq: "weekly",
    schemaType: "SoftwareApplication",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "Frontis Horizon 衔远大观", path: "/horizon.html" },
    ],
  },
  {
    file: "leadeep.html",
    path: "/leadeep.html",
    title: "Leadeep AI 领衔者 | 企业家 AI 数字分身与专家团",
    description:
      "Leadeep AI 领衔者为企业家和管理者打造 AI 数字分身、商业情报专家、决策顾问团与商务销售专家，沉淀个人商业直觉并持续创造认知复利。",
    priority: "0.85",
    changefreq: "weekly",
    schemaType: "SoftwareApplication",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "Leadeep AI 领衔者", path: "/leadeep.html" },
    ],
  },
  {
    file: "scene.html",
    path: "/scene.html",
    title: "AI 应用场景 | 衔远科技 Frontis AI",
    description:
      "衔远科技 Frontis AI 场景总览，覆盖战略管理、生产研发、供应链运营、营销增长、运营管理等高价值业务现场，帮助企业部署可持续进化的 AI 专家团。",
    priority: "0.8",
    changefreq: "weekly",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "AI 应用场景", path: "/scene.html" },
    ],
  },
  {
    file: "scene-strategy.html",
    path: "/scene-strategy.html",
    title: "战略管理 AI 专家团 | Leadeep AI 领衔者",
    description:
      "战略管理 AI 专家团帮助领导者沉淀会议、访谈、行业情报和经营判断，形成可复用的决策中枢、专家协同体系与增长行动建议。",
    priority: "0.75",
    changefreq: "monthly",
    schemaType: "Service",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "AI 应用场景", path: "/scene.html" },
      { name: "战略管理 AI 专家团", path: "/scene-strategy.html" },
    ],
  },
  {
    file: "scene-supply.html",
    path: "/scene-supply.html",
    title: "供应链 AI 专家团 | 衔远科技 Frontis AI",
    description:
      "供应链 AI 专家团面向采购、物流、港口、贸易与风险管理场景，连接业务知识、流程数据和专家模型，提升供应链响应与经营判断效率。",
    priority: "0.72",
    changefreq: "monthly",
    schemaType: "Service",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "AI 应用场景", path: "/scene.html" },
      { name: "供应链 AI 专家团", path: "/scene-supply.html" },
    ],
  },
  {
    file: "scene-sales.html",
    path: "/scene-sales.html",
    title: "营销增长 AI 专家团 | 衔远科技 Frontis AI",
    description:
      "营销增长 AI 专家团支持客户洞察、销售陪练、商机推进、市场日报与私域运营，帮助增长团队把经验转化为可复制的 AI 协同能力。",
    priority: "0.72",
    changefreq: "monthly",
    schemaType: "Service",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "AI 应用场景", path: "/scene.html" },
      { name: "营销增长 AI 专家团", path: "/scene-sales.html" },
    ],
  },
  {
    file: "scene-ops.html",
    path: "/scene-ops.html",
    title: "运营 AI 专家团 | 衔远科技 Frontis AI",
    description:
      "运营 AI 专家团面向项目管理、经营复盘、任务协同与现场执行，帮助组织把运营经验、问题闭环和关键动作沉淀为可持续进化的智能系统。",
    priority: "0.72",
    changefreq: "monthly",
    schemaType: "Service",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "AI 应用场景", path: "/scene.html" },
      { name: "运营 AI 专家团", path: "/scene-ops.html" },
    ],
  },
  {
    file: "scene-research.html",
    path: "/scene-research.html",
    title: "生产研发 AI 专家团 | 衔远科技 Frontis AI",
    description:
      "生产研发 AI 专家团连接研发文档、图纸、计划评审与现场知识，支持项目决策、进度管理和工程资料生成，提升研发与生产协同效率。",
    priority: "0.72",
    changefreq: "monthly",
    schemaType: "Service",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "AI 应用场景", path: "/scene.html" },
      { name: "生产研发 AI 专家团", path: "/scene-research.html" },
    ],
  },
  {
    file: "technology.html",
    path: "/technology.html",
    title: "技术架构 | Frontis AI 衔远科技",
    description:
      "了解衔远科技 Frontis AI 的企业级 AI 技术架构，包括多 Agent 协同、知识与记忆系统、企业数据连接、安全治理和持续进化机制。",
    priority: "0.75",
    changefreq: "monthly",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "技术架构", path: "/technology.html" },
    ],
  },
  {
    file: "ecosystem.html",
    path: "/ecosystem.html",
    title: "生态合作 | 衔远科技 Frontis AI",
    description:
      "衔远科技 Frontis AI 面向城市、产业、渠道与技术伙伴开放生态合作，共建 AI 原生企业服务网络、行业专家资源和落地示范场景。",
    priority: "0.65",
    changefreq: "monthly",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "生态合作", path: "/ecosystem.html" },
    ],
  },
  {
    file: "about.html",
    path: "/about.html",
    title: "关于衔远科技 | Frontis AI",
    description:
      "衔远科技 Frontis AI 专注企业 AI 专家团、AI 原生组织与领导者数字分身，服务大型企业和高成长组织完成从 +AI 工具到 AI 原生运营的跃迁。",
    priority: "0.7",
    changefreq: "monthly",
    breadcrumbs: [
      { name: "首页", path: "/" },
      { name: "关于衔远科技", path: "/about.html" },
    ],
  },
];

export function canonicalUrl(page) {
  return `${SITE_URL}${page.path}`;
}
