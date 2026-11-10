(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var lang = body.getAttribute("data-lang") === "en" ? "en" : "zh";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PASS_LINE = 0.72; // viewport fraction; matches .pass { top: 72vh }

  var T = {
    zh: {
      s0: "基线评测中",
      s1: "基线 24/26 · 定位到 2 处差距",
      s2: "候选 1 · 出现回归，淘汰",
      s3: "候选 2 · 出现回归，淘汰",
      s4: "候选 3 复评中",
      passed: "2 项改善 · 0 项回退 · 等待人批准",
      approved: "已采纳到开发包 · 发布另行执行",
      approve: "批准采纳",
      approveDone: "已批准",
      formMissing: "请填写姓名、公司，以及邮箱或手机中的一项。",
      formEmail: "请填写有效的邮箱地址。",
      formNoEndpoint: "当前预览环境没有提交服务。请直接发邮件到 xianyuan@frontis.ai。",
      formSending: "正在提交",
      formPending: "正在提交，请稍候。",
      formDone: "已收到。我们会在 1 个工作日内联系你。",
      formFail: "提交失败，请稍后重试，或发邮件到 xianyuan@frontis.ai。",
      stack: "Agent 平台",
    },
    en: {
      s0: "Scoring baseline",
      s1: "Baseline 24/26 · 2 gaps located",
      s2: "Candidate 1 · regression, discarded",
      s3: "Candidate 2 · regression, discarded",
      s4: "Re-testing candidate 3",
      passed: "2 improved · 0 regressed · awaiting human approval",
      approved: "Adopted into the dev package · release is a separate step",
      approve: "Approve",
      approveDone: "Approved",
      formMissing: "Please add your name, company, and an email or phone number.",
      formEmail: "Please enter a valid email address.",
      formNoEndpoint: "This preview has no submission service. Email xianyuan@frontis.ai instead.",
      formSending: "Sending",
      formPending: "Sending your request.",
      formDone: "Received. We will reply within one business day.",
      formFail: "Could not send. Please try again, or email xianyuan@frontis.ai.",
      stack: "Agent stack",
    },
  }[lang];

  function track(name, params) {
    if (typeof window.frontisTrack === "function") window.frontisTrack(name, params || {});
  }

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  /* ---------- Ready: hero headline enters once fonts are in ---------- */
  function ready() { root.classList.add("is-ready"); }
  if (doc.fonts && doc.fonts.ready) {
    var readyTimer = window.setTimeout(ready, 900);
    doc.fonts.ready.then(function () { window.clearTimeout(readyTimer); window.requestAnimationFrame(ready); });
  } else {
    ready();
  }

  /* ---------- Header ---------- */
  var hd = doc.getElementById("hd");
  var menu = doc.querySelector("[data-menu]");
  function setMenu(open) {
    if (!hd || !menu) return;
    hd.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (menu) {
    menu.addEventListener("click", function () { setMenu(menu.getAttribute("aria-expanded") !== "true"); });
    each(doc.querySelectorAll(".hd__nav a"), function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  }

  /* ---------- Threshold: elements are "verified" as they cross the pass line ---------- */
  var targets = doc.querySelectorAll("[data-v]");
  function verify(el) { el.classList.add("on"); }

  if (reduce || !("IntersectionObserver" in window)) {
    each(targets, verify);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        verify(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -" + Math.round((1 - PASS_LINE) * 100) + "% 0px", threshold: 0 });
    each(targets, function (el) { io.observe(el); });
  }

  // Fail-open sweep: fast jumps, anchor links and the end of the page must never leave content gray.
  var ticking = false;
  function sweep() {
    ticking = false;
    var line = window.innerHeight * PASS_LINE;
    var atEnd = window.innerHeight + window.scrollY >= root.scrollHeight - 4;
    each(targets, function (el) {
      if (el.classList.contains("on")) return;
      if (atEnd || el.getBoundingClientRect().top < line) verify(el);
    });
    if (hd) hd.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  function requestSweep() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(sweep);
  }
  window.addEventListener("scroll", requestSweep, { passive: true });
  window.addEventListener("resize", requestSweep);
  window.addEventListener("hashchange", function () { window.setTimeout(sweep, 60); });
  window.addEventListener("beforeprint", function () { each(targets, verify); });
  sweep();

  /* ---------- Evaluation cells ---------- */
  var CASES = 26;
  function list(value) {
    return (value || "").split(",").filter(Boolean).map(Number);
  }
  function buildCells(host) {
    var frag = doc.createDocumentFragment();
    for (var n = 0; n < CASES; n++) frag.appendChild(doc.createElement("i"));
    host.appendChild(frag);
    return host.children;
  }
  function stateOf(index, fails, regs) {
    var id = index + 1;
    if (regs.indexOf(id) >= 0) return "r";
    if (fails.indexOf(id) >= 0) return "f";
    return "p";
  }

  each(doc.querySelectorAll("[data-mini]"), function (mini) {
    var cells = buildCells(mini.querySelector(".mini__cells"));
    var fails = list(mini.getAttribute("data-fail"));
    each(cells, function (cell, index) { cell.className = stateOf(index, fails, []); });
  });

  /* ---------- Hero matrix: one recorded run, replayed ---------- */
  var mx = doc.querySelector("[data-mx]");
  if (mx) {
    var hero = doc.querySelector(".hero");
    var status = mx.querySelector("[data-mx-status]");
    var approve = mx.querySelector("[data-mx-approve]");
    var replay = mx.querySelector("[data-mx-replay]");
    var timers = [];
    var rows = Array.prototype.map.call(mx.querySelectorAll(".mx__row"), function (row) {
      return {
        el: row,
        cells: buildCells(row.querySelector(".mx__cells")),
        fails: list(row.getAttribute("data-fail")),
        regs: list(row.getAttribute("data-reg")),
        drop: row.hasAttribute("data-drop"),
        final: row.classList.contains("mx__row--final"),
      };
    });

    var later = function (fn, ms) { timers.push(window.setTimeout(fn, ms)); };
    var say = function (text) { if (status) status.textContent = text; };

    var paintRow = function (row) {
      each(row.cells, function (cell, index) { cell.className = stateOf(index, row.fails, row.regs); });
    };
    var settleRow = function (row) {
      row.el.classList.remove("is-live");
      row.el.classList.add("is-done");
      if (row.drop) row.el.classList.add("is-drop");
      if (row.final) row.el.classList.add("is-pass");
    };

    var finish = function () {
      mx.classList.add("is-found", "is-passed");
      if (hero) hero.classList.add("is-passed");
      say(T.passed);
      approve.disabled = false;
    };

    var reset = function () {
      timers.forEach(window.clearTimeout);
      timers = [];
      mx.classList.remove("is-found", "is-passed", "is-approved");
      if (hero) hero.classList.remove("is-passed");
      rows.forEach(function (row) {
        row.el.classList.remove("is-live", "is-done", "is-drop", "is-pass");
        each(row.cells, function (cell) { cell.className = ""; });
      });
      approve.disabled = true;
      approve.textContent = T.approve;
    };

    var showFinal = function () {
      rows.forEach(function (row) { paintRow(row); settleRow(row); });
      finish();
    };

    var play = function () {
      reset();
      if (reduce) { showFinal(); return; }

      var at = 250;
      var messages = [T.s0, T.s2, T.s3, T.s4];
      rows.forEach(function (row, r) {
        var step = r === 0 ? 30 : 16;
        later(function () { row.el.classList.add("is-live"); say(messages[r]); }, at);
        for (var n = 0; n < CASES; n++) {
          (function (index) {
            later(function () { row.cells[index].className = stateOf(index, row.fails, row.regs); }, at + 80 + index * step);
          })(n);
        }
        at += 80 + CASES * step + 120;
        later(function () {
          settleRow(row);
          if (r === 0) { mx.classList.add("is-found"); say(T.s1); }
        }, at);
        at += r === 0 ? 1100 : 520;
      });
      later(finish, at - 380);
    };

    approve.addEventListener("click", function () {
      if (approve.disabled || mx.classList.contains("is-approved")) return;
      mx.classList.add("is-approved");
      approve.textContent = T.approveDone;
      approve.disabled = true;
      say(T.approved);
      if (!reduce) {
        var leap = doc.createElement("div");
        leap.className = "leap";
        body.appendChild(leap);
        window.setTimeout(function () { leap.remove(); }, 1200);
      }
      track("home_approve_click", { lang: lang });
    });

    replay.addEventListener("click", function () { play(); track("home_matrix_replay", { lang: lang }); });

    // Paint the finished run first so nothing depends on the animation; replay it once when visible.
    showFinal();
    if (!reduce && "IntersectionObserver" in window) {
      var once = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        once.disconnect();
        play();
      }, { threshold: 0.35 });
      once.observe(mx);
    }
  }

  /* ---------- Evidence: popovers + evidence mode ---------- */
  var pop = doc.querySelector("[data-pop]");
  var popType = pop && pop.querySelector("[data-pop-type]");
  var popBody = pop && pop.querySelector("[data-pop-body]");
  var popOpener = null;

  function closePop(returnFocus) {
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    if (returnFocus && popOpener) popOpener.focus();
    popOpener = null;
  }

  function openPop(marker) {
    var note = doc.getElementById("ev-" + marker.getAttribute("data-ev"));
    if (!pop || !note) return;
    var type = note.querySelector("em");
    var text = note.querySelector("p");
    popType.textContent = marker.getAttribute("data-ev") + " · " + (type ? type.textContent : "");
    popBody.innerHTML = text ? "<p>" + text.innerHTML + "</p>" : "";
    pop.hidden = false;
    var rect = marker.getBoundingClientRect();
    var width = pop.offsetWidth;
    var left = Math.min(Math.max(12, rect.left - 24), root.clientWidth - width - 12);
    var top = rect.bottom + 10;
    if (top + pop.offsetHeight > window.innerHeight - 12 && rect.top - pop.offsetHeight - 10 > 72) top = rect.top - pop.offsetHeight - 10;
    pop.style.left = left + window.scrollX + "px";
    pop.style.top = top + window.scrollY + "px";
    popOpener = marker;
    track("home_evidence_open", { id: marker.getAttribute("data-ev"), lang: lang });
  }

  doc.addEventListener("click", function (event) {
    var target = event.target;
    var marker = target.closest && target.closest(".ev");
    if (marker) {
      event.preventDefault();
      if (popOpener === marker) closePop(false); else openPop(marker);
      return;
    }
    if (target.closest && (target.closest("[data-pop-x]") || target.closest("[data-pop-all]"))) { closePop(false); return; }
    if (pop && !pop.hidden && !pop.contains(target)) closePop(false);

    var tracked = target.closest && target.closest("[data-track]");
    if (tracked) track("home_cta_click", { cta: tracked.getAttribute("data-track"), lang: lang });
  });
  doc.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    closePop(true);
    setMenu(false);
  });

  var evBar = doc.querySelector("[data-evbar]");
  each(doc.querySelectorAll("[data-ev-toggle]"), function (button) {
    button.addEventListener("click", function () {
      var on = !body.classList.contains("ev-on");
      body.classList.toggle("ev-on", on);
      each(doc.querySelectorAll(".hd__ev"), function (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (evBar) evBar.hidden = !on;
      track("home_evidence_mode", { on: on, lang: lang });
    });
  });

  /* ---------- Contact form (same payload as the shared /api/cta contract) ---------- */
  var form = doc.querySelector("[data-form]");
  if (form) {
    var note = form.querySelector("[data-form-status]");
    var submit = form.querySelector("button[type='submit']");
    var submitLabel = submit.innerHTML;

    var setStatus = function (type, message) {
      note.textContent = message;
      note.classList.remove("is-error", "is-success");
      if (type) note.classList.add("is-" + type);
    };

    var endpoint = function () {
      if (typeof window.FRONTIS_CTA_ENDPOINT === "string" && window.FRONTIS_CTA_ENDPOINT) return window.FRONTIS_CTA_ENDPOINT.trim();
      var meta = doc.querySelector('meta[name="frontis-cta-endpoint"]');
      if (meta && meta.content) return meta.content.trim();
      var host = window.location.hostname;
      if (!/^https?:$/.test(window.location.protocol)) return "";
      if (/\.github\.io$/i.test(host) || /claude/i.test(host)) return "";
      return "/api/cta";
    };

    var utm = function () {
      var out = {};
      try {
        var params = new URLSearchParams(window.location.search);
        ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
          if (params.get(key)) out[key] = params.get(key);
        });
      } catch (error) { /* ignore */ }
      return out;
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var value = function (key) { return (data.get(key) || "").toString().trim(); };
      var stack = value("stack");
      var payload = {
        name: value("name"),
        company: value("company"),
        phone: value("phone"),
        email: value("email"),
        interest: value("interest") || "ma",
        message: (stack ? "[" + T.stack + "] " + stack + "\n" : "") + value("message"),
        website: value("website"),
        sourcePage: window.location.href,
        pageTitle: doc.title,
        submittedAt: new Date().toISOString(),
        referrer: doc.referrer || "",
        tracking: utm(),
      };

      if (!payload.name || !payload.company || (!payload.email && !payload.phone)) { setStatus("error", T.formMissing); return; }
      if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) { setStatus("error", T.formEmail); return; }

      var url = endpoint();
      if (!url) { setStatus("error", T.formNoEndpoint); return; }

      submit.disabled = true;
      submit.textContent = T.formSending;
      setStatus("", T.formPending);
      track("frontis_cta_submit", { interest: payload.interest, lang: lang });

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      }).then(function (response) {
        var isJson = (response.headers.get("content-type") || "").indexOf("application/json") >= 0;
        return (isJson ? response.json().catch(function () { return {}; }) : Promise.resolve({})).then(function (result) {
          if (!response.ok || result.ok === false) throw { user: lang === "zh" && result.message ? result.message : T.formFail };
          form.reset();
          setStatus("success", T.formDone);
          track("generate_lead", { method: "website_cta", interest: payload.interest, lang: lang });
        });
      }).catch(function (error) {
        setStatus("error", error && error.user ? error.user : T.formFail);
        track("frontis_cta_submit_error", { interest: payload.interest, lang: lang });
      }).then(function () {
        submit.disabled = false;
        submit.innerHTML = submitLabel;
      });
    });
  }
})();
