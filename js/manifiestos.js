/* Manifiestos: armar la carga por destino, despachar el camión e imprimir el manifiesto */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;
  const db = () => LC.store.db;

  function porDespachar() {
    const g = {};
    db().envios.filter(e => e.estado === 'recibido' && e.origen !== e.destino).forEach(e => { const k = e.origen + '-' + e.destino; (g[k] = g[k] || []).push(e); });
    return Object.entries(g).map(([k, envs]) => ({ k, origen: envs[0].origen, destino: envs[0].destino, envs, kg: envs.reduce((s, e) => s + LC.store.tarifa(e).kg, 0), riesgo: Math.max(...envs.map(e => LC.store.riesgo(e).puntaje)) }))
      .sort((a, b) => b.riesgo - a.riesgo || b.envs.length - a.envs.length);
  }
  const locales = () => db().envios.filter(e => e.estado === 'recibido' && e.origen === e.destino);

  function manifiestoHTML(m) {
    const envs = m.envios.map(id => LC.store.envio(id)).filter(Boolean);
    const cond = LC.store.persona(m.conductor);
    return '<div class="guia"><header class="g-h"><div><h1>Manifiesto de carga ' + esc(m.id) + '</h1><p>' + esc(db().empresa.razon) + '</p><p>' + esc(M.agencia(m.origen).nombre) + ' → ' + esc(M.agencia(m.destino).nombre) + ' · salida ' + U.fechaLarga(m.salida) + ' ' + U.hora(m.salida) + '</p><p>Conductor: ' + esc(cond.nombre) + ' · ' + esc(m.vehiculo) + '</p></div>' + LC.envios.barcode(m.id.replace('M-', 'LC'), 40) + '</header>' +
      '<table><tr><td><b>N.º</b></td><td><b>Envío</b></td><td><b>Destinatario</b></td><td><b>Bultos</b></td><td><b>Kg</b></td><td><b>Entrega</b></td></tr>' +
      envs.map((e, i) => '<tr><td>' + (i + 1) + '</td><td>' + e.id + '</td><td>' + esc(e.destinatario.nombre) + '</td><td>' + e.bultos.length + '</td><td>' + (LC.store.tarifa(e).kg || 'sobre') + '</td><td>' + (e.tipoEntrega === 'domicilio' ? 'Domicilio' : 'Agencia') + (e.contraEntrega ? ' · cobrar S/ ' + e.contraEntrega : '') + '</td></tr>').join('') +
      '</table><p>Total: ' + U.plural(envs.length, 'envío') + ' · ' + envs.reduce((s, e) => s + e.bultos.length, 0) + ' bultos.</p><div class="g-firmas"><div>Despachó (agencia origen)</div><div>Conductor</div><div>Recibió (agencia destino)</div></div></div>';
  }

  function render(el) {
    const grupos = porDespachar();
    const loc = locales();
    const enRuta = db().manifiestos.filter(m => m.estado === 'en_ruta');
    const recientes = db().manifiestos.filter(m => m.estado === 'llegado').slice(0, 8);
    const conds = db().personas.filter(p => p.rol === 'conductor');
    el.innerHTML = '<section><div class="sec-h"><h2>Por despachar</h2><p>' + (grupos.length ? 'Envíos recibidos que esperan camión. Los de mayor riesgo van arriba.' : '') + '</p></div>' +
      (grupos.length ? '<div class="desp-grid">' + grupos.map(g => {
        const cond = conds.find(c => c.ruta.includes(g.origen === 'LIM' ? g.destino : g.origen)) || conds[0];
        return '<article class="caja desp" data-k="' + g.k + '"><header>' + LC.illus('camion', 44) + '<div><h3>' + esc(M.agencia(g.origen).ciudad) + ' → ' + esc(M.agencia(g.destino).ciudad) + '</h3><p class="muted">' + U.plural(g.envs.length, 'envío') + ' · ' + (g.kg ? Math.round(g.kg) + ' kg' : 'solo sobres') + ' · ' + U.num(M.km(g.origen, g.destino)) + ' km</p></div></header>' +
          '<p class="desp-r">' + U.riesgo(LC.store.riesgo(g.envs.slice().sort((a, b) => LC.store.riesgo(b).puntaje - LC.store.riesgo(a).puntaje)[0]), true) + '<span class="muted">el más urgente</span></p>' +
          '<label class="campo">Conductor y unidad<select data-cond>' + conds.map(c => '<option value="' + c.id + '"' + (c === cond ? ' selected' : '') + '>' + esc(U.nombreCorto(c.nombre)) + ' · ' + esc(c.vehiculo.split(' · ')[0]) + '</option>').join('') + '</select></label>' +
          '<button class="btn btn-primary" data-desp>' + icon('truck') + 'Despachar ' + U.plural(g.envs.length, 'envío') + '</button></article>';
      }).join('') + '</div>' : U.vacio('check', 'No hay carga esperando', 'Los envíos que reciban los counters aparecerán aquí agrupados por destino.')) +
      (loc.length ? '<p class="alerta">' + icon('box') + '<span><b>' + U.plural(loc.length, 'envío local') + '</b> en Lima por clasificar para reparto.</span><button class="btn btn-sm btn-line" data-clas>Clasificar</button></p>' : '') + '</section>' +
      '<section class="sec"><div class="sec-h"><h2>En carretera</h2><p>' + U.plural(enRuta.length, 'camión', 'camiones') + '</p></div>' + (enRuta.length ? '<div class="lista-man">' + enRuta.map(filaMan).join('') + '</div>' : U.vacio('truck', 'No hay camiones en carretera', '')) + '</section>' +
      '<section class="sec"><div class="sec-h"><h2>Llegaron hace poco</h2></div><div class="lista-man">' + recientes.map(filaMan).join('') + '</div></section>';

    el.querySelectorAll('.desp').forEach(card => card.querySelector('[data-desp]').onclick = () => {
      const g = grupos.find(x => x.k === card.dataset.k);
      const cond = LC.store.persona(card.querySelector('[data-cond]').value);
      const n = LC.store.nextId('manifiesto');
      const m = { id: 'M-' + M.diaISO(Date.now()).replace(/-/g, '').slice(2) + '-' + g.origen + '-' + g.destino + '-' + n, origen: g.origen, destino: g.destino, salida: Date.now(), conductor: cond.id, vehiculo: cond.vehiculo, envios: g.envs.map(e => e.id), estado: 'en_ruta' };
      db().manifiestos.unshift(m);
      g.envs.forEach(e => { e.manifiesto = m.id; LC.envios.avanzar(e, 'en_ruta', 'Salió en el manifiesto ' + m.id); });
      LC.store.log('Despachó manifiesto', m.id + ' · ' + U.plural(g.envs.length, 'envío') + ' · ' + cond.nombre);
      LC.store.save();
      U.toast('Manifiesto ' + m.id + ' despachado con ' + U.plural(g.envs.length, 'envío'));
      LC.refrescar();
      LC.ui.imprimir(manifiestoHTML(m));
    });
    const clas = el.querySelector('[data-clas]');
    if (clas) clas.onclick = () => { loc.forEach(e => LC.envios.avanzar(e, 'en_destino', 'Clasificado en almacén Lima para su entrega')); U.toast(U.plural(loc.length, 'envío clasificado', 'envíos clasificados')); LC.refrescar(); };
    el.querySelectorAll('[data-man]').forEach(b => b.onclick = () => verMan(b.dataset.man));
  }

  function filaMan(m) {
    const cond = LC.store.persona(m.conductor);
    const eta = m.salida + M.horasTransito(m.origen, m.destino) * 36e5;
    const tarde = m.estado === 'en_ruta' && Date.now() > eta;
    return '<button class="man" data-man="' + esc(m.id) + '"><span class="man-r"><b>' + esc(M.agencia(m.origen).ciudad) + '</b>' + icon('arrowR') + '<b>' + esc(M.agencia(m.destino).ciudad) + '</b></span>' +
      '<span class="muted num">' + esc(m.id) + '</span><span>' + U.plural(m.envios.length, 'envío') + '</span><span>' + esc(U.nombreCorto(cond.nombre)) + '</span>' +
      '<span>' + (m.estado === 'llegado' ? '<span class="tag tag-ok">' + icon('check') + 'Llegó ' + U.cuando(m.llegada) + '</span>' : tarde ? '<span class="tag tag-red">' + icon('clock') + 'Debió llegar ' + U.cuando(eta) + '</span>' : '<span class="tag">' + icon('clock') + 'Llega ' + U.cuando(eta) + '</span>') + '</span>' +
      (m.incidencia ? '<span class="man-inc">' + icon('alert') + esc(m.incidencia) + '</span>' : '') + '</button>';
  }

  function verMan(id) {
    const m = LC.store.manifiesto(id);
    const envs = m.envios.map(x => LC.store.envio(x)).filter(Boolean);
    const p = U.panel('<div class="panel-h"><div style="flex:1;min-width:0"><span class="sub">' + esc(M.agencia(m.origen).ciudad) + ' → ' + esc(M.agencia(m.destino).ciudad) + ' · ' + esc(m.vehiculo) + '</span><h2 class="num">' + esc(m.id) + '</h2></div><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="panel-c">' + (m.incidencia ? '<p class="alerta mal">' + icon('alert') + '<span>' + esc(m.incidencia) + '</span></p>' : '') + '<div class="lista-env mini">' + envs.map(e => '<button class="mini-env" data-id="' + e.id + '"><b class="num">' + e.id + '</b><span>' + esc(U.nombreCorto(e.destinatario.nombre)) + '</span>' + U.estado(e, true) + '</button>').join('') + '</div></div>' +
      '<div class="panel-f"><button class="btn btn-line" data-print>' + icon('print') + 'Imprimir manifiesto</button></div>');
    p.querySelector('[data-print]').onclick = () => LC.ui.imprimir(manifiestoHTML(m));
    p.querySelectorAll('[data-id]').forEach(b => b.onclick = () => LC.envios.detalle(b.dataset.id));
  }

  LC.manifiestos = { porDespachar, filaMan };
  LC.vistas.manifiestos = { titulo: 'Manifiestos y despacho', menu: 'Despacho', icono: 'truck', modulo: 'manifiestos', badge: () => porDespachar().length, render };
})();
