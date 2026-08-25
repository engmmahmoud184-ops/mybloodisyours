import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { app } from "./firebase.js";

export const auth = getAuth(app);
