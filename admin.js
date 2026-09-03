"use strict";

const ADMIN_CONFIG = {
  username: "onsheinTech",
passwordHash: "a7efe53e14ccd3d691cbbb258b6898174c53e206f8c5808be3f1b41377a8ef11",
  sessionKey: "myblood_admin_session_v1"
};

let contributorsCache = {};

document.addEventListener("DOMContentLoaded", () => {
  bindAdminEvents();

  if (isAdminSessionActive()) {
    showDashboard();
  } else {
    showLogin();
  }
});

function bindAdminEvents() {
  document
    .getElementById("loginForm")
    .addEventListener("submit", handleAdminLogin);

  document
    .getElementById("contributorForm")
    .addEventListener("submit", saveContributor);

  document
    .getElementById("contributionScope")
    .addEventListener("change", updateScopeFields);

  document
    .getElementById("regionCode")
    .addEventListener("change", syncRegionName);

  document
    .getElementById("logoUrl")
    .addEventListener("input", handleLogoUrlInput);

  document
    .getElementById("logoFile")
    .addEventListener("change", handleLogoFileChange);

  document
    .getElementById("contributorsSearch")
    .addEventListener("input", renderContributors);

  document
    .getElementById("tierFilter")
    .addEventListener("change", renderContributors);

  document
    .getElementById("scopeFilter")
    .addEventListener("change", renderContributors);

  document
    .getElementById("contributorModal")
    .addEventListener("click", event => {
      if (event.target.id === "contributorModal") {
        closeContributorForm();
      }
    });
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function handleAdminLogin(event) {
  event.preventDefault();

  const username =
    document.getElementById("loginUsername").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  const passwordHash = await sha256(password);

  if (
    username === ADMIN_CONFIG.username &&
    passwordHash === ADMIN_CONFIG.passwordHash
  ) {
    sessionStorage.setItem(
      ADMIN_CONFIG.sessionKey,
      JSON.stringify({
        username,
        loggedInAt: new Date().toISOString()
      })
    );

    document.getElementById("loginForm").reset();
    showDashboard();
    return;
  }

  setAdminMessage(
    "loginMessage",
    "error",
    "Invalid username or password."
  );
}

function isAdminSessionActive() {
  return Boolean(
    sessionStorage.getItem(ADMIN_CONFIG.sessionKey)
  );
}

function adminLogout() {
  sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
  contributorsCache = {};
  showLogin();
}

function showLogin() {
  document.getElementById("loginView").hidden = false;
  document.getElementById("dashboardView").hidden = true;
  closeContributorForm();
}

function showDashboard() {
  document.getElementById("loginView").hidden = true;
  document.getElementById("dashboardView").hidden = false;
  loadContributors();
}

async function loadContributors() {
  const loading = document.getElementById("contributorsLoading");

  loading.hidden = false;

  try {
    contributorsCache =
      await MyBloodApp.request("/Contributors.json") || {};

    renderContributors();
    updateSummary();
  } catch (error) {
    contributorsCache = {};
    renderContributors();

    showToast(
      "Unable to load Contributors: " + error.message,
      "error"
    );
  } finally {
    loading.hidden = true;
  }
}

function getFilteredContributors() {
  const search =
    document.getElementById("contributorsSearch")
      .value.trim().toLowerCase();

  const tier =
    document.getElementById("tierFilter").value;

  const scope =
    document.getElementById("scopeFilter").value;

  return Object.entries(contributorsCache)
    .map(([id, contributor]) => ({
      id,
      ...contributor
    }))
    .filter(contributor => {
      const text = [
        contributor.CompanyName,
        contributor.CompanyNameAr,
        contributor.RegionName,
        contributor.RegionCode,
        contributor.TownName,
        contributor.TownCode
      ].join(" ").toLowerCase();

      return (
        (!search || text.includes(search)) &&
        (!tier || contributor.Tier === tier) &&
        (!scope || contributor.ContributionScope === scope)
      );
    })
    .sort((first, second) => {
      const tierOrder = {
        GOLD: 1,
        SILVER: 2,
        BRONZE: 3
      };

      const firstTier =
        tierOrder[first.Tier] || 99;

      const secondTier =
        tierOrder[second.Tier] || 99;

      if (firstTier !== secondTier) {
        return firstTier - secondTier;
      }

      return (
        Number(first.DisplayOrder || 9999) -
        Number(second.DisplayOrder || 9999)
      );
    });
}

function renderContributors() {
  const grid =
    document.getElementById("contributorsGrid");

  const empty =
    document.getElementById("contributorsEmpty");

  const contributors =
    getFilteredContributors();

  grid.innerHTML = "";

  if (!contributors.length) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  contributors.forEach(contributor => {
    grid.appendChild(
      createContributorCard(contributor)
    );
  });
}

function createContributorCard(contributor) {
  const card = document.createElement("article");
  card.className = "admin-contributor-card";

  const tierClass =
    String(contributor.Tier || "").toLowerCase();

  const scopeLabel = getScopeLabel(contributor);

  card.innerHTML = `
    <div class="admin-contributor-logo">
      <img
        src="${escapeAdminHtml(contributor.LogoUrl || "")}"
        alt="${escapeAdminHtml(contributor.CompanyName || "Contributor")}">
    </div>

    <div class="admin-contributor-main">
      <div class="admin-contributor-title">
        <div>
          <h3>${escapeAdminHtml(contributor.CompanyName || "Unnamed")}</h3>
          <p dir="rtl">${escapeAdminHtml(contributor.CompanyNameAr || "")}</p>
        </div>

        <span class="admin-tier-badge ${tierClass}">
          ${escapeAdminHtml(contributor.Tier || "—")}
        </span>
      </div>

      <div class="admin-contributor-meta">
        <span>${escapeAdminHtml(scopeLabel)}</span>
        <span>Order: ${Number(contributor.DisplayOrder || 0)}</span>
        <span class="${contributor.IsActive ? "active" : "inactive"}">
          ${contributor.IsActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div class="admin-contributor-actions">
        <button
          type="button"
          onclick="editContributor('${contributor.id}')">
          Edit
        </button>

        <button
          class="danger"
          type="button"
          onclick="deleteContributor('${contributor.id}')">
          Delete
        </button>
      </div>
    </div>
  `;

  const image = card.querySelector("img");

  image.addEventListener("error", () => {
    image.closest(".admin-contributor-logo").textContent =
      (contributor.CompanyName || "C").charAt(0).toUpperCase();
  });

  return card;
}

function getScopeLabel(contributor) {
  if (contributor.ContributionScope === "NATIONAL") {
    return "National";
  }

  if (contributor.ContributionScope === "REGION") {
    return "Region: " +
      (contributor.RegionName || contributor.RegionCode || "—");
  }

  if (contributor.ContributionScope === "TOWN") {
    return "Town: " +
      (contributor.TownName || contributor.TownCode || "—");
  }

  return contributor.ContributionScope || "—";
}

function updateSummary() {
  const contributors =
    Object.values(contributorsCache || {});

  document.getElementById("summaryTotal").textContent =
    contributors.length;

  document.getElementById("summaryGold").textContent =
    contributors.filter(item => item.Tier === "GOLD").length;

  document.getElementById("summarySilver").textContent =
    contributors.filter(item => item.Tier === "SILVER").length;

  document.getElementById("summaryBronze").textContent =
    contributors.filter(item => item.Tier === "BRONZE").length;
}

function openContributorForm(contributor = null) {
  const modal =
    document.getElementById("contributorModal");

  const form =
    document.getElementById("contributorForm");

  form.reset();
  document.getElementById("contributorId").value = "";
  document.getElementById("isActive").checked = true;
  document.getElementById("showOnHomepage").checked = true;
  document.getElementById("showOnRegionPages").checked = true;
  document.getElementById("showOnTownPages").checked = true;
  document.getElementById("displayOrder").value = 1;
  document.getElementById("logoData").value = "";
  document.getElementById("logoFile").value = "";
  document.getElementById("logoUrl").value = "";

  document.getElementById("contributorModalTitle").textContent =
    contributor ? "Edit Contributor" : "Add Contributor";

  if (contributor) {
    document.getElementById("contributorId").value =
      contributor.id || "";

    document.getElementById("companyName").value =
      contributor.CompanyName || "";

    document.getElementById("companyNameAr").value =
      contributor.CompanyNameAr || "";

    document.getElementById("tier").value =
      contributor.Tier || "GOLD";

    document.getElementById("contributionScope").value =
      contributor.ContributionScope || "NATIONAL";

    document.getElementById("regionCode").value =
      contributor.RegionCode || "";

    document.getElementById("regionName").value =
      contributor.RegionName || "";

    document.getElementById("townCode").value =
      contributor.TownCode || "";

    document.getElementById("townName").value =
      contributor.TownName || "";

    const existingLogo = contributor.LogoUrl || "";

    document.getElementById("logoData").value =
      existingLogo.startsWith("data:image/")
        ? existingLogo
        : "";

    document.getElementById("logoUrl").value =
      existingLogo.startsWith("data:image/")
        ? ""
        : existingLogo;

    document.getElementById("websiteUrl").value =
      contributor.WebsiteUrl || "";

    document.getElementById("displayOrder").value =
      contributor.DisplayOrder ?? 1;

    document.getElementById("contributionType").value =
      contributor.ContributionType || "FINANCIAL";

    document.getElementById("isActive").checked =
      contributor.IsActive !== false;

    document.getElementById("showOnHomepage").checked =
      contributor.ShowOnHomepage !== false;

    document.getElementById("showOnRegionPages").checked =
      contributor.ShowOnRegionPages !== false;

    document.getElementById("showOnTownPages").checked =
      contributor.ShowOnTownPages !== false;

    document.getElementById("notes").value =
      contributor.Notes || "";
  }

  updateScopeFields();
  updateLogoPreview();

  modal.hidden = false;
  document.body.classList.add("admin-modal-open");
}

function closeContributorForm() {
  const modal =
    document.getElementById("contributorModal");

  if (modal) {
    modal.hidden = true;
  }

  document.body.classList.remove("admin-modal-open");
  setAdminMessage("contributorFormMessage", "", "");
}

function editContributor(id) {
  const contributor =
    contributorsCache[id];

  if (!contributor) {
    return;
  }

  openContributorForm({
    id,
    ...contributor
  });
}

async function saveContributor(event) {
  event.preventDefault();

  const button =
    document.getElementById("saveContributorButton");

  const contributorId =
    document.getElementById("contributorId").value;

  const scope =
    document.getElementById("contributionScope").value;

  const regionCode =
    document.getElementById("regionCode").value.trim();

  const regionName =
    document.getElementById("regionName").value.trim();

  const townCode =
    document.getElementById("townCode").value.trim();

  const townName =
    document.getElementById("townName").value.trim();

  if (scope === "REGION" && !regionCode) {
    setAdminMessage(
      "contributorFormMessage",
      "error",
      "Region is required for REGION scope."
    );
    return;
  }

  if (
    scope === "TOWN" &&
    (!regionCode || !townCode || !townName)
  ) {
    setAdminMessage(
      "contributorFormMessage",
      "error",
      "Region, Town Code, and Town Name are required for TOWN scope."
    );
    return;
  }

  const selectedLogo = getSelectedLogoValue();

  if (!selectedLogo) {
    setAdminMessage(
      "contributorFormMessage",
      "error",
      "Please upload a logo or enter a Logo URL."
    );
    return;
  }

  const now = new Date().toISOString();

  const payload = {
    CompanyName:
      document.getElementById("companyName").value.trim(),

    CompanyNameAr:
      document.getElementById("companyNameAr").value.trim(),

    Tier:
      document.getElementById("tier").value,

    ContributionScope: scope,

    RegionCode:
      scope === "NATIONAL" ? "" : regionCode,

    RegionName:
      scope === "NATIONAL" ? "" : regionName,

    TownCode:
      scope === "TOWN" ? townCode.toUpperCase() : "",

    TownName:
      scope === "TOWN" ? townName : "",

    LogoUrl:
      getSelectedLogoValue(),

    WebsiteUrl:
      document.getElementById("websiteUrl").value.trim(),

    DisplayOrder:
      Number(document.getElementById("displayOrder").value || 0),

    ContributionType:
      document.getElementById("contributionType").value,

    IsActive:
      document.getElementById("isActive").checked,

    ShowOnHomepage:
      document.getElementById("showOnHomepage").checked,

    ShowOnRegionPages:
      document.getElementById("showOnRegionPages").checked,

    ShowOnTownPages:
      document.getElementById("showOnTownPages").checked,

    Notes:
      document.getElementById("notes").value.trim(),

    UpdatedAt: now,
    UpdatedBy: ADMIN_CONFIG.username
  };

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    if (contributorId) {
      payload.CreatedAt =
        contributorsCache[contributorId]?.CreatedAt || now;

      payload.CreatedBy =
        contributorsCache[contributorId]?.CreatedBy ||
        ADMIN_CONFIG.username;

      await MyBloodApp.request(
        "/Contributors/" + contributorId + ".json",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      showToast("Contributor updated successfully.", "success");
    } else {
      payload.CreatedAt = now;
      payload.CreatedBy = ADMIN_CONFIG.username;

      await MyBloodApp.request(
        "/Contributors.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      showToast("Contributor added successfully.", "success");
    }

    closeContributorForm();
    await loadContributors();
  } catch (error) {
    setAdminMessage(
      "contributorFormMessage",
      "error",
      "Unable to save: " + error.message
    );
  } finally {
    button.disabled = false;
    button.textContent = "Save Contributor";
  }
}

async function deleteContributor(id) {
  const contributor =
    contributorsCache[id];

  if (!contributor) {
    return;
  }

  const confirmed = window.confirm(
    "Delete contributor: " +
    (contributor.CompanyName || id) +
    "?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await MyBloodApp.request(
      "/Contributors/" + id + ".json",
      {
        method: "DELETE"
      }
    );

    showToast("Contributor deleted.", "success");
    await loadContributors();
  } catch (error) {
    showToast(
      "Unable to delete: " + error.message,
      "error"
    );
  }
}

function updateScopeFields() {
  const scope =
    document.getElementById("contributionScope").value;

  const showRegion =
    scope === "REGION" || scope === "TOWN";

  const showTown =
    scope === "TOWN";

  document.getElementById("regionCodeField").hidden =
    !showRegion;

  document.getElementById("regionNameField").hidden =
    !showRegion;

  document.getElementById("townCodeField").hidden =
    !showTown;

  document.getElementById("townNameField").hidden =
    !showTown;

  document.getElementById("regionCode").required =
    showRegion;

  document.getElementById("townCode").required =
    showTown;

  document.getElementById("townName").required =
    showTown;

  if (!showRegion) {
    document.getElementById("regionCode").value = "";
    document.getElementById("regionName").value = "";
  }

  if (!showTown) {
    document.getElementById("townCode").value = "";
    document.getElementById("townName").value = "";
  }
}

function syncRegionName() {
  const select =
    document.getElementById("regionCode");

  const selected =
    select.options[select.selectedIndex];

  document.getElementById("regionName").value =
    selected && select.value
      ? selected.textContent.trim()
      : "";
}

function getSelectedLogoValue() {
  const uploadedData =
    document.getElementById("logoData").value.trim();

  const externalUrl =
    document.getElementById("logoUrl").value.trim();

  return uploadedData || externalUrl;
}

function handleLogoUrlInput() {
  const url =
    document.getElementById("logoUrl").value.trim();

  if (url) {
    document.getElementById("logoData").value = "";
    document.getElementById("logoFile").value = "";
  }

  updateLogoPreview();
}

async function handleLogoFileChange(event) {
  const file =
    event.target.files && event.target.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setAdminMessage(
      "contributorFormMessage",
      "error",
      "Please select a valid image file."
    );
    event.target.value = "";
    return;
  }

  const maxOriginalSize = 8 * 1024 * 1024;

  if (file.size > maxOriginalSize) {
    setAdminMessage(
      "contributorFormMessage",
      "error",
      "The selected image is larger than 8 MB."
    );
    event.target.value = "";
    return;
  }

  try {
    setAdminMessage(
      "contributorFormMessage",
      "",
      "Processing image..."
    );

    const compressedDataUrl =
      await compressContributorImage(file);

    document.getElementById("logoData").value =
      compressedDataUrl;

    document.getElementById("logoUrl").value = "";

    updateLogoPreview();

    setAdminMessage(
      "contributorFormMessage",
      "success",
      "Logo processed successfully."
    );
  } catch (error) {
    setAdminMessage(
      "contributorFormMessage",
      "error",
      "Unable to process image: " + error.message
    );

    event.target.value = "";
  }
}

function compressContributorImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Unable to read the selected file."));
    };

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => {
        reject(new Error("The selected file is not a readable image."));
      };

      image.onload = () => {
        const maxWidth = 900;
        const maxHeight = 500;

        const scale = Math.min(
          1,
          maxWidth / image.width,
          maxHeight / image.height
        );

        const width =
          Math.max(1, Math.round(image.width * scale));

        const height =
          Math.max(1, Math.round(image.height * scale));

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context =
          canvas.getContext("2d");

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        let quality = 0.86;
        let dataUrl =
          canvas.toDataURL("image/webp", quality);

        const targetLength = 350000;

        while (
          dataUrl.length > targetLength &&
          quality > 0.48
        ) {
          quality -= 0.08;
          dataUrl =
            canvas.toDataURL("image/webp", quality);
        }

        resolve(dataUrl);
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

function updateLogoPreview() {
  const value =
    getSelectedLogoValue();

  const image =
    document.getElementById("logoPreview");

  const placeholder =
    document.getElementById("logoPreviewPlaceholder");

  const sizeInfo =
    document.getElementById("logoSizeInfo");

  if (!value) {
    image.removeAttribute("src");
    image.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = "No image selected";
    sizeInfo.textContent = "";
    return;
  }

  image.src = value;
  image.hidden = false;
  placeholder.hidden = true;

  if (value.startsWith("data:image/")) {
    const approximateBytes =
      Math.round((value.length * 3) / 4);

    sizeInfo.textContent =
      "Stored image size: approximately " +
      formatAdminBytes(approximateBytes);
  } else {
    sizeInfo.textContent =
      "External image URL";
  }

  image.onerror = () => {
    image.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = "Unable to load this image.";
  };

  image.onload = () => {
    image.hidden = false;
    placeholder.hidden = true;
  };
}

function formatAdminBytes(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function setAdminMessage(id, type, text) {
  const element =
    document.getElementById(id);

  element.className =
    "admin-message" + (type ? " " + type : "");

  element.textContent = text;
}

function showToast(text, type = "success") {
  const toast =
    document.getElementById("adminToast");

  toast.className = "admin-toast " + type;
  toast.textContent = text;
  toast.hidden = false;

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.hidden = true;
  }, 3500);
}

function escapeAdminHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
