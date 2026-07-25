(function () {
  "use strict";

  /*
   * These were the supporters shown successfully in the older project.
   * They remain as a safe fallback when Firebase is unavailable or its
   * node/field structure changes.
   */
  const LEGACY_SUPPORTERS = [
    {
      image: "https://cdn.shopify.com/s/files/1/0603/7621/9837/files/saab.jpg?v=1716886171",
      link: "https://www.instagram.com/saabprinthouse",
      name: "Saab Print House",
      order: 1
    },
    {
      image: "https://cdn.shopify.com/s/files/1/0603/7621/9837/files/caramello.jpg?v=1716886570",
      link: "https://www.facebook.com/caramello86",
      name: "Caramello",
      order: 2
    }
  ];

  const NODE_CANDIDATES = [
    "/OurPartner.json",
    "/OurPartners.json",
    "/Partners.json",
    "/Partner.json",
    "/Supporters.json",
    "/Supporter.json",
    "/Sponsors.json",
    "/Sponsor.json",
    "/ourPartners.json",
    "/partners.json",
    "/supporters.json"
  ];

  function toArray(data) {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data.filter(Boolean);
    }

    if (typeof data === "object") {
      return Object.entries(data).map(([id, value]) => {
        if (value && typeof value === "object") {
          return { id, ...value };
        }

        if (typeof value === "string") {
          return { id, image: value };
        }

        return { id };
      });
    }

    return [];
  }

  function pick(item, keys) {
    for (const key of keys) {
      const value = item && item[key];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }

    return "";
  }

  function normalize(item) {
    const orderValue = Number(pick(item, [
      "Order", "order", "Priority", "priority",
      "Position", "position", "Index", "index"
    ]));

    const activeValue = pick(item, [
      "Active", "active", "Enabled", "enabled", "Visible", "visible"
    ]);

    const isActive =
      activeValue === "" ||
      activeValue === true ||
      activeValue === 1 ||
      String(activeValue).toLowerCase() === "true";

    return {
      image: String(pick(item, [
        "Image", "image", "ImageUrl", "imageUrl",
        "ImageURL", "Photo", "photo", "PhotoUrl",
        "Logo", "logo", "LogoUrl", "logoUrl",
        "Url", "url", "src", "Source"
      ]) || "").trim(),

      name: String(pick(item, [
        "Name", "name", "Title", "title",
        "Company", "company", "PartnerName", "partnerName"
      ]) || "Supporter").trim(),

      link: String(pick(item, [
        "Website", "website", "WebSite",
        "Link", "link", "Target", "target",
        "Facebook", "facebook", "Instagram", "instagram"
      ]) || "").trim(),

      order: Number.isFinite(orderValue) ? orderValue : 9999,
      active: isActive
    };
  }

  function deduplicate(items) {
    const seen = new Set();

    return items.filter(item => {
      const key = (item.image || "").trim().toLowerCase();

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  async function readFirebaseSupporters() {
    if (
      !window.MyBloodApp ||
      typeof MyBloodApp.request !== "function"
    ) {
      return [];
    }

    for (const node of NODE_CANDIDATES) {
      try {
        const data = await MyBloodApp.request(node);

        const supporters = toArray(data)
          .map(normalize)
          .filter(item => item.active && item.image);

        if (supporters.length) {
          console.info(
            "Supporters loaded from Firebase node:",
            node
          );
          return supporters;
        }
      } catch (error) {
        console.warn(
          "Unable to read supporters from:",
          node,
          error
        );
      }
    }

    return [];
  }

  function getLegacySupporters() {
    const externalLegacy = Array.isArray(window.MY_BLOOD_SUPPORTERS)
      ? window.MY_BLOOD_SUPPORTERS
      : [];

    return [...externalLegacy, ...LEGACY_SUPPORTERS]
      .map(normalize)
      .filter(item => item.active && item.image);
  }

  async function fetchSupporters() {
    const firebaseSupporters = await readFirebaseSupporters();
    const legacySupporters = getLegacySupporters();

    /*
     * Combine both sources. Firebase content appears first, while old
     * supporters remain visible and guarantee the bar never becomes empty.
     */
    return deduplicate([
      ...firebaseSupporters,
      ...legacySupporters
    ]);
  }

  function buildCard(item, isClone = false) {
    const card = item.link
      ? document.createElement("a")
      : document.createElement("article");

    card.className = "v6-supporter-card";

    if (item.link) {
      card.href = item.link;
      card.target = "_blank";
      card.rel = "noopener";
    }

    if (isClone) {
      card.setAttribute("aria-hidden", "true");
      card.tabIndex = -1;
    }

    const imageBox = document.createElement("div");
    imageBox.className = "v6-supporter-image";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = isClone ? "" : item.name;
    image.loading = "eager";
    image.decoding = "async";

    image.addEventListener("error", () => {
      image.remove();

      const fallback = document.createElement("span");
      fallback.className = "v6-supporter-fallback";
      fallback.textContent =
        (item.name || "S")
          .trim()
          .charAt(0)
          .toUpperCase();

      imageBox.appendChild(fallback);
    });

    imageBox.appendChild(image);

    if (item.name && item.name !== "Supporter") {
      const name = document.createElement("span");
      name.className = "v6-supporter-name";
      name.textContent = item.name;
      card.append(imageBox, name);
    } else {
      card.appendChild(imageBox);
    }

    return card;
  }

  function renderTrack(track, supporters) {
    const ordered = [...supporters].sort(
      (a, b) => a.order - b.order
    );

    track.className = "v6-supporters-track";
    track.innerHTML = "";

    ordered.forEach(item => {
      track.appendChild(buildCard(item));
    });

    /*
     * Repeat enough items for a seamless newsbar, even when Firebase
     * currently contains only two supporters.
     */
    const repetitions = ordered.length < 4 ? 4 : 2;

    for (let repeat = 1; repeat < repetitions; repeat++) {
      ordered.forEach(item => {
        track.appendChild(buildCard(item, true));
      });
    }

    track.classList.add("is-moving");
  }

  async function loadSupporters() {
    const track = document.getElementById("supportersGrid");

    if (!track) return;

    track.innerHTML = `
      <div class="v6-supporters-loading">
        <span class="spinner"></span>
        Loading supporters...
        <span dir="rtl">جاري تحميل الداعمين</span>
      </div>
    `;

    try {
      const supporters = await fetchSupporters();

      if (!supporters.length) {
        track.className = "v6-supporters-track is-centered";
        track.innerHTML = `
          <div class="v6-supporters-empty">
            <strong>Our supporter network is growing.</strong>
            <span dir="rtl">نعمل باستمرار على توسيع شبكة الداعمين.</span>
          </div>
        `;
        return;
      }

      renderTrack(track, supporters);
    } catch (error) {
      console.error("Supporters loading error:", error);

      /*
       * This should rarely happen because the legacy list is always
       * available, but keep a clear UI fallback.
       */
      track.className = "v6-supporters-track is-centered";
      track.innerHTML = `
        <div class="v6-supporters-empty">
          <strong>Supporters could not be loaded right now.</strong>
          <span dir="rtl">تعذر تحميل صور الداعمين حاليًا.</span>
        </div>
      `;
    }
  }

  window.loadSupporters = loadSupporters;
})();