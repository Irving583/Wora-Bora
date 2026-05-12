// register.js
// Gestiona el formulario de registro de nuevos usuarios contratantes

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

// muestra un mensaje de error en pantalla
function mostrarError(mensaje) {
  alerta.textContent = mensaje;
  alerta.className   = "alerta error visible";
}

// cuando el usuario pulsa el boton de crear cuenta
btnRegister.addEventListener("click", async () => {
  const nombre   = nombreInput.value.trim();
  const email    = emailInput.value.trim();
  const password = passInput.value;

  // compruebo que todos los campos esten rellenos
  if (!nombre || !email || !password) {
    mostrarError("Por favor, rellena todos los campos.");
    return;
  }

  // validaciones de la contrasena
  if (password.length < 6) {
    mostrarError("La contrasena debe tener al menos 6 caracteres.");
    return;
  }
  if (!/[A-Z]/.test(password)) {
    mostrarError("La contrasena debe contener al menos una letra mayuscula.");
    return;
  }
  if (!/[0-9]/.test(password)) {
    mostrarError("La contrasena debe contener al menos un numero.");
    return;
  }

  btnRegister.disabled    = true;
  btnRegister.textContent = "Creando cuenta...";
  alerta.className        = "alerta error";

  try {
    // creo el usuario en Firebase Authentication
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    const uid        = credencial.user.uid;

    // guardo el nombre en el perfil de Auth
    await updateProfile(credencial.user, { displayName: nombre });

    // guardo los datos en Firestore, el rol siempre es contratante
    await setDoc(doc(db, "usuarios", uid), {
      nombre,
      email,
      rol:      "contratante",
      creadoEn: serverTimestamp()
    });

    // si todo va bien redirijo al dashboard
    window.location.href = "dashboard.html";

  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      mostrarError("Este email ya esta registrado.");
    } else if (error.code === "auth/invalid-email") {
      mostrarError("El email no tiene un formato valido.");
    } else {
      mostrarError("Error al crear la cuenta. Intentalo de nuevo.");
      console.error(error);
    }
    btnRegister.disabled    = false;
    btnRegister.textContent = "Crear cuenta";
  }
});