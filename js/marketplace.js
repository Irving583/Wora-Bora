// js/marketplace.js
// Carga los DJs desde Firestore y aplica los filtros

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, query, where }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Elementos del HTML
const listaDjs       = document.getElementById("lista-djs");
const resultadosInfo = document.getElementById("resultados-info");
const filtroNombre   = document.getElementById("filtro-nombre");
const filtroGenero   = document.getElementById("filtro-genero");
const filtroCiudad   = document.getElementById("filtro-ciudad");
const filtroTarifa   = document.getElementById("filtro-tarifa");

// Navbar dinámico según sesión
const navLogin    = document.getElementById("nav-login");
const navRegister = document.getElementById("nav-register");
const navDashboard= document.getElementById("nav-dashboard");
const navLogout   = document.getElementById("nav-logout");

onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    navLogin.style.display     = "none";
    navRegister.style.display  = "none";
    navDashboard.style.display = "inline-block";
    navLogout.style.display    = "inline-block";
  }
});

if (navLogout) {
  navLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.reload();
  });
}

// Guardamos todos los DJs en memoria para filtrar sin nuevas peticiones
let todosDJs = [];

// ── Cargar DJs desde Firestore ─────────────────────────────
async function cargarDJs() {
  listaDjs.innerHTML = '<div class="spinner"></div>';

  try {
    const q        = query(collection(db, "djs"), where("disponible", "==", true));
    const snapshot = await getDocs(q);
    todosDJs       = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    mostrarDJs(todosDJs);
  } catch (error) {
    listaDjs.innerHTML = `
      <div class="vacio">
        <div class="vacio-emoji">⚠️</div>
        <p>Error al cargar los DJs.</p>
      </div>`;
    console.error(error);
  }
}

// ── Crear HTML de una tarjeta DJ ───────────────────────────
function crearTarjeta(dj) {
  const inicial = dj.nombre ? dj.nombre[0].toUpperCase() : "D";
  const tarifa  = dj.tarifa > 0 ? `${dj.tarifa} €/evento` : "Tarifa a consultar";
  const ciudad  = dj.ciudad ? `<p class="dj-city">📍 ${dj.ciudad}</p>` : "";
  const colores = [
  { bg: "#EDE7F6", color: "#4A148C" },
  { bg: "#FCE4EC", color: "#880E4F" },
  { bg: "#E3F2FD", color: "#0D47A1" },
  { bg: "#E8F5E9", color: "#1B5E20" },
  { bg: "#FFF3E0", color: "#E65100" },
  { bg: "#F3E5F5", color: "#6A1B9A" },
];
const color = colores[dj.nombre?.charCodeAt(0) % colores.length] || colores[0];

  // Estrellas
  let estrellas = "";
  if (dj.valoracion > 0) {
    const llenas = Math.round(dj.valoracion);
    estrellas = `<p class="stars">${"★".repeat(llenas)}${"☆".repeat(5 - llenas)}</p>`;
  }

  // Tags de géneros
  const tags = dj.generos && dj.generos.length > 0
    ? `<div class="dj-generos">
         ${dj.generos.map(g => `<span class="tag">${g}</span>`).join("")}
       </div>`
    : "";

  return `
    <div class="dj-card">
      <div class="dj-avatar">${inicial}</div>
      <p class="dj-name">${dj.nombre || "DJ Anónimo"}</p>
      ${ciudad}
      ${estrellas}
      ${tags}
      <p class="dj-tarifa">${tarifa}</p>
      <a href="perfil.html?id=${dj.id}" class="btn btn-primary" style="width:100%">
        Ver perfil
      </a>
    </div>`;
}

// ── Mostrar lista de DJs ───────────────────────────────────
function mostrarDJs(djs) {
  resultadosInfo.textContent =
    `${djs.length} DJ${djs.length !== 1 ? "s" : ""} encontrado${djs.length !== 1 ? "s" : ""}`;

  if (djs.length === 0) {
    listaDjs.innerHTML = `
      <div class="vacio">
        <div class="vacio-emoji">🎧</div>
        <p>No se encontraron DJs con esos filtros</p>
      </div>`;
    return;
  }

  listaDjs.innerHTML = djs.map(dj => crearTarjeta(dj)).join("");
}

// ── Filtrar sin nueva petición a Firebase ──────────────────
function aplicarFiltros() {
  const nombre = filtroNombre.value.trim().toLowerCase();
  const genero = filtroGenero.value;
  const ciudad = filtroCiudad.value.trim().toLowerCase();
  const tarifa = parseFloat(filtroTarifa.value);

  const resultado = todosDJs.filter(dj => {
    if (nombre && !dj.nombre?.toLowerCase().includes(nombre)) return false;
    if (genero && !dj.generos?.includes(genero))               return false;
    if (ciudad && !dj.ciudad?.toLowerCase().includes(ciudad))  return false;
    if (!isNaN(tarifa) && dj.tarifa > tarifa)                  return false;
    return true;
  });

  mostrarDJs(resultado);
}

// ── Escuchar cambios en los filtros ───────────────────────
filtroNombre.addEventListener("input",  aplicarFiltros);
filtroGenero.addEventListener("change", aplicarFiltros);
filtroCiudad.addEventListener("input",  aplicarFiltros);
filtroTarifa.addEventListener("input",  aplicarFiltros);

// ── Arrancar ───────────────────────────────────────────────
cargarDJs();