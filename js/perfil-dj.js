// js/perfil-dj.js
// Perfil público del DJ - diseño mejorado

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const contenido = document.getElementById("contenido");

const navLogin     = document.getElementById("nav-login");
const navRegister  = document.getElementById("nav-register");
const navDashboard = document.getElementById("nav-dashboard");
const navLogout    = document.getElementById("nav-logout");

let usuarioActual = null;
let datosUsuario  = null;

onAuthStateChanged(auth, async (user) => {
  usuarioActual = user;
  if (user) {
    if (navLogin)     navLogin.style.display     = "none";
    if (navRegister)  navRegister.style.display  = "none";
    if (navDashboard) navDashboard.style.display = "inline-block";
    if (navLogout)    navLogout.style.display     = "inline-block";
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (snap.exists()) datosUsuario = snap.data();
  }
});

if (navLogout) {
  navLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.reload();
  });
}

const params = new URLSearchParams(window.location.search);
const idDJ   = params.get("id");

async function cargarPerfil() {
  if (!idDJ) {
    contenido.innerHTML = '<p style="text-align:center;padding:4rem">DJ no encontrado.</p>';
    return;
  }
  try {
    const djSnap = await getDoc(doc(db, "djs", idDJ));
    if (!djSnap.exists()) {
      contenido.innerHTML = '<p style="text-align:center;padding:4rem">DJ no encontrado.</p>';
      return;
    }
    const dj = { id: djSnap.id, ...djSnap.data() };
    contenido.innerHTML = renderPerfil(dj);
    conectarFormulario(dj);
  } catch (error) {
    contenido.innerHTML = '<p style="text-align:center;padding:4rem;color:red">Error al cargar.</p>';
    console.error(error);
  }
}

function renderPerfil(dj) {
  const nombre  = dj.nombre   || "DJ Anónimo";
  const inicial = nombre[0].toUpperCase();
  const tarifa  = dj.tarifa > 0 ? `${dj.tarifa} €` : "A consultar";
  const ciudad  = dj.ciudad   || "Ciudad no indicada";
  const bio     = dj.bio      || "Este DJ aún no ha añadido una descripción.";

  // Colores avatar
  const colores = [
    { bg: "#EDE7F6", color: "#4A148C" },
    { bg: "#FCE4EC", color: "#880E4F" },
    { bg: "#E3F2FD", color: "#0D47A1" },
    { bg: "#E8F5E9", color: "#1B5E20" },
    { bg: "#FFF3E0", color: "#E65100" },
    { bg: "#F3E5F5", color: "#6A1B9A" },
  ];
  const color = colores[nombre.charCodeAt(0) % colores.length];

  // Foto de perfil o avatar
  const fotoHTML = dj.fotoPerfil
    ? `<img src="${dj.fotoPerfil}" alt="${nombre}"
        style="width:120px; height:120px; border-radius:50%;
               object-fit:cover; border:4px solid white;
               box-shadow:0 4px 20px rgba(0,0,0,0.3)" />`
    : `<div style="width:120px; height:120px; border-radius:50%;
               background:${color.bg}; color:${color.color};
               display:flex; align-items:center; justify-content:center;
               font-size:3rem; font-weight:800; border:4px solid white;
               box-shadow:0 4px 20px rgba(0,0,0,0.3)">
         ${inicial}
       </div>`;

  // Estrellas
  let estrellas = "";
  if (dj.valoracion > 0) {
    const llenas = Math.round(dj.valoracion);
    estrellas = `<span style="color:#f59e0b">${"★".repeat(llenas)}${"☆".repeat(5 - llenas)}</span>
      <span style="color:rgba(255,255,255,0.8); font-size:0.85rem">
        ${dj.valoracion.toFixed(1)} (${dj.numValoraciones} reseñas)
      </span>`;
  }

  // Tags géneros
  const tags = dj.generos?.length > 0
    ? dj.generos.map(g => `
        <span style="background:rgba(255,255,255,0.2); color:white;
                     padding:0.25rem 0.75rem; border-radius:999px;
                     font-size:0.8rem; font-weight:600">
          ${g}
        </span>`).join("")
    : "";

  // Sitios donde ha pinchado
  const sitiosHTML = dj.sitios?.length > 0
    ? dj.sitios.map(s => `
        <div style="display:flex; align-items:center; gap:0.75rem;
                    padding:0.75rem 0; border-bottom:1px solid #f3f4f6">
          <span style="color:#7B2FBE; font-size:1.1rem">📍</span>
          <span style="font-weight:500; color:#374151">${s}</span>
        </div>`).join("")
    : '<p style="color:#6b7280">Aún no hay sitios añadidos</p>';

  // Galería
  const galeriaHTML = dj.galeria?.length > 0
    ? `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr));
                   gap:1rem; margin-top:1rem">
        ${dj.galeria.map(url => `
          <img src="${url}" alt="foto DJ"
            style="width:100%; height:180px; object-fit:cover;
                   border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);
                   transition:transform 0.2s"
            onmouseover="this.style.transform='scale(1.03)'"
            onmouseout="this.style.transform='scale(1)'" />`
        ).join("")}
       </div>`
    : '<p style="color:#6b7280; margin-top:1rem">Aún no hay fotos en la galería</p>';

  return `
    <!-- CABECERA HERO -->
    <div style="background:linear-gradient(135deg, #4A148C, #7B2FBE, #a855f7);
            padding:3rem 4rem 4rem; position:relative; width:100%">
      <div style="max-width:1200px; margin:0 auto;
            display:flex; align-items:flex-end; gap:2rem; flex-wrap:wrap">

        <!-- Foto -->
        ${fotoHTML}

        <!-- Info principal -->
        <div style="flex:1; min-width:200px">
          <h1 style="color:white; font-size:2.5rem; font-weight:800;
                     margin-bottom:0.25rem">${nombre}</h1>
          <p style="color:rgba(255,255,255,0.8); font-size:1rem; margin-bottom:0.5rem">
            📍 ${ciudad}
          </p>
          ${estrellas ? `<p style="margin-bottom:0.75rem">${estrellas}</p>` : ""}
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem">${tags}</div>
        </div>

        <!-- Tarifa destacada -->
        <div style="background:rgba(255,255,255,0.15); backdrop-filter:blur(10px);
                    border-radius:16px; padding:1.25rem 2rem; text-align:center;
                    border:1px solid rgba(255,255,255,0.2)">
          <p style="color:rgba(255,255,255,0.8); font-size:0.85rem; margin-bottom:0.25rem">
            Tarifa por evento
          </p>
          <p style="color:white; font-size:2rem; font-weight:800">${tarifa}</p>
        </div>

      </div>
    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <div style="max-width:1200px; margin:0 auto; padding:2rem;
            display:grid; grid-template-columns:1fr 380px; gap:2rem">

      <!-- COLUMNA IZQUIERDA -->
      <div style="display:flex; flex-direction:column; gap:1.5rem">

        <!-- Sobre mí -->
        <div class="card">
          <h2 style="font-size:1.2rem; font-weight:700; margin-bottom:1rem;
                     color:#111827; display:flex; align-items:center; gap:0.5rem">
            🎧 Sobre mí
          </h2>
          <p style="color:#4b5563; line-height:1.8; font-size:0.95rem">${bio}</p>
        </div>

        <!-- Sitios donde ha pinchado -->
        <div class="card">
          <h2 style="font-size:1.2rem; font-weight:700; margin-bottom:0.5rem;
                     color:#111827; display:flex; align-items:center; gap:0.5rem">
            🗺️ Dónde he pinchado
          </h2>
          ${sitiosHTML}
        </div>

        <!-- Galería -->
        <div class="card">
          <h2 style="font-size:1.2rem; font-weight:700; color:#111827;
                     display:flex; align-items:center; gap:0.5rem">
            📸 Galería
          </h2>
          ${galeriaHTML}
        </div>

      </div>

      <!-- COLUMNA DERECHA: formulario reserva -->
      <div>
        <div class="card" style="position:sticky; top:80px">
          <h2 style="font-size:1.1rem; font-weight:700; margin-bottom:0.25rem">
            Solicitar reserva
          </h2>
          <p style="color:#6b7280; font-size:0.85rem; margin-bottom:1.25rem">
            El DJ recibirá tu solicitud directamente
          </p>

          <div id="alerta-reserva" class="alerta error"></div>
          <div id="exito-reserva" class="alerta exito"></div>

          <form id="form-reserva">
            <div class="form-group">
              <label for="fecha">Fecha del evento</label>
              <input type="date" id="fecha" required
                min="${new Date().toISOString().split("T")[0]}" />
            </div>
            <div class="form-group">
              <label for="evento">Tipo de evento</label>
              <input type="text" id="evento" required
                placeholder="Ej: Boda, fiesta privada..." />
            </div>
            <div class="form-group">
              <label for="mensaje">Mensaje para el DJ</label>
              <textarea id="mensaje" rows="4"
                placeholder="Cuéntale los detalles..."></textarea>
            </div>

            <p id="aviso-login" style="text-align:center; font-size:0.85rem;
               color:#6b7280; margin-bottom:0.75rem; display:none">
              Necesitas <a href="login.html"
              style="color:#7B2FBE; font-weight:600">iniciar sesión</a> para reservar
            </p>

            <button type="submit" id="btn-reserva"
              class="btn btn-primary" style="width:100%">
              Enviar solicitud
            </button>
          </form>
        </div>
      </div>

    </div>`;
}

function conectarFormulario(dj) {
  const form        = document.getElementById("form-reserva");
  const btnReserva  = document.getElementById("btn-reserva");
  const alertaError = document.getElementById("alerta-reserva");
  const alertaExito = document.getElementById("exito-reserva");
  const avisoLogin  = document.getElementById("aviso-login");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!usuarioActual) {
      avisoLogin.style.display = "block";
      return;
    }
    if (datosUsuario?.rol === "dj") {
      alertaError.textContent = "Los DJs no pueden hacer reservas.";
      alertaError.className   = "alerta error visible";
      return;
    }

    const fecha   = document.getElementById("fecha").value;
    const evento  = document.getElementById("evento").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();

    if (!fecha || !evento) {
      alertaError.textContent = "Rellena la fecha y el tipo de evento.";
      alertaError.className   = "alerta error visible";
      return;
    }

    btnReserva.disabled    = true;
    btnReserva.textContent = "Enviando...";
    alertaError.className  = "alerta error";

    try {
      await addDoc(collection(db, "reservas"), {
        idUsuario: usuarioActual.uid,
        idDJ:      dj.id,
        fecha,
        evento,
        mensaje,
        estado:   "pendiente",
        pagado:   false,
        creadoEn: serverTimestamp()
      });

      form.style.display      = "none";
      alertaExito.textContent = "✅ ¡Solicitud enviada! El DJ revisará tu petición pronto.";
      alertaExito.className   = "alerta exito visible";

    } catch (error) {
      alertaError.textContent = "Error al enviar. Inténtalo de nuevo.";
      alertaError.className   = "alerta error visible";
      console.error(error);
      btnReserva.disabled    = false;
      btnReserva.textContent = "Enviar solicitud";
    }
  });
}

cargarPerfil();