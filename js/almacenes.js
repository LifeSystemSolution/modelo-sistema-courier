import { auth, db } from "./firebase-config.js";
import { showError, showLoader, hideLoader, showValidationErrors, toast } from "./ui.js";
import { collection, addDoc, doc, getDocs, query, updateDoc, Timestamp } from "./demo/firebase-firestore.js";
import { isAdmin } from "./permissions.js";
import { EMPRESA_INICIAL, ESTADOS_USUARIO, normalizeEstado } from "./roles.js";

function currentUserIsAdmin() { return isAdmin(window.currentUserRole); }
function badge(estado) { const e = normalizeEstado(estado); return `<span class="badge text-bg-${e === ESTADOS_USUARIO.INACTIVO ? "secondary" : "success"}">${e}</span>`; }

async function cargarAlmacenes() {
  if (!currentUserIsAdmin()) return;
  const snap = await getDocs(query(collection(db, "almacenes")));
  const almacenes = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  document.getElementById("tablaAlmacenes").innerHTML = almacenes.map((a) => `<tr><td>${a.nombre || "-"}</td><td>${a.ciudad || "-"}</td><td>${a.direccion || "-"}</td><td>${badge(a.estado)}</td><td><button class="btn btn-sm btn-outline-secondary" onclick="toggleAlmacen('${a.id}','${normalizeEstado(a.estado) === ESTADOS_USUARIO.INACTIVO ? ESTADOS_USUARIO.ACTIVO : ESTADOS_USUARIO.INACTIVO}')">${normalizeEstado(a.estado) === ESTADOS_USUARIO.INACTIVO ? "Activar" : "Desactivar"}</button></td></tr>`).join("") || '<tr><td colspan="5" class="text-muted">Sin almacenes registrados.</td></tr>';
}

window.guardarAlmacen = async function () {
  if (!currentUserIsAdmin()) return showError("Solo un administrador puede gestionar almacenes.");
  const nombre = document.getElementById("almacenNombre").value.trim();
  const ciudad = document.getElementById("almacenCiudad").value.trim();
  const direccion = document.getElementById("almacenDireccion").value.trim();
  const estado = document.getElementById("almacenEstado").value;
  const errores = [];
  if (!nombre) errores.push("El nombre del almacén es obligatorio.");
  if (!ciudad) errores.push("La ciudad del almacén es obligatoria.");
  if (!direccion) errores.push("La dirección del almacén es obligatoria.");
  if (errores.length) return showValidationErrors(errores);
  showLoader();
  try {
    await addDoc(collection(db, "almacenes"), { nombre, ciudad, direccion, estado: normalizeEstado(estado), empresaId: EMPRESA_INICIAL.id, creadoEn: Timestamp.now(), creadoPor: auth.currentUser?.uid || "" });
    ["almacenNombre", "almacenCiudad", "almacenDireccion"].forEach((id) => document.getElementById(id).value = "");
    await cargarAlmacenes();
    await toast("Almacén guardado correctamente");
  } catch (e) { await showError("No se pudo guardar el almacén."); }
  finally { hideLoader(); }
};

window.toggleAlmacen = async (id, estado) => { showLoader(); try { await updateDoc(doc(db, "almacenes", id), { estado, actualizadoEn: Timestamp.now() }); await cargarAlmacenes(); } finally { hideLoader(); } };
const ready = setInterval(() => { if (!window.currentUserRole) return; clearInterval(ready); document.getElementById(currentUserIsAdmin() ? "adminOnlyContent" : "noAdmin").classList.remove("d-none"); cargarAlmacenes(); }, 150);
