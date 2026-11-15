import { auth, db, firebaseConfig } from "./firebase-config.js";
import { showError, showLoader, hideLoader, showValidationErrors, toast } from "./ui.js";
import { EMPRESA_INICIAL, ESTADOS_USUARIO, ROLES } from "./roles.js";
import { initializeApp, deleteApp } from "./demo/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "./demo/firebase-auth.js";
import { collection, doc, getDocs, limit, query, serverTimestamp, where, writeBatch } from "./demo/firebase-firestore.js";

async function existeSuperAdmin() {
  const snap = await getDocs(query(collection(db, "usuarios"), where("rol", "==", ROLES.SUPER_ADMIN), limit(1)));
  return !snap.empty;
}

async function evaluarBootstrap() {
  const btn = document.getElementById("crearSuperAdminBtn");
  if (!btn) return;
  try { btn.classList.toggle("d-none", await existeSuperAdmin()); }
  catch { btn.classList.add("d-none"); }
}

window.login = async function () {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) return showValidationErrors(["Ingresa correo y contraseña."]);
  showLoader();
  try { await signInWithEmailAndPassword(auth, email, password); window.location.href = "dashboard.html"; }
  catch { await showError("No fue posible iniciar sesión. Verifica tus datos."); }
  finally { hideLoader(); }
};

window.mostrarFormularioSuperAdmin = async function () {
  if (await existeSuperAdmin()) { await showError("Ya existe un Super Administrador registrado."); await evaluarBootstrap(); return; }
  document.getElementById("superAdminBox").classList.remove("d-none");
  document.getElementById("crearSuperAdminBtn").classList.add("d-none");
};

window.crearSuperAdmin = async function () {
  const ids = ["saNombres","saApellidoPaterno","saApellidoMaterno","saDni","saTelefono","saCorreo","saPassword","saConfirmar","saEmpresa","saRuc"];
  const v = Object.fromEntries(ids.map((id) => [id, document.getElementById(id).value.trim()]));
  const errores = [];
  if (!v.saNombres) errores.push("Los nombres son obligatorios.");
  if (!v.saApellidoPaterno) errores.push("El apellido paterno es obligatorio.");
  if (!v.saApellidoMaterno) errores.push("El apellido materno es obligatorio.");
  if (!/^\d{8}$/.test(v.saDni)) errores.push("El DNI debe tener 8 dígitos.");
  if (!/^\d{9}$/.test(v.saTelefono)) errores.push("El teléfono debe tener 9 dígitos.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.saCorreo)) errores.push("Ingresa un correo válido.");
  if (v.saPassword.length < 6) errores.push("La contraseña debe tener al menos 6 caracteres.");
  if (v.saPassword !== v.saConfirmar) errores.push("Las contraseñas no coinciden.");
  if (!v.saEmpresa || !v.saRuc) errores.push("Empresa y RUC son obligatorios.");
  if (errores.length) return showValidationErrors(errores);
  showLoader();
  const secondary = initializeApp(firebaseConfig, `super-admin-${Date.now()}`);
  try {
    if (await existeSuperAdmin()) throw new Error("SUPER_ADMIN_EXISTS");
    const secondaryAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, v.saCorreo, v.saPassword);
    const batch = writeBatch(db);
    batch.set(doc(db, "usuarios", cred.user.uid), {
      nombres: v.saNombres, apellidoPaterno: v.saApellidoPaterno, apellidoMaterno: v.saApellidoMaterno,
      dni: v.saDni, telefono: v.saTelefono, correo: v.saCorreo, email: v.saCorreo,
      rol: ROLES.SUPER_ADMIN, empresaId: EMPRESA_INICIAL.id, empresa: v.saEmpresa, ruc: v.saRuc,
      almacenId: null, almacen_id: null, estado: ESTADOS_USUARIO.ACTIVO,
      fechaCreacion: serverTimestamp(), ultimoAcceso: serverTimestamp(), uid: cred.user.uid
    });
    batch.set(doc(db, "empresas", EMPRESA_INICIAL.id), { nombre: v.saEmpresa, ruc: v.saRuc, estado: "ACTIVO", fechaCreacion: serverTimestamp() }, { merge: true });
    batch.set(doc(db, "configuracion", "superAdmin"), { uid: cred.user.uid, creadoEn: serverTimestamp() });
    await batch.commit();
    await signInWithEmailAndPassword(auth, v.saCorreo, v.saPassword);
    await toast("Super Administrador creado correctamente.");
    window.location.href = "dashboard.html";
  } catch (e) {
    await showError(e.message === "SUPER_ADMIN_EXISTS" ? "Ya existe un Super Administrador registrado." : "No se pudo crear el Super Administrador.");
    await evaluarBootstrap();
  } finally { await deleteApp(secondary); hideLoader(); }
};

evaluarBootstrap();
