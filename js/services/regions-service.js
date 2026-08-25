import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "../firebase.js";

export async function getActiveRegions() {
  const snapshot = await getDocs(query(collection(db, "regions"), where("isActive", "==", true)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
}

export async function getRegionById(regionId) {
  const snapshot = await getDoc(doc(db, "regions", regionId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
