import { auth, db } from "./firebase-config.js";
import { showError, showLoader, hideLoader, showValidationErrors, toast } from "./ui.js";
import { clienteDisplay, clienteSearchText, formatoFecha, normalizarTexto } from "./domain.js";
import { onAuthStateChanged } from "./demo/firebase-auth.js";
import { collection, addDoc, getDocs, query, serverTimestamp, where, limit } from "./demo/firebase-firestore.js";
import { getAccessibleClientes } from "./permissions.js";

const lista = document.getElementById("lista");
let clientes = [];

function ids(idsList, value = "") { idsList.forEach((id) => { document.getElementById(id).value = value; }); }
function correoValido(correo) { return !correo || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo); }

function toggleTipo() {
  const esEmpresa = document.getElementById("tipoCliente").value === "empresa";
  document.getElementById("formNatural").classList.toggle("d-none", esEmpresa);
  document.getElementById("formEmpresa").classList.toggle("d-none", !esEmpresa);
}

function obtenerFormulario() {
  const tipoCliente = document.getElementById("tipoCliente").value;
  if (tipoCliente === "empresa") {
    const razonSocial = document.getElementById("razonSocial").value.trim();
    return {
      tipoCliente,
      razonSocial,
      ruc: document.getElementById("ruc").value.trim(),
      telefono: document.getElementById("telefonoEmpresa").value.trim(),
      correo: document.getElementById("correoEmpresa").value.trim().toLowerCase(),
      direccion: document.getElementById("direccionEmpresa").value.trim(),
      nombreBusqueda: razonSocial.toLowerCase()
    };
  }
  const nombres = document.getElementById("nombres").value.trim();
  const apellidoPaterno = document.getElementById("apellidoPaterno").value.trim();
  const apellidoMaterno = document.getElementById("apellidoMaterno").value.trim();
  const nombreCompleto = [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ");
  return {
    tipoCliente,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    nombreCompleto,
    nombre: nombreCompleto,
    dni: document.getElementById("dni").value.trim(),
    telefono: document.getElementById("telefonoNatural").value.trim(),
    correo: document.getElementById("correoNatural").value.trim().toLowerCase(),
    direccion: document.getElementById("direccionNatural").value.trim()
  };
}

function validar(data) {
  const errores = [];
  if (data.tipoCliente === "empresa") {
    if (!data.razonSocial || !data.ruc || !data.telefono) errores.push("Razón Social, RUC y teléfono son obligatorios.");
    if (data.ruc && !/^\d{11}$/.test(data.ruc)) errores.push("El RUC debe tener exactamente 11 dígitos.");
  } else {
    if (!data.nombres || !data.apellidoPaterno || !data.apellidoMaterno || !data.dni || !data.telefono) errores.push("Nombres, apellidos, DNI y teléfono son obligatorios.");
    if (data.dni && !/^\d{8}$/.test(data.dni)) errores.push("El DNI debe tener exactamente 8 dígitos.");
  }
  if (data.telefono && !/^\d{9}$/.test(data.telefono)) errores.push("El teléfono debe tener exactamente 9 dígitos.");
  if (!correoValido(data.correo)) errores.push("El correo no tiene formato válido.");
  return errores;
}

async function existeDuplicado(userId, data) {
  const campo = data.tipoCliente === "empresa" ? "ruc" : "dni";
  const valor = data[campo];
  const snap = await getDocs(query(collection(db, "clientes"), where("user_id", "==", userId), where(campo, "==", valor), limit(1)));
  return snap.empty ? null : `Ya existe un cliente con este ${campo.toUpperCase()}.`;
}

function limpiarFormulario() {
  ids(["nombres", "apellidoPaterno", "apellidoMaterno", "dni", "telefonoNatural", "correoNatural", "direccionNatural", "razonSocial", "ruc", "telefonoEmpresa", "correoEmpresa", "direccionEmpresa"]);
}

window.guardarCliente = async function () {
  const user = auth.currentUser;
  if (!user) return showError("Tu sesión expiró. Vuelve a iniciar sesión.");
  const data = obtenerFormulario();
  const errores = validar(data);
  if (errores.length) return showValidationErrors(errores);
  showLoader();
  try {
    const duplicado = await existeDuplicado(user.uid, data);
    if (duplicado) return showValidationErrors([duplicado]);
    await addDoc(collection(db, "clientes"), { ...data, searchText: clienteSearchText(data), fecha_registro: serverTimestamp(), user_id: user.uid, almacenId: window.currentUserAlmacenId || null, almacen_id: window.currentUserAlmacenId || null });
    limpiarFormulario();
    await cargarClientes();
    await toast("Cliente registrado");
  } catch (error) { await showError("No se pudo registrar el cliente."); } finally { hideLoader(); }
};

function renderClientes() {
  const texto = normalizarTexto(document.getElementById("buscarCliente").value);
  const rows = clientes.filter((c) => !texto || clienteSearchText(c).includes(texto));
  lista.innerHTML = rows.length ? "" : '<li class="list-group-item text-muted">No hay clientes para mostrar.</li>';
  rows.forEach((d) => {
    const documento = d.tipoCliente === "empresa" ? `RUC: ${d.ruc || "-"}` : `DNI: ${d.dni || "-"}`;
    lista.innerHTML += `<li class="list-group-item"><div class="d-flex justify-content-between align-items-start gap-3"><div><span class="badge text-bg-${d.tipoCliente === "empresa" ? "warning" : "primary"}">${d.tipoCliente === "empresa" ? "Empresa" : "Persona Natural"}</span><strong class="ms-2">${clienteDisplay(d)}</strong><div class="small text-muted">${documento} · Tel: ${d.telefono || "-"}</div><div class="small">${d.correo || "Sin correo"}</div><div class="small text-muted">${d.direccion || "Sin dirección"}</div></div><div class="text-end small text-muted"><div>Registro: ${formatoFecha(d.fecha_registro)}</div></div></div></li>`;
  });
}

async function cargarClientes() {
  const user = auth.currentUser;
  if (!user) return;
  showLoader();
  try {
    clientes = (await getAccessibleClientes()).sort((a, b) => clienteDisplay(a).localeCompare(clienteDisplay(b), "es"));
    renderClientes();
  } finally { hideLoader(); }
}

document.getElementById("tipoCliente").addEventListener("change", toggleTipo);
document.getElementById("buscarCliente").addEventListener("input", renderClientes);
onAuthStateChanged(auth, (user) => { if (user) cargarClientes(); });
