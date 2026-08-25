import { getProviderById } from "./services/providers-service.js";
import { getTownById } from "./services/towns-service.js";
import { getSpecialtyById } from "./services/specialties-service.js";
import { mapsHref, phoneHref, whatsappHref } from "./contact-links.js";
import { showNotice } from "./ui.js";

const params = new URLSearchParams(location.search);
const providerId = params.get("id");
const townId = params.get("town");
const categoryId = params.get("category");
const specialtyId = params.get("specialty");
const loading = document.querySelector("#profile-loading");
const profile = document.querySelector("#provider-profile");

function addAction(container, label, href, className, external = false) {
  if (!href) return;
  const link = document.createElement("a");
  link.className = `contact-button ${className}`;
  link.href = href;
  link.textContent = label;
  if (external) { link.target = "_blank"; link.rel = "noopener"; }
  container.append(link);
}

if (!providerId) {
  showNotice(loading, "لم يتم تحديد مقدّم الخدمة.", "ارجع إلى النتائج واختر مقدّم الخدمة.", true);
} else {
  try {
    const provider = await getProviderById(providerId);
    if (!provider || !provider.isActive) throw new Error("Provider not found");
    const resolvedTownId = townId || provider.townId;
    const [town, specialties] = await Promise.all([
      getTownById(resolvedTownId),
      Promise.all((provider.specialtyIds || []).map(getSpecialtyById))
    ]);
    const selectedSpecialty = specialties.find(item => item?.id === specialtyId) || specialties.find(Boolean);
    const resultsUrl = townId && categoryId && specialtyId ? `providers.html?town=${encodeURIComponent(townId)}&category=${encodeURIComponent(categoryId)}&specialty=${encodeURIComponent(specialtyId)}` : "index.html";
    document.querySelector("#results-back-link").href = resultsUrl;
    document.title = `${provider.name || "مقدّم خدمة"} | أنا بدي`;
    document.querySelector("#profile-avatar").textContent = (provider.name || "خ").trim().charAt(0);
    document.querySelector("#profile-name").textContent = provider.name || "مقدّم خدمة";
    document.querySelector("#profile-specialty").textContent = selectedSpecialty?.nameAr || "خدمة محلية";
    document.querySelector("#profile-location").textContent = [town?.nameAr, provider.address].filter(Boolean).join(" · ");
    document.querySelector("#profile-description").textContent = provider.description || "تواصل مباشرةً مع مقدّم الخدمة للحصول على مزيد من المعلومات.";
    document.querySelector("#profile-verified").hidden = !provider.isVerified;
    if (provider.address) {
      document.querySelector("#profile-address-block").hidden = false;
      document.querySelector("#profile-address").textContent = provider.address;
    }
    const tags = document.querySelector("#profile-specialties");
    specialties.filter(Boolean).forEach(item => { const tag = document.createElement("span"); tag.textContent = item.nameAr; tags.append(tag); });
    if (!tags.children.length) document.querySelector("#profile-specialties-block").hidden = true;
    const actions = document.querySelector("#profile-actions");
    addAction(actions, `اتصال ${provider.phone || ""}`.trim(), phoneHref(provider.phone), "call-button");
    addAction(actions, "مراسلة عبر واتساب", whatsappHref(provider.whatsapp || provider.phone), "whatsapp-button", true);
    addAction(actions, "فتح العنوان على الخريطة", mapsHref(provider.address, town?.nameAr), "map-button", true);
    loading.hidden = true;
    profile.hidden = false;
  } catch (error) {
    console.error(error);
    showNotice(loading, "تعذّر فتح البروفايل.", "قد يكون مقدّم الخدمة غير متاح أو أن الاتصال تعذّر.", true);
  }
}
