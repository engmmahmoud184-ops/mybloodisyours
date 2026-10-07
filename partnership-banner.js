(function () {
  "use strict";

  function normalizeRegion(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z\u0600-\u06ff]/g, "");
  }

  function isBekaaRegion(value) {
    const normalized = normalizeRegion(value);

    return (
      normalized === "albekaa" ||
      normalized === "bekaa" ||
      normalized === "البقاع"
    );
  }

  function createBanner() {
    const existing = document.querySelector(
      "[data-bekaa-partnership]"
    );

    if (existing) {
      return existing;
    }

    const banner = document.createElement("aside");
    banner.className = "bekaa-partnership-banner";
    banner.setAttribute("data-bekaa-partnership", "");
    banner.setAttribute("role", "note");
    banner.setAttribute(
      "aria-label",
      "My Blood Is Yours and Bekaa Hospital partnership"
    );
    banner.hidden = true;

    banner.innerHTML = `
      <div class="bekaa-banner-brands" aria-hidden="true">
        <img src="assets/bekaa-hospital-logo.webp" alt="">
        <span>×</span>
        <img src="assets/logo.png" alt="">
      </div>

      <div class="bekaa-banner-copy">
        <span class="bekaa-banner-kicker">
          Bekaa Health Partnership · شراكة صحية في البقاع
        </span>
        <strong dir="rtl">
          شراكة لخدمة جميع بلدات وقرى البقاع
        </strong>
        <p dir="rtl">
          دمنا واحد × مستشفى البقاع — لتوسيع قاعدة المتبرعين وتعزيز ثقافة التبرع بالدم.
        </p>
      </div>

      <div class="bekaa-banner-gold">
        <span aria-hidden="true">★</span>
        <strong dir="rtl">الراعي الذهبي</strong>
        <small>Gold Sponsor</small>
      </div>
    `;

    const anchor =
      document.querySelector(".v3-section-head") ||
      document.querySelector(".hero-card");

    if (anchor) {
      anchor.insertAdjacentElement("afterend", banner);
    } else {
      const main = document.querySelector("main");
      if (main) {
        main.prepend(banner);
      }
    }

    return banner;
  }

  function updateBekaaPartnershipBanner(regionValue) {
    const banner = createBanner();
    banner.hidden = !isBekaaRegion(regionValue);
  }

  function getInitialRegion() {
    const params = new URLSearchParams(window.location.search);
    const queryRegion = params.get("region");

    if (queryRegion) {
      return queryRegion;
    }

    const page = window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

    if (
      page === "albekaa.html" ||
      page === "menu.htm" ||
      page === "search.html" ||
      page === "results.html"
    ) {
      return "AlBekaa";
    }

    return "";
  }

  window.updateBekaaPartnershipBanner =
    updateBekaaPartnershipBanner;

  document.addEventListener("DOMContentLoaded", () => {
    updateBekaaPartnershipBanner(getInitialRegion());
  });
})();
