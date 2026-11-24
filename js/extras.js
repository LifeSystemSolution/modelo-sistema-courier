/* Plan Completo: cobro contra entrega (liquidación a tiendas) y avisos por WhatsApp (simulados) */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;
  const db = () => LC.store.db;

  /* ===== Contra entrega ===== */
  function renderCE(el) {
    const ce = db().envios.filter(e => e.contraEntrega);
    const porCobrar = ce.filter(e => !e.ce);
    const porLiq = ce.filter(e => e.ce && !e.ce.liquidado);
    const liq30 = ce.filter(e => e.ce && e.ce.liquidado && e.ce.liquidado > Date.now() - 30 * 864e5);
    const comision = e => Math.max(db().ajustes.tarifa.ceMin, e.contraEntrega * db().ajustes.tarifa.cePct / 100);
    const tiendas = {};
    porLiq.forEach(e => { const k = e.remitente.clienteId || e.remitente.nombre; (tiendas[k] = tiendas[k] || { nombre: e.remitente.nombre, envs: [] }).envs.push(e); });
    el.innerHTML = '<div class="kpis"><div class="kpi"><span>Por cobrar</span><b class="num">' + U.soles(porCobrar.reduce((s, e) => s + e.contraEntrega, 0), 0) + '</b><small>' + U.plural(porCobrar.length, 'envío') + ' en camino o en agencia</small></div>' +
      '<div class="kpi kpi-mal"><span>Cobrado, por liquidar</span><b class="num">' + U.soles(porLiq.reduce((s, e) => s + e.contraEntrega, 0), 0) + '</b><small>a ' + U.plural(Object.keys(tiendas).length, 'tienda') + '</small></div>' +
      '<div class="kpi"><span>Liquidado en 30 días</span><b class="num">' + U.soles(liq30.reduce((s, e) => s + e.contraEntrega, 0), 0) + '</b><small>' + U.plural(liq30.length, 'envío') + '</small></div>' +
      '<div class="kpi"><span>Tu comisión en 30 días</span><b class="num">' + U.soles(liq30.concat(porLiq).reduce((s, e) => s + comision(e), 0), 0) + '</b><small>' + db().ajustes.tarifa.cePct + '% (mín. S/ ' + db().ajustes.tarifa.ceMin + '), ya incluida en la tarifa</small></div></div>' +
      '<section class="sec"><div class="sec-h"><h2>Liquidar a tiendas</h2><p>Se liquida lo cobrado. La comisión ya se cobró en la tarifa del envío.</p></div>' +
      (Object.keys(tiendas).length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Tienda</th><th class="r">Envíos</th><th class="r">Cobrado</th><th>Desde</th><th></th></tr></thead><tbody>' +
        Object.entries(tiendas).map(([k, t]) => '<tr><td><b>' + esc(t.nombre) + '</b></td><td class="r num">' + t.envs.length + '</td><td class="r num">' + U.soles(t.envs.reduce((s, e) => s + e.contraEntrega, 0)) + '</td><td>' + U.fechaDia(Math.min(...t.envs.map(e => e.ce.cobrado))) + '</td><td class="r"><button class="btn btn-sm btn-dark" data-liq="' + esc(k) + '">Liquidar</button></td></tr>').join('') + '</tbody></table></div>'
        : U.vacio('check', 'No hay nada por liquidar', 'Lo que se cobre al entregar aparecerá aquí agrupado por tienda.')) + '</section>' +
      '<section class="sec"><div class="sec-h"><h2>Por cobrar al entregar</h2></div><div class="lista-env mini">' + porCobrar.map(e => '<button class="mini-env" data-id="' + e.id + '"><b class="num">' + e.id + '</b><span>' + esc(U.nombreCorto(e.remitente.nombre)) + ' → ' + esc(U.nombreCorto(e.destinatario.nombre)) + ' · ' + U.soles(e.contraEntrega, 0) + '</span>' + U.estado(e, true) + '</button>').join('') + '</div></section>';
    el.querySelectorAll('[data-liq]').forEach(b => b.onclick = async () => {
      const t = tiendas[b.dataset.liq];
      const total = t.envs.reduce((s, e) => s + e.contraEntrega, 0);
      const r = await U.modal('Liquidar a ' + t.nombre, '<p>Vas a transferir <b>' + U.soles(total) + '</b> por ' + U.plural(t.envs.length, 'envío cobrado', 'envíos cobrados') + '.</p><label class="campo">Medio<select name="medio"><option>Transferencia bancaria</option><option>Yape empresarial</option><option>Efectivo en agencia</option></select></label><p class="muted">La transferencia es simulada. Se imprime la constancia.</p>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Liquidar ' + U.soles(total, 0), 'btn-dark']]);
      if (r.v !== 'ok') return;
      const ahora = Date.now();
      t.envs.forEach(e => { e.ce.liquidado = ahora; });
      LC.store.log('Liquidó contra entrega', t.nombre + ' · ' + U.soles(total));
      LC.store.save();
      U.toast('Liquidaste ' + U.soles(total) + ' a ' + t.nombre);
      U.imprimir('<div class="guia"><header class="g-h"><div><h1>Liquidación de cobros contra entrega</h1><p>' + esc(db().empresa.razon) + '</p><p>Para: ' + esc(t.nombre) + ' · ' + U.fechaLarga(ahora) + ' · ' + esc(r.data.get('medio')) + '</p></div></header><table><tr><td><b>Envío</b></td><td><b>Destinatario</b></td><td><b>Entregado</b></td><td><b>Cobrado</b></td></tr>' +
        t.envs.map(e => '<tr><td>' + e.id + '</td><td>' + esc(e.destinatario.nombre) + '</td><td>' + U.fechaDia(e.entregado) + '</td><td>' + U.soles(e.contraEntrega) + '</td></tr>').join('') + '<tr><td colspan="3"><b>Total liquidado</b></td><td><b>' + U.soles(total) + '</b></td></tr></table><div class="g-firmas"><div>Entregó LifeCargo</div><div>Recibió la tienda</div></div></div>');
      LC.refrescar();
    });
    el.querySelectorAll('[data-id]').forEach(b => b.onclick = () => LC.envios.detalle(b.dataset.id));
  }

  /* ===== Avisos por WhatsApp ===== */
  function texto(e, estado) {
    const p = db().ajustes.plantillas[estado];
    if (!p) return '';
    return p.replace('{destinatario}', U.nombreCorto(e.destinatario.nombre).split(' ')[0]).replace('{remitente}', U.nombreCorto(e.remitente.nombre)).replace('{codigo}', e.id)
      .replace('{promesa}', U.fechaDia(e.promesa)).replace('{agencia}', M.agencia(e.destino).nombre);
  }
  function registrar(e, estado) {
    if (!LC.tieneModulo || !LC.tieneModulo('avisos') || !db().ajustes.plantillas[estado]) return;
    db().avisos.unshift({ t: Date.now(), envio: e.id, a: e.destinatario.nombre, tel: e.destinatario.tel, estado, txt: texto(e, estado) });
    if (db().avisos.length > 200) db().avisos.length = 200;
  }
  function abrir(e) {
    const t = texto(e, e.estado) || 'Hola, te escribimos de LifeCargo sobre tu envío ' + e.id + '.';
    U.modal('Avisar a ' + U.nombreCorto(e.destinatario.nombre), '<div class="wa-burbuja">' + esc(t) + '</div><p class="muted">En el demo no se envía nada: el número del destinatario es ficticio.</p>', [['cancelar', 'Cerrar', 'btn-line'], ['ok', 'Marcar como enviado', 'btn-ok']]).then(r => {
      if (r.v !== 'ok') return;
      db().avisos.unshift({ t: Date.now(), envio: e.id, a: e.destinatario.nombre, tel: e.destinatario.tel, estado: e.estado, txt: t, manual: true });
      LC.store.save();
      U.toast('Aviso registrado (simulado)');
    });
  }

  function renderAvisos(el) {
    // Últimos movimientos de los envíos abiertos, como si se hubieran enviado avisos automáticos
    const auto = db().envios.filter(e => e.estado !== 'entregado' || e.entregado > Date.now() - 2 * 864e5).flatMap(e => e.eventos.filter(x => db().ajustes.plantillas[x.estado] && !x.nota.startsWith('Intento')).map(x => ({ t: x.t, envio: e.id, a: e.destinatario.nombre, estado: x.estado, txt: texto(e, x.estado) })));
    const log = db().avisos.concat(auto.filter(a => a.t < U.inicioDia())).sort((a, b) => b.t - a.t).slice(0, 40);
    const P = db().ajustes.plantillas;
    const NOM = { recibido: 'Al registrar el envío', en_destino: 'Al llegar a la agencia destino', en_reparto: 'Al salir a reparto', entregado: 'Al entregar' };
    el.innerHTML = '<p class="alerta">' + icon('whatsapp') + '<span>Envío simulado: en el demo los mensajes no salen del navegador. En el sistema real se conectan con WhatsApp Business.</span></p>' +
      '<div class="grid2 sec"><section class="caja caja-p"><div class="sec-h"><h2>Plantillas</h2><p>Variables: {destinatario} {remitente} {codigo} {promesa} {agencia}</p></div><div class="plantillas">' +
      Object.keys(NOM).map(k => '<label class="campo">' + NOM[k] + '<textarea data-pl="' + k + '" rows="3">' + esc(P[k]) + '</textarea></label>').join('') + '<button class="btn btn-dark" data-guardar>Guardar plantillas</button></div></section>' +
      '<section class="caja caja-p"><div class="sec-h"><h2>Enviados</h2><p>' + U.plural(log.length, 'mensaje') + ' recientes</p></div><ul class="wa-log">' + log.map(a => '<li><div><b>' + esc(U.nombreCorto(a.a)) + '</b><time>' + U.cuando(a.t) + '</time></div><p>' + esc(a.txt) + '</p><small class="num">' + a.envio + ' · ' + icon('check') + icon('check') + ' entregado</small></li>').join('') + '</ul></section></div>';
    el.querySelector('[data-guardar]').onclick = () => {
      el.querySelectorAll('[data-pl]').forEach(t => { P[t.dataset.pl] = t.value.trim(); });
      LC.store.log('Editó plantillas de WhatsApp', '');
      LC.store.save();
      U.toast('Plantillas guardadas');
    };
  }

  LC.avisos = { registrar, abrir, texto };
  LC.vistas.contraentrega = { titulo: 'Cobro contra entrega', menu: 'Contra entrega', corto: 'Cobros', icono: 'cash', modulo: 'contraentrega', render: renderCE };
  LC.vistas.avisos = { titulo: 'Avisos por WhatsApp', menu: 'Avisos WhatsApp', corto: 'Avisos', icono: 'whatsapp', modulo: 'avisos', render: renderAvisos };
})();
