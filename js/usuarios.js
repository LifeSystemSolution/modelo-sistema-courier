import { auth, db, firebaseConfig } from "./firebase-config.js";
import { showError, showLoader, hideLoader, showValidationErrors, toast } from "./ui.js";
import { initializeApp, deleteApp } from "./demo/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "./demo/firebase-auth.js";
import { collection, doc, getDocs, query, setDoc, updateDoc, Timestamp } from "./demo/firebase-firestore.js";
import { isAdmin, isSuperAdmin } from "./permissions.js";
import { EMPRESA_INICIAL, ESTADOS_USUARIO, normalizeEstado, normalizeRole, ROLES } from "./roles.js";

let almacenes = [];
function currentUserIsAdmin() { return isAdmin(window.currentUserRole); }
function almacenNombre(id) { return almacenes.find((a) => a.id === id)?.nombre || "-"; }
function labelRol(u = {}) { const rol = normalizeRole(u.rol); if (rol === ROLES.OPERADOR) return `Operador - ${almacenNombre(u.almacenId || u.almacen_id)}`; return { SUPER_ADMIN: "Super Administrador", ADMIN: "Administrador", TRANSPORTISTA: "Transportista" }[rol] || rol || "-"; }
function badge(estado) { const e = normalizeEstado(estado); return `<span class="badge text-bg-${e === ESTADOS_USUARIO.INACTIVO ? "secondary" : "success"}">${e}</span>`; }

async function cargarAlmacenes() {
  const snap = await getDocs(query(collection(db, "almacenes")));
  almacenes = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  document.getElementById("usuarioAlmacen").innerHTML = '<option value="">Sin almacén asignado</option>' + almacenes.filter((a) => normalizeEstado(a.estado) !== ESTADOS_USUARIO.INACTIVO).map((a) => `<option value="${a.id}">${a.nombre} - ${a.ciudad || ""}</option>`).join("");
}

async function cargarUsuarios() {
  if (!currentUserIsAdmin()) return;
  await cargarAlmacenes();
  const snap = await getDocs(query(collection(db, "usuarios")));
  document.getElementById("tablaUsuarios").innerHTML = snap.docs.map((d) => {
    const u = d.data();
    const nombre = [u.nombres || u.nombre, u.apellidoPaterno || u.apellido, u.apellidoMaterno].filter(Boolean).join(" ");
    const accion = normalizeRole(u.rol) === ROLES.SUPER_ADMIN ? "Protegido" : `<button class="btn btn-sm btn-outline-secondary" onclick="toggleUsuario('${d.id}','${normalizeEstado(u.estado) === ESTADOS_USUARIO.INACTIVO ? ESTADOS_USUARIO.ACTIVO : ESTADOS_USUARIO.INACTIVO}')">${normalizeEstado(u.estado) === ESTADOS_USUARIO.INACTIVO ? "Activar" : "Desactivar"}</button>`;
    return `<tr><td>${nombre || "-"}</td><td>${u.dni || "-"}</td><td>${u.telefono || "-"}</td><td>${u.email || u.correo || "-"}</td><td>${labelRol(u)}</td><td>${almacenNombre(u.almacenId || u.almacen_id)}</td><td>${badge(u.estado)}</td><td>${accion}</td></tr>`;
  }).join("") || '<tr><td colspan="8" class="text-muted">Sin usuarios registrados.</td></tr>';
}

window.toggleUsuario = async (id, estado) => { showLoader(); try { await updateDoc(doc(db, "usuarios", id), { estado, actualizadoEn: Timestamp.now() }); await cargarUsuarios(); } finally { hideLoader(); } };

window.crearUsuario = async function () {
  if (!currentUserIsAdmin()) return showError("Solo un administrador puede crear usuarios.");
  const nombres = document.getElementById("nombres").value.trim();
  const apellidoPaterno = document.getElementById("apellidoPaterno").value.trim();
  const apellidoMaterno = document.getElementById("apellidoMaterno").value.trim();
  const dni = document.getElementById("dni").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value;
  const rol = normalizeRole(document.getElementById("rol").value);
  const almacen_id = document.getElementById("usuarioAlmacen").value;
  const estado = document.getElementById("estado").value;
  const almacen = almacenes.find((a) => a.id === almacen_id);
  const errores = [];
  if (!nombres) errores.push("Los nombres son obligatorios.");
  if (!apellidoPaterno) errores.push("El apellido paterno es obligatorio.");
  if (!apellidoMaterno) errores.push("El apellido materno es obligatorio.");
  if (!/^\d{8}$/.test(dni)) errores.push("El DNI debe tener 8 dígitos.");
  if (!/^\d{9}$/.test(telefono)) errores.push("El teléfono debe tener 9 dígitos.");
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.push("Ingresa un correo válido.");
  if (!password || password.length < 6) errores.push("La contraseña temporal debe tener al menos 6 caracteres.");
  if (rol === ROLES.SUPER_ADMIN) errores.push("No se puede crear otro Super Administrador.");
  if (!isSuperAdmin(window.currentUserRole) && rol === ROLES.ADMIN) errores.push("Un Administrador no puede crear otros Administradores.");
  if (rol === ROLES.OPERADOR && !almacen_id) errores.push("Selecciona el almacén del operador.");
  if (errores.length) return showValidationErrors(errores);
  showLoader();
  const secondary = initializeApp(firebaseConfig, `user-create-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, correo, password);
    await setDoc(doc(db, "usuarios", cred.user.uid), { nombres, apellidoPaterno, apellidoMaterno, dni, telefono, email: correo, correo, rol, empresaId: EMPRESA_INICIAL.id, empresa: EMPRESA_INICIAL.nombre, estado: normalizeEstado(estado), almacenId: almacen_id || null, almacen_id: almacen_id || null, almacenNombre: almacen?.nombre || null, almacen_nombre: almacen?.nombre || null, creadoPor: auth.currentUser?.uid || "", fechaCreacion: Timestamp.now(), creadoEn: Timestamp.now(), ultimoAcceso: null, uid: cred.user.uid });
    ["nombres", "apellidoPaterno", "apellidoMaterno", "dni", "telefono", "correo", "password"].forEach((id) => document.getElementById(id).value = "");
    document.getElementById("usuarioAlmacen").value = "";
    await cargarUsuarios();
    await toast("Usuario creado correctamente");
  } catch (e) { await showError("No se pudo crear el usuario. Verifica el correo o la configuración de Firebase."); }
  finally { await deleteApp(secondary); hideLoader(); }
};

document.getElementById("rol").addEventListener("change", (event) => {
  document.getElementById("usuarioAlmacen").disabled = normalizeRole(event.target.value) !== ROLES.OPERADOR;
});
document.getElementById("usuarioAlmacen").disabled = true;
const ready = setInterval(() => { if (!window.currentUserRole) return; clearInterval(ready); document.getElementById(currentUserIsAdmin() ? "adminOnlyContent" : "noAdmin").classList.remove("d-none"); cargarUsuarios(); }, 150);
