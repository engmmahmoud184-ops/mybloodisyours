import { getTownById } from "./services/towns-service.js";
import { getCategoryById } from "./services/categories-service.js";
import { getActiveSpecialtiesByCategory } from "./services/specialties-service.js";
import { showNotice } from "./ui.js";

const params = new URLSearchParams(location.search);
const townId = params.get("town");
const categoryId = params.get("category");
const container = document.querySelector("#specialties");

if (!townId || !categoryId) {
  showNotice(container, "الاختيارات غير مكتملة.", "ارجع واختر البلدة وفئة الخدمة أولاً.", true);
} else {
  try {
    const [town, category, specialties] = await Promise.all([
      getTownById(townId),
      getCategoryById(categoryId),
      getActiveSpecialtiesByCategory(categoryId)
    ]);
    if (!town || !category) throw new Error("Selection not found");

    const townsUrl = `towns.html?region=${encodeURIComponent(town.regionId)}`;
    const categoriesUrl = `categories.html?town=${encodeURIComponent(townId)}`;
    document.querySelector("#towns-link").href = townsUrl;
    document.querySelector("#categories-link").href = categoriesUrl;
    document.querySelector("#categories-back-link").href = categoriesUrl;
    document.querySelector("#category-breadcrumb").textContent = category.nameAr;
    document.querySelector("#selected-town").textContent = town.nameAr;
    document.querySelector("#selected-category").textContent = category.nameAr;
    document.querySelector("#specialties-subtitle").textContent = `اختار الاختصاص المناسب ضمن ${category.nameAr}.`;
    container.innerHTML = "";
    container.removeAttribute("aria-busy");

    if (!specialties.length) {
      showNotice(container, "ما في اختصاصات ضمن هالفئة حالياً.", "يمكن لاحقاً الانتقال مباشرةً إلى النتائج عند عدم وجود اختصاصات.");
    } else {
      specialties.forEach((specialty, index) => {
        const link = document.createElement("a");
        link.className = "specialty-row";
        link.href = `providers.html?town=${encodeURIComponent(townId)}&category=${encodeURIComponent(categoryId)}&specialty=${encodeURIComponent(specialty.id)}`;
        link.setAttribute("aria-label", `اختيار ${specialty.nameAr}`);
        link.innerHTML = `<span class="specialty-index"></span><span class="specialty-copy"><strong></strong><small lang="en" dir="ltr"></small></span><span class="specialty-action">عرض النتائج <b aria-hidden="true">←</b></span>`;
        link.querySelector(".specialty-index").textContent = String(index + 1).padStart(2, "0");
        link.querySelector("strong").textContent = specialty.nameAr;
        link.querySelector("small").textContent = specialty.nameEn || "";
        container.append(link);
      });
    }
  } catch (error) {
    console.error(error);
    showNotice(container, "ما قدرنا نحمّل الاختصاصات.", "تحقّق من الإنترنت ومن Firestore Security Rules ثم حاول مجدداً.", true);
  }
}
