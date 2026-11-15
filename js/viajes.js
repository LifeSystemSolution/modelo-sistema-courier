import { auth, db } from "./firebase-config.js";
import { showError, showLoader, hideLoader, toast } from "./ui.js";
import { estadoLabel } from "./domain.js";
import { getAccessibleEnvios } from "./permissions.js";
import { onAuthStateChanged } from "./demo/firebase-auth.js";
import { arrayUnion, doc, getDoc, Timestamp, updateDoc } from "./demo/firebase-firestore.js";

let viajes = [];
function currentUserLabel() { return document.getElementById("usuarioNombre")?.innerText || auth.currentUser?.email || "Transportista"; }
function movimiento(anterior, nuevo, observacion = "Llegó al almacén") { const ahora = new Date(); return { usuario: currentUserLabel(), user_id: auth.currentUser?.uid || "", fecha: Timestamp.now(), hora: ahora.toLocaleTimeString("es-PE"), estadoAnterior: anterior, estadoNuevo: nuevo, observacion, estado: nuevo }; }
function origen(d) { return d.origen || d.almacen_origen_nombre || d.almacenOrigenNombre || "-"; }
function destino(d) { return d.destino || d.almacen_destino_nombre || d.almacenDestinoNombre || d.ciudad || "-"; }
function puedeMarcarLlegada(d) { return ["recibido", "almacen_origen", "en_ruta"].includes(d.estado); }

function renderViajes() {
  document.getElementById("tablaViajes").innerHTML = viajes.map((d) => {
    const boton = puedeMarcarLlegada(d) ? `<button class="btn btn-sm btn-primary" onclick="llegoAlmacen('${d.id}')">Llegó al almacén</button>` : '<span class="text-muted small">Sin acción</span>';
    return `<tr><td><strong>${d.codigo || d.id}</strong></td><td>${origen(d)}</td><td>${destino(d)}</td><td>${d.cantidad_paquetes || d.cantidad || 1}</td><td><span class="badge text-bg-secondary">${estadoLabel(d.estado)}</span></td><td>${boton}</td></tr>`;
  }).join("") || '<tr><td colspan="6" class="text-muted">No tienes viajes asignados.</td></tr>';
}

async function cargarViajes() {
  showLoader();
  try {
    viajes = (await getAccessibleEnvios()).sort((a, b) => (b.fecha?.toMillis?.() || b.fecha_ingreso?.toMillis?.() || 0) - (a.fecha?.toMillis?.() || a.fecha_ingreso?.toMillis?.() || 0));
    renderViajes();
  } finally { hideLoader(); }
}

window.llegoAlmacen = async function (id) {
  showLoader();
  try {
    const ref = doc(db, "envios", id);
    const snap = await getDoc(ref);
    const actual = snap.data().estado;
    await updateDoc(ref, { estado: "almacen_destino", llegoAlmacenPor: currentUserLabel(), llegoAlmacenEn: Timestamp.now(), historial: arrayUnion(movimiento(actual, "almacen_destino")) });
    await cargarViajes();
    await toast("Viaje marcado como llegado al almacén");
  } catch (e) { await showError("No se pudo actualizar el viaje."); }
  finally { hideLoader(); }
};

onAuthStateChanged(auth, (user) => { if (user) cargarViajes(); });
