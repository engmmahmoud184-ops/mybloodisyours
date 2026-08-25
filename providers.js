import { getTownById } from "./services/towns-service.js";
import { getCategoryById } from "./services/categories-service.js";
import { getSpecialtyById } from "./services/specialties-service.js";
import { getActiveProviders } from "./services/providers-service.js";
import { mapsHref, phoneHref, whatsappHref } from "./contact-links.js";
import { showNotice } from "./ui.js";

const params = new URLSearchParams(location.search);
const townId = params.get("town");
const categoryId = params.get("category");
const specialtyId = params.get("specialty");
const container = document.querySelector("#providers");

function actionLink(label, href, className, external = false) {
  if (!href) return "";
  const target = external ? ' target="_blank" rel="noopener"' : "";
  return `<a class="contact-button ${className}" href="${href}"${target}>${label}</a>`;
}

if (!townId || !categoryId || !specialtyId) {
  showNotice(container, "الاختيارات غير مكتملة.", "ارجع واختر البلدة والفئة والاختصاص أولاً.", true);
} else {
  try {
    const [town, category, specialty] = await Promise.all([
      getTownById(townId), getCategoryById(categoryId), getSpecialtyById(specialtyId)
    ]);
    if (!town || !category || !specialty) throw new Error("Selection not found");
    const normalizedLegacyKey = String(town.legacyKey || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const providers = await getActiveProviders({ townIds: [townId, town.legacyKey, normalizedLegacyKey], categoryId, specialtyId });

    const townsUrl = `towns.html?region=${encodeURIComponent(town.regionId)}`;
    const categoriesUrl = `categories.html?town=${encodeURIComponent(townId)}`;
    const specialtiesUrl = `specialties.html?town=${encodeURIComponent(townId)}&category=${encodeURIComponent(categoryId)}`;
    document.querySelector("#towns-link").href = townsUrl;
    document.querySelector("#categories-link").href = categoriesUrl;
    document.querySelector("#specialties-link").href = specialtiesUrl;
    document.querySelector("#specialties-back-link").href = specialtiesUrl;
    document.querySelector("#providers-subtitle").textContent = `${specialty.nameAr} ضمن ${town.nameAr}.`;
    document.querySelector("#providers-count").textContent = `${providers.length.toLocaleString("ar-LB")} نتيجة`;
    container.innerHTML = "";
    container.removeAttribute("aria-busy");

    if (!providers.length) {
      showNotice(container, "ما لقينا مقدّمي خدمة لهالاختصاص حالياً.", "ستظهر النتائج تلقائياً عند إضافة مقدّمين فعّالين ضمن البلدة والاختصاص.");
    } else {
      providers.forEach(provider => {
        const card = document.createElement("article");
        card.className = "provider-card";
        const profileUrl = `provider.html?id=${encodeURIComponent(provider.id)}&town=${encodeURIComponent(townId)}&category=${encodeURIComponent(categoryId)}&specialty=${encodeURIComponent(specialtyId)}`;
        const call = phoneHref(provider.phone);
        const whatsapp = whatsappHref(provider.whatsapp || provider.phone);
        const map = mapsHref(provider.address, town.nameAr);
        card.innerHTML = `<div class="provider-card-top"><span class="provider-avatar" aria-hidden="true"></span><div class="provider-title"><div><h2></h2><span class="verified-badge" hidden>موثّق</span></div><p></p></div><a class="profile-link" href="${profileUrl}">عرض البروفايل <span aria-hidden="true">←</span></a></div><p class="provider-description"></p><div class="provider-address" hidden><span>العنوان</span><strong></strong></div><div class="contact-actions">${actionLink("اتصال مباشر", call, "call-button")}${actionLink("واتساب", whatsapp, "whatsapp-button", true)}${actionLink("عرض العنوان", map, "map-button", true)}</div>`;
        card.querySelector(".provider-avatar").textContent = (provider.name || "خ").trim().charAt(0);
        card.querySelector("h2").textContent = provider.name || "مقدّم خدمة";
        card.querySelector(".provider-title p").textContent = specialty.nameAr;
        card.querySelector(".provider-description").textContent = provider.description || "تواصل مباشرةً للحصول على مزيد من المعلومات.";
        card.querySelector(".verified-badge").hidden = !provider.isVerified;
        if (provider.address) {
          card.querySelector(".provider-address").hidden = false;
          card.querySelector(".provider-address strong").textContent = provider.address;
        }
        container.append(card);
      });
    }
  } catch (error) {
    console.error(error);
    showNotice(container, "ما قدرنا نحمّل مقدّمي الخدمة.", "تحقّق من الإنترنت ومن Firestore Security Rules ثم حاول مجدداً.", true);
  }
}
