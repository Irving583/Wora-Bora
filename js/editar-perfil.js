// js/editar-perfil.js
// Carga y guarda el perfil del DJ

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const GENEROS = ["techno", "house", "reggaeton", "pop", "electronica"];

const bioInput          = document.getElementById("bio");
const ciudadInput       = document.getElementById("ciudad");
const tarifaInput       = document.getElementById("tarifa");
const fotoPerfilInput   = document.getElementById("fotoPerfil");
const disponibleCheck   = document.getElementById("disponible");
const generosContenedor = document.getElementById("generos-container");
const btnGuardar        = document.getElementById("btn-guardar");
const alerta            = document.getElementById("alerta");
const exito             = document.getElementById("exito");
const previewPerfil     = document.getElementById("preview-perfil");
const imgPerfilPreview  = document.getElementById("img-perfil-preview");

let generosSeleccionados = [];

// ── Previsualizar foto de perfil al escribir la URL ────────
if (fotoPerfilInput) {
  fotoPerfilInput.addEventListener("input", () => {
    const url = fotoPerfilInput.value.trim();
    if (url) {
      imgPerfilPreview.src = url;
      previewPerfil.style.display = "block";
    } else {
      previewPerfil.style.display = "none";
    }
  });
}

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
        generosSeleccionados = generosSeleccionados.filter(x => x !== g);
        btn.style.background  = "white";
        btn.style.color       = "#374151";
        btn.style.borderColor = "#d1d5db";
      } else {
        generosSeleccionados.push(g);
        btn.style.background  = "#7B2FBE";
        btn.style.color       = "white";
        btn.style.borderColor = "#7B2FBE";
      }
    });
  });
}

// ── Marcar géneros ya guardados ────────────────────────────
function marcarGenerosActivos() {
  document.querySelectorAll(".btn-genero").forEach(btn => {
    if (generosSeleccionados.includes(btn.dataset.genero)) {
      btn.style.background  = "#7B2FBE";
      btn.style.color       = "white";
      btn.style.borderColor = "#7B2FBE";
    }
  });
}

// ── Cargar datos y esperar sesión ──────────────────────────
onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  const usuarioSnap = await getDoc(doc(db, "usuarios", usuario.uid));
  if (!usuarioSnap.exists() || usuarioSnap.data().rol !== "dj") {
    window.location.href = "dashboard.html";
    return;
  }

  const djSnap = await getDoc(doc(db, "djs", usuario.uid));
  if (djSnap.exists()) {
    const dj = djSnap.data();

    // Datos básicos
    bioInput.value          = dj.bio       || "";
    ciudadInput.value       = dj.ciudad    || "";
    tarifaInput.value       = dj.tarifa    || "";
    disponibleCheck.checked = dj.disponible ?? true;
    generosSeleccionados    = dj.generos   || [];

    // Foto de perfil
    if (dj.fotoPerfil && fotoPerfilInput) {
      fotoPerfilInput.value       = dj.fotoPerfil;
      imgPerfilPreview.src        = dj.fotoPerfil;
      previewPerfil.style.display = "block";
    }

    // Sitios donde ha pinchado
    const sitios = dj.sitios || [];
    document.querySelectorAll(".input-sitio").forEach((input, i) => {
      input.value = sitios[i] || "";
    });

    // Galería de fotos
    const galeria = dj.galeria || [];
    document.querySelectorAll(".input-galeria").forEach((input, i) => {
      input.value = galeria[i] || "";
    });
  }

  crearBotonesGeneros();
  marcarGenerosActivos();

  // ── Guardar cambios ──────────────────────────────────────
  btnGuardar.addEventListener("click", async () => {
    alerta.className = "alerta error";
    exito.className  = "alerta exito";
    btnGuardar.disabled    = true;
    btnGuardar.textContent = "Guardando...";

    // Recoger sitios
    const sitios = Array.from(document.querySelectorAll(".input-sitio"))
      .map(input => input.value.trim())
      .filter(v => v !== "");

    // Recoger galería
    const galeria = Array.from(document.querySelectorAll(".input-galeria"))
      .map(input => input.value.trim())
      .filter(v => v !== "");

    try {
      await setDoc(doc(db, "djs", usuario.uid), {
        bio:           bioInput.value.trim(),
        ciudad:        ciudadInput.value.trim(),
        tarifa:        parseFloat(tarifaInput.value) || 0,
        generos:       generosSeleccionados,
        disponible:    disponibleCheck.checked,
        fotoPerfil:    fotoPerfilInput?.value.trim() || "",
        sitios,
        galeria,
        actualizadoEn: serverTimestamp()
      }, { merge: true });

      exito.textContent = "✅ Perfil actualizado correctamente";
      exito.className   = "alerta exito visible";
      setTimeout(() => { exito.className = "alerta exito"; }, 3000);

    } catch (error) {
      alerta.textContent = "Error al guardar. Inténtalo de nuevo.";
      alerta.className   = "alerta error visible";
      console.error(error);
    }

    btnGuardar.disabled    = false;
    btnGuardar.textContent = "Guardar cambios";
  });
});