// firebase-config.js
// Inicializa Firebase y exporta auth y db para usarlos en el resto de archivos

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// credenciales del proyecto Firebase
const firebaseConfig = {
  apiKey:            "AIzaSyAb5xBbPB7uE2kyuIoynVm4Jjjoq5Tob_c",
  authDomain:        "wora-bora.firebaseapp.com",
  projectId:         "wora-bora",
  storageBucket:     "wora-bora.firebasestorage.app",
  messagingSenderId: "114339394460",
  appId:             "1:114339394460:web:f605d5b07c48c99d290e59"
};

// inicio la app de Firebase
const app = initializeApp(firebaseConfig);

// exporto auth y db para usarlos desde otros archivos
export const auth = getAuth(app);
export const db   = getFirestore(app);