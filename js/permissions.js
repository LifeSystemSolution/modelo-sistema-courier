import { db, auth } from "./firebase-config.js";
import { collection, doc, getDoc, getDocs, query, where } from "./demo/firebase-firestore.js";

import { normalizeRole, ROLES } from "./roles.js";

export const ADMIN_ROLES = Object.freeze([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
export const OPERATOR_ROLE = ROLES.OPERADOR;

export const ROLE_MENUS = Object.freeze({
  [ROLES.SUPER_ADMIN]: ["dashboard", "clientes", "envios", "tracking", "reportes", "usuarios", "almacenes", "configuracion"],
  [ROLES.ADMIN]: ["dashboard", "clientes", "envios", "tracking", "reportes", "usuarios", "almacenes", "configuracion"],
  [ROLES.OPERADOR]: ["dashboard", "clientes", "envios", "tracking"],
  [ROLES.TRANSPORTISTA]: ["viajes", "tracking"]
});

export const MODULES = Object.freeze({
  dashboard: { label: "Dashboard", href: "dashboard.html" },
  clientes: { label: "Clientes", href: "clientes.html" },
  envios: { label: "Envíos", href: "envios.html" },
  viajes: { label: "Mis Viajes", href: "viajes.html" },
  tracking: { label: "Seguimiento", href: "tracking.html" },
  reportes: { label: "Reportes", href: "reportes.html" },
  usuarios: { label: "Usuarios", href: "usuarios.html" },
  almacenes: { label: "Almacenes", href: "almacenes.html" },
  configuracion: { label: "Configuración", href: "configuracion.html" }
});

export function isSuperAdmin(role = "") { return normalizeRole(role) === ROLES.SUPER_ADMIN; }
export function isAdmin(role = "") { return ADMIN_ROLES.includes(normalizeRole(role)); }
export function isOperator(role = "") { return normalizeRole(role) === OPERATOR_ROLE; }
export function isTransportista(role = "") { return normalizeRole(role) === ROLES.TRANSPORTISTA; }

export const isSuperAdminRole = isSuperAdmin;
export const isAdminRole = isAdmin;
export const isOperatorRole = isOperator;
export const isTransportistaRole = isTransportista;

export function allowedModulesForRole(role = "") { return ROLE_MENUS[normalizeRole(role)] || []; }
export function canAccessModule(role = "", module = "dashboard") { return allowedModulesForRole(role).includes(module); }

export function defaultModuleForRole(role = "") {
  return isTransportista(role) ? "viajes" : "dashboard";
}

export function defaultHrefForRole(role = "") {
  const module = defaultModuleForRole(role);
  return MODULES[module]?.href || "dashboard.html";
}

export function moduleFromPath(pathname = window.location.pathname) {
  const file = pathname.split("/").pop() || "dashboard.html";
  const map = { "dashboard.html": "dashboard", "clientes.html": "clientes", "envios.html": "envios", "viajes.html": "viajes", "tracking.html": "tracking", "reportes.html": "reportes", "usuarios.html": "usuarios", "almacenes.html": "almacenes", "configuracion.html": "configuracion" };
  return map[file] || "dashboard";
}

export async function getCurrentUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, "usuarios", user.uid));
  const data = snap.exists() ? snap.data() : {};
  return { uid: user.uid, email: user.email, ...data, rol: normalizeRole(data.rol || data.role || ROLES.ADMIN) };
}

export function canAccessEnvio(envio = {}, profile = {}) {
  if (isAdmin(profile.rol)) return true;
  if (isOperatorRole(profile.rol)) {
    const almacenId = profile.almacenId || profile.almacen_id;
    return Boolean(almacenId) && [envio.almacen_origen_id, envio.almacen_destino_id, envio.almacenOrigenId, envio.almacenDestinoId].includes(almacenId);
  }
  if (isTransportistaRole(profile.rol)) return envio.transportistaId === profile.uid;
  return envio.user_id === profile.uid;
}

function mergeDocs(snaps = [], profile) {
  const map = new Map();
  snaps.forEach((snap) => snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() })));
  return [...map.values()].filter((envio) => canAccessEnvio(envio, profile));
}

export async function getAccessibleClientes() {
  const profile = await getCurrentUserProfile();
  if (!profile) return [];
  if (isAdmin(profile.rol)) return (await getDocs(collection(db, "clientes"))).docs.map((d) => ({ id: d.id, ...d.data() }));
  if (isOperatorRole(profile.rol) && (profile.almacenId || profile.almacen_id)) {
    const almacenId = profile.almacenId || profile.almacen_id;
    const [actual, legacy] = await Promise.all([
      getDocs(query(collection(db, "clientes"), where("almacenId", "==", almacenId))),
      getDocs(query(collection(db, "clientes"), where("almacen_id", "==", almacenId)))
    ]);
    const map = new Map();
    [actual, legacy].forEach((snap) => snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() })));
    return [...map.values()];
  }
  return (await getDocs(query(collection(db, "clientes"), where("user_id", "==", profile.uid)))).docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAccessibleEnvios() {
  const profile = await getCurrentUserProfile();
  if (!profile) return [];
  if (isAdmin(profile.rol)) {
    return (await getDocs(collection(db, "envios"))).docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  if (isOperatorRole(profile.rol) && (profile.almacen_id || profile.almacenId)) {
    const almacenId = profile.almacenId || profile.almacen_id;
    const [origen, destino, origenLegacy, destinoLegacy] = await Promise.all([
      getDocs(query(collection(db, "envios"), where("almacen_origen_id", "==", almacenId))),
      getDocs(query(collection(db, "envios"), where("almacen_destino_id", "==", almacenId))),
      getDocs(query(collection(db, "envios"), where("almacenOrigenId", "==", almacenId))),
      getDocs(query(collection(db, "envios"), where("almacenDestinoId", "==", almacenId)))
    ]);
    return mergeDocs([origen, destino, origenLegacy, destinoLegacy], profile);
  }
  if (isTransportistaRole(profile.rol)) {
    const asignados = await getDocs(query(collection(db, "envios"), where("transportistaId", "==", profile.uid)));
    return mergeDocs([asignados], profile);
  }
  const propios = await getDocs(query(collection(db, "envios"), where("user_id", "==", profile.uid)));
  return mergeDocs([propios], profile);
}
