/* Reparto a domicilio: ruta del repartidor (celular) y asignación del día (jefa) */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;
  const db = () => LC.store.db;
  const distrito = e => (e.destinatario.dir.split(',').pop() || '').trim();
  const falloHoy = e => { const u = e.eventos[e.eventos.length - 1]; return u.nota.startsWith('Intento fallido') && u.t >= U.inicioDia(); };
  const pendiente = e => e.estado === 'en_reparto' || (e.estado === 'en_destino' && !falloHoy(e));

  function deHoy(pid) {
    const h0 = U.inicioDia();
    return db().envios.filter(e => e.repartidor === pid && e.tipoEntrega === 'domicilio' &&
      ((e.estado === 'en_destino' && (e.programado || e.intentos === 0)) || e.estado === 'en_reparto' ||
        (e.eventos.some(x => x.t >= h0 && (x.estado === 'entregado' || x.nota.startsWith('Intento fallido')) && x.por === pid))));
  }

  /* ===== Mi ruta (repartidor) ===== */
  function renderRuta(el) {
    const pid = LC.sesion.personaId;
    const h0 = U.inicioDia();
    const todos = deHoy(pid);
    const pend = todos.filter(pendiente).sort((a, b) => distrito(a).localeCompare(distrito(b)));
    const hechos = todos.filter(e => !pend.includes(e));
    const enCasa = pend.filter(e => e.estado === 'en_destino');
    const cobrar = pend.filter(e => e.contraEntrega && !e.ce).reduce((s, e) => s + e.contraEntrega, 0);
    const cobrado = hechos.filter(e => e.ce && e.ce.cobrado >= h0).reduce((s, e) => s + e.contraEntrega, 0);
    const p = LC.sesion.persona;
    el.innerHTML = '<div class="ruta-top caja caja-p"><div class="ruta-av"><b class="num">' + hechos.length + '<small> de ' + todos.length + '</small></b><span>' + (todos.length === 1 ? 'parada' : 'paradas') + ' hechas hoy</span><i style="--p:' + (todos.length ? Math.round(hechos.length / todos.length * 100) : 0) + '%"></i></div>' +
      '<div class="ruta-dat"><span>' + icon('truck') + esc(p.vehiculo) + '</span>' + (cobrar || cobrado ? '<span>' + icon('cash') + 'Por cobrar ' + U.soles(cobrar) + (cobrado ? ' · cobrado ' + U.soles(cobrado) : '') + '</span>' : '') + '</div>' +
      (enCasa.length ? '<button class="btn btn-primary btn-lg" data-salir>' + icon('truck') + 'Salir a reparto con ' + U.plural(enCasa.length, 'envío') + '</button>' : '') + '</div>' +
      (pend.length ? '<ol class="paradas">' + pend.map((e, i) => parada(e, i + 1)).join('') + '</ol>' : U.vacio('check', todos.length ? 'Terminaste la ruta de hoy' : 'No tienes entregas asignadas hoy', todos.length ? 'Entrega a la agencia el efectivo cobrado y los envíos que no se pudieron entregar.' : 'Cuando la jefa de operaciones te asigne envíos, aparecerán aquí.')) +
      (hechos.length ? '<section class="sec"><div class="sec-h"><h2>Hechas hoy</h2></div><ul class="hechas">' + hechos.map(e => { const ult = e.eventos[e.eventos.length - 1]; const ok = e.estado === 'entregado'; return '<li>' + (ok ? icon('check') : icon('alert')) + '<span><b class="num">' + e.id + '</b> ' + esc(U.nombreCorto(e.destinatario.nombre)) + '<small>' + esc(ok ? 'Entregado ' + U.hora(ult.t) : ult.nota) + '</small></span></li>'; }).join('') + '</ul></section>' : '');
    const salir = el.querySelector('[data-salir]');
    if (salir) salir.onclick = () => {
      enCasa.forEach(e => LC.envios.avanzar(e, 'en_reparto', 'Salió a reparto con ' + U.nombreCorto(p.nombre)));
      U.toast('Saliste a reparto con ' + U.plural(enCasa.length, 'envío') + '. Los destinatarios fueron avisados (simulado).');
      LC.refrescar();
    };
    el.querySelectorAll('[data-ok]').forEach(b => b.onclick = async () => { const e = LC.store.envio(b.dataset.ok); if (e.estado === 'en_destino') LC.envios.avanzar(e, 'en_reparto', 'Salió a reparto'); if (await LC.envios.pedirEntrega(e)) { U.toast(e.id + ' entregado'); LC.refrescar(); } });
    el.querySelectorAll('[data-no]').forEach(b => b.onclick = async () => { const e = LC.store.envio(b.dataset.no); if (e.estado === 'en_destino') LC.envios.avanzar(e, 'en_reparto', 'Salió a reparto'); if (await LC.envios.pedirFallo(e)) { U.toast('Intento registrado. Devuelve ' + e.id + ' a la agencia.', 'info'); LC.refrescar(); } });
    el.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => LC.envios.detalle(b.dataset.ver));
  }

  function parada(e, n) {
    return '<li class="parada"><span class="par-n num">' + n + '</span><div class="par-c"><div class="par-h"><b>' + esc(e.destinatario.nombre) + '</b>' + U.estado(e, true) + '</div>' +
      '<p>' + icon('pin') + esc(e.destinatario.dir) + '</p>' +
      '<p class="muted">' + U.plural(e.bultos.length, 'bulto') + ' · ' + esc(e.contenido) + ' · <span class="num">' + e.id + '</span>' + (e.intentos ? ' · ' + U.plural(e.intentos, 'intento previo', 'intentos previos') : '') + '</p>' +
      (e.contraEntrega && !e.ce ? '<p class="ent-ce">' + icon('cash') + 'Cobrar ' + U.soles(e.contraEntrega) + '</p>' : '') +
      '<div class="par-acc"><button class="btn btn-primary" data-ok="' + e.id + '">' + icon('check') + 'Entregado</button><button class="btn btn-line" data-no="' + e.id + '">No se pudo</button>' +
      '<a class="btn btn-ghost btn-icon" href="tel:' + esc(e.destinatario.tel) + '" aria-label="Llamar a ' + esc(e.destinatario.nombre) + '">' + icon('phone') + '</a><button class="btn btn-ghost btn-icon" data-ver="' + e.id + '" aria-label="Ver detalle">' + icon('more') + '</button></div></div></li>';
  }

  /* ===== Reparto de hoy (jefa) ===== */
  function renderReparto(el) {
    const reps = db().personas.filter(p => p.rol === 'reparto');
    const pendLima = db().envios.filter(e => e.destino === 'LIM' && e.tipoEntrega === 'domicilio' && (e.estado === 'en_destino' || e.estado === 'en_reparto'));
    const llegan = db().envios.filter(e => e.destino === 'LIM' && e.tipoEntrega === 'domicilio' && e.estado === 'en_ruta');
    const sinAsignar = pendLima.filter(e => !e.repartidor);
    const otras = M.AGENCIAS.filter(a => a.id !== 'LIM').map(a => ({ a, n: db().envios.filter(e => e.destino === a.id && e.tipoEntrega === 'domicilio' && (e.estado === 'en_destino' || e.estado === 'en_reparto')).length }));
    el.innerHTML = '<div class="kpis"><div class="kpi"><span>Por repartir en Lima</span><b class="num">' + pendLima.length + '</b><small>' + (sinAsignar.length ? U.plural(sinAsignar.length, 'sin asignar') : 'Todos asignados') + '</small></div>' +
      reps.map(r => { const mine = deHoy(r.id); const ok = mine.filter(e => e.estado === 'entregado').length; return '<div class="kpi"><span>' + esc(U.nombreCorto(r.nombre)) + '</span><b class="num">' + ok + '<small> / ' + mine.length + '</small></b><small>' + esc(r.vehiculo.split(' · ')[0]) + '</small></div>'; }).join('') +
      '<div class="kpi"><span>Llegan hoy a Lima</span><b class="num">' + llegan.length + '</b><small>para reparto mañana o tarde</small></div></div>' +
      '<div class="fila acciones-caja"><button class="btn btn-dark" data-auto' + (sinAsignar.length ? '' : ' disabled') + '>' + icon('route') + 'Asignar por distrito</button><span class="muted">Agrupa por distrito y reparte la carga entre repartidores.</span></div>' +
      '<section class="sec"><div class="sec-h"><h2>Envíos a domicilio en Lima</h2></div>' + (pendLima.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Envío</th><th>Destinatario</th><th>Distrito</th><th>Estado</th><th>Repartidor</th></tr></thead><tbody>' +
        pendLima.sort((a, b) => distrito(a).localeCompare(distrito(b))).map(e => '<tr><td><button class="link num" data-ver="' + e.id + '">' + e.id + '</button></td><td>' + esc(e.destinatario.nombre) + (e.intentos ? ' <span class="tag tag-red">' + U.plural(e.intentos, 'intento') + '</span>' : '') + '</td><td>' + esc(distrito(e)) + '</td><td>' + U.estado(e, true) + '</td><td>' +
          (e.estado === 'en_reparto' ? esc(U.nombreCorto((LC.store.persona(e.repartidor) || {}).nombre || '—')) : '<select data-asig="' + e.id + '" aria-label="Repartidor de ' + e.id + '"><option value="">Sin asignar</option>' + reps.map(r => '<option value="' + r.id + '"' + (r.id === e.repartidor ? ' selected' : '') + '>' + esc(U.nombreCorto(r.nombre)) + '</option>').join('') + '</select>') + '</td></tr>').join('') + '</tbody></table></div>'
        : U.vacio('check', 'No hay envíos por repartir en Lima', 'Los envíos a domicilio que lleguen a la agencia Lima aparecerán aquí.')) + '</section>' +
      '<section class="sec"><div class="sec-h"><h2>En otras ciudades</h2><p>Reparto con aliados locales</p></div><div class="mini-ags">' + otras.map(o => '<div><b>' + esc(o.a.ciudad) + '</b><span class="num">' + U.plural(o.n, 'envío') + '</span></div>').join('') + '</div></section>';
    el.querySelectorAll('[data-asig]').forEach(s => s.onchange = () => { const e = LC.store.envio(s.dataset.asig); e.repartidor = s.value || undefined; e.programado = s.value ? M.diaISO(Date.now()) : undefined; LC.store.log('Asignó reparto', e.id + ' → ' + (s.value ? LC.store.persona(s.value).nombre : 'sin asignar')); LC.store.save(); U.toast(e.id + (s.value ? ' asignado a ' + U.nombreCorto(LC.store.persona(s.value).nombre) : ' sin asignar')); });
    el.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => LC.envios.detalle(b.dataset.ver));
    const auto = el.querySelector('[data-auto]');
    if (auto) auto.onclick = () => {
      const porD = {};
      sinAsignar.forEach(e => (porD[distrito(e)] = porD[distrito(e)] || []).push(e));
      const carga = Object.fromEntries(reps.map(r => [r.id, deHoy(r.id).length]));
      Object.values(porD).sort((a, b) => b.length - a.length).forEach(g => { const r = Object.keys(carga).sort((a, b) => carga[a] - carga[b])[0]; g.forEach(e => { e.repartidor = r; e.programado = M.diaISO(Date.now()); }); carga[r] += g.length; });
      LC.store.log('Asignó reparto automático', U.plural(sinAsignar.length, 'envío'));
      LC.store.save();
      U.toast(U.plural(sinAsignar.length, 'envío asignado', 'envíos asignados') + ' por distrito');
      LC.refrescar();
    };
  }

  LC.reparto = { deHoy };
  LC.vistas.ruta = { titulo: 'Mi ruta de hoy', menu: 'Mi ruta', icono: 'route', modulo: 'reparto', badge: () => deHoy(LC.sesion.personaId).filter(pendiente).length, render: renderRuta };
  LC.vistas.reparto = { titulo: 'Reparto de hoy', menu: 'Reparto', icono: 'route', modulo: 'reparto', render: renderReparto };
})();
