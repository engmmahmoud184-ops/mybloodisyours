import { getRegionById } from "./services/regions-service.js";
import { getActiveTownsByRegion } from "./services/towns-service.js";
import { normalizeSearch, showNotice } from "./ui.js";

const params = new URLSearchParams(location.search);
const regionId = params.get("region");
const container = document.querySelector("#towns");
const input = document.querySelector("#town-search");
let towns = [];

function render(filter = "") {
  const needle = normalizeSearch(filter);
  const visible = towns.filter(town => !needle || normalizeSearch(`${town.nameAr} ${town.nameEn || ""}`).includes(needle));
  container.innerHTML = "";
  container.className = "town-list";
  container.removeAttribute("aria-busy");
  if (!visible.length) {
    showNotice(container, filter ? "ما لقينا بلدة بهالاسم." : "ما في بلدات متاحة حالياً.", filter ? "جرّب كتابة جزء أقصر من الاسم." : "ستظهر البلدات بعد تفعيلها في Firestore.");
    return;
  }
  visible.forEach(town => {
    const link = document.createElement("a");
    link.className = "town-row";
    link.href = `categories.html?town=${encodeURIComponent(town.id)}`;
    link.innerHTML = `<span><strong></strong><small lang="en" dir="ltr"></small></span><span class="arrow" aria-hidden="true">←</span>`;
    link.querySelector("strong").textContent = town.nameAr;
    link.querySelector("small").textContent = town.nameEn || "";
    container.append(link);
  });
}

if (!regionId) {
  showNotice(container, "لم يتم اختيار منطقة.", "ارجع إلى الصفحة الرئيسية واختر منطقتك.", true);
} else {
  try {
    const [region, items] = await Promise.all([getRegionById(regionId), getActiveTownsByRegion(regionId)]);
    towns = items;
    const regionName = region?.nameAr || "المنطقة";
    document.querySelector("#region-breadcrumb").textContent = regionName;
    document.querySelector("#towns-subtitle").textContent = `كل البلدات الفعّالة ضمن ${regionName}.`;
    document.querySelector("#town-count").textContent = `${towns.length.toLocaleString("ar-LB")} بلدة`;
    render();
  } catch (error) {
    console.error(error);
    showNotice(container, "ما قدرنا نحمّل البلدات.", "تحقّق من الإنترنت ومن Firestore Security Rules ثم حاول مجدداً.", true);
  }
}

document.querySelector("#town-search-form").addEventListener("submit", event => { event.preventDefault(); render(input.value); });
input.addEventListener("input", () => render(input.value));
