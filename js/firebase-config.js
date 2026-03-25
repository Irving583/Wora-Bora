// js/firebase-config.js
// Configuración de Firebase para Wora Bora Agency

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAb5xBbPB7uE2kyuIoynVm4Jjjoq5Tob_c",
  authDomain:        "wora-bora.firebaseapp.com",
  projectId:         "wora-bora",
  storageBucket:     "wora-bora.firebasestorage.app",
  messagingSenderId: "114339394460",
  appId:             "1:114339394460:web:f605d5b07c48c99d290e59"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);