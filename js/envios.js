/* Envíos: operaciones (crear, avanzar estado, entregar), detalle, guía imprimible y lista */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;

  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const st = () => LC.store;
  const db = () => LC.store.db;
  const ag = id => M.agencia(id);
  const persona = id => (id ? st().persona(id) : null);

  /* ===== Operaciones ===== */
  function evento(e, estado, nota, extra) {
    const t = Date.now();
    e.eventos.push(Object.assign({ t, estado, lugar: estado === 'recibido' ? e.origen : e.destino, por: LC.sesion ? LC.sesion.personaId : null, nota: nota || '' }, extra || {}));
    e.estado = estado;
    if (estado === 'entregado') e.entregado = t;
    if (LC.avisos) LC.avisos.registrar(e, estado);
  }

  function crear(d) {
    const s = st();
    const id = 'LC-' + s.nextId('envio');
    const e = {
      id, creado: Date.now(), origen: d.origen, destino: d.destino,
      remitente: d.remitente, destinatario: d.destinatario,
      tipoEntrega: d.tipoEntrega, servicio: d.servicio, bultos: d.bultos, contenido: d.contenido,
      valorDeclarado: Number(d.valorDeclarado) || 0, contraEntrega: Number(d.contraEntrega) || 0,
      counter: LC.sesion ? LC.sesion.personaId : 'P1', intentos: 0, eventos: [], estado: 'recibido'
    };
    e.tarifa = s.tarifa(e).total;
    e.promesa = M.promesa(e.creado, e.origen, e.destino, e.servicio);
    e.pago = { medio: d.medio || 'Efectivo', t: e.creado, por: e.counter, monto: e.tarifa };
    db().envios.unshift(e);
    evento(e, 'recibido', 'Recibido en agencia ' + ag(e.origen).nombre);
    if (d.remitente.clienteId) { const c = s.cliente(d.remitente.clienteId); if (c) c.ultimo = e.creado; }
    s.log('Registró el envío', id + ' · ' + ag(e.origen).ciudad + ' → ' + ag(e.destino).ciudad + ' · ' + U.soles(e.tarifa));
    s.save();
    return e;
  }

  const NOMBRES = ['Milagros Salazar Cruz', 'Renzo Gutiérrez Poma', 'Fiorella Ramos Ticona', 'César Villanueva Ríos', 'Nataly Espinoza Vega', 'Percy Huanca Flores'];
  function simular() {
    const s = st();
    const destinos = ['ARE', 'TRU', 'CUS', 'PIU', 'HYO', 'LIM'];
    const n = db().contadores.envio;
    const destino = destinos[n % destinos.length];
    const frec = db().clientes.filter(c => c.agencia === 'LIM');
    const c = frec[n % frec.length];
    const dom = n % 3 !== 0;
    const prev = LC.sesion;
    if (!LC.sesion || LC.sesion.rol !== 'counter') LC.sesion = Object.assign({}, LC.sesion || {}, { personaId: 'P1', nombre: 'Rosa Quispe Huamán' });
    const e = crear({
      origen: 'LIM', destino,
      remitente: { clienteId: c.id, nombre: c.nombre, doc: c.doc, tel: c.tel, tipo: c.tipo },
      destinatario: { nombre: NOMBRES[n % NOMBRES.length], doc: String(40000000 + (n * 7919) % 39999999), tel: '9000' + String(10000 + (n * 31) % 89999), dir: dom ? 'Jr. Los Pinos ' + (100 + n % 800) + ', ' + (destino === 'LIM' ? 'Los Olivos' : ag(destino).ciudad) : '' },
      tipoEntrega: dom ? 'domicilio' : 'agencia', servicio: n % 4 === 0 ? 'express' : 'estandar',
      bultos: c.tipo === 'empresa' && !c.tienda ? [{ tipo: 'sobre', peso: 0.2, l: 0, a: 0, h: 0 }] : [{ tipo: 'paquete', peso: 1.5 + (n % 5), l: 35, a: 25, h: 18 }],
      contenido: c.tienda ? 'Pedido web: ropa' : c.tipo === 'empresa' ? 'Documentos' : 'Encomienda familiar',
      valorDeclarado: c.tienda ? 150 : 0, contraEntrega: c.tienda ? 120 : 0,
      medio: ['Efectivo', 'Yape', 'Tarjeta'][n % 3]
    });
    LC.sesion = prev;
    return e;
  }

  /* Cambio de estado manual, con nota */
  function avanzar(e, estado, nota, extra) {
    evento(e, estado, nota, extra);
    st().log('Cambió el estado', e.id + ' → ' + U.ESTADOS[estado].txt);
    st().save();
  }

  function entregar(e, datos) {
    evento(e, 'entregado', (e.tipoEntrega === 'agencia' ? 'Recogido en agencia por ' : 'Entregado a ') + datos.quien + ' · DNI ' + datos.dni + ' verificado');
    if (e.contraEntrega && !e.ce) e.ce = { cobrado: e.entregado, medio: datos.medio || 'Efectivo', por: LC.sesion.personaId };
    st().log('Entregó el envío', e.id + (e.contraEntrega ? ' · cobró ' + U.soles(e.contraEntrega) : ''));
    st().save();
  }

  function intentoFallido(e, motivo) {
    e.intentos = (e.intentos || 0) + 1;
    evento(e, 'en_destino', 'Intento fallido: ' + motivo);
    delete e.programado;
    st().log('Registró intento fallido', e.id + ' · ' + motivo);
    st().save();
  }

  /* ===== Código de barras Code 39 en SVG ===== */
  const C39 = { '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'L': 'wnnnnwnnw', 'C': 'wnwnnwnnn', '-': 'nwnnnnwnw', '*': 'nwnnwnwnn' };
  function barcode(txt, alto) {
    const s = '*' + txt.toUpperCase() + '*';
    let x = 0, rects = '';
    for (const ch of s) {
      const p = C39[ch] || C39['-'];
      for (let i = 0; i < 9; i++) { const w = p[i] === 'w' ? 3 : 1; if (i % 2 === 0) rects += '<rect x="' + x + '" y="0" width="' + w + '" height="' + (alto || 40) + '"/>'; x += w; }
      x += 1;
    }
    return '<svg class="barcode" viewBox="0 0 ' + x + ' ' + (alto || 40) + '" preserveAspectRatio="none" aria-label="Código de barras ' + esc(txt) + '">' + rects + '</svg>';
  }

  /* ===== Documento imprimible: guía + etiqueta + comprobante ===== */
  function guiaHTML(e) {
    const emp = db().empresa;
    const T = st().tarifa(e);
    const o = ag(e.origen), d = ag(e.destino);
    const ce = e.contraEntrega ? '<p class="g-ce">COBRAR AL ENTREGAR: <b>' + U.soles(e.contraEntrega) + '</b></p>' : '';
    const etiqueta = '<section class="g-etq"><div class="g-etq-h"><b>LifeCargo Express</b><span>' + esc(e.servicio === 'express' ? 'EXPRESS' : 'ESTÁNDAR') + '</span></div>' +
      '<div class="g-ruta"><span>' + o.id + '</span>→<b>' + d.id + '</b></div>' + barcode(e.id, 46) + '<p class="g-cod">' + e.id + '</p>' +
      '<p><b>Para:</b> ' + esc(e.destinatario.nombre) + ' · ' + esc(e.destinatario.tel) + '</p><p>' + (e.tipoEntrega === 'domicilio' ? esc(e.destinatario.dir) : 'Recojo en agencia ' + esc(d.nombre)) + '</p>' + ce +
      '<p class="g-peq">' + e.bultos.length + (e.bultos.length === 1 ? ' bulto' : ' bultos') + ' · ' + (T.kg ? T.kg + ' kg' : 'sobre') + ' · llega ' + U.fechaDia(e.promesa) + '</p></section>';
    return '<div class="guia"><header class="g-h"><div><h1>Guía de envío ' + e.id + '</h1><p>' + esc(emp.razon) + ' · RUC ' + emp.ruc + ' (ficticio)</p><p>' + esc(emp.direccion) + '</p></div>' + barcode(e.id, 40) + '</header>' +
      '<table><tr><td><b>Remitente</b><br>' + esc(e.remitente.nombre) + '<br>' + (e.remitente.doc.length === 11 ? 'RUC ' : 'DNI ') + esc(e.remitente.doc) + ' · ' + esc(e.remitente.tel) + '</td>' +
      '<td><b>Destinatario</b><br>' + esc(e.destinatario.nombre) + '<br>DNI ' + esc(e.destinatario.doc) + ' · ' + esc(e.destinatario.tel) + (e.destinatario.dir ? '<br>' + esc(e.destinatario.dir) : '') + '</td></tr>' +
      '<tr><td><b>Origen</b><br>' + esc(o.nombre) + '<br>' + U.fechaLarga(e.creado) + ' ' + U.hora(e.creado) + '</td><td><b>Destino</b><br>' + esc(d.nombre) + ' · ' + (e.tipoEntrega === 'domicilio' ? 'entrega a domicilio' : 'recojo en agencia') + '<br>Fecha prometida: ' + U.fechaLarga(e.promesa) + '</td></tr>' +
      '<tr><td colspan="2"><b>Contenido declarado:</b> ' + esc(e.contenido) + ' · ' + e.bultos.map((b, i) => (b.tipo === 'sobre' ? 'Sobre' : 'Bulto ' + (i + 1) + ': ' + b.peso + ' kg, ' + b.l + '×' + b.a + '×' + b.h + ' cm')).join(' · ') + (e.valorDeclarado ? ' · Valor declarado ' + U.soles(e.valorDeclarado) : '') + '</td></tr></table>' +
      '<h2>Boleta de venta electrónica B001-' + String(Number(e.id.slice(3)) - 100000).padStart(8, '0') + ' (demo)</h2><table class="g-tar">' + T.lineas.map(l => '<tr><td>' + esc(l.c) + '<br><small>' + esc(l.f) + '</small></td><td class="r">' + U.soles(l.m) + '</td></tr>').join('') +
      '<tr><td><b>Total pagado · ' + esc(e.pago.medio) + '</b></td><td class="r"><b>' + U.soles(e.tarifa) + '</b></td></tr></table>' +
      '<p class="g-peq">Documento de demostración. El envío a SUNAT es simulado. Consulta tu envío en la web de LifeCargo con el código ' + e.id + '.</p>' +
      '<div class="g-firmas"><div>Firma del remitente</div><div>Recibido por (counter)</div></div>' + etiqueta + '</div>';
  }
  const imprimirGuia = e => U.imprimir(guiaHTML(e));

  /* ===== Detalle (panel lateral) ===== */
  function timeline(e) {
    return '<ol class="tl">' + e.eventos.slice().reverse().map(x => {
      const p = persona(x.por);
      const fallo = x.nota.startsWith('Intento fallido');
      return '<li class="' + (fallo ? 'tl-mal' : '') + '"><time>' + U.cuando(x.t) + '</time><div><b>' + (fallo ? 'Intento fallido' : U.ESTADOS[x.estado].txt) + '</b> · ' + esc(ag(x.lugar).ciudad) + '<p>' + esc(fallo ? x.nota.replace('Intento fallido: ', '') : x.nota) + (p ? ' · ' + esc(U.nombreCorto(p.nombre)) : '') + '</p></div></li>';
    }).join('') + '</ol>';
  }

  function accionesDe(e) {
    const rol = LC.sesion.rol;
    const a = [];
    const enMiAgencia = LC.sesion.agencia === e.destino || rol === 'jefe';
    if (e.estado === 'recibido' && rol !== 'transportista' && !LC.tieneModulo('manifiestos')) a.push(['salida', 'Marcar salida', 'btn-dark', 'truck']);
    if (e.estado === 'en_ruta' && enMiAgencia) a.push(['llegada', 'Registrar llegada', 'btn-dark', 'store']);
    if (e.estado === 'en_destino' && e.tipoEntrega === 'agencia' && enMiAgencia && rol !== 'transportista') a.push(['entregar', 'Entregar al cliente', 'btn-primary', 'check']);
    if (e.estado === 'en_destino' && e.tipoEntrega === 'domicilio' && (rol === 'transportista' || rol === 'jefe')) a.push(['reparto', 'Salir a reparto', 'btn-dark', 'truck']);
    if (e.estado === 'en_reparto' && (rol === 'transportista' || rol === 'jefe')) { a.push(['entregar', 'Entregado', 'btn-primary', 'check']); a.push(['fallo', 'No se pudo entregar', 'btn-line', 'alert']); }
    a.push(['guia', 'Imprimir guía y etiqueta', 'btn-line', 'print']);
    if (LC.tieneModulo('avisos') && rol !== 'transportista') a.push(['wa', 'Avisar por WhatsApp', 'btn-line', 'whatsapp']);
    return a;
  }

  function detalle(id) {
    const e = st().envio(id);
    if (!e) { U.toast('No encontramos el envío ' + id + '. Revisa el código.', 'error'); return; }
    const r = e.estado === 'entregado' ? null : st().riesgo(e);
    const T = st().tarifa(e);
    const o = ag(e.origen), d = ag(e.destino);
    const cump = M.cumplido(e);
    const cumple = cump ? (cump <= e.promesa ? '<span class="tag tag-ok">' + icon('check') + 'A tiempo</span>' : '<span class="tag tag-red">' + icon('clock') + 'Con ' + U.duracion((cump - e.promesa) / 36e5) + ' de retraso</span>') : '';
    const html = '<div class="panel-h"><div style="flex:1;min-width:0"><span class="sub">' + U.fechaDia(e.creado) + ' · ' + esc(e.servicio === 'express' ? 'Express' : 'Estándar') + ' · ' + (e.tipoEntrega === 'domicilio' ? 'A domicilio' : 'Recojo en agencia') + '</span><h2 class="num">' + e.id + '</h2></div><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="panel-c">' +
      '<div class="fila">' + U.estado(e) + cumple + (e.contraEntrega ? '<span class="tag">' + icon('cash') + 'Cobrar ' + U.soles(e.contraEntrega) + (e.ce ? ' · cobrado' : '') + '</span>' : '') + '</div>' +
      '<div class="ruta-big"><div><span>' + esc(o.ciudad) + '</span><small>' + U.cuando(e.creado) + '</small></div>' + icon('arrowR') + '<div><span>' + esc(d.ciudad) + '</span><small>Promesa: ' + U.fechaDia(e.promesa) + ' ' + U.hora(e.promesa) + '</small></div></div>' +
      (r ? '<section class="bloque"><h3>Riesgo de retraso</h3>' + U.medidor(r) + '</section>' : '') +
      '<section class="bloque dato-grid"><div class="dato"><span>Remitente</span><b>' + esc(e.remitente.nombre) + '</b><small>' + (e.remitente.doc.length === 11 ? 'RUC ' : 'DNI ') + esc(e.remitente.doc) + ' · ' + esc(e.remitente.tel) + '</small></div>' +
      '<div class="dato"><span>Destinatario</span><b>' + esc(e.destinatario.nombre) + '</b><small>DNI ' + esc(e.destinatario.doc) + ' · ' + esc(e.destinatario.tel) + '</small></div>' +
      (e.destinatario.dir ? '<div class="dato"><span>Dirección de entrega</span><b>' + esc(e.destinatario.dir) + '</b></div>' : '') +
      '<div class="dato"><span>Contenido</span><b>' + esc(e.contenido) + '</b><small>' + U.plural(e.bultos.length, 'bulto') + (T.kg ? ' · ' + T.kg + ' kg facturables' : ' · sobre') + '</small></div></section>' +
      '<section class="bloque"><h3>Tarifa: ' + U.soles(e.tarifa) + ' <small class="muted">· ' + esc(e.pago.medio) + '</small></h3><ul class="desglose">' + T.lineas.map(l => '<li><span>' + esc(l.c) + '<small>' + esc(l.f) + '</small></span><b class="num">' + U.soles(l.m) + '</b></li>').join('') + '</ul></section>' +
      '<section class="bloque"><h3>Historial</h3>' + timeline(e) + '</section>' +
      '</div><div class="panel-f">' + accionesDe(e).map(b => '<button class="btn ' + b[2] + '" data-acc="' + b[0] + '">' + icon(b[3]) + b[1] + '</button>').join('') + '</div>';
    const p = U.panel(html);
    p.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => accion(e, b.dataset.acc));
  }

  async function accion(e, acc) {
    if (acc === 'guia') { imprimirGuia(e); return; }
    if (acc === 'wa') { LC.avisos.abrir(e); return; }
    if (acc === 'salida') { avanzar(e, 'en_ruta', 'Salió de la agencia ' + ag(e.origen).nombre); U.toast(e.id + ' salió a ' + ag(e.destino).ciudad); }
    if (acc === 'llegada') { avanzar(e, 'en_destino', 'Llegó a la agencia ' + ag(e.destino).nombre); U.toast(e.id + ' ya está en la agencia ' + ag(e.destino).ciudad); }
    if (acc === 'reparto') { if (!e.repartidor) e.repartidor = LC.sesion.rol === 'transportista' ? LC.sesion.personaId : 'P3'; avanzar(e, 'en_reparto', 'Salió a reparto'); U.toast(e.id + ' salió a reparto'); }
    if (acc === 'entregar') { const ok = await pedirEntrega(e); if (!ok) return; U.toast(e.id + ' entregado' + (e.contraEntrega ? ' · cobraste ' + U.soles(e.contraEntrega) : '')); }
    if (acc === 'fallo') { const ok = await pedirFallo(e); if (!ok) return; U.toast('Intento fallido registrado. ' + e.id + ' vuelve a la agencia.', 'info'); }
    LC.refrescar();
    detalle(e.id);
  }

  async function pedirEntrega(e) {
    const ce = e.contraEntrega && !e.ce ? '<p class="nota">' + icon('cash') + ' Cobra <b>' + U.soles(e.contraEntrega) + '</b> antes de entregar.</p><label class="campo">Medio de cobro<select name="medio"><option>Efectivo</option><option>Yape</option><option>Plin</option></select></label>' : '';
    const r = await U.modal('Entregar ' + e.id, '<p>Pide el DNI a quien recibe. Debe coincidir con el destinatario o tener carta poder.</p>' + ce +
      '<label class="campo">Recibe<input name="quien" value="' + esc(e.destinatario.nombre) + '" required></label>' +
      '<label class="campo">DNI de quien recibe<input name="dni" inputmode="numeric" maxlength="8" value="' + esc(e.destinatario.doc) + '" required pattern="[0-9]{8}"></label>' +
      '<label class="check"><input type="checkbox" name="firma" checked> Firmó en la pantalla (simulado)</label>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Confirmar entrega', 'btn-primary']]);
    if (r.v !== 'ok') return false;
    const dni = String(r.data.get('dni') || '').trim();
    if (!/^\d{8}$/.test(dni)) { U.toast('El DNI debe tener 8 dígitos. Vuelve a intentarlo.', 'error'); return false; }
    entregar(e, { quien: LC.ui.nombreCorto(r.data.get('quien') || e.destinatario.nombre), dni, medio: r.data.get('medio') });
    return true;
  }

  async function pedirFallo(e) {
    const r = await U.modal('No se pudo entregar ' + e.id, '<p>El envío vuelve a la agencia y se programa para el siguiente día hábil.</p><label class="campo">Motivo<select name="motivo"><option>No había nadie en el domicilio</option><option>Dirección incompleta o errada</option><option>El cliente pidió reprogramar</option><option>Rechazó el envío</option><option>Zona sin acceso</option></select></label>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Registrar intento', 'btn-dark']]);
    if (r.v !== 'ok') return false;
    intentoFallido(e, r.data.get('motivo'));
    return true;
  }

  /* ===== Lista ===== */
  function fila(e, r) {
    const d = ag(e.destino), o = ag(e.origen);
    return '<button class="env" data-id="' + e.id + '">' +
      '<span class="env-id"><b class="num">' + e.id + '</b><small>' + U.cuando(e.creado) + '</small></span>' +
      '<span class="env-p"><b>' + esc(e.destinatario.nombre) + '</b><small>De ' + esc(U.nombreCorto(e.remitente.nombre)) + ' · ' + esc(e.contenido) + '</small></span>' +
      '<span class="env-r">' + esc(o.ciudad) + icon('arrowR') + '<b>' + esc(d.ciudad) + '</b></span>' +
      '<span class="env-e">' + U.estado(e, true) + '</span>' +
      '<span class="env-k">' + (r ? U.riesgo(r) : (M.cumplido(e) <= e.promesa ? '<span class="rg rg-ok">' + icon('check') + '<span>A tiempo</span></span>' : '<span class="rg rg-tarde">' + icon('clock') + '<span>Con retraso</span></span>')) + '</span>' +
      '<span class="env-f num">' + (e.estado === 'entregado' ? U.fechaDia(e.entregado) : U.fechaDia(e.promesa)) + '</span></button>';
  }

  const FILTROS = [
    ['abiertos', 'En proceso'], ['riesgo', 'En riesgo'], ['vencidos', 'Vencidos'], ['recoger', 'Por recoger'], ['camino', 'En camino'], ['entregados', 'Entregados'], ['todos', 'Todos']
  ];

  function render(el, params) {
    const rol = LC.sesion.rol;
    let filtro = params.get('f') || 'abiertos';
    let q = params.get('q') || '';
    let agencia = rol === 'jefe' ? (params.get('ag') || '') : LC.sesion.agencia;
    let limite = 60;
    el.innerHTML = '<div class="barra-f"><label class="buscar">' + icon('search') + '<input type="search" data-buscar placeholder="Código, DNI, nombre o teléfono" value="' + esc(q) + '" aria-label="Buscar envíos"><kbd>/</kbd></label>' +
      (rol === 'jefe' ? '<select class="sel-ag" aria-label="Agencia"><option value="">Todas las agencias</option>' + M.AGENCIAS.map(a => '<option value="' + a.id + '"' + (a.id === agencia ? ' selected' : '') + '>' + esc(a.nombre) + '</option>').join('') + '</select>' : '') +
      (LC.puede('recepcion') ? '<a class="btn btn-primary" href="#/recepcion">' + icon('plus') + 'Nuevo envío</a>' : '') + '</div>' +
      '<div class="chips" role="tablist">' + FILTROS.map(f => '<button class="chip' + (f[0] === filtro ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '<span class="num" data-n="' + f[0] + '"></span></button>').join('') + '</div>' +
      (rol !== 'jefe' ? '<p class="muted ayuda">Ves los envíos que salen o llegan a la agencia ' + esc(ag(agencia).nombre) + '.</p>' : '') +
      '<div class="lista-env" id="lista"></div>';
    const lista = el.querySelector('#lista');

    function pintar() {
      const ahora = Date.now();
      let base = db().envios.filter(e => !agencia || e.origen === agencia || e.destino === agencia);
      const qq = norm(q);
      if (qq) base = base.filter(e => norm(e.id + ' ' + e.remitente.nombre + ' ' + e.remitente.doc + ' ' + e.remitente.tel + ' ' + e.destinatario.nombre + ' ' + e.destinatario.doc + ' ' + e.destinatario.tel).includes(qq));
      const conR = base.map(e => ({ e, r: e.estado === 'entregado' ? null : st().riesgo(e) }));
      const grupos = {
        abiertos: conR.filter(x => x.r),
        riesgo: conR.filter(x => x.r && (x.r.nivel === 'alto' || x.r.nivel === 'medio')),
        vencidos: conR.filter(x => x.r && x.r.vencido),
        recoger: conR.filter(x => x.e.estado === 'en_destino' && x.e.tipoEntrega === 'agencia'),
        camino: conR.filter(x => x.e.estado === 'en_ruta'),
        entregados: conR.filter(x => !x.r),
        todos: conR
      };
      el.querySelectorAll('[data-n]').forEach(s => { s.textContent = grupos[s.dataset.n].length; });
      let rows = grupos[filtro] || grupos.abiertos;
      if (filtro === 'entregados' || filtro === 'todos') rows = rows.slice().sort((a, b) => b.e.creado - a.e.creado);
      else rows = rows.slice().sort((a, b) => (b.r ? b.r.puntaje : -1) - (a.r ? a.r.puntaje : -1) || a.e.promesa - b.e.promesa);
      if (!rows.length) {
        lista.innerHTML = U.vacio('box', q ? 'No hay envíos con "' + q + '"' : 'No hay envíos en este filtro', q ? 'Revisa el código o busca por DNI del destinatario.' : 'Prueba con otro filtro o registra un envío nuevo.', LC.puede('recepcion') ? '<a class="btn btn-primary" href="#/recepcion">' + icon('plus') + 'Nuevo envío</a>' : '');
        return;
      }
      lista.innerHTML = '<div class="env env-cab" aria-hidden="true"><span>Código</span><span>Destinatario</span><span>Ruta</span><span>Estado</span><span>Riesgo</span><span>' + (filtro === 'entregados' ? 'Entregado' : 'Promesa') + '</span></div>' +
        rows.slice(0, limite).map(x => fila(x.e, x.r)).join('') +
        (rows.length > limite ? '<button class="btn btn-line mas-env" data-mas>Ver ' + Math.min(60, rows.length - limite) + ' más de ' + U.num(rows.length) + '</button>' : '');
      lista.querySelectorAll('[data-id]').forEach(b => b.onclick = () => detalle(b.dataset.id));
      const mas = lista.querySelector('[data-mas]');
      if (mas) mas.onclick = () => { limite += 60; pintar(); };
      // Búsqueda exacta por código (lector de código de barras): abre el detalle
      const exacto = db().envios.find(e => e.id.toLowerCase() === qq);
      if (exacto && params.get('abrir') !== '0') { detalle(exacto.id); }
    }
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtro = b.dataset.f; limite = 60; el.querySelectorAll('[data-f]').forEach(c => c.classList.toggle('on', c === b)); pintar(); });
    const inp = el.querySelector('[data-buscar]');
    let tmr;
    inp.oninput = () => { clearTimeout(tmr); tmr = setTimeout(() => { q = inp.value; limite = 60; pintar(); }, 160); };
    const sel = el.querySelector('.sel-ag');
    if (sel) sel.onchange = () => { agencia = sel.value; pintar(); };
    pintar();
    const id = params.get('id');
    if (id) {
      const e = id === 'primero' ? conRiesgoMayor() : st().envio(id);
      if (e) detalle(e.id);
    }
  }

  function conRiesgoMayor() {
    return db().envios.filter(e => e.estado !== 'entregado').map(e => ({ e, r: st().riesgo(e) })).sort((a, b) => b.r.puntaje - a.r.puntaje)[0].e;
  }

  LC.envios = { norm, crear, simular, avanzar, entregar, intentoFallido, detalle, guiaHTML, imprimirGuia, barcode, pedirEntrega, pedirFallo, fila };
  LC.vistas.envios = {
    titulo: 'Envíos', icono: 'box', modulo: 'envios',
    badge: () => { const a = LC.sesion.rol === 'jefe' ? null : LC.sesion.agencia; return db().envios.filter(e => e.estado !== 'entregado' && (!a || e.origen === a || e.destino === a) && st().riesgo(e).nivel === 'alto').length; },
    render
  };
})();
