import { getActiveRegions } from "./services/regions-service.js";
import { showNotice } from "./ui.js";
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const container = document.querySelector("#regions");
const providersStat = document.querySelector("#providers-stat");
const visitsStat = document.querySelector("#visits-stat");
const numberFormatter = new Intl.NumberFormat("ar-LB");

async function loadProviderCount() {
  const activeProviders = query(collection(db, "providers"), where("isActive", "==", true));
  const snapshot = await getDocs(activeProviders);
  providersStat.textContent = numberFormatter.format(snapshot.size);
}

async function loadAndRegisterVisit() {
  const statsRef = doc(db, "publicStats", "main");

  const total = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(statsRef);
    const currentVisits = snapshot.exists() && Number.isInteger(snapshot.data().visits)
      ? snapshot.data().visits
      : 0;
    const nextVisits = currentVisits + 1;
    transaction.set(statsRef, { visits: nextVisits, updatedAt: serverTimestamp() });
    return nextVisits;
  });

  visitsStat.textContent = numberFormatter.format(total);
}

Promise.allSettled([loadProviderCount(), loadAndRegisterVisit()]).then(results => {
  if (results[0].status === "rejected") {
    console.error(results[0].reason);
    providersStat.textContent = "—";
  }
  if (results[1].status === "rejected") {
    console.error(results[1].reason);
    visitsStat.textContent = "—";
  }
});

try {
  const regions = await getActiveRegions();
  container.innerHTML = "";
  container.removeAttribute("aria-busy");
  if (!regions.length) {
    showNotice(container, "ما في مناطق متاحة حالياً.", "ستظهر هون تلقائياً بعد تفعيلها في Firestore.");
  } else {
    regions.forEach((region, index) => {
      const link = document.createElement("a");
      link.className = "region-card";
      link.href = `towns.html?region=${encodeURIComponent(region.id)}`;
      link.setAttribute("aria-label", `اختيار ${region.nameAr}`);
      link.innerHTML = `<span class="region-number">${String(index + 1).padStart(2, "0")}</span><span><strong></strong><small lang="en" dir="ltr"></small></span><span class="arrow" aria-hidden="true">←</span>`;
      link.querySelector("strong").textContent = region.nameAr;
      link.querySelector("small").textContent = region.nameEn || "";
      container.append(link);
    });
  }
} catch (error) {
  console.error(error);
  showNotice(container, "ما قدرنا نحمّل المناطق.", "تحقّق من الإنترنت ومن Firestore Security Rules ثم أعد تحميل الصفحة.", true);
}
