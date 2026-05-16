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

  function isCurrent(href) {
    return href === pageHref || (page === "index" && href === "./index.html");
  }

  function ctaHref() {
    if (page === "index") return "#contact";
    if (page === "horizon" || page === "technology") return "#cta";
    if (page === "scene") return "#cta-section";
    if (page === "ecosystem") return "#apply";
    if (page === "about") return "#contact";
    if (page === "scene-strategy") return "./scene-strategy.html#contact";
    return "./index.html#contact";
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
      '<a class="site-header__cta" href="' + ctaHref() + '">开启跃迁</a>' +
      "</div>" +
      "</header>";
  }

  function footerLink(href, label) {
    return '<a href="' + href + '"' + (isCurrent(href) ? ' class="is-active" aria-current="page"' : "") + ">" + label + "</a>";
  }

  function renderFooter() {
    return '<footer class="site-footer" role="contentinfo">' +
      '<div class="site-footer__grid">' +
      '<div class="site-footer__brand">' +
      '<a href="./index.html" aria-label="返回首页"><img src="./assets/logo-dark.svg" alt="FRONTIS 衔远科技" /></a>' +
      '<div class="site-footer__email">partner@frontis.cn</div>' +
      "</div>" +
      '<div><div class="site-footer__title">产品</div><div class="site-footer__links">' +
      footerLink("./horizon.html", "衔远大观") +
      footerLink("./leadeep.html", "Leadeep AI") +
      "</div></div>" +
      '<div><div class="site-footer__title">场景</div><div class="site-footer__links">' +
      footerLink("./scene.html", "场景总览") +
      footerLink("./scene-strategy.html", "战略管理专家团") +
      footerLink("./scene-supply.html", "供应链") +
      footerLink("./scene-sales.html", "销售") +
      footerLink("./scene-ops.html", "运营") +
      footerLink("./scene-research.html", "研发") +
      "</div></div>" +
      '<div><div class="site-footer__title">公司</div><div class="site-footer__links">' +
      footerLink("./about.html", "关于衔远") +
      footerLink("./technology.html", "技术") +
      footerLink("./ecosystem.html", "生态") +
      "</div></div>" +
      '<div><div class="site-footer__title">联系</div><div class="site-footer__contact">' +
      '<a href="mailto:cooperation@frontis.cn">商务合作</a>' +
      '<a href="mailto:marketing@frontis.cn">市场合作</a>' +
      '<a href="mailto:hr@frontis.cn">人才招聘</a>' +
      "</div></div>" +
      "</div>" +
      '<div class="site-footer__bottom">' +
      "<span>© 2026 衔远科技 FRONTIS AI</span>" +
      '<a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">京ICP备2022014486号-1</a>' +
      "</div>" +
      "</footer>";
  }

  function renderSharedCta(target) {
    var id = target && target.id ? target.id : "contact";
    var labelId = id + "-heading";

    return '<section id="' + id + '" class="site-cta" aria-labelledby="' + labelId + '">' +
      '<div class="site-cta__inner">' +
      '<div class="site-cta__header">' +
      '<div class="site-cta__headline">' +
      '<span class="site-cta__kicker">开启跃迁</span>' +
      '<h2 id="' + labelId + '" class="site-cta__title">即刻开启智能跃迁</h2>' +
      '</div>' +
      '<p class="site-cta__copy">从一个高价值业务场景开始，把 ME、WE、MA 带入真实组织现场，确认最先落地、可复用、可持续进化的 AI 原生路径。</p>' +
      '</div>' +
      '<div class="site-cta__grid site-cta__grid--form">' +
      '<form class="site-cta__form" data-site-cta-form novalidate>' +
      '<div class="site-cta__form-head"><strong>预约沟通</strong><span>我们会确认场景、试点路径与下一步安排。</span></div>' +
      '<div class="site-cta__fields">' +
      '<label><span>姓名</span><input name="name" autocomplete="name" placeholder="请输入姓名" required></label>' +
      '<label><span>公司</span><input name="company" autocomplete="organization" placeholder="请输入公司名称" required></label>' +
      '<label><span>手机</span><input name="phone" autocomplete="tel" inputmode="tel" placeholder="请输入手机号码" required></label>' +
      '<label><span>邮箱</span><input name="email" type="email" autocomplete="email" inputmode="email" spellcheck="false" placeholder="请输入邮箱地址"></label>' +
      '</div>' +
      '<fieldset class="site-cta__radios">' +
      '<legend>优先沟通方向</legend>' +
      '<label><input type="radio" name="interest" value="trial" checked><span>企业试用 / 产品演示</span></label>' +
      '<label><input type="radio" name="interest" value="private"><span>私有化 / 行业场景</span></label>' +
      '<label><input type="radio" name="interest" value="strategy"><span>战略诊断 / ROI 评估</span></label>' +
      '</fieldset>' +
      '<label class="site-cta__message"><span>留言</span><textarea name="message" autocomplete="off" placeholder="可以描述行业、关键场景、当前 AI 试点阶段或希望优先解决的问题。"></textarea></label>' +
      '<button class="site-cta__submit" type="submit">提交并预约沟通</button>' +
      '<p class="site-cta__note">演示预约通常在 1 个工作日内完成，支持私有化部署方案评估。</p>' +
      '</form>' +
      '</div>' +
      '</div>' +
      '</section>';
  }

  var headerTarget = document.querySelector("[data-site-header]");
  if (headerTarget) {
    headerTarget.outerHTML = renderHeader();
  }

  var footerTarget = document.querySelector("[data-site-footer]");
  if (footerTarget) {
    footerTarget.outerHTML = renderFooter();
  }

  document.querySelectorAll("[data-site-cta]").forEach(function (target) {
    target.outerHTML = renderSharedCta(target);
  });

  document.querySelectorAll("[data-site-cta-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var button = form.querySelector(".site-cta__submit");
      if (!button) return;
      button.textContent = "已提交，我们会尽快联系你";
      button.disabled = true;
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
