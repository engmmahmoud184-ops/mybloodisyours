import { getActiveRegions } from "./services/regions-service.js";
import { getActiveTownsByRegion } from "./services/towns-service.js";
import { getActiveCategories } from "./services/categories-service.js";
import { getActiveSpecialtiesByCategory } from "./services/specialties-service.js";
import { submitProviderRequest } from "./services/provider-requests-service.js";

const form = document.querySelector("#provider-form");
const region = document.querySelector("#region");
const town = document.querySelector("#town");
const category = document.querySelector("#category");
const specialty = document.querySelector("#specialty");
const button = document.querySelector("#submit-button");
const status = document.querySelector("#form-status");

function setOptions(select, items, placeholder) {
  select.replaceChildren(new Option(placeholder, ""));
  items.forEach(item => select.add(new Option(item.nameEn ? `${item.nameAr} — ${item.nameEn}` : item.nameAr, item.id)));
  select.disabled = items.length === 0;
}

async function loadInitialData() {
  try {
    const [regions, categories] = await Promise.all([getActiveRegions(), getActiveCategories()]);
    setOptions(region, regions, "اختر المنطقة");
    setOptions(category, categories, "اختر الفئة");
  } catch (error) {
    status.textContent = "تعذر تحميل الخيارات. تحقق من الاتصال وحاول مجدداً.";
  }
}

region.addEventListener("change", async () => {
  town.disabled = true; town.replaceChildren(new Option("جارٍ تحميل البلدات…", ""));
  if (!region.value) return setOptions(town, [], "اختر المنطقة أولاً");
  try { setOptions(town, await getActiveTownsByRegion(region.value), "اختر البلدة"); }
  catch { setOptions(town, [], "تعذر تحميل البلدات"); }
});

category.addEventListener("change", async () => {
  specialty.disabled = true; specialty.replaceChildren(new Option("جارٍ تحميل الاختصاصات…", ""));
  if (!category.value) return setOptions(specialty, [], "اختر الفئة أولاً");
  try { setOptions(specialty, await getActiveSpecialtiesByCategory(category.value), "اختر الاختصاص"); }
  catch { setOptions(specialty, [], "تعذر تحميل الاختصاصات"); }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (document.querySelector("#website").value) return;
  button.disabled = true; status.textContent = "جارٍ إرسال الطلب…";
  try {
    await submitProviderRequest({
      name:document.querySelector("#name").value, regionId:region.value, townId:town.value,
      categoryId:category.value, specialtyId:specialty.value,
      phone:document.querySelector("#phone").value, whatsapp:document.querySelector("#whatsapp").value,
      address:document.querySelector("#address").value, description:document.querySelector("#description").value
    });
    form.classList.add("hidden"); document.querySelector("#success").classList.remove("hidden");
  } catch (error) {
    console.error(error); status.textContent = "لم يُرسل الطلب. تأكد من نشر قواعد Firestore الجديدة ثم حاول مجدداً."; button.disabled = false;
  }
});

loadInitialData();
