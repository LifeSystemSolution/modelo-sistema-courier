import { db, auth } from "./firebase-config.js";
import { showInfo, showLoader, hideLoader } from "./ui.js";
import { estadoLabel, formatoFecha, envioSearchText } from "./domain.js";
import { getAccessibleEnvios } from "./permissions.js";

function renderTimeline(historial = []) {
  const timelineEl = document.getElementById("trackingTimeline");
  if (!Array.isArray(historial) || historial.length === 0) { timelineEl.innerHTML = '<li class="timeline-item"><div class="text-muted">Sin historial registrado.</div></li>'; return; }
  const ordenado = [...historial].sort((a,b)=>(b?.fecha?.toMillis?.()||0)-(a?.fecha?.toMillis?.()||0));
  timelineEl.innerHTML = ordenado.map((item)=>`<li class="timeline-item"><div class="timeline-dot"></div><div><div class="fw-semibold">${estadoLabel(item.estadoNuevo || item.estado)}</div><small class="text-muted">${formatoFecha(item.fecha)} · ${item.hora || ""}</small><div class="small">${item.estadoAnterior ? `${estadoLabel(item.estadoAnterior)} → ` : ""}${estadoLabel(item.estadoNuevo || item.estado)}</div><div class="small text-muted">Usuario: ${item.usuario || "-"}${item.observacion ? ` · Obs: ${item.observacion}` : ""}</div></div></li>`).join("");
}

window.buscarEnvio = async function () {
  const user = auth.currentUser; const input = document.getElementById("codigoBusqueda"); const resultadoEl = document.getElementById("resultadoTracking"); const vacioEl = document.getElementById("trackingVacio"); const texto = input.value.trim().toLowerCase(); resultadoEl.classList.add("d-none"); vacioEl.classList.add("d-none"); if (!texto) return showInfo("Ingresa un dato de búsqueda."); if (!user) return;
  showLoader();
  try { const rows = (await getAccessibleEnvios()).filter((d)=>envioSearchText(d).includes(texto)); if (!rows.length) { vacioEl.classList.remove("d-none"); return; } const envio = rows[0]; document.getElementById("trackingCliente").innerText = `${envio.cliente_nombre || "Sin cliente"} (${envio.cliente_documento || "sin documento"})`; document.getElementById("trackingDestinatario").innerText = envio.destinatario?.nombreCompleto || envio.destinatario?.nombre || "Sin destinatario"; const estadoEl = document.getElementById("trackingEstado"); estadoEl.innerText = estadoLabel(envio.estado); estadoEl.className = "badge text-bg-primary"; renderTimeline(envio.historial); resultadoEl.classList.remove("d-none"); } finally { hideLoader(); }
};
document.getElementById("codigoBusqueda")?.addEventListener("keydown", (e)=>{ if(e.key === "Enter") { e.preventDefault(); buscarEnvio(); } });
