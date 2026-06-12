(function () {
  "use strict";

  var page = (window.location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  if (!page) page = "index";

  var navItems = [
    { key: "index", label: "首页", href: "./index.html" },
    {
      key: "products",
      label: "产品",
      href: "./horizon.html",
    },
    {
      key: "scenes",
      label: "场景",
      href: "./scene.html",
    },
    { key: "technology", label: "技术", href: "./technology.html" },
    { key: "ecosystem", label: "生态", href: "./ecosystem.html" },
    { key: "about", label: "关于衔远", href: "./about.html" },
  ];

  var groups = {
    index: "index",
    horizon: "products",
    leadeep: "products",
    scene: "scenes",
    "scene-strategy": "scenes",
    "scene-supply": "scenes",
    "scene-sales": "scenes",
    "scene-ops": "scenes",
    "scene-research": "scenes",
    technology: "technology",
    ecosystem: "ecosystem",
    about: "about",
  };

  var pageHref = page === "index" ? "./index.html" : "./" + page + ".html";
  var activeGroup = groups[page] || "";
  var productLoginHref = "https://ai.frontis.cn/login";

  function isCurrent(href) {
    return href === pageHref || (page === "index" && href === "./index.html");
  }

  function ctaHref() {
    return productLoginHref;
  }

  function renderNavItem(item) {
    var active = activeGroup === item.key ? " is-active" : "";

    return '<div class="site-header__item' + active + '">' +
      '<a class="site-header__link" href="' + item.href + '"' + (isCurrent(item.href) ? ' aria-current="page"' : "") + ">" +
      item.label + "</a>" +
      "</div>";
  }

  function renderHeader() {
    return '<header id="navbar" class="site-header" role="banner">' +
      '<a class="site-header__logo" href="./index.html" aria-label="返回首页">' +
      '<img src="./assets/logo-light.svg" alt="FRONTIS 衔远科技" />' +
      "</a>" +
      '<div class="site-header__right">' +
      '<div class="site-header__menu" role="navigation" aria-label="主导航">' +
      navItems.map(renderNavItem).join("") +
      "</div>" +
      '<a class="site-header__cta" href="' + ctaHref() + '" data-leap-cta data-hover="即刻体验"><span class="leap-cta__label">开启跃迁</span></a>' +
      '<button class="site-header__toggle" type="button" aria-expanded="false" aria-controls="site-mobile-menu">' +
      '<span class="site-header__toggle-text">目录</span>' +
      '<span class="site-header__toggle-icon" aria-hidden="true"><span></span><span></span></span>' +
      "</button>" +
      "</div>" +
      '<div id="site-mobile-menu" class="site-header__mobile-panel" hidden>' +
      '<div class="site-header__mobile-menu" role="navigation" aria-label="移动端主导航">' +
      navItems.map(renderNavItem).join("") +
      '<a class="site-header__mobile-cta" href="' + ctaHref() + '">开启跃迁</a>' +
      "</div>" +
      "</div>" +
      "</header>";
  }

  function footerLink(href, label) {
    return '<a href="' + href + '"' + (isCurrent(href) ? ' class="is-active" aria-current="page"' : "") + ">" + label + "</a>";
  }

  function footerStatic(label) {
    return '<span class="site-footer__link-static" aria-disabled="true">' + label + "</span>";
  }

  function escapeAttr(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function trackSiteEvent(eventName, params) {
    var payload = Object.assign({
      page_path: window.location.pathname,
      page_title: document.title,
    }, params || {});

    if (typeof window.frontisTrack === "function") {
      window.frontisTrack(eventName, payload);
      return;
    }

    if (typeof window.CustomEvent === "function") {
      document.dispatchEvent(new CustomEvent("frontis:analytics", {
        detail: {
          eventName: eventName,
          params: payload,
        },
      }));
    }
  }

  function renderFooter() {
    return '<footer class="site-footer" role="contentinfo">' +
      '<div class="site-footer__grid">' +
      '<div class="site-footer__brand">' +
      '<a href="./index.html" aria-label="返回首页"><img src="./assets/logo-dark.svg" alt="FRONTIS 衔远科技" /></a>' +
      '<p class="site-footer__tagline">让组织从 +AI 工具跃迁到 AI 原生，每一次任务都沉淀为组织能力。</p>' +
      '<div class="site-footer__email">xianyuan@frontis.ai</div>' +
      "</div>" +
      '<div><div class="site-footer__title">产品</div><div class="site-footer__links">' +
      footerLink("./horizon.html", "衔远大观") +
      "</div>" +
      '<div class="site-footer__subgroup"><div class="site-footer__title">技术</div><div class="site-footer__links">' +
      footerLink("./technology.html", "技术架构") +
      "</div></div></div>" +
      '<div><div class="site-footer__title">场景</div><div class="site-footer__links">' +
      footerLink("./scene.html", "场景总览") +
      footerLink("./scene-strategy.html", "战略管理") +
      footerStatic("生产研发") +
      footerStatic("供应链运营") +
      footerStatic("营销增长") +
      "</div></div>" +
      '<div><div class="site-footer__title">公司</div><div class="site-footer__links">' +
      footerLink("./about.html", "关于衔远") +
      footerLink("./ecosystem.html", "生态") +
      "</div></div>" +
      '<div><div class="site-footer__title">联系</div><div class="site-footer__contact">' +
      '<a href="mailto:xianyuan@frontis.ai">商务合作</a>' +
      '<a href="mailto:sunlei@frontis.cn">生态合作</a>' +
      '<a href="mailto:hr-public@frontis.cn">人才招聘</a>' +
      "</div></div>" +
      "</div>" +
      '<div class="site-footer__bottom">' +
      "<span>© 2026 衔远科技 FRONTIS AI</span>" +
      '<div class="site-footer__records">' +
      '<a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">京ICP备2022014486号-1</a>' +
      '<a class="site-footer__police-record" href="https://beian.mps.gov.cn/#/query/webSearch?code=11010802042925" target="_blank" rel="noopener">' +
      '<img src="./assets/beian-police.png" alt="" aria-hidden="true" decoding="async">' +
      "<span>京公网安备11010802042925号</span>" +
      "</a>" +
      "</div>" +
      "</div>" +
      "</footer>";
  }

  function renderSharedCta(target) {
    var id = target && target.id ? target.id : "contact";
    var labelId = id + "-heading";
    var targetEndpoint = target && target.getAttribute ? target.getAttribute("data-cta-endpoint") : "";
    var endpointAttr = targetEndpoint ? ' data-cta-endpoint="' + escapeAttr(targetEndpoint) + '"' : "";

    return '<section id="' + id + '" class="site-cta" aria-labelledby="' + labelId + '">' +
      '<div class="site-cta__inner">' +
      '<div class="site-cta__header">' +
      '<div class="site-cta__headline">' +
      '<span class="site-cta__kicker">联系我们 CONTACT FRONTIS</span>' +
      '<h2 id="' + labelId + '" class="site-cta__title">即刻开启智能跃迁</h2>' +
      '</div>' +
      '<p class="site-cta__copy">申请产品体验，率先迈入AI原生时代</p>' +
      '</div>' +
      '<div class="site-cta__grid site-cta__grid--form">' +
      '<form class="site-cta__form" data-site-cta-form' + endpointAttr + ' novalidate>' +
      '<div class="site-cta__form-head"><strong>申请产品演示</strong><span>我们会确认场景、试点路径与下一步安排。</span></div>' +
      '<div class="site-cta__fields">' +
      '<label><span>姓名</span><input name="name" autocomplete="name" placeholder="请输入您的姓名" required></label>' +
      '<label><span>公司</span><input name="company" autocomplete="organization" placeholder="请输入公司名称" required></label>' +
      '<label><span>手机</span><input name="phone" autocomplete="tel" inputmode="tel" placeholder="请输入手机号码" required></label>' +
      '<label><span>邮箱</span><input name="email" type="email" autocomplete="email" inputmode="email" spellcheck="false" placeholder="请输入邮箱地址"></label>' +
      '</div>' +
      '<fieldset class="site-cta__radios">' +
      '<legend>我更感兴趣：</legend>' +
      '<label><input type="radio" name="interest" value="horizon" checked><span>Frontis Horizon（企业级）</span></label>' +
      '<label><input type="radio" name="interest" value="leadeep"><span>Leadeep AI（个人 / 老板）</span></label>' +
      '<label><input type="radio" name="interest" value="ecosystem"><span>城市生态合作</span></label>' +
      '<label><input type="radio" name="interest" value="other"><span>其他</span></label>' +
      '</fieldset>' +
      '<label class="site-cta__trap" aria-hidden="true" tabindex="-1"><span>Website</span><input name="website" autocomplete="off" tabindex="-1"></label>' +
      '<label class="site-cta__message"><span>留言</span><textarea name="message" autocomplete="off" placeholder="请描述您的需求或问题（选填）"></textarea></label>' +
      '<button class="site-cta__submit" type="submit">立即提交</button>' +
      '<p class="site-cta__note" data-site-cta-status role="status" aria-live="polite">我们会在 1 个工作日内联系你，确认演示时间与试点路径。</p>' +
      '</form>' +
      '<aside class="site-cta__contact" aria-label="联系我们">' +
      '<div class="site-cta__contact-title">联系我们</div>' +
      '<div class="site-cta__contact-item"><span>商务合作</span><a href="mailto:xianyuan@frontis.ai">xianyuan@frontis.ai</a></div>' +
      '<div class="site-cta__contact-divider"></div>' +
      '<div class="site-cta__contact-item"><span>生态合作</span><a href="mailto:sunlei@frontis.cn">sunlei@frontis.cn</a></div>' +
      '<div class="site-cta__contact-divider"></div>' +
      '<div class="site-cta__contact-item"><span>人才招聘</span><a href="mailto:hr-public@frontis.cn">hr-public@frontis.cn</a></div>' +
      '</aside>' +
      '</div>' +
      '</div>' +
      '</section>';
  }

  function isStaticHostedPage() {
    return window.location.hostname === "metaelement.github.io" || /\.github\.io$/i.test(window.location.hostname);
  }

  function getCtaEndpoint(form) {
    var formEndpoint = form && form.getAttribute ? form.getAttribute("data-cta-endpoint") : "";
    if (formEndpoint) return formEndpoint.trim();

    if (window.FRONTIS_CTA_ENDPOINT && typeof window.FRONTIS_CTA_ENDPOINT === "string") {
      return window.FRONTIS_CTA_ENDPOINT.trim();
    }

    var endpointMeta = document.querySelector('meta[name="frontis-cta-endpoint"]');
    if (endpointMeta && endpointMeta.content) return endpointMeta.content.trim();

    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      if (isStaticHostedPage()) return "";
      return "/api/cta";
    }

    return "";
  }

  function setCtaStatus(form, type, message) {
    var status = form.querySelector("[data-site-cta-status]");
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-success", "is-error", "is-pending");
    if (type) status.classList.add("is-" + type);
  }

  function normalizeCtaForm(form) {
    var data = new FormData(form);
    return {
      name: (data.get("name") || "").toString().trim(),
      company: (data.get("company") || "").toString().trim(),
      phone: (data.get("phone") || "").toString().trim(),
      email: (data.get("email") || "").toString().trim(),
      interest: (data.get("interest") || "").toString().trim(),
      message: (data.get("message") || "").toString().trim(),
      website: (data.get("website") || "").toString().trim(),
      sourcePage: window.location.href || pageHref,
      pageTitle: document.title,
      submittedAt: new Date().toISOString(),
      referrer: document.referrer || "",
      tracking: getCtaTracking(),
    };
  }

  function getCtaTracking() {
    var tracking = {};
    try {
      var params = new URLSearchParams(window.location.search);
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
        var value = params.get(key);
        if (value) tracking[key] = value;
      });
    } catch (error) {
      return tracking;
    }
    return tracking;
  }

  function validateCtaPayload(payload) {
    if (!payload.name || !payload.company || !payload.phone) {
      return "请补充姓名、公司和手机号码。";
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return "请填写有效的邮箱地址，或暂时留空。";
    }

    return "";
  }

  var headerTarget = document.querySelector("[data-site-header]");
  if (headerTarget) {
    headerTarget.outerHTML = renderHeader();
  }

  var header = document.querySelector(".site-header");
  var menuToggle = document.querySelector(".site-header__toggle");
  var mobilePanel = document.querySelector(".site-header__mobile-panel");

  function setMobileMenu(open) {
    if (!header || !menuToggle || !mobilePanel) return;
    header.classList.toggle("is-menu-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    mobilePanel.hidden = !open;
  }

  if (menuToggle && mobilePanel) {
    menuToggle.addEventListener("click", function () {
      setMobileMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    mobilePanel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMobileMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMobileMenu(false);
    });

    document.addEventListener("click", function (event) {
      if (!header || !header.classList.contains("is-menu-open")) return;
      if (header.contains(event.target)) return;
      setMobileMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 768) setMobileMenu(false);
    });
  }

  var footerTarget = document.querySelector("[data-site-footer]");
  if (footerTarget) {
    footerTarget.outerHTML = renderFooter();
  }

  document.querySelectorAll("[data-site-cta]").forEach(function (target) {
    target.outerHTML = renderSharedCta(target);
  });

  document.querySelectorAll("[data-site-cta-form]").forEach(function (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var button = form.querySelector(".site-cta__submit");
      if (!button) return;

      var originalText = button.getAttribute("data-original-text") || button.textContent;
      button.setAttribute("data-original-text", originalText);

      var payload = normalizeCtaForm(form);
      var validationMessage = validateCtaPayload(payload);
      if (validationMessage) {
        trackSiteEvent("frontis_cta_validation_error", {
          interest: payload.interest || "unknown",
          error_type: validationMessage.indexOf("邮箱") >= 0 ? "invalid_email" : "missing_required",
        });
        setCtaStatus(form, "error", validationMessage);
        return;
      }

      var endpoint = getCtaEndpoint(form);
      if (!endpoint) {
        trackSiteEvent("frontis_cta_submit_error", {
          interest: payload.interest || "unknown",
          error_type: "missing_endpoint",
        });
        setCtaStatus(form, "error", "当前页面尚未配置提交服务。请部署 API 后配置 frontis-cta-endpoint。");
        return;
      }

      trackSiteEvent("frontis_cta_submit", {
        interest: payload.interest || "unknown",
      });
      button.textContent = "正在提交...";
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      setCtaStatus(form, "pending", "正在提交预约信息，请稍候。");

      try {
        var response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        var responseType = response.headers.get("content-type") || "";
        var result = responseType.indexOf("application/json") >= 0 ? await response.json().catch(function () {
          return {};
        }) : {};

        if (!response.ok || result.ok === false) {
          var fallbackMessage = response.status === 404 && endpoint === "/api/cta" ?
            "提交服务尚未部署：当前站点没有 /api/cta，请配置 frontis-cta-endpoint。" :
            "提交失败，请稍后重试。";
          throw new Error(result.message || fallbackMessage);
        }

        form.reset();
        button.textContent = "已提交，我们会尽快联系你";
        setCtaStatus(form, "success", "预约信息已发送，我们会在 1 个工作日内联系你。");
        trackSiteEvent("generate_lead", {
          method: "website_cta",
          interest: payload.interest || "unknown",
        });
      } catch (error) {
        button.textContent = originalText;
        button.disabled = false;
        setCtaStatus(form, "error", error && error.message ? error.message : "提交失败，请稍后重试。");
        trackSiteEvent("frontis_cta_submit_error", {
          interest: payload.interest || "unknown",
          error_type: "submit_failed",
        });
      } finally {
        button.removeAttribute("aria-busy");
      }
    });
  });

  document.querySelectorAll(".site-header__item").forEach(function (item) {
    item.addEventListener("keydown", function (event) {
      if (event.key === "Escape") item.classList.remove("is-open");
    });
  });

  window.addEventListener("scroll", function () {
    var header = document.getElementById("navbar");
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });
})();
