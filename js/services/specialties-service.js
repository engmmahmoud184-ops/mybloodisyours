import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "../firebase.js";

export async function getActiveSpecialtiesByCategory(categoryId) {
  const snapshot = await getDocs(query(collection(db, "specialties"), where("categoryId", "==", categoryId), where("isActive", "==", true)));
  return snapshot.docs
    .map(item => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getSpecialtyById(specialtyId) {
  const snapshot = await getDoc(doc(db, "specialties", specialtyId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
