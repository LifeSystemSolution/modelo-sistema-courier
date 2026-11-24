/* Ajustes: negocio, tarifas, reglas de riesgo, costos, usuarios, historial y datos del demo */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;
  const db = () => LC.store.db;

  const CAMPOS_T = [
    ['baseNacional', 'Base nacional', 'S/ por paquete'], ['baseLocal', 'Base local', 'S/ por paquete'],
    ['kgLocal', 'Kg local', 'S/ por kg'], ['kgCorta', 'Kg hasta 600 km', 'S/ por kg'], ['kgMedia', 'Kg 600 a 1 200 km', 'S/ por kg'], ['kgLarga', 'Kg más de 1 200 km', 'S/ por kg'],
    ['sobreLocal', 'Sobre local', 'S/'], ['sobreNacional', 'Sobre nacional', 'S/'], ['expressPct', 'Express', '% sobre el flete'], ['domicilio', 'A domicilio', 'S/ por envío'],
    ['seguroPct', 'Seguro', '% del valor declarado'], ['cePct', 'Contra entrega', '% del monto a cobrar']
  ];
  const CAMPOS_C = [['lineaKg100', 'Costo de línea', 'S/ por kg cada 100 km'], ['localKg', 'Costo local', 'S/ por kg'], ['repartoEntrega', 'Reparto', 'S/ por entrega'], ['comisionTarjeta', 'Comisión de tarjeta', '%'], ['fijoDia', 'Gastos fijos', 'S/ por día']];
  const NOM_F = { plazo: 'Plazo usado', avance: 'Avance', detenido: 'Detenido', intentos: 'Intentos fallidos', ruta: 'Ruta' };

  function sec(t, d, cuerpo) { return '<section class="aj-sec"><div><h2>' + t + '</h2><p>' + d + '</p></div><div>' + cuerpo + '</div></section>'; }

  function render(el) {
    const D = db();
    const emp = D.empresa;
    const ejemplo = { origen: 'LIM', destino: 'ARE', servicio: 'estandar', tipoEntrega: 'domicilio', bultos: [{ tipo: 'paquete', peso: 3, l: 30, a: 25, h: 20 }], valorDeclarado: 0, contraEntrega: 0 };
    const muestra = D.envios.filter(e => e.estado !== 'entregado').map(e => ({ e, r: LC.store.riesgo(e) })).sort((a, b) => b.r.puntaje - a.r.puntaje)[0];
    el.innerHTML =
      sec('Datos del negocio', 'Aparecen en la guía, la boleta y la web.', '<div class="campos"><label class="campo">Razón social<input data-emp="razon" value="' + esc(emp.razon) + '"></label><label class="campo">RUC<input data-emp="ruc" value="' + esc(emp.ruc) + '" inputmode="numeric" maxlength="11"></label><label class="campo">Dirección principal<input data-emp="direccion" value="' + esc(emp.direccion) + '"></label><label class="campo">Horario<input data-emp="horario" value="' + esc(emp.horario) + '"></label></div><button class="btn btn-dark" data-g-emp>Guardar datos</button>') +
      sec('Tarifas', 'Cambian el precio de los envíos nuevos. Los ya registrados mantienen su tarifa.', '<div class="campos campos-sm">' + CAMPOS_T.map(c => '<label class="campo">' + c[1] + '<input type="number" step="0.1" min="0" data-t="' + c[0] + '" value="' + D.ajustes.tarifa[c[0]] + '"><small>' + c[2] + '</small></label>').join('') + '</div><p class="ejemplo" data-ej></p><button class="btn btn-dark" data-g-t>Guardar tarifas</button>') +
      (LC.tieneModulo('tablero') ? sec('Riesgo de retraso', 'Cuántos puntos aporta cada factor. La suma debería ser 100.', '<div class="pesos">' + Object.keys(NOM_F).map(k => '<label class="peso"><span>' + NOM_F[k] + '</span><input type="range" min="0" max="60" step="1" data-p="' + k + '" value="' + D.ajustes.pesos[k] + '"><output class="num">' + D.ajustes.pesos[k] + '</output></label>').join('') + '</div><p class="suma" data-suma></p>' +
        (muestra ? '<div class="caja caja-p prev"><p class="muted">Vista previa con <b class="num">' + muestra.e.id + '</b> (' + esc(M.agencia(muestra.e.origen).ciudad) + ' → ' + esc(M.agencia(muestra.e.destino).ciudad) + ')</p><div data-prev></div></div>' : '') + '<div class="fila"><button class="btn btn-dark" data-g-p>Guardar pesos</button><button class="btn btn-ghost" data-reset-p>Volver a los valores sugeridos</button></div>') : '') +
      (LC.tieneModulo('reportes') ? sec('Costos para la ganancia estimada', 'Se usan solo en Reportes. Ajústalos a tu operación.', '<div class="campos campos-sm">' + CAMPOS_C.map(c => '<label class="campo">' + c[1] + '<input type="number" step="0.05" min="0" data-c="' + c[0] + '" value="' + D.ajustes.costos[c[0]] + '"><small>' + c[2] + '</small></label>').join('') + '</div><button class="btn btn-dark" data-g-c>Guardar costos</button>') : '') +
      sec('Usuarios', 'Quién entra al sistema y desde qué agencia.', '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Nombre</th><th>Cargo</th><th>Agencia</th></tr></thead><tbody>' + D.personas.map(p => '<tr><td>' + U.avatar(p.nombre, 'avatar-s') + ' ' + esc(p.nombre) + '</td><td>' + esc(p.cargo) + '</td><td>' + esc(M.agencia(p.agencia).ciudad) + '</td></tr>').join('') + '</tbody></table></div>') +
      sec('Historial de cambios', 'Quién cambió qué y cuándo.', '<ul class="hist">' + D.historial.slice(0, 25).map(h => '<li><time>' + U.cuando(h.t) + '</time><div><b>' + esc(h.usuario) + '</b> · ' + esc(h.accion) + (h.detalle ? '<small>' + esc(h.detalle) + '</small>' : '') + '</div></li>').join('') + '</ul>') +
      sec('Datos del demo', 'Los datos son ficticios y se regeneran cada día. Puedes reiniciarlos cuando quieras.', '<button class="btn btn-line" data-reset>' + icon('refresh') + 'Reiniciar datos de ejemplo</button>');

    // Negocio
    el.querySelector('[data-g-emp]').onclick = () => {
      const cambios = [];
      el.querySelectorAll('[data-emp]').forEach(i => { if (emp[i.dataset.emp] !== i.value.trim()) { cambios.push(i.dataset.emp); emp[i.dataset.emp] = i.value.trim(); } });
      if (!cambios.length) { U.toast('No hay cambios que guardar', 'info'); return; }
      LC.store.log('Cambió datos del negocio', cambios.join(', '));
      LC.store.save(); U.toast('Datos del negocio guardados');
    };
    // Tarifas con ejemplo en vivo
    const ej = el.querySelector('[data-ej]');
    const leerT = () => { const t = Object.assign({}, D.ajustes.tarifa); el.querySelectorAll('[data-t]').forEach(i => { t[i.dataset.t] = Number(i.value) || 0; }); return t; };
    const pintarEj = () => { const T = M.tarifa(ejemplo, leerT()); ej.innerHTML = icon('box') + '<span>Ejemplo: Lima → Arequipa, 3 kg, a domicilio = <b class="num">' + U.soles(T.total) + '</b> (' + T.lineas.map(l => esc(l.c.replace(/ \(.*\)/, '')) + ' ' + U.soles(l.m)).join(' + ') + ')</span>'; };
    el.querySelectorAll('[data-t]').forEach(i => i.oninput = pintarEj);
    pintarEj();
    el.querySelector('[data-g-t]').onclick = () => {
      const t = leerT();
      const cambios = CAMPOS_T.filter(c => t[c[0]] !== D.ajustes.tarifa[c[0]]).map(c => c[1] + ': ' + D.ajustes.tarifa[c[0]] + ' → ' + t[c[0]]);
      if (!cambios.length) { U.toast('No hay cambios que guardar', 'info'); return; }
      D.ajustes.tarifa = t;
      LC.store.log('Cambió tarifas', cambios.join(' · '));
      LC.store.save(); U.toast('Tarifas guardadas. Se aplican a los envíos nuevos.');
      LC.refrescar();
    };
    // Pesos de riesgo con vista previa
    const prev = el.querySelector('[data-prev]');
    const leerP = () => { const p = {}; el.querySelectorAll('[data-p]').forEach(i => { p[i.dataset.p] = Number(i.value); i.nextElementSibling.textContent = i.value; }); return p; };
    const pintarP = () => {
      const p = leerP();
      const s = Object.values(p).reduce((a, b) => a + b, 0);
      const sm = el.querySelector('[data-suma]');
      if (sm) sm.innerHTML = 'Suma: <b class="num">' + s + '</b> de 100' + (s !== 100 ? ' · <span class="aviso">' + (s > 100 ? 'pasa de 100: los puntajes se cortarán en 100' : 'menos de 100: ningún envío llegará a 100') + '</span>' : '');
      if (prev && muestra) prev.innerHTML = U.medidor(M.riesgo(muestra.e, p));
    };
    el.querySelectorAll('[data-p]').forEach(i => i.oninput = pintarP);
    if (el.querySelector('[data-p]')) pintarP();
    const gp = el.querySelector('[data-g-p]');
    if (gp) gp.onclick = () => {
      const p = leerP();
      const cambios = Object.keys(p).filter(k => p[k] !== D.ajustes.pesos[k]).map(k => NOM_F[k] + ': ' + D.ajustes.pesos[k] + ' → ' + p[k]);
      if (!cambios.length) { U.toast('No hay cambios que guardar', 'info'); return; }
      D.ajustes.pesos = p;
      LC.store.log('Ajustó los pesos del riesgo', cambios.join(' · '));
      LC.store.save(); U.toast('Pesos guardados. El tablero ya usa los nuevos puntajes.');
      LC.refrescar();
    };
    const rp = el.querySelector('[data-reset-p]');
    if (rp) rp.onclick = () => { el.querySelectorAll('[data-p]').forEach(i => { i.value = M.PESOS_BASE[i.dataset.p]; }); pintarP(); };
    // Costos
    const gc = el.querySelector('[data-g-c]');
    if (gc) gc.onclick = () => {
      const cambios = [];
      el.querySelectorAll('[data-c]').forEach(i => { const v = Number(i.value) || 0; if (v !== D.ajustes.costos[i.dataset.c]) { cambios.push(CAMPOS_C.find(c => c[0] === i.dataset.c)[1] + ': ' + D.ajustes.costos[i.dataset.c] + ' → ' + v); D.ajustes.costos[i.dataset.c] = v; } });
      if (!cambios.length) { U.toast('No hay cambios que guardar', 'info'); return; }
      LC.store.log('Cambió costos de referencia', cambios.join(' · '));
      LC.store.save(); U.toast('Costos guardados');
      LC.refrescar();
    };
    el.querySelector('[data-reset]').onclick = async () => {
      const r = await U.modal('Reiniciar datos de ejemplo', '<p>Se borran los envíos, cobros y cambios que hiciste en este navegador y se cargan otra vez los 30 días de ejemplo.</p>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Reiniciar', 'btn-primary']]);
      if (r.v !== 'ok') return;
      LC.store.reset();
      U.toast('Datos de ejemplo reiniciados');
      LC.refrescar();
    };
  }

  LC.vistas.ajustes = { titulo: 'Ajustes', icono: 'settings', render };
})();
