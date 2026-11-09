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
      title: "明确改进目标与验收标准。",
      copy: "业务负责人确定什么结果可用，提供规则与样本；任务范围、允许修改的对象与预算在开始前约定清楚。",
      tags: ["改进目标", "验收标准", "授权范围"],
    },
    {
      title: "用 Benchmark OS 建立能力基线。",
      copy: "把业务标准转成可执行的评测用例，独立运行和判分。先确认评测本身有效，再判断业务是否达标。",
      tags: ["评测集", "可信基线", "逐例结果"],
    },
    {
      title: "定位差距，聚焦改进问题。",
      copy: "从评测结果与线上轨迹中归纳共性问题，把多次失败归为一个可验证的问题，而不是逐条修补。",
      tags: ["轨迹分析", "失败归因", "问题清单"],
    },
    {
      title: "改进工作方法，或优化专业模型。",
      copy: "按问题需要改进 Agent 的提示词、Skill 与工作流，或开展 ML 模型实验；只在约定范围内修改。",
      tags: ["Agent 工作方法", "ML 专业模型", "候选方案"],
    },
    {
      title: "用同一标准独立复测。",
      copy: "候选与基线在相同条件下比较，同时检查原有能力是否回归、边界是否守住，以及时延与成本。",
      tags: ["版本对比", "回归检查", "成本记录"],
    },
    {
      title: "由负责人决定是否应用。",
      copy: "查看证据、差异与适用范围，采纳到开发包；正式发布独立执行，并在使用中观察实际收益。",
      tags: ["审阅证据", "采纳与发布", "业务观察"],
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

  /* ---------- CTA tracking ---------- */
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("[data-track]");
    if (link) track("v3_cta_click", { cta: link.getAttribute("data-track") });
  });

  /* ---------- Reveal on scroll ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(
      ".v3-head, .v3-pillars, .v3-stack, .v3-loop, .v3-engines, .v3-cards, .v3-promise, .v3-mewe, .v3-solutions, .v3-industries, .v3-research, .v3-path, .v3-ready, .v3-cases, .v3-clients, .v3-about > *, .v3-faq__list, .v3-entries"
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
