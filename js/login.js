// login.js
// Gestiona el formulario de inicio de sesion

import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// elementos del formulario
const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const btnLogin   = document.getElementById("btn-login");
const alerta     = document.getElementById("alerta");

// muestra un mensaje de error en la pantalla
function mostrarError(mensaje) {
  alerta.textContent = mensaje;
  alerta.className   = "alerta error visible";
}

// cuando el usuario pulsa el boton de iniciar sesion
btnLogin.addEventListener("click", async () => {
  const email    = emailInput.value.trim();
  const password = passInput.value;

  // compruebo que los campos no esten vacios
  if (!email || !password) {
    mostrarError("Por favor, rellena todos los campos.");
    return;
  }

  // desactivo el boton para evitar que se pulse dos veces
  btnLogin.disabled    = true;
  btnLogin.textContent = "Cargando...";
  alerta.className     = "alerta error";

  try {
    // intento iniciar sesion con Firebase
    await signInWithEmailAndPassword(auth, email, password);

    // si va bien redirijo al dashboard
    window.location.href = "dashboard.html";

  } catch (error) {
    // muestro el error en español segun el codigo que devuelve Firebase
    if (error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password") {
      mostrarError("Email o contrasena incorrectos.");
    } else if (error.code === "auth/too-many-requests") {
      mostrarError("Demasiados intentos. Espera un momento.");
    } else {
      mostrarError("Error al iniciar sesion. Intentalo de nuevo.");
    }
    btnLogin.disabled    = false;
    btnLogin.textContent = "Iniciar sesion";
  }
});

// tambien se puede iniciar sesion pulsando Enter en el campo de contrasena
passInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnLogin.click();
});