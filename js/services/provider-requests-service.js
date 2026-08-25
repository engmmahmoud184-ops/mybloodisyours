import { collection, doc, getDocs, runTransaction, serverTimestamp, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "../firebase.js";

export async function submitProviderRequest(data) {
  const requestRef = doc(collection(db, "providerRequests"));
  await setDoc(requestRef, {
    name: data.name.trim(), regionId: data.regionId, townId: data.townId,
    categoryId: data.categoryId, specialtyIds: [data.specialtyId],
    phone: data.phone.trim(), whatsapp: data.whatsapp.trim(),
    address: data.address.trim(), description: data.description.trim(),
    status: "pending", source: "website", createdAt: serverTimestamp()
  });
  return requestRef;
}

export async function getPendingProviderRequests() {
  const snapshot = await getDocs(collection(db, "providerRequests"));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
    .filter(item => item.status === "pending")
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function approveProviderRequest(requestId, adminUid) {
  const requestRef = doc(db, "providerRequests", requestId);
  const providerRef = doc(collection(db, "providers"));
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(requestRef);
    if (!snapshot.exists() || snapshot.data().status !== "pending") throw new Error("الطلب غير موجود أو تمت مراجعته.");
    const data = snapshot.data();
    transaction.set(providerRef, {
      name:data.name, regionId:data.regionId, townId:data.townId, categoryId:data.categoryId,
      specialtyIds:data.specialtyIds, phone:data.phone, whatsapp:data.whatsapp,
      address:data.address, description:data.description, isActive:true, isVerified:false,
      publishedFromRequestId:requestId, createdAt:serverTimestamp()
    });
    transaction.update(requestRef, { status:"approved", reviewedAt:serverTimestamp(), reviewedBy:adminUid, providerId:providerRef.id });
  });
  return providerRef.id;
}

export function rejectProviderRequest(requestId, adminUid) {
  return updateDoc(doc(db, "providerRequests", requestId), { status:"rejected", reviewedAt:serverTimestamp(), reviewedBy:adminUid });
}
