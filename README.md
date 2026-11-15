# LifeCargo Express — Modelo de sistema de gestión de envíos (courier)

Demo de sistema web para empresas de courier y transporte de carga desarrollado por **LifeSystem Solutions**.
La empresa, los clientes, usuarios y envíos son ficticios.

**Demo en vivo:** https://lifesystemsolution.github.io/modelo-sistema-courier/

## Usuarios de prueba (contraseña `demo123`)
| Rol | Correo |
|---|---|
| Administrador | admin@lifecargo.demo |
| Operador de almacén | operador@lifecargo.demo |
| Transportista | transportista@lifecargo.demo |

## Funcionalidades
- Inicio de sesión con roles y permisos (Administrador, Operador, Transportista).
- Registro de clientes (personas y empresas) y almacenes.
- Registro de envíos con código de seguimiento, etiquetas y tickets imprimibles.
- Flujo de estados (Recibido → En ruta → Entregado) con historial.
- Dashboard con métricas y gráficos, reportes con exportación a PDF.
- Panel de accesibilidad.

## Modo demo
Esta versión no usa base de datos en la nube: `js/demo/` simula Firebase Auth y Firestore
guardando los datos en el navegador (localStorage). Para un cliente real se reemplaza
`js/firebase-config.js` por la configuración de su proyecto Firebase.

## Tecnologías
HTML, CSS, JavaScript (módulos ES), Bootstrap 5, Chart.js, SweetAlert2 y jsPDF.

---
Desarrollado por LifeSystem Solutions.
