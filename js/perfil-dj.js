// js/perfil-dj.js
// Carga el perfil público de un DJ y gestiona el formulario de reserva

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const contenido = document.getElementById("contenido");

// Navbar dinámico
const navLogin     = document.getElementById("nav-login");
const navRegister  = document.getElementById("nav-register");
const navDashboard = document.getElementById("nav-dashboard");
const navLogout    = document.getElementById("nav-logout");

let usuarioActual = null;
let datosUsuario  = null;

// ── Escuchar sesión ────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  usuarioActual = user;

  if (user) {
    navLogin.style.display     = "none";
    navRegister.style.display  = "none";
    navDashboard.style.display = "inline-block";
    navLogout.style.display    = "inline-block";

    // Cargar rol del usuario
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (snap.exists()) datosUsuario = snap.data();
  }
});

// Cerrar sesión
navLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.reload();
});

// ── Leer el ID del DJ desde la URL ────────────────────────
// Ejemplo: perfil-dj.html?id=ABC123
const params = new URLSearchParams(window.location.search);
const idDJ   = params.get("id");

// ── Cargar perfil del DJ ───────────────────────────────────
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

// ── Construir el HTML del perfil ───────────────────────────
function renderPerfil(dj) {
  const inicial = dj.nombre ? dj.nombre[0] : "D";
  const tarifa  = dj.tarifa > 0 ? `${dj.tarifa} €` : "A consultar";
  const ciudad  = dj.ciudad || "Ciudad no indicada";
  const bio     = dj.bio    || "Este DJ aún no ha añadido una descripción.";

  // Estrellas
  let estrellas = "Sin valoraciones aún";
  if (dj.valoracion > 0) {
    const llenas = Math.round(dj.valoracion);
    estrellas = `${"★".repeat(llenas)}${"☆".repeat(5 - llenas)}
      <span style="font-size:0.85rem; color:#6b7280">
        ${dj.valoracion.toFixed(1)} · ${dj.numValoraciones} reseñas
      </span>`;
  }

  // Tags de géneros
  const tags = dj.generos && dj.generos.length > 0
    ? dj.generos.map(g => `<span class="tag">${g}</span>`).join("")
    : "No indicados";

  return `
    <div class="perfil-page">

      <!-- Columna izquierda: info del DJ -->
      <div class="perfil-info">

        <div class="perfil-cabecera">
          <div class="perfil-avatar">${inicial}</div>
          <p class="perfil-nombre">${dj.nombre || "DJ Anónimo"}</p>
          <p class="perfil-ciudad">📍 ${ciudad}</p>
          <p class="stars" style="margin-top:0.5rem">${estrellas}</p>
        </div>

        <div class="info-bloque">
          <h2>Sobre mí</h2>
          <p>${bio}</p>
        </div>

        <div class="info-bloque">
          <h2>Géneros musicales</h2>
          <div class="dj-generos" style="margin-top:0.25rem">${tags}</div>
        </div>

        <div class="info-bloque">
          <h2>Tarifa por evento</h2>
          <p class="tarifa-grande">${tarifa}</p>
        </div>

      </div>

      <!-- Columna derecha: formulario de reserva -->
      <div>
        <div class="card" style="position:sticky; top:80px">
          <h2 style="font-size:1.2rem; font-weight:700; margin-bottom:0.25rem">
            Solicitar reserva
          </h2>
          <p style="color:#6b7280; font-size:0.88rem; margin-bottom:1.25rem">
            Rellena el formulario y el DJ recibirá tu solicitud
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

// ── Conectar el formulario de reserva ──────────────────────
function conectarFormulario(dj) {
  const form        = document.getElementById("form-reserva");
  const btnReserva  = document.getElementById("btn-reserva");
  const alertaError = document.getElementById("alerta-reserva");
  const alertaExito = document.getElementById("exito-reserva");
  const avisoLogin  = document.getElementById("aviso-login");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Sin sesión → mostrar aviso
    if (!usuarioActual) {
      avisoLogin.style.display = "block";
      return;
    }

    // Los DJs no pueden reservar
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

// ── Arrancar ───────────────────────────────────────────────
cargarPerfil();