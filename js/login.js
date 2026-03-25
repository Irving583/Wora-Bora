// js/login.js
// Lógica del formulario de inicio de sesión

import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Cogemos los elementos del HTML por su id
const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const btnLogin   = document.getElementById("btn-login");
const alerta     = document.getElementById("alerta");

// ── Mostrar error en pantalla ──────────────────────────────
function mostrarError(mensaje) {
  alerta.textContent = mensaje;
  alerta.className = "alerta error visible";
}

// ── Cuando el usuario pulsa "Iniciar sesión" ───────────────
btnLogin.addEventListener("click", async () => {
  const email    = emailInput.value.trim();
  const password = passInput.value;

  // Validación básica
  if (!email || !password) {
    mostrarError("Por favor, rellena todos los campos.");
    return;
  }

  // Desactivar botón para evitar doble clic
  btnLogin.disabled = true;
  btnLogin.textContent = "Cargando...";
  alerta.className = "alerta error"; // ocultar error anterior

  try {
    // Intentar login con Firebase
    await signInWithEmailAndPassword(auth, email, password);

    // Si funciona → ir al dashboard
    window.location.href = "dashboard.html";

  } catch (error) {
    // Mostrar error en español
    if (error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password") {
      mostrarError("Email o contraseña incorrectos.");
    } else if (error.code === "auth/too-many-requests") {
      mostrarError("Demasiados intentos. Espera un momento.");
    } else {
      mostrarError("Error al iniciar sesión. Inténtalo de nuevo.");
    }
    btnLogin.disabled = false;
    btnLogin.textContent = "Iniciar sesión";
  }
});

// ── También funciona pulsando Enter en la contraseña ───────
passInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnLogin.click();
});