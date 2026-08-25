import { getTownById } from "./services/towns-service.js";
import { getActiveCategories } from "./services/categories-service.js";
import { showNotice } from "./ui.js";

const params = new URLSearchParams(location.search);
const townId = params.get("town");
const container = document.querySelector("#categories");

if (!townId) {
  showNotice(container, "لم يتم اختيار بلدة.", "ارجع إلى المناطق واختر المنطقة ثم البلدة.", true);
} else {
  try {
    const [town, categories] = await Promise.all([getTownById(townId), getActiveCategories()]);
    if (!town) throw new Error("Town not found");

    const townsUrl = `towns.html?region=${encodeURIComponent(town.regionId)}`;
    document.querySelector("#towns-back-link").href = townsUrl;
    document.querySelector("#town-breadcrumb-link").href = townsUrl;
    document.querySelector("#town-breadcrumb").textContent = town.nameAr;
    document.querySelector("#selected-town").textContent = town.nameAr;
    document.querySelector("#categories-subtitle").textContent = `اختار الفئة المناسبة ضمن ${town.nameAr}.`;
    container.innerHTML = "";
    container.removeAttribute("aria-busy");

    if (!categories.length) {
      showNotice(container, "ما في فئات متاحة حالياً.", "ستظهر الفئات تلقائياً بعد تفعيلها في Firestore.");
    } else {
      categories.forEach((category, index) => {
        const link = document.createElement("a");
        link.className = "category-card";
        link.href = `specialties.html?town=${encodeURIComponent(townId)}&category=${encodeURIComponent(category.id)}`;
        link.setAttribute("aria-label", `اختيار ${category.nameAr}`);
        link.innerHTML = `<span class="category-symbol" aria-hidden="true"></span><span class="category-copy"><small>فئة ${String(index + 1).padStart(2, "0")}</small><strong></strong><span lang="en" dir="ltr"></span></span><span class="category-arrow" aria-hidden="true">←</span>`;
        link.querySelector(".category-symbol").textContent = category.nameAr?.trim().charAt(0) || "•";
        link.querySelector("strong").textContent = category.nameAr;
        link.querySelector(".category-copy > span").textContent = category.nameEn || "";
        container.append(link);
      });
    }
  } catch (error) {
    console.error(error);
    showNotice(container, "ما قدرنا نحمّل فئات الخدمات.", "تحقّق من الإنترنت ومن Firestore Security Rules ثم حاول مجدداً.", true);
  }
}
