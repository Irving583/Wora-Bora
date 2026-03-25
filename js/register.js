// js/register.js
// Este archivo hace funcionar el formulario de registro

import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Cogemos los elementos del HTML por su id
const nombreInput = document.getElementById("nombre");
const emailInput  = document.getElementById("email");
const passInput   = document.getElementById("password");
const rolInput    = document.getElementById("rol");
const btnRegister = document.getElementById("btn-register");
const alerta      = document.getElementById("alerta");
const rolOpciones = document.querySelectorAll(".rol-option");

// ── Selector de rol: cuando haces clic en Contratante o DJ ──
rolOpciones.forEach((opcion) => {
  opcion.addEventListener("click", () => {
    // Quitar el borde morado de todas las opciones
    rolOpciones.forEach((o) => o.classList.remove("activo"));
    // Poner el borde morado en la que has clicado
    opcion.classList.add("activo");
    // Guardar el rol elegido en el campo oculto
    rolInput.value = opcion.dataset.rol;
  });
});

// ── Función para mostrar un error en pantalla ──
function mostrarError(mensaje) {
  alerta.textContent = mensaje;
  alerta.className = "alerta error visible";
}

// ── Cuando el usuario hace clic en "Crear cuenta" ──
btnRegister.addEventListener("click", async () => {
  const nombre   = nombreInput.value.trim();
  const email    = emailInput.value.trim();
  const password = passInput.value;
  const rol      = rolInput.value;

  // Validaciones antes de llamar a Firebase
  if (!nombre || !email || !password) {
    mostrarError("Por favor, rellena todos los campos.");
    return;
  }
  if (password.length < 6) {
    mostrarError("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  // Desactivar el botón para que no se pulse dos veces
  btnRegister.disabled = true;
  btnRegister.textContent = "Creando cuenta...";
  alerta.className = "alerta error"; // ocultar error anterior

  try {
    // 1. Crear el usuario en Firebase Authentication
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credencial.user.uid;

    // 2. Guardar el nombre en el perfil de Auth
    await updateProfile(credencial.user, { displayName: nombre });

    // 3. Guardar los datos en Firestore (colección "usuarios")
    await setDoc(doc(db, "usuarios", uid), {
      nombre,
      email,
      rol,
      creadoEn: serverTimestamp()
    });

    // 4. Si es DJ, crear también su perfil en la colección "djs"
    if (rol === "dj") {
      await setDoc(doc(db, "djs", uid), {
        idUsuario:       uid,
        nombre,
        bio:             "",
        generos:         [],
        tarifa:          0,
        valoracion:      0,
        numValoraciones: 0,
        ciudad:          "",
        disponible:      true,
        creadoEn:        serverTimestamp()
      });
    }

    // 5. Todo correcto → ir al dashboard
    window.location.href = "dashboard.html";

  } catch (error) {
    // Mostrar error en español según el código de Firebase
    if (error.code === "auth/email-already-in-use") {
      mostrarError("Este email ya está registrado.");
    } else if (error.code === "auth/invalid-email") {
      mostrarError("El email no tiene un formato válido.");
    } else {
      mostrarError("Error al crear la cuenta. Inténtalo de nuevo.");
      console.error(error);
    }
    btnRegister.disabled = false;
    btnRegister.textContent = "Crear cuenta";
  }
});