import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "../firebase.js";

const sortArabic = (items, field="nameAr") => items.sort((a,b)=>(a[field]||"").localeCompare(b[field]||"","ar"));
const allDocs = async name => (await getDocs(collection(db,name))).docs.map(item=>({id:item.id,...item.data()}));

export async function getAllProvidersAdmin(){ return sortArabic(await allDocs("providers"),"name"); }
export async function getAllRegionsAdmin(){ return sortArabic(await allDocs("regions")); }
export async function getAllTownsAdmin(){ return sortArabic(await allDocs("towns")); }

export function updateProviderAdmin(id,data){ return updateDoc(doc(db,"providers",id),{...data,updatedAt:serverTimestamp()}); }
export function updateRegionAdmin(id,data){ return updateDoc(doc(db,"regions",id),data); }
export function updateTownAdmin(id,data){ return updateDoc(doc(db,"towns",id),data); }

export function addRegionAdmin(data){ return addDoc(collection(db,"regions"),{nameAr:data.nameAr.trim(),nameEn:data.nameEn.trim(),isActive:true,createdAt:serverTimestamp()}); }
export function addTownAdmin(data){ return addDoc(collection(db,"towns"),{nameAr:data.nameAr.trim(),nameEn:data.nameEn.trim(),legacyKey:data.nameEn.trim(),regionId:data.regionId,isActive:true,createdAt:serverTimestamp()}); }
