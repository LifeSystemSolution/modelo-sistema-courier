// MODO DEMO: este proyecto no se conecta a Firebase.
// Los módulos de ./demo/ simulan Auth y Firestore con datos ficticios guardados en el navegador.
import { initializeApp } from "./demo/firebase-app.js";
import { getAuth } from "./demo/firebase-auth.js";
import { getFirestore } from "./demo/firebase-firestore.js";

export const firebaseConfig = { projectId: "lifecargo-demo" };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
