// js/dashboard.js
// Panel de control — diferente según si eres DJ o contratante

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where,
         orderBy, getDocs, updateDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const contenido = document.getElementById("contenido");
const btnLogout = document.getElementById("btn-logout");

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

  const snap = await getDoc(doc(db, "usuarios", usuario.uid));
  const datos = snap.data();

  if (datos.rol === "dj") {
    await dashboardDJ(usuario.uid, datos);
  } else {
    await dashboardContratante(usuario.uid, datos);
  }
});

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

  // Cargar nombre del DJ para cada reserva
  const reservas = await Promise.all(
    snap.docs.map(async (d) => {
      const reserva = { id: d.id, ...d.data() };
      try {
        const djSnap = await getDoc(doc(db, "djs", reserva.idDJ));
        if (djSnap.exists()) {
          reserva.nombreDJ = djSnap.data().nombre;
        }
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
      btn.disabled = true;
      btn.textContent = "Procesando...";
      await updateDoc(doc(db, "reservas", btn.dataset.id), {
        pagado: true,
        estado: "completada",
        fechaPago: serverTimestamp()
      });
      await dashboardContratante(uid, datos);
    });
  });
}

function tarjetaContratante(r) {
  const btnPago = r.estado === "aceptada" && !r.pagado
    ? `<button class="btn btn-primary btn-pago" data-id="${r.id}"
         style="font-size:0.82rem; margin-top:0.25rem">
         💳 Simular pago
       </button>` : "";
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
        ? `<p style="font-size:0.85rem; color:#6b7280; font-style:italic">
             "${r.mensaje}"
           </p>`
        : ""}
      ${r.pagado
        ? `<p style="color:#15803d; font-size:0.82rem; font-weight:600">
             ✔ Pago realizado
           </p>`
        : ""}
      ${btnPago}
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
    estado: nuevoEstado,
    actualizadoEn: serverTimestamp()
  });
  await dashboardDJ(uid, datos);
}