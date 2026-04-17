// js/navbar.js
// Controla el navbar en todas las páginas según si hay sesión o no

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const navLogin     = document.getElementById("nav-login");
const navRegister  = document.getElementById("nav-register");
const navDashboard = document.getElementById("nav-dashboard");
const navLogout    = document.getElementById("nav-logout");

onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    // Logueado → mostrar dashboard y salir
    if (navLogin)     navLogin.style.display     = "none";
    if (navRegister)  navRegister.style.display  = "none";
    if (navDashboard) navDashboard.style.display = "inline-block";
    if (navLogout)    navLogout.style.display     = "inline-block";
  } else {
    // Sin sesión → mostrar login y register
    if (navLogin)     navLogin.style.display     = "inline-block";
    if (navRegister)  navRegister.style.display  = "inline-block";
    if (navDashboard) navDashboard.style.display = "none";
    if (navLogout)    navLogout.style.display     = "none";
  }
});

if (navLogout) {
  navLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "../index.html";
  });
}