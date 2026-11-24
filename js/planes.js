/* Planes y módulos. Lo usan la página de planes (index.html) y el sistema (app.html).
   El plan se elige con ?plan=basico|control|completo, o ?plan=custom&mods=a,b,c para "Arma tu plan". */
(function () {
  const LC = (window.LC = window.LC || {});

  const MODULOS = {
    recepcion: { nombre: 'Recepción y guías', plan: 'basico', fijo: true, desc: 'Registra el envío en menos de un minuto: tarifa con su cálculo a la vista, guía, etiqueta y boleta.' },
    envios: { nombre: 'Envíos e historial', plan: 'basico', fijo: true, desc: 'Busca por código, DNI o nombre y mira dónde está cada envío y quién lo movió.' },
    seguimiento: { nombre: 'Rastreo para tus clientes', plan: 'basico', fijo: true, desc: 'Tu web muestra dónde está el envío con solo el código. Menos llamadas preguntando.' },
    llegadas: { nombre: 'Llegadas a agencia', plan: 'basico', desc: 'Recibe la carga que llega y confirma bulto por bulto lo que bajó del camión.' },
    entregas: { nombre: 'Entregas en agencia', plan: 'basico', desc: 'Entrega con verificación de DNI y cobro pendiente, sin buscar en cuadernos.' },
    caja: { nombre: 'Caja diaria', plan: 'basico', desc: 'Apertura, cobros por medio de pago y cierre con arqueo de billetes y monedas.' },
    clientes: { nombre: 'Clientes', plan: 'basico', desc: 'Remitentes frecuentes con DNI o RUC, historial de envíos y lo que gastan al mes.' },
    manifiestos: { nombre: 'Manifiestos y despacho', plan: 'control', desc: 'Arma la carga de cada camión por destino, imprime el manifiesto y despacha con un toque.' },
    reparto: { nombre: 'Reparto a domicilio', plan: 'control', desc: 'Asigna la ruta del día y el repartidor marca entregas e intentos fallidos desde su celular.' },
    tablero: { nombre: 'Tablero y riesgo de retraso', plan: 'control', desc: 'Cada envío tiene un puntaje de 0 a 100 que avisa cuál se va a retrasar, con el porqué.' },
    reportes: { nombre: 'Reportes y Excel', plan: 'control', desc: 'Envíos, ingresos, cumplimiento de plazos y ganancia estimada por día, ruta y hora.' },
    contraentrega: { nombre: 'Cobro contra entrega', plan: 'completo', desc: 'Para tiendas online: cobra al entregar y liquida a cada tienda lo que le corresponde.' },
    avisos: { nombre: 'Avisos por WhatsApp', plan: 'completo', desc: 'Mensajes automáticos al destinatario en cada etapa, con plantillas que tú editas.' }
  };

  const PLANES = {
    basico: { nombre: 'Básico', para: 'Una o dos agencias que reciben y entregan en counter.', mods: ['recepcion', 'envios', 'seguimiento', 'llegadas', 'entregas', 'caja', 'clientes'] },
    control: { nombre: 'Control', para: 'Varias agencias con camiones propios y reparto a domicilio.', mods: ['recepcion', 'envios', 'seguimiento', 'llegadas', 'entregas', 'caja', 'clientes', 'manifiestos', 'reparto', 'tablero', 'reportes'] },
    completo: { nombre: 'Completo', para: 'Courier que trabaja con tiendas online y quiere avisar solo a sus clientes.', mods: Object.keys(MODULOS) }
  };

  function planActual() {
    const q = new URLSearchParams(location.search);
    let clave = q.get('plan');
    let mods = q.get('mods');
    if (clave) {
      try { sessionStorage.setItem('lifecargo-plan', clave); sessionStorage.setItem('lifecargo-mods', mods || ''); } catch (e) { /* sin almacenamiento */ }
    } else {
      try { clave = sessionStorage.getItem('lifecargo-plan'); mods = sessionStorage.getItem('lifecargo-mods'); } catch (e) { clave = null; }
    }
    if (clave === 'custom') {
      const lista = String(mods || '').split(',').filter(m => MODULOS[m]);
      Object.keys(MODULOS).forEach(m => { if (MODULOS[m].fijo && !lista.includes(m)) lista.push(m); });
      return { clave: 'custom', nombre: 'A tu medida', mods: lista };
    }
    if (!PLANES[clave]) clave = 'completo';
    return Object.assign({ clave }, PLANES[clave]);
  }

  /* Plan más bajo que incluye un módulo (para el aviso de "disponible en…") */
  const planDe = mod => (MODULOS[mod] ? PLANES[MODULOS[mod].plan] : null);

  LC.planes = { MODULOS, PLANES, planActual, planDe, WHATSAPP: '51957111471' };
})();
