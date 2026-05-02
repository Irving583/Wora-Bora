// js/marketplace.js
// Carga los DJs desde Firestore y aplica los filtros

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, query, where }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const listaDjs       = document.getElementById("lista-djs");
const resultadosInfo = document.getElementById("resultados-info");
const filtroNombre   = document.getElementById("filtro-nombre");
const filtroGenero   = document.getElementById("filtro-genero");
const filtroCiudad   = document.getElementById("filtro-ciudad");
const filtroTarifa   = document.getElementById("filtro-tarifa");

const navLogin     = document.getElementById("nav-login");
const navRegister  = document.getElementById("nav-register");
const navDashboard = document.getElementById("nav-dashboard");
const navLogout    = document.getElementById("nav-logout");

onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    if (navLogin)     navLogin.style.display     = "none";
    if (navRegister)  navRegister.style.display  = "none";
    if (navDashboard) navDashboard.style.display = "inline-block";
    if (navLogout)    navLogout.style.display     = "inline-block";
  }
});

if (navLogout) {
  navLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.reload();
  });
}

let todosDJs = [];

// ── Cargar DJs desde Firestore ─────────────────────────────
async function cargarDJs() {
  listaDjs.innerHTML = '<div class="spinner"></div>';
  try {
    const q        = query(collection(db, "djs"), where("disponible", "==", true));
    const snapshot = await getDocs(q);
    todosDJs       = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Leer genero de la URL si viene desde la pagina de inicio
    const params    = new URLSearchParams(window.location.search);
    const generoURL = params.get("genero");
    if (generoURL && filtroGenero) {
      filtroGenero.value = generoURL;
      aplicarFiltros();
    } else {
      mostrarDJs(todosDJs);
    }

  } catch (error) {
    listaDjs.innerHTML = `
      <div class="vacio">
        <p>Error al cargar los DJs.</p>
      </div>`;
    console.error(error);
  }
}

// ── Crear tarjeta estilo Real Madrid ───────────────────────
function crearTarjeta(dj) {
  const nombre  = dj.nombre || "DJ Anonimo";
  const inicial = nombre[0].toUpperCase();
  const tarifa  = dj.tarifa > 0 ? `${dj.tarifa} EUR` : "A consultar";

  const colores = [
    { bg: "#4A148C", color: "#EDE7F6" },
    { bg: "#880E4F", color: "#FCE4EC" },
    { bg: "#0D47A1", color: "#E3F2FD" },
    { bg: "#1B5E20", color: "#E8F5E9" },
    { bg: "#E65100", color: "#FFF3E0" },
    { bg: "#6A1B9A", color: "#F3E5F5" },
  ];
  const color = colores[nombre.charCodeAt(0) % colores.length];

  let estrellas = "";
  if (dj.valoracion > 0) {
    const llenas = Math.round(dj.valoracion);
    estrellas = `<span style="color:#f59e0b; font-size:0.85rem">
      ${"★".repeat(llenas)}${"☆".repeat(5 - llenas)}
    </span>`;
  }

  const tags = dj.generos?.length > 0
    ? dj.generos.map(g => `
        <span style="background:rgba(255,255,255,0.2); color:white;
                     padding:0.15rem 0.6rem; border-radius:999px;
                     font-size:0.75rem; font-weight:600">
          ${g}
        </span>`).join("")
    : "";

  const fondoHTML = dj.fotoPerfil
    ? `background: url('${dj.fotoPerfil}') center/cover no-repeat`
    : `background: linear-gradient(135deg, ${color.bg}, #7B2FBE)`;

  return `
    <a href="perfil.html?id=${dj.id}"
       style="text-decoration:none; display:block;
              border-radius:16px; overflow:hidden;
              position:relative; aspect-ratio:3/4;
              cursor:pointer; box-shadow:0 4px 20px rgba(0,0,0,0.15);
              transition:transform 0.3s, box-shadow 0.3s"
       onmouseover="this.style.transform='translateY(-6px)';
                   this.style.boxShadow='0 16px 40px rgba(0,0,0,0.25)'"
       onmouseout="this.style.transform='translateY(0)';
                  this.style.boxShadow='0 4px 20px rgba(0,0,0,0.15)'">

      <div style="${fondoHTML}; width:100%; height:100%; position:absolute; inset:0"></div>

      ${!dj.fotoPerfil ? `
        <div style="position:absolute; inset:0; display:flex;
                    align-items:center; justify-content:center">
          <span style="font-size:5rem; font-weight:900; color:rgba(255,255,255,0.3)">
            ${inicial}
          </span>
        </div>` : ""}

      <div style="position:absolute; inset:0;
                  background:linear-gradient(to top,
                    rgba(0,0,0,0.9) 0%,
                    rgba(0,0,0,0.4) 50%,
                    rgba(0,0,0,0) 100%)">
      </div>

      <div style="position:absolute; bottom:0; left:0; right:0; padding:1.5rem 1.25rem">

        ${tags ? `<div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.5rem">
          ${tags}
        </div>` : ""}

        <h3 style="color:white; font-size:1.4rem; font-weight:800;
                   margin-bottom:0.25rem; line-height:1.2;
                   text-shadow:0 2px 8px rgba(0,0,0,0.5)">
          ${nombre}
        </h3>

        <div style="display:flex; align-items:center;
                    justify-content:space-between; flex-wrap:wrap; gap:0.5rem">
          <p style="color:rgba(255,255,255,0.8); font-size:0.85rem; margin:0">
            ${dj.ciudad ? dj.ciudad : ""}
          </p>
          <p style="color:white; font-weight:700; font-size:0.9rem; margin:0;
                    background:rgba(123,47,190,0.8); padding:0.2rem 0.6rem;
                    border-radius:999px">
            ${tarifa}
          </p>
        </div>

        ${estrellas ? `<div style="margin-top:0.4rem">${estrellas}</div>` : ""}

      </div>

      <div style="position:absolute; inset:0; background:rgba(123,47,190,0);
                  transition:background 0.3s; display:flex; align-items:center;
                  justify-content:center"
           onmouseover="this.style.background='rgba(123,47,190,0.2)'"
           onmouseout="this.style.background='rgba(123,47,190,0)'">
      </div>

    </a>`;
}

// ── Mostrar lista de DJs ───────────────────────────────────
function mostrarDJs(djs) {
  resultadosInfo.textContent =
    `${djs.length} DJ${djs.length !== 1 ? "s" : ""} encontrado${djs.length !== 1 ? "s" : ""}`;

  if (djs.length === 0) {
    listaDjs.innerHTML = `
      <div class="vacio">
        <p>No se encontraron DJs con esos filtros</p>
      </div>`;
    return;
  }

  listaDjs.innerHTML = djs.map(dj => crearTarjeta(dj)).join("");
}

// ── Filtros ────────────────────────────────────────────────
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

filtroNombre.addEventListener("input",  aplicarFiltros);
filtroGenero.addEventListener("change", aplicarFiltros);
filtroCiudad.addEventListener("input",  aplicarFiltros);
filtroTarifa.addEventListener("input",  aplicarFiltros);

cargarDJs();