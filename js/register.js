// js/register.js
// Formulario de registro — todos los usuarios son contratantes

import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const nombreInput = document.getElementById("nombre");
const emailInput  = document.getElementById("email");
const passInput   = document.getElementById("password");
const btnRegister = document.getElementById("btn-register");
const alerta      = document.getElementById("alerta");

// ── Mostrar error ──────────────────────────────────────────
function mostrarError(mensaje) {
  alerta.textContent = mensaje;
  alerta.className   = "alerta error visible";
}

// ── Crear cuenta ───────────────────────────────────────────
btnRegister.addEventListener("click", async () => {
  const nombre   = nombreInput.value.trim();
  const email    = emailInput.value.trim();
  const password = passInput.value;

  // Validaciones
  if (!nombre || !email || !password) {
    mostrarError("Por favor, rellena todos los campos.");
    return;
  }
  if (password.length < 6) {
    mostrarError("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  btnRegister.disabled    = true;
  btnRegister.textContent = "Creando cuenta...";
  alerta.className        = "alerta error";

  try {
    // 1. Crear usuario en Firebase Auth
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    const uid        = credencial.user.uid;

    // 2. Guardar nombre en el perfil Auth
    await updateProfile(credencial.user, { displayName: nombre });

    // 3. Guardar en Firestore — siempre como contratante
    await setDoc(doc(db, "usuarios", uid), {
      nombre,
      email,
      rol:      "contratante",
      creadoEn: serverTimestamp()
    });

    // 4. Ir al dashboard
    window.location.href = "dashboard.html";

  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      mostrarError("Este email ya está registrado.");
    } else if (error.code === "auth/invalid-email") {
      mostrarError("El email no tiene un formato válido.");
    } else {
      mostrarError("Error al crear la cuenta. Inténtalo de nuevo.");
      console.error(error);
    }
    btnRegister.disabled    = false;
    btnRegister.textContent = "Crear cuenta";
  }
});