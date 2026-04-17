// js/editar-perfil.js
// Carga y guarda el perfil del DJ

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const GENEROS = ["techno", "house", "reggaeton", "pop", "electronica"];

const bioInput = document.getElementById("bio");
const ciudadInput = document.getElementById("ciudad");
const tarifaInput = document.getElementById("tarifa");
const disponibleCheck = document.getElementById("disponible");
const generosContenedor = document.getElementById("generos-container");
const btnGuardar = document.getElementById("btn-guardar");
const btnLogout = document.getElementById("btn-logout");
const alerta = document.getElementById("alerta");
const exito = document.getElementById("exito");

let generosSeleccionados = [];

// ── Cerrar sesión ──────────────────────────────────────────
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../index.html";
});

// ── Crear botones de género ────────────────────────────────
function crearBotonesGeneros() {
  generosContenedor.innerHTML = GENEROS.map(g => `
    <button type="button" class="btn-genero" data-genero="${g}"
      style="padding:0.35rem 0.9rem; border-radius:999px; font-size:0.85rem;
             font-weight:600; border:2px solid #d1d5db; background:white;
             color:#374151; cursor:pointer; transition:all 0.2s">
      ${g.charAt(0).toUpperCase() + g.slice(1)}
    </button>`
  ).join("");

  document.querySelectorAll(".btn-genero").forEach(btn => {
    btn.addEventListener("click", () => {
      const g = btn.dataset.genero;
      if (generosSeleccionados.includes(g)) {
        // Deseleccionar
        generosSeleccionados = generosSeleccionados.filter(x => x !== g);
        btn.style.background = "white";
        btn.style.color = "#374151";
        btn.style.borderColor = "#d1d5db";
      } else {
        // Seleccionar
        generosSeleccionados.push(g);
        btn.style.background = "#7B2FBE";
        btn.style.color = "white";
        btn.style.borderColor = "#7B2FBE";
      }
    });
  });
}

// ── Marcar los géneros que ya tenía guardados ──────────────
function marcarGenerosActivos() {
  document.querySelectorAll(".btn-genero").forEach(btn => {
    if (generosSeleccionados.includes(btn.dataset.genero)) {
      btn.style.background = "#7B2FBE";
      btn.style.color = "white";
      btn.style.borderColor = "#7B2FBE";
    }
  });
}

// ── Esperar sesión y cargar datos del DJ ───────────────────
onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  // Comprobar que es DJ
  const usuarioSnap = await getDoc(doc(db, "usuarios", usuario.uid));
  if (!usuarioSnap.exists() || usuarioSnap.data().rol !== "dj") {
    window.location.href = "dashboard.html";
    return;
  }

  // Cargar datos actuales del DJ
  const djSnap = await getDoc(doc(db, "djs", usuario.uid));
  console.log("UID del usuario:", usuario.uid);
  if (djSnap.exists()) {
    const dj = djSnap.data();
    bioInput.value = dj.bio || "";
    ciudadInput.value = dj.ciudad || "";
    tarifaInput.value = dj.tarifa || "";
    disponibleCheck.checked = dj.disponible ?? true;
    generosSeleccionados = dj.generos || [];
  }

  crearBotonesGeneros();
  marcarGenerosActivos();

  // ── Guardar cambios ──────────────────────────────────────
  btnGuardar.addEventListener("click", async () => {
    alerta.className = "alerta error";
    exito.className = "alerta exito";

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";

    try {
      await setDoc(doc(db, "djs", usuario.uid), {
        bio: bioInput.value.trim(),
        ciudad: ciudadInput.value.trim(),
        tarifa: parseFloat(tarifaInput.value) || 0,
        generos: generosSeleccionados,
        disponible: disponibleCheck.checked,
        actualizadoEn: serverTimestamp()
      }, { merge: true });

      exito.textContent = "✅ Perfil actualizado correctamente";
      exito.className = "alerta exito visible";
      setTimeout(() => { exito.className = "alerta exito"; }, 3000);

    } catch (error) {
      alerta.textContent = "Error al guardar. Inténtalo de nuevo.";
      alerta.className = "alerta error visible";
      console.error(error);
    }

    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar cambios";
  });
});
