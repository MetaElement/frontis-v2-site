(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function swap(el) {
    if (reduceMotion || !el) return;
    el.classList.remove("is-swapping");
    void el.offsetWidth;
    el.classList.add("is-swapping");
  }

  function track(name, params) {
    if (typeof window.frontisTrack === "function") window.frontisTrack(name, params || {});
  }

  // Keyboard support for role="tablist": arrows / Home / End move focus and select.
  function bindTabs(tabs, select) {
    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { select(index, true); });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        select(next, true);
        tabs[next].focus();
      });
    });
  }

  function setActive(tabs, index) {
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.setAttribute("tabindex", on ? "0" : "-1");
    });
  }

  function renderTags(list, items) {
    list.innerHTML = "";
    items.forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });
  }

  /* ---------- 03 · Evolution loop ---------- */
  var LOOP = [
    {
      title: "把“好”写成可执行的标准。",
      copy: "专家确认业务目标，历史数据与异常案例成为专业评测的依据。",
      tags: ["业务目标", "真实案例", "评价规则"],
    },
    {
      title: "让标准，可以被运行。",
      copy: "以真实任务与验收要求构建评测集，把“好不好用”变成可以验证的问题。",
      tags: ["评测集", "验收标准", "测试记录"],
    },
    {
      title: "每一个候选，都经过实验检验。",
      copy: "提出候选方案，执行实验、比较结果，只保留可以证明的改进。",
      tags: ["候选方案", "执行记录", "对比结果"],
    },
    {
      title: "有效经验，成为下一步的起点。",
      copy: "将有效方法沉淀为技能、评测模板与训练任务；关键发布由专家确认。",
      tags: ["可复用技能", "版本报告", "专家复核"],
    },
  ];

  var loop = document.querySelector("[data-v3-loop]");
  if (loop) {
    var loopTabs = Array.prototype.slice.call(loop.querySelectorAll("[data-step]"));
    var loopPanel = loop.querySelector(".v3-loop__panel");
    var loopTitle = loop.querySelector("[data-loop-title]");
    var loopCopy = loop.querySelector("[data-loop-copy]");
    var loopTags = loop.querySelector("[data-loop-tags]");
    var progress = loop.querySelector("[data-v3-loop-progress]");
    var nodes = Array.prototype.slice.call(loop.querySelectorAll("[data-node]"));
    var circumference = 2 * Math.PI * 128;
    var loopIndex = 0;
    var loopTimer = null;
    var userTouched = false;

    var selectLoop = function (index, fromUser) {
      loopIndex = index;
      var step = LOOP[index];
      setActive(loopTabs, index);
      loopTitle.textContent = step.title;
      loopCopy.textContent = step.copy;
      renderTags(loopTags, step.tags);
      if (progress) progress.style.strokeDashoffset = String(circumference * (1 - (index + 1) / LOOP.length));
      nodes.forEach(function (node, i) { node.classList.toggle("is-on", i <= index); });
      swap(loopPanel);
      if (fromUser) {
        userTouched = true;
        stopLoop();
        track("v3_loop_step", { step: index + 1 });
      }
    };

    var stopLoop = function () {
      if (loopTimer) window.clearInterval(loopTimer);
      loopTimer = null;
    };

    var startLoop = function () {
      if (reduceMotion || userTouched || loopTimer) return;
      loopTimer = window.setInterval(function () {
        selectLoop((loopIndex + 1) % LOOP.length, false);
      }, 4200);
    };

    bindTabs(loopTabs, selectLoop);
    selectLoop(0, false);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) startLoop();
          else stopLoop();
        });
      }, { threshold: 0.35 }).observe(loop);
    }
  }

  /* ---------- 05 · Industries ---------- */
  var INDUSTRY = [
    {
      eyebrow: "SEMICONDUCTORS",
      img: "./assets/v3/semiconductor.webp",
      alt: "硅晶圆的精密网格表面，行业概念视觉",
      title: "从芯片设计，<br>到封装测试协同。",
      desc: "连接设计规格、EDA 工具与工程数据，辅助设计仿真、跨工艺适配和材料耗用核对。保留分析依据，支持工程师复核与质量异常排查。",
      caps: ["设计仿真与适配", "BOM 耗用核对", "质量异常排查"],
      status: "已开放使用 · 封测 BOM Agent",
      caseText: "BOM Agent 1.0 已向封测客户开放使用，核对 MES / ERP、实物盘点及 BOM 与实际消耗，形成偏差清单与排查依据。",
    },
    {
      eyebrow: "SYNTHETIC BIOLOGY",
      img: "./assets/v3/synthetic-biology.webp",
      alt: "含琥珀色培养液的玻璃生物反应器，合成生物研究概念视觉",
      title: "从代谢通路，<br>走向菌株设计。",
      desc: "连接文献、基因组、代谢通路与专业工具，辅助分析代谢瓶颈、筛选菌株改造方向。以专家评审和湿实验验证，让设计与下一轮实验有据可循。",
      caps: ["代谢通路分析", "候选改造排序", "专家与湿实验验证"],
      status: "研究验证 · 菌株设计",
      caseText: "当前从公开数据验证起步，形成代谢瓶颈解释与候选改造清单，为专家评审及后续湿实验提供依据。",
    },
    {
      eyebrow: "SUPPLY CHAIN & OPERATIONS",
      img: "./assets/v3/supply.webp",
      alt: "物流场景中的集装箱，行业示意摄影",
      title: "从复杂信息，<br>到更清晰的决策。",
      desc: "融合供需、库存、运费与市场信息，辅助价格研判；结合订单、关务、天气与港口信息比较多式联运路径，让成本、时效与风险成为可核对的决策依据。",
      caps: ["大宗商品研判", "多式联运路径", "风险与方案比较"],
      status: "场景方案 · 多式联运",
      caseText: "将订单与运输条件转化为可比较的路径方案，识别天气与港口风险，并随条件变化重新规划。",
    },
    {
      eyebrow: "CONSUMER & BRANDS",
      img: "./assets/v3/consumer.webp",
      alt: "消费品场景，行业示意摄影",
      title: "把产品知识，<br>带到每一次服务。",
      desc: "以企业知识支持销售建议、客服响应与导购质检；按门店标准识别巡检问题、形成整改任务，并用后续记录检验执行结果。",
      caps: ["AI 销售辅助", "门店巡检", "营销协同"],
      status: "场景方案 · 门店巡检",
      caseText: "围绕着装、环境与操作规范保留异常记录，将问题连接到整改任务和后续核验。",
    },
  ];

  var industry = document.querySelector("[data-v3-industry]");
  if (industry) {
    var indTabs = Array.prototype.slice.call(industry.querySelectorAll("[data-industry]"));
    var indPanel = industry.querySelector(".v3-industry__panel");
    var q = function (sel) { return industry.querySelector(sel); };

    INDUSTRY.forEach(function (item) { var pre = new Image(); pre.src = item.img; });

    bindTabs(indTabs, function (index, fromUser) {
      var item = INDUSTRY[index];
      setActive(indTabs, index);
      var img = q("[data-ind-img]");
      img.src = item.img;
      img.alt = item.alt;
      q("[data-ind-eyebrow]").textContent = item.eyebrow;
      q("[data-ind-title]").innerHTML = item.title;
      q("[data-ind-desc]").textContent = item.desc;
      renderTags(q("[data-ind-caps]"), item.caps);
      q("[data-ind-status]").textContent = item.status;
      q("[data-ind-case]").textContent = item.caseText;
      swap(indPanel);
      if (fromUser) track("v3_industry_tab", { industry: item.eyebrow });
    });
  }

  /* ---------- CTA tracking ---------- */
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("[data-track]");
    if (link) track("v3_cta_click", { cta: link.getAttribute("data-track") });
  });

  /* ---------- Reveal on scroll ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(
      ".v3-head, .v3-pillars, .v3-stack, .v3-loop, .v3-products__group, .v3-industry, .v3-clients, .v3-research, .v3-timeline, .v3-about > *, .v3-faq__list, .v3-entries"
    );
    root.classList.add("v3-js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    Array.prototype.forEach.call(targets, function (el) {
      el.setAttribute("data-reveal", "");
      io.observe(el);
    });

    // Fail-open: anything at or above the viewport bottom is revealed even if the
    // observer missed it (fast jumps, anchor links, headless renderers).
    var pending = false;
    var sweep = function () {
      pending = false;
      Array.prototype.forEach.call(targets, function (el) {
        if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    };
    window.addEventListener("scroll", function () {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(sweep);
    }, { passive: true });
    window.addEventListener("hashchange", sweep);
    window.addEventListener("beforeprint", function () {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add("is-in"); });
    });
    sweep();
  }
})();
