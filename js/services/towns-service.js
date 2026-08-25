import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "../firebase.js";

export async function getActiveTownsByRegion(regionId) {
  const snapshot = await getDocs(query(collection(db, "towns"), where("regionId", "==", regionId), where("isActive", "==", true)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
}

export async function getTownById(townId) {
  const snapshot = await getDoc(doc(db, "towns", townId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
