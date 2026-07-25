(function () {
  "use strict";

  const CONTRIBUTORS_PATH = "/Contributors.json";

  function getValue(item, names, fallback = "") {
    for (const name of names) {
      if (
        item &&
        Object.prototype.hasOwnProperty.call(item, name) &&
        item[name] !== undefined &&
        item[name] !== null &&
        String(item[name]).trim() !== ""
      ) {
        return item[name];
      }
    }

    return fallback;
  }

  function toBoolean(value, fallback = true) {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }

    return (
      value === true ||
      value === 1 ||
      String(value).trim().toLowerCase() === "true"
    );
  }

  function normalizeContributor(id, item) {
    return {
      id,

      CompanyName: String(getValue(item, [
        "CompanyName",
        "companyName",
        "Name",
        "name"
      ], "Golden Contributor")).trim(),

      CompanyNameAr: String(getValue(item, [
        "CompanyNameAr",
        "companyNameAr",
        "NameAr",
        "nameAr"
      ])).trim(),

      Tier: String(getValue(item, [
        "Tier",
        "tier"
      ])).trim().toUpperCase(),

      IsActive: toBoolean(getValue(item, [
        "IsActive",
        "isActive",
        "Active",
        "active"
      ], true), true),

      DisplayOrder: Number(getValue(item, [
        "DisplayOrder",
        "displayOrder",
        "Order",
        "order"
      ], 9999)),

      WebsiteUrl: String(getValue(item, [
        "WebsiteUrl",
        "websiteUrl",
        "Website",
        "website",
        "Link",
        "link"
      ])).trim(),

      LogoUrl: String(getValue(item, [
        "LogoUrl",
        "logoUrl",
        "LogoURL",
        "LogoData",
        "logoData",
        "ImageUrl",
        "imageUrl",
        "ImageLink",
        "ImageSrc"
      ])).trim()
    };
  }

  async function loadGoldenContributors() {
    const url =
      MyBloodApp.FIREBASE_URL +
      CONTRIBUTORS_PATH +
      "?t=" +
      Date.now();

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(
        "Firebase returned HTTP " + response.status
      );
    }

    const data = await response.json();

    if (!data || typeof data !== "object") {
      return [];
    }

    const contributors = Object.entries(data)
      .map(([id, item]) =>
        normalizeContributor(id, item)
      )
      .filter(item => (
        item.Tier === "GOLD" &&
        item.IsActive === true &&
        Boolean(item.LogoUrl)
      ))
      .sort((first, second) => {
        if (first.DisplayOrder !== second.DisplayOrder) {
          return first.DisplayOrder - second.DisplayOrder;
        }

        return first.CompanyName.localeCompare(
          second.CompanyName
        );
      });

    console.info(
      "Active GOLD contributors shown on homepage:",
      contributors
    );

    return contributors;
  }

  function createCard(item, isClone = false) {
    const card = item.WebsiteUrl
      ? document.createElement("a")
      : document.createElement("article");

    card.className =
      "homepage-gold-contributor-card";

    if (item.WebsiteUrl) {
      card.href = item.WebsiteUrl;
      card.target = "_blank";
      card.rel = "noopener";
    }

    if (isClone) {
      card.setAttribute("aria-hidden", "true");
      card.tabIndex = -1;
    }

    const logoBox =
      document.createElement("div");

    logoBox.className =
      "homepage-gold-logo";

    const image =
      document.createElement("img");

    image.src = item.LogoUrl;
    image.alt = isClone ? "" : item.CompanyName;
    image.loading = "eager";
    image.decoding = "async";

    image.onload = () => {
      card.classList.add("logo-loaded");
    };

    image.onerror = () => {
      console.error(
        "Unable to display logo for:",
        item.CompanyName
      );

      image.remove();

      const fallback =
        document.createElement("span");

      fallback.className =
        "homepage-gold-logo-fallback";

      fallback.textContent =
        item.CompanyName
          .charAt(0)
          .toUpperCase();

      logoBox.appendChild(fallback);
    };

    logoBox.appendChild(image);

    const info =
      document.createElement("div");

    info.className =
      "homepage-gold-details";

    const company =
      document.createElement("strong");

    company.textContent =
      item.CompanyName;

    info.appendChild(company);

    if (item.CompanyNameAr) {
      const arabic =
        document.createElement("span");

      arabic.dir = "rtl";
      arabic.textContent =
        item.CompanyNameAr;

      info.appendChild(arabic);
    }

    const tier =
      document.createElement("small");

    tier.className =
      "homepage-gold-badge";

    tier.textContent =
      "GOLD | ذهبي";

    info.appendChild(tier);
    card.append(logoBox, info);

    return card;
  }

  function renderContributors(track, contributors) {
    track.innerHTML = "";

    if (contributors.length <= 3) {
      track.className =
        "homepage-gold-static-grid";

      contributors.forEach(item => {
        track.appendChild(createCard(item));
      });

      return;
    }

    track.className =
      "v6-supporters-track homepage-gold-track";

    contributors.forEach(item => {
      track.appendChild(createCard(item));
    });

    contributors.forEach(item => {
      track.appendChild(createCard(item, true));
    });

    track.classList.add("is-moving");
  }

  async function loadSupporters() {
    const track =
      document.getElementById("supportersGrid");

    if (!track) {
      return;
    }

    track.className =
      "v6-supporters-track is-centered";

    track.innerHTML = `
      <div class="v6-supporters-loading">
        <span class="spinner"></span>
        Loading supporters...
        <span dir="rtl">
          جاري تحميل الداعمين
        </span>
      </div>
    `;

    try {
      const contributors =
        await loadGoldenContributors();

      if (!contributors.length) {
        track.innerHTML = `
          <div class="v6-supporters-empty">
            <strong>
              No active supporter is available yet.
            </strong>

            <span dir="rtl">
              لا يوجد داعمون مفعّلون حاليًا.
            </span>
          </div>
        `;

        return;
      }

      renderContributors(
        track,
        contributors
      );
    } catch (error) {
      console.error(
        "Supporters display error:",
        error
      );

      track.innerHTML = `
        <div class="homepage-contributors-error">
          <strong>
            Unable to load supporters.
          </strong>

          <span dir="rtl">
            تعذر تحميل الداعمين.
          </span>

          <button
            type="button"
            onclick="loadSupporters()">
            Retry | إعادة المحاولة
          </button>

          <small>
            ${String(error.message || error)}
          </small>
        </div>
      `;
    }
  }

  window.loadSupporters =
    loadSupporters;
})();