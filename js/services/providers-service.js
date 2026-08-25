import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "../firebase.js";

export async function getActiveProviders({ townIds, categoryId, specialtyId }) {
  const uniqueTownIds = [...new Set(townIds.filter(Boolean))];
  const snapshots = await Promise.all(uniqueTownIds.map(townId => getDocs(query(collection(db, "providers"), where("townId", "==", townId), where("isActive", "==", true)))));
  const providers = snapshots.flatMap(snapshot => snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  return [...new Map(providers.map(provider => [provider.id, provider])).values()]
    .filter(provider => !categoryId || provider.categoryId === categoryId)
    .filter(provider => !specialtyId || (provider.specialtyIds || []).includes(specialtyId))
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar", { sensitivity: "base" }));
}

export async function getProviderById(providerId) {
  const snapshot = await getDoc(doc(db, "providers", providerId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
