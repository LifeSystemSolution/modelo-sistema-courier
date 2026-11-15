import { auth, db } from "./firebase-config.js";
import { allowedModulesForRole, canAccessModule, defaultHrefForRole, isAdmin, moduleFromPath, MODULES } from "./permissions.js";
import { ensureBrandLogos } from "./logo.js";
import { normalizeEstado, normalizeRole } from "./roles.js";
import { onAuthStateChanged, signOut } from "./demo/firebase-auth.js";
import { doc, getDoc } from "./demo/firebase-firestore.js";

window.logout = async function () { await signOut(auth); window.location.href = "index.html"; };

function renderMenu(role) {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar || sidebar.dataset.menuRendered === "true") return;

  const current = moduleFromPath();
  const links = allowedModulesForRole(role).map((key) => {
    const item = MODULES[key];
    const active = key === current || (key === "almacenes" && current === "usuarios" && window.location.hash === "#almacenes");
    return `<a class="${active ? "active" : ""}" href="${item.href}">${item.label}</a>`;
  }).join("");

  sidebar.innerHTML = `<div class="brand"></div>${links}`;
  sidebar.dataset.menuRendered = "true";
  ensureBrandLogos();
}

function notifyDenied() {
  const message = sessionStorage.getItem("permissionDeniedMessage");
  if (!message) return;
  sessionStorage.removeItem("permissionDeniedMessage");
  if (window.Swal) Swal.fire({ icon: "warning", title: "Acceso restringido", text: message });
  else alert(message);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }
  const snap = await getDoc(doc(db, "usuarios", user.uid));
  if (!snap.exists()) { await signOut(auth); window.location.href = "index.html"; return; }
  const data = snap.data();
  const nombre = [data.nombres || data.nombre, data.apellidoPaterno, data.apellidoMaterno].filter(Boolean).join(" ") || user.email || "Usuario";
  window.currentUserRole = normalizeRole(data.rol || data.role || "ADMIN");
  window.currentUserAlmacenId = data.almacenId || data.almacen_id || null;
  window.currentUserEstado = normalizeEstado(data.estado);
  if (window.currentUserEstado === "INACTIVO") { await signOut(auth); window.location.href = "index.html"; return; }
  const module = moduleFromPath();
  if (!canAccessModule(window.currentUserRole, module)) {
    sessionStorage.setItem("permissionDeniedMessage", "No tiene permisos para acceder a este módulo.");
    window.location.href = defaultHrefForRole(window.currentUserRole);
    return;
  }
  const el = document.getElementById("usuarioNombre");
  if (el) el.innerText = `${nombre} (${window.currentUserRole})`;
  renderMenu(window.currentUserRole);
  document.querySelectorAll("[data-admin-only]").forEach((node) => node.classList.toggle("d-none", !isAdmin(window.currentUserRole)));
  notifyDenied();
});
