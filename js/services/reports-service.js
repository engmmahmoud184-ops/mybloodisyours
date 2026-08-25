import { addDoc, collection, getDocs, serverTimestamp, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "../firebase.js";

export function submitReport(data){return addDoc(collection(db,"reports"),{reporterName:data.reporterName.trim(),contact:data.contact.trim(),type:data.type,details:data.details.trim(),pageUrl:data.pageUrl.trim(),status:"open",createdAt:serverTimestamp()});}
export async function getReportsAdmin(){const snapshot=await getDocs(collection(db,"reports"));return snapshot.docs.map(item=>({id:item.id,...item.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));}
export function closeReportAdmin(id,adminUid){return updateDoc(doc(db,"reports",id),{status:"closed",reviewedBy:adminUid,reviewedAt:serverTimestamp()});}
