// js/dashboard.js
// Panel de control — diferente según si eres DJ, contratante o admin

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where,
         orderBy, getDocs, updateDoc, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const contenido = document.getElementById("contenido");
const btnLogout = document.getElementById("btn-logout");
let usuarioActual     = null;
let datosUsuarioActual = null;

if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "../index.html";
  });
}

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  usuarioActual = usuario;

 const snap = await getDoc(doc(db, "usuarios", usuario.uid));
console.log("UID:", usuario.uid);
console.log("Existe el documento:", snap.exists());
console.log("Datos:", snap.data());
const datos = snap.data();
datosUsuarioActual = datos;
  if (datos.rol === "admin") {
    await dashboardAdmin(datos);
  } else if (datos.rol === "dj") {
    await dashboardDJ(usuario.uid, datos);
  } else {
    await dashboardContratante(usuario.uid, datos);
  }
});

// ══════════════════════════════════════════════════════════
// DASHBOARD ADMIN
// ══════════════════════════════════════════════════════════
async function dashboardAdmin(datos) {
  // Cargar todos los DJs
  const djsSnap = await getDocs(collection(db, "djs"));
  const djs     = djsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Cargar TODAS las reservas
  const reservasSnap = await getDocs(
    query(collection(db, "reservas"), orderBy("creadoEn", "desc"))
  );

  const todasReservas = await Promise.all(
    reservasSnap.docs.map(async (d) => {
      const r = { id: d.id, ...d.data() };
      // Nombre del DJ
      try {
        const djSnap = await getDoc(doc(db, "djs", r.idDJ));
        if (djSnap.exists()) r.nombreDJ = djSnap.data().nombre;
      } catch(e) {}
      // Nombre del contratante
      try {
        const uSnap = await getDoc(doc(db, "usuarios", r.idUsuario));
        if (uSnap.exists()) r.nombreUsuario = uSnap.data().nombre;
      } catch(e) {}
      return r;
    })
  );

  const pendientes  = todasReservas.filter(r => r.estado === "pendiente").length;
  const aceptadas   = todasReservas.filter(r => r.estado === "aceptada").length;
  const completadas = todasReservas.filter(r => r.estado === "completada").length;
  const rechazadas  = todasReservas.filter(r => r.estado === "rechazada").length;

  contenido.innerHTML = `
    <div class="dashboard">

      <div class="dashboard-header">
        <div>
          <h1>Panel de Administración 🛠️</h1>
          <p style="color:#6b7280">Gestiona todas las reservas de la plataforma</p>
        </div>
        <a href="marketplace.html" class="btn btn-secondary">Ver marketplace</a>
      </div>

      <!-- Stats globales -->
      <div class="stats-grid" style="grid-template-columns:repeat(5,1fr)">
        <div class="stat-card">
          <div class="stat-numero">${todasReservas.length}</div>
          <div class="stat-label">Total reservas</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#b45309">${pendientes}</div>
          <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#15803d">${aceptadas}</div>
          <div class="stat-label">Aceptadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#991b1b">${rechazadas}</div>
          <div class="stat-label">Rechazadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#1d4ed8">${completadas}</div>
          <div class="stat-label">Completadas</div>
        </div>
      </div>

      <!-- Filtro por DJ -->
      <div style="margin-bottom:1.5rem; display:flex; align-items:center; gap:1rem; flex-wrap:wrap">
        <h2 style="font-size:1.1rem; font-weight:700">Todas las reservas</h2>
        <select id="filtro-dj-admin"
          style="padding:0.5rem 0.75rem; border:1.5px solid #d1d5db;
                 border-radius:8px; font-size:0.9rem; outline:none; font-family:inherit">
          <option value="">Todos los DJs</option>
          ${djs.map(dj => `<option value="${dj.id}">${dj.nombre}</option>`).join("")}
        </select>
        <select id="filtro-estado-admin"
          style="padding:0.5rem 0.75rem; border:1.5px solid #d1d5db;
                 border-radius:8px; font-size:0.9rem; outline:none; font-family:inherit">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aceptada">Aceptada</option>
          <option value="rechazada">Rechazada</option>
          <option value="completada">Completada</option>
        </select>
      </div>

      <!-- Lista de reservas -->
      <div id="lista-admin" class="reservas-grid">
        ${todasReservas.length === 0
          ? `<div class="vacio">
               <div class="vacio-emoji">📋</div>
               <p>No hay reservas en la plataforma</p>
             </div>`
          : todasReservas.map(r => tarjetaAdmin(r)).join("")
        }
      </div>

    </div>`;

  // Conectar filtros
  const filtroDJ     = document.getElementById("filtro-dj-admin");
  const filtroEstado = document.getElementById("filtro-estado-admin");

  function aplicarFiltros() {
    const djSelec     = filtroDJ.value;
    const estadoSelec = filtroEstado.value;
    const filtradas   = todasReservas.filter(r => {
      if (djSelec     && r.idDJ    !== djSelec)     return false;
      if (estadoSelec && r.estado  !== estadoSelec)  return false;
      return true;
    });
    document.getElementById("lista-admin").innerHTML =
      filtradas.length === 0
        ? `<div class="vacio"><div class="vacio-emoji">📋</div><p>No hay reservas con esos filtros</p></div>`
        : filtradas.map(r => tarjetaAdmin(r)).join("");
    conectarBotonesAdmin(datos);
  }

  filtroDJ.addEventListener("change",     aplicarFiltros);
  filtroEstado.addEventListener("change", aplicarFiltros);

  conectarBotonesAdmin(datos);
}

function tarjetaAdmin(r) {
  const acciones = r.estado === "pendiente" ? `
    <div class="reserva-acciones">
      <button class="btn btn-primary btn-aceptar-admin" data-id="${r.id}">Aceptar</button>
      <button class="btn btn-secondary btn-rechazar-admin" data-id="${r.id}">Rechazar</button>
    </div>` : "";

  return `
    <div class="reserva-card">
      <div class="reserva-header">
        <span class="reserva-evento">${r.evento}</span>
        <span class="badge badge-${r.estado}">${r.estado}</span>
      </div>
      <p class="reserva-fecha">📅 ${r.fecha}</p>
      <p style="font-size:0.85rem; color:#7B2FBE; font-weight:600">
        🎧 DJ: ${r.nombreDJ || "DJ Anónimo"}
      </p>
      <p style="font-size:0.85rem; color:#6b7280; font-weight:600">
        👤 Contratante: ${r.nombreUsuario || "Desconocido"}
      </p>
      ${r.mensaje
        ? `<p style="font-size:0.85rem; color:#6b7280; font-style:italic">"${r.mensaje}"</p>`
        : ""}
      ${r.pagado
        ? `<p style="color:#15803d; font-size:0.82rem; font-weight:600">✔ Pago realizado</p>`
        : ""}
      ${acciones}
    </div>`;
}

function conectarBotonesAdmin(datos) {
  document.querySelectorAll(".btn-aceptar-admin").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled    = true;
      btn.textContent = "Procesando...";
      await updateDoc(doc(db, "reservas", btn.dataset.id), {
        estado:        "aceptada",
        actualizadoEn: serverTimestamp()
      });
      await dashboardAdmin(datos);
    });
  });

  document.querySelectorAll(".btn-rechazar-admin").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled    = true;
      btn.textContent = "Procesando...";
      await updateDoc(doc(db, "reservas", btn.dataset.id), {
        estado:        "rechazada",
        actualizadoEn: serverTimestamp()
      });
      await dashboardAdmin(datos);
    });
  });
}

// ══════════════════════════════════════════════════════════
// DASHBOARD CONTRATANTE
// ══════════════════════════════════════════════════════════
async function dashboardContratante(uid, datos) {
  const q = query(
    collection(db, "reservas"),
    where("idUsuario", "==", uid),
    orderBy("creadoEn", "desc")
  );
  const snap = await getDocs(q);

  const reservas = await Promise.all(
    snap.docs.map(async (d) => {
      const reserva = { id: d.id, ...d.data() };
      try {
        const djSnap = await getDoc(doc(db, "djs", reserva.idDJ));
        if (djSnap.exists()) reserva.nombreDJ = djSnap.data().nombre;
      } catch (e) {}
      return reserva;
    })
  );

  const pendientes  = reservas.filter(r => r.estado === "pendiente").length;
  const aceptadas   = reservas.filter(r => r.estado === "aceptada").length;
  const completadas = reservas.filter(r => r.estado === "completada").length;

  contenido.innerHTML = `
    <div class="dashboard">
      <div class="dashboard-header">
        <div>
          <h1>Hola, ${datos.nombre.split(" ")[0]} 👋</h1>
          <p>Panel de contratante · gestiona tus reservas</p>
        </div>
        <a href="marketplace.html" class="btn btn-primary">Buscar DJs</a>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-numero">${reservas.length}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#b45309">${pendientes}</div>
          <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#15803d">${aceptadas}</div>
          <div class="stat-label">Aceptadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#1d4ed8">${completadas}</div>
          <div class="stat-label">Completadas</div>
        </div>
      </div>

      <h2 style="font-size:1.1rem; font-weight:700; margin-bottom:1rem">Mis reservas</h2>
      <div class="reservas-grid">
        ${reservas.length === 0
          ? `<div class="vacio">
               <div class="vacio-emoji">📋</div>
               <p>Aún no has hecho ninguna reserva</p>
             </div>`
          : reservas.map(r => tarjetaContratante(r)).join("")
        }
      </div>
    </div>`;

  document.querySelectorAll(".btn-pago").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled    = true;
      btn.textContent = "Procesando...";
      await updateDoc(doc(db, "reservas", btn.dataset.id), {
        pagado:    true,
        estado:    "completada",
        fechaPago: serverTimestamp()
      });
      await dashboardContratante(uid, datos);
    });
  });
  conectarBotonesValorar();
}

function tarjetaContratante(r) {
  const btnPago = r.estado === "aceptada" && !r.pagado
    ? `<button class="btn btn-primary btn-pago" data-id="${r.id}"
         style="font-size:0.82rem; margin-top:0.25rem">
         💳 Simular pago
       </button>` : "";

  const btnValorar = r.estado === "completada" && !r.valorado
    ? `<button class="btn btn-secondary btn-valorar"
         data-id="${r.id}" data-dj="${r.idDJ}"
         style="font-size:0.82rem; margin-top:0.25rem">
         ⭐ Valorar DJ
       </button>` : "";

  const yaValorado = r.valorado
    ? `<p style="color:#f59e0b; font-size:0.82rem; font-weight:600">
         ⭐ Ya has valorado este evento
       </p>` : "";

  return `
    <div class="reserva-card">
      <div class="reserva-header">
        <span class="reserva-evento">${r.evento}</span>
        <span class="badge badge-${r.estado}">${r.estado}</span>
      </div>
      <p class="reserva-fecha">📅 ${r.fecha}</p>
      <p style="font-size:0.85rem; color:#7B2FBE; font-weight:600">
        🎧 DJ: ${r.nombreDJ || "DJ Anónimo"}
      </p>
      ${r.mensaje
        ? `<p style="font-size:0.85rem; color:#6b7280; font-style:italic">"${r.mensaje}"</p>`
        : ""}
      ${r.pagado
        ? `<p style="color:#15803d; font-size:0.82rem; font-weight:600">✔ Pago realizado</p>`
        : ""}
      ${yaValorado}
      ${btnPago}
      ${btnValorar}
    </div>`;
}

// ══════════════════════════════════════════════════════════
// DASHBOARD DJ
// ══════════════════════════════════════════════════════════
async function dashboardDJ(uid, datos) {
  const q = query(
    collection(db, "reservas"),
    where("idDJ", "==", uid),
    orderBy("creadoEn", "desc")
  );
  const snap     = await getDocs(q);
  const reservas = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const pendientes  = reservas.filter(r => r.estado === "pendiente").length;
  const aceptadas   = reservas.filter(r => r.estado === "aceptada").length;
  const completadas = reservas.filter(r => r.estado === "completada").length;

  contenido.innerHTML = `
    <div class="dashboard">
      <div class="dashboard-header">
        <div>
          <h1>Hola, ${datos.nombre.split(" ")[0]} 👋</h1>
          <p>Panel de DJ · gestiona tus solicitudes</p>
        </div>
        <a href="editar-perfil.html" class="btn btn-secondary">Editar perfil</a>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-numero">${reservas.length}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#b45309">${pendientes}</div>
          <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#15803d">${aceptadas}</div>
          <div class="stat-label">Aceptadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-numero" style="color:#1d4ed8">${completadas}</div>
          <div class="stat-label">Completadas</div>
        </div>
      </div>

      <h2 style="font-size:1.1rem; font-weight:700; margin-bottom:1rem">Solicitudes recibidas</h2>
      <div class="reservas-grid">
        ${reservas.length === 0
          ? `<div class="vacio">
               <div class="vacio-emoji">📋</div>
               <p>Aún no has recibido solicitudes</p>
             </div>`
          : reservas.map(r => tarjetaDJ(r)).join("")
        }
      </div>
    </div>`;

  document.querySelectorAll(".btn-aceptar").forEach(btn => {
    btn.addEventListener("click", () => cambiarEstado(btn, "aceptada", uid, datos));
  });
  document.querySelectorAll(".btn-rechazar").forEach(btn => {
    btn.addEventListener("click", () => cambiarEstado(btn, "rechazada", uid, datos));
  });
}

function tarjetaDJ(r) {
  const acciones = r.estado === "pendiente" ? `
    <div class="reserva-acciones">
      <button class="btn btn-primary btn-aceptar" data-id="${r.id}">Aceptar</button>
      <button class="btn btn-secondary btn-rechazar" data-id="${r.id}">Rechazar</button>
    </div>` : "";
  return `
    <div class="reserva-card">
      <div class="reserva-header">
        <span class="reserva-evento">${r.evento}</span>
        <span class="badge badge-${r.estado}">${r.estado}</span>
      </div>
      <p class="reserva-fecha">📅 ${r.fecha}</p>
      ${r.pagado
        ? `<p style="color:#15803d; font-size:0.82rem; font-weight:600">✔ Pago recibido</p>`
        : ""}
      ${acciones}
    </div>`;
}

async function cambiarEstado(btn, nuevoEstado, uid, datos) {
  btn.disabled = true;
  await updateDoc(doc(db, "reservas", btn.dataset.id), {
    estado:        nuevoEstado,
    actualizadoEn: serverTimestamp()
  });
  await dashboardDJ(uid, datos);
}

// ══════════════════════════════════════════════════════════
// SISTEMA DE VALORACIONES
// ══════════════════════════════════════════════════════════
function conectarBotonesValorar() {
  document.querySelectorAll(".btn-valorar").forEach(btn => {
    btn.addEventListener("click", () => {
      mostrarModalValoracion(btn.dataset.id, btn.dataset.dj);
    });
  });
}

function mostrarModalValoracion(idReserva, idDJ) {
  const modal = document.createElement("div");
  modal.id = "modal-valoracion";
  modal.style.cssText = `
    position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.5); z-index:1000;
    display:flex; align-items:center; justify-content:center`;

  modal.innerHTML = `
    <div style="background:white; border-radius:20px; padding:2rem;
                width:90%; max-width:440px; box-shadow:0 20px 60px rgba(0,0,0,0.3)">
      <h2 style="font-size:1.3rem; font-weight:700; margin-bottom:0.25rem">⭐ Valorar DJ</h2>
      <p style="color:#6b7280; font-size:0.88rem; margin-bottom:1.5rem">
        Comparte tu experiencia con la comunidad
      </p>
      <div style="margin-bottom:1.25rem">
        <label style="font-size:0.85rem; font-weight:600; color:#374151;
                      display:block; margin-bottom:0.5rem">Puntuación</label>
        <div id="estrellas-selector"
             style="display:flex; gap:0.5rem; font-size:2rem; cursor:pointer">
          <span class="estrella" data-valor="1">☆</span>
          <span class="estrella" data-valor="2">☆</span>
          <span class="estrella" data-valor="3">☆</span>
          <span class="estrella" data-valor="4">☆</span>
          <span class="estrella" data-valor="5">☆</span>
        </div>
      </div>
      <div style="margin-bottom:1.25rem">
        <label style="font-size:0.85rem; font-weight:600; color:#374151;
                      display:block; margin-bottom:0.5rem">Comentario</label>
        <textarea id="comentario-valoracion" rows="3"
          placeholder="¿Cómo fue tu experiencia con este DJ?"
          style="width:100%; padding:0.6rem 0.9rem; border:1.5px solid #d1d5db;
                 border-radius:8px; font-family:inherit; font-size:0.95rem;
                 resize:none; outline:none"></textarea>
      </div>
      <div id="alerta-valoracion" style="display:none; background:#fef2f2;
           border:1px solid #fecaca; color:#dc2626; padding:0.6rem 0.9rem;
           border-radius:8px; font-size:0.85rem; margin-bottom:1rem"></div>
      <div style="display:flex; gap:0.75rem">
        <button id="btn-cancelar-valoracion" class="btn btn-secondary" style="flex:1">
          Cancelar
        </button>
        <button id="btn-enviar-valoracion" class="btn btn-primary" style="flex:1">
          Enviar valoración
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  let puntuacion = 0;
  const estrellas = modal.querySelectorAll(".estrella");

  estrellas.forEach(estrella => {
    estrella.addEventListener("mouseover", () => {
      const val = parseInt(estrella.dataset.valor);
      estrellas.forEach((e, i) => {
        e.textContent = i < val ? "★" : "☆";
        e.style.color = i < val ? "#f59e0b" : "#d1d5db";
      });
    });
    estrella.addEventListener("click", () => {
      puntuacion = parseInt(estrella.dataset.valor);
    });
  });

  modal.querySelector("#estrellas-selector").addEventListener("mouseleave", () => {
    estrellas.forEach((e, i) => {
      e.textContent = i < puntuacion ? "★" : "☆";
      e.style.color = i < puntuacion ? "#f59e0b" : "#d1d5db";
    });
  });

  modal.querySelector("#btn-cancelar-valoracion").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.querySelector("#btn-enviar-valoracion").addEventListener("click", async () => {
    const comentario = modal.querySelector("#comentario-valoracion").value.trim();
    const alertaVal  = modal.querySelector("#alerta-valoracion");

    if (puntuacion === 0) {
      alertaVal.textContent   = "Por favor selecciona una puntuación.";
      alertaVal.style.display = "block";
      return;
    }

    const btnEnviar       = modal.querySelector("#btn-enviar-valoracion");
    btnEnviar.disabled    = true;
    btnEnviar.textContent = "Enviando...";

    try {
      await addDoc(collection(db, "valoraciones"), {
        idReserva, idDJ,
        idUsuario:  usuarioActual.uid,
        puntuacion,
        comentario,
        creadoEn:   serverTimestamp()
      });

      await updateDoc(doc(db, "reservas", idReserva), { valorado: true });
      await actualizarMediaDJ(idDJ);

      document.body.removeChild(modal);
      const snap = await getDoc(doc(db, "usuarios", usuarioActual.uid));
      await dashboardContratante(usuarioActual.uid, snap.data());

    } catch (error) {
      alertaVal.textContent   = "Error al enviar. Inténtalo de nuevo.";
      alertaVal.style.display = "block";
      console.error(error);
      btnEnviar.disabled    = false;
      btnEnviar.textContent = "Enviar valoración";
    }
  });
}

async function actualizarMediaDJ(idDJ) {
  const q    = query(collection(db, "valoraciones"), where("idDJ", "==", idDJ));
  const snap = await getDocs(q);
  const vals = snap.docs.map(d => d.data().puntuacion);
  if (vals.length === 0) return;
  const media = vals.reduce((a, b) => a + b, 0) / vals.length;
  await updateDoc(doc(db, "djs", idDJ), {
    valoracion:      parseFloat(media.toFixed(1)),
    numValoraciones: vals.length
  });
}