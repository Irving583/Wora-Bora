// js/perfil-dj.js
// Perfil público del DJ 

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
  const nombre  = dj.nombre || "DJ Anónimo";
  const inicial = nombre[0].toUpperCase();
  const tarifa  = dj.tarifa > 0 ? `${dj.tarifa} €` : "A consultar";
  const ciudad  = dj.ciudad || "Ciudad no indicada";
  const bio     = dj.bio    || "Este DJ aún no ha añadido una descripción.";

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

  // Estrellas
  let estrellasHTML = "";
  if (dj.valoracion > 0) {
    const llenas = Math.round(dj.valoracion);
    estrellasHTML = `
      <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem">
        <span style="color:#f59e0b; font-size:1.2rem">
          ${"★".repeat(llenas)}${"☆".repeat(5 - llenas)}
        </span>
        <span style="color:rgba(255,255,255,0.8); font-size:0.9rem">
          ${dj.valoracion.toFixed(1)} (${dj.numValoraciones} reseñas)
        </span>
      </div>`;
  }

  // Tags géneros
  const tags = dj.generos?.length > 0
    ? dj.generos.map(g => `
        <span style="background:rgba(255,255,255,0.15); color:white;
                     padding:0.3rem 1rem; border-radius:999px;
                     font-size:0.85rem; font-weight:600;
                     border:1px solid rgba(255,255,255,0.3)">
          ${g}
        </span>`).join("")
    : "";

  // Sitios estilo carrera
  const sitiosHTML = dj.sitios?.length > 0
    ? dj.sitios.map((s, i) => `
        <div style="display:flex; align-items:center; justify-content:space-between;
                    padding:1rem 0; border-bottom:1px solid #f3f4f6">
          <div style="display:flex; align-items:center; gap:1rem">
            <span style="width:32px; height:32px; border-radius:50%;
                         background:#EDE7F6; color:#7B2FBE;
                         display:flex; align-items:center; justify-content:center;
                         font-weight:700; font-size:0.85rem">${i + 1}</span>
            <span style="font-weight:600; color:#111827">${s}</span>
          </div>
          <span style="font-size:1.2rem">🎧</span>
        </div>`).join("")
    : '<p style="color:#6b7280; padding:1rem 0">Aún no hay sitios añadidos</p>';

  // Galería
  const galeriaHTML = dj.galeria?.length > 0
    ? `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px,1fr));
                   gap:1rem">
        ${dj.galeria.map(url => `
          <div style="overflow:hidden; border-radius:12px; aspect-ratio:1">
            <img src="${url}" alt="foto DJ"
              style="width:100%; height:100%; object-fit:cover; transition:transform 0.3s"
              onmouseover="this.style.transform='scale(1.05)'"
              onmouseout="this.style.transform='scale(1)'" />
          </div>`).join("")}
       </div>`
    : '<p style="color:#6b7280">Aún no hay fotos en la galería</p>';

  // Foto o avatar
  const fotoHTML = dj.fotoPerfil
    ? `<img src="${dj.fotoPerfil}" alt="${nombre}"
        style="height:340px; object-fit:cover; object-position:top;
               filter:drop-shadow(0 20px 40px rgba(0,0,0,0.4))" />`
    : `<div style="width:200px; height:200px; border-radius:50%;
               background:${color.bg}; color:${color.color};
               display:flex; align-items:center; justify-content:center;
               font-size:5rem; font-weight:800">
         ${inicial}
       </div>`;

  return `
    <!-- HERO A PANTALLA COMPLETA -->
    <div style="background:linear-gradient(135deg, #0d0d1a 0%, #1a0533 50%, #2d0a6b 100%);
                min-height:420px; position:relative; overflow:hidden; width:100%">

      <!-- Fondo con foto difuminada -->
      ${dj.fotoPerfil ? `
        <div style="position:absolute; inset:0;
                    background:url('${dj.fotoPerfil}') center/cover no-repeat;
                    opacity:0.15; filter:blur(8px)"></div>` : ""}

      <!-- Contenido hero -->
      <div style="max-width:1400px; margin:0 auto; padding:3rem 4rem;
                  display:grid; grid-template-columns:auto 1fr auto;
                  gap:3rem; align-items:flex-end; position:relative; z-index:1">

        <!-- Foto DJ -->
        <div style="display:flex; align-items:flex-end">
          ${fotoHTML}
        </div>

        <!-- Info principal -->
        <div style="padding-bottom:1.5rem">
          <p style="color:rgba(255,255,255,0.6); font-size:0.85rem; font-weight:600;
                    letter-spacing:2px; text-transform:uppercase; margin-bottom:0.5rem">
            DJ Profesional · ${ciudad}
          </p>
          <h1 style="color:white; font-size:3.5rem; font-weight:900; line-height:1;
                     margin-bottom:0.75rem; text-shadow:0 2px 20px rgba(0,0,0,0.5)">
            ${nombre}
          </h1>
          ${estrellasHTML}
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:1rem">
            ${tags}
          </div>
        </div>

        <!-- Tarifa destacada -->
        <div style="background:rgba(255,255,255,0.1); backdrop-filter:blur(20px);
                    border:1px solid rgba(255,255,255,0.2); border-radius:20px;
                    padding:1.5rem 2rem; text-align:center; margin-bottom:1.5rem">
          <p style="color:rgba(255,255,255,0.7); font-size:0.8rem;
                    text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem">
            Tarifa por evento
          </p>
          <p style="color:white; font-size:2.5rem; font-weight:900">${tarifa}</p>
          <a href="#reserva" class="btn btn-primary"
             style="margin-top:1rem; display:block; text-align:center">
            Reservar ahora
          </a>
        </div>

      </div>
    </div>

    <!-- STATS BAR -->
    <div style="background:#111827; padding:1.25rem 4rem">
      <div style="max-width:1400px; margin:0 auto;
                  display:flex; gap:3rem; align-items:center; flex-wrap:wrap">
        <div style="text-align:center">
          <p style="color:white; font-size:1.5rem; font-weight:800">
            ${dj.numValoraciones || 0}
          </p>
          <p style="color:#9ca3af; font-size:0.78rem; text-transform:uppercase;
                    letter-spacing:1px">Valoraciones</p>
        </div>
        <div style="width:1px; height:40px; background:#374151"></div>
        <div style="text-align:center">
          <p style="color:white; font-size:1.5rem; font-weight:800">
            ${dj.sitios?.length || 0}
          </p>
          <p style="color:#9ca3af; font-size:0.78rem; text-transform:uppercase;
                    letter-spacing:1px">Locales</p>
        </div>
        <div style="width:1px; height:40px; background:#374151"></div>
        <div style="text-align:center">
          <p style="color:white; font-size:1.5rem; font-weight:800">
            ${dj.valoracion > 0 ? dj.valoracion.toFixed(1) + " ⭐" : "Nuevo"}
          </p>
          <p style="color:#9ca3af; font-size:0.78rem; text-transform:uppercase;
                    letter-spacing:1px">Valoración</p>
        </div>
        <div style="width:1px; height:40px; background:#374151"></div>
        <div style="text-align:center">
          <p style="color:white; font-size:1.5rem; font-weight:800">
            ${dj.tarifa > 0 ? dj.tarifa + " €" : "–"}
          </p>
          <p style="color:#9ca3af; font-size:0.78rem; text-transform:uppercase;
                    letter-spacing:1px">Tarifa</p>
        </div>
      </div>
    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <div style="max-width:1400px; margin:0 auto; padding:3rem 4rem;
                display:grid; grid-template-columns:1fr 400px; gap:3rem">

      <!-- COLUMNA IZQUIERDA -->
      <div style="display:flex; flex-direction:column; gap:2rem">

        <!-- Bio -->
        <div class="card">
          <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:1rem;
                     color:#111827; display:flex; align-items:center; gap:0.5rem">
            🎧 Sobre mí
          </h2>
          <p style="color:#4b5563; line-height:2; font-size:1rem">${bio}</p>
        </div>

        <!-- Sitios -->
        <div class="card">
          <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:0.5rem;
                     color:#111827; display:flex; align-items:center; gap:0.5rem">
            🗺️ Dónde he pinchado
          </h2>
          ${sitiosHTML}
        </div>

        <!-- Galería -->
        <div class="card">
          <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:1rem;
                     color:#111827; display:flex; align-items:center; gap:0.5rem">
            📸 Galería
          </h2>
          ${galeriaHTML}
        </div>

      </div>

      <!-- COLUMNA DERECHA: formulario -->
      <div id="reserva">
        <div class="card" style="position:sticky; top:80px">
          <h2 style="font-size:1.2rem; font-weight:800; margin-bottom:0.25rem">
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