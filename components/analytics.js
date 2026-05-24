(function () {
  "use strict";

  var options = window.FRONTIS_ANALYTICS_OPTIONS || {};
  var maxParamLength = 180;
  var directGaReady = false;

  function trim(value) {
    return String(value || "").trim();
  }

  function readMeasurementId() {
    var script = document.currentScript;
    var meta = document.querySelector('meta[name="frontis-ga-measurement-id"]');
    return trim(window.FRONTIS_GA_MEASUREMENT_ID) ||
      trim(meta && meta.content) ||
      trim(script && script.getAttribute("data-ga-measurement-id"));
  }

  function isLocalhost() {
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(window.location.hostname);
  }

  function isValidMeasurementId(value) {
    return /^G-[A-Z0-9]+$/i.test(value);
  }

  function sanitizeValue(value) {
    if (value === null || typeof value === "undefined") return "";
    if (typeof value === "number" || typeof value === "boolean") return value;
    return trim(value).slice(0, maxParamLength);
  }

  function normalizeParams(params) {
    var normalized = {
      page_path: window.location.pathname,
      page_title: document.title,
    };

    Object.keys(params || {}).forEach(function (key) {
      if (!/^[a-zA-Z0-9_]+$/.test(key)) return;
      var value = sanitizeValue(params[key]);
      if (value === "") return;
      normalized[key] = value;
    });

    return normalized;
  }

  window.dataLayer = window.dataLayer || [];

  function noopTrack() {}

  if (options.enabled === false) {
    window.frontisTrack = window.frontisTrack || noopTrack;
    return;
  }

  function setupDirectGa4() {
    var measurementId = readMeasurementId();
    if (options.enableDirectGa4 !== true || !measurementId || !isValidMeasurementId(measurementId)) return;
    if (options.disableDirectGa4OnLocalhost !== false && isLocalhost()) return;

    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search,
      send_page_view: options.sendPageView !== false,
      debug_mode: options.debug === true,
    });

    var googleTag = document.createElement("script");
    googleTag.async = true;
    googleTag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
    document.head.appendChild(googleTag);
    directGaReady = true;
  }

  function trackEvent(eventName, params) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(eventName || "")) return;
    var normalized = normalizeParams(params);
    var dataLayerEvent = Object.assign({ event: eventName }, normalized);
    window.dataLayer.push(dataLayerEvent);

    if (directGaReady && typeof window.gtag === "function") {
      window.gtag("event", eventName, normalized);
    }
  }

  function linkText(link) {
    return trim(link.getAttribute("aria-label") || link.textContent || link.href).replace(/\s+/g, " ");
  }

  function linkArea(link) {
    if (link.closest(".site-header")) return "header";
    if (link.closest(".site-footer")) return "footer";
    if (link.closest(".site-cta")) return "cta";
    return "body";
  }

  function linkUrl(link) {
    try {
      return new URL(link.getAttribute("href"), window.location.href);
    } catch (error) {
      return null;
    }
  }

  function bindClickTracking() {
    document.addEventListener("click", function (event) {
      var link = event.target && event.target.closest ? event.target.closest("a") : null;
      if (!link) return;

      var href = link.getAttribute("href") || "";
      var url = linkUrl(link);
      var area = linkArea(link);
      var text = linkText(link);

      if (link.hasAttribute("data-leap-cta") || /ai\.frontis\.cn\/login/i.test(href)) {
        trackEvent("frontis_cta_click", {
          cta_location: area,
          link_text: text,
          link_url: href,
        });
        return;
      }

      if (/^mailto:/i.test(href)) {
        trackEvent("contact_click", {
          contact_method: "email",
          cta_location: area,
          link_text: text,
        });
        return;
      }

      if (url && url.origin !== window.location.origin && /^https?:$/i.test(url.protocol)) {
        trackEvent("outbound_click", {
          cta_location: area,
          link_domain: url.hostname,
          link_url: url.href,
          link_text: text,
        });
        return;
      }

      if (area === "header" || area === "footer") {
        trackEvent("navigation_click", {
          navigation_area: area,
          link_text: text,
          link_url: href,
        });
      }
    }, true);
  }

  setupDirectGa4();
  window.frontisTrack = trackEvent;

  document.addEventListener("frontis:analytics", function (event) {
    var detail = event.detail || {};
    trackEvent(detail.eventName, detail.params);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindClickTracking);
  } else {
    bindClickTracking();
  }
})();
