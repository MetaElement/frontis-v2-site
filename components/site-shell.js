(function () {
  "use strict";

  var page = (window.location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  if (!page) page = "index";

  var navItems = [
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
    { key: "ecosystem", label: "生态合作", href: "./ecosystem.html" },
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
    if (page === "ecosystem") return "./ecosystem.html#apply";
    if (page === "about") return "./about.html#contact";
    if (page === "technology") return "./technology.html#cta";
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
      footerLink("./ecosystem.html", "生态合作") +
      "</div></div>" +
      '<div><div class="site-footer__title">联系</div><div class="site-footer__contact">' +
      '<a href="mailto:cooperation@frontis.cn">商务合作</a>' +
      '<a href="mailto:marketing@frontis.cn">市场合作</a>' +
      '<a href="mailto:hr@frontis.cn">人才招聘</a>' +
      "</div></div>" +
      "</div>" +
      '<div class="site-footer__bottom">' +
      "<span>© 2024 Frontis AI 衔远科技</span>" +
      '<a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">京ICP备2022014486号-1</a>' +
      "</div>" +
      "</footer>";
  }

  var headerTarget = document.querySelector("[data-site-header]");
  if (headerTarget) {
    headerTarget.outerHTML = renderHeader();
  }

  var footerTarget = document.querySelector("[data-site-footer]");
  if (footerTarget) {
    footerTarget.outerHTML = renderFooter();
  }

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
