/* Recepción en counter: registrar envío con tarifa en vivo y emitir guía */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;

  const NOMBRES_RENIEC = ['Gladys Ticona Mamani', 'Óscar Salazar Vega', 'Roxana Cruz Espinoza', 'Julio Poma Huanca', 'Mercedes Ríos Castillo', 'Fernando Apaza Quispe'];

  function render(el, params) {
    const db = LC.store.db;
    const mia = LC.sesion.agencia || 'LIM';
    const sim = params.get('sim') === '1';
    const st = {
      origen: mia, destino: sim ? 'ARE' : '', tipoEntrega: sim ? 'domicilio' : 'agencia', servicio: 'estandar',
      bultos: [sim ? { tipo: 'paquete', peso: 3.2, l: 40, a: 30, h: 25 } : { tipo: 'paquete', peso: '', l: '', a: '', h: '' }],
      valorDeclarado: sim ? 250 : '', contraEntrega: '', medio: 'Efectivo'
    };
    const ejemplo = sim ? db.clientes.find(c => c.tienda) : null;

    el.innerHTML = '<form class="rec" novalidate autocomplete="off">' +
      '<div class="rec-form">' +
      '<section class="rec-sec"><h2>' + icon('user') + 'Remitente</h2><div class="campos">' +
      '<label class="campo">DNI o RUC<span class="con-btn"><input name="remDoc" inputmode="numeric" maxlength="11" data-buscar placeholder="8 u 11 dígitos" value="' + (ejemplo ? ejemplo.doc : '') + '"><button type="button" class="btn btn-line btn-sm" data-consulta="rem">Buscar</button></span><small data-hint="rem">Si ya es cliente, se completan sus datos.</small></label>' +
      '<label class="campo">Nombre o razón social<input name="remNombre" value="' + esc(ejemplo ? ejemplo.nombre : '') + '"></label>' +
      '<label class="campo">Celular<input name="remTel" inputmode="tel" maxlength="9" value="' + (ejemplo ? ejemplo.tel : '') + '"></label>' +
      '</div></section>' +
      '<section class="rec-sec"><h2>' + icon('pin') + 'Destino y destinatario</h2><div class="campos">' +
      '<label class="campo">Agencia de destino<select name="destino"><option value="">Elige el destino</option>' + M.AGENCIAS.map(a => '<option value="' + a.id + '"' + (a.id === st.destino ? ' selected' : '') + '>' + esc(a.ciudad) + (a.id === mia ? ' (envío local)' : '') + '</option>').join('') + '</select></label>' +
      '<div class="campo"><span>Entrega</span><div class="seg2" role="radiogroup" aria-label="Tipo de entrega"><button type="button" data-ent="agencia">' + icon('store') + 'En agencia</button><button type="button" data-ent="domicilio">' + icon('home') + 'A domicilio</button></div></div>' +
      '<label class="campo">DNI del destinatario<span class="con-btn"><input name="desDoc" inputmode="numeric" maxlength="8" placeholder="8 dígitos" value="' + (sim ? '70214455' : '') + '"><button type="button" class="btn btn-line btn-sm" data-consulta="des">RENIEC</button></span><small data-hint="des">Consulta simulada.</small></label>' +
      '<label class="campo">Nombre del destinatario<input name="desNombre" value="' + (sim ? 'Valeria Gutiérrez Ramos' : '') + '"></label>' +
      '<label class="campo">Celular del destinatario<input name="desTel" inputmode="tel" maxlength="9" value="' + (sim ? '900045512' : '') + '"></label>' +
      '<label class="campo" data-dir>Dirección de entrega<input name="desDir" placeholder="Calle, número y distrito" value="' + (sim ? 'Av. Ejército 712, Yanahuara' : '') + '"></label>' +
      '</div></section>' +
      '<section class="rec-sec"><h2>' + icon('box') + 'Qué se envía</h2><div id="bultos" class="bultos"></div>' +
      '<div class="fila"><button type="button" class="btn btn-line btn-sm" data-add="paquete">' + icon('plus') + 'Otro bulto</button><button type="button" class="btn btn-ghost btn-sm" data-add="sobre">' + icon('plus') + 'Sobre</button></div>' +
      '<div class="campos" style="margin-top:14px">' +
      '<label class="campo">Contenido declarado<input name="contenido" placeholder="Ej.: ropa, documentos, repuestos" value="' + (sim ? 'Pedido web: ropa' : '') + '"></label>' +
      '<label class="campo">Valor declarado (S/)<input name="valor" type="number" min="0" step="10" placeholder="Opcional, para el seguro" value="' + st.valorDeclarado + '"></label>' +
      (LC.tieneModulo('contraentrega') ? '<label class="campo">Cobrar al entregar (S/)<input name="ce" type="number" min="0" step="5" placeholder="Solo tiendas online" value="' + (sim ? 120 : '') + '"><small>El destinatario paga al recibir.</small></label>' : '') +
      '</div></section>' +
      '</div>' +
      '<aside class="rec-res"><div class="caja caja-p" id="resumen"></div></aside></form>';

    const f = el.querySelector('form');
    const $ = n => f.elements[n];
    const segEnt = el.querySelectorAll('[data-ent]');

    function pintarBultos() {
      el.querySelector('#bultos').innerHTML = st.bultos.map((b, i) => b.tipo === 'sobre'
        ? '<div class="bulto">' + LC.illus('sobre', 40) + '<b>Sobre</b><span class="muted">Documentos hasta 500 g · tarifa plana</span>' + (st.bultos.length > 1 ? '<button type="button" class="btn btn-ghost btn-icon btn-sm" data-del="' + i + '" aria-label="Quitar sobre">' + icon('x') + '</button>' : '') + '</div>'
        : '<div class="bulto">' + LC.illus('paquete', 40) + '<label>Peso kg<input type="number" min="0.1" step="0.1" data-b="' + i + '" data-k="peso" value="' + b.peso + '" placeholder="0.0"></label>' +
          '<label>Largo cm<input type="number" min="1" data-b="' + i + '" data-k="l" value="' + b.l + '"></label><label>Ancho cm<input type="number" min="1" data-b="' + i + '" data-k="a" value="' + b.a + '"></label><label>Alto cm<input type="number" min="1" data-b="' + i + '" data-k="h" value="' + b.h + '"></label>' +
          (st.bultos.length > 1 ? '<button type="button" class="btn btn-ghost btn-icon btn-sm" data-del="' + i + '" aria-label="Quitar bulto">' + icon('x') + '</button>' : '') + '</div>').join('');
      el.querySelectorAll('[data-b]').forEach(inp => inp.oninput = () => { st.bultos[inp.dataset.b][inp.dataset.k] = inp.value; resumen(); });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { st.bultos.splice(Number(b.dataset.del), 1); pintarBultos(); resumen(); });
    }

    function leer() {
      st.destino = $('destino').value;
      st.valorDeclarado = $('valor').value;
      st.contraEntrega = $('ce') ? $('ce').value : 0;
    }

    function faltantes() {
      const m = [];
      const doc = $('remDoc').value.trim();
      if (!/^(\d{8}|\d{11})$/.test(doc)) m.push('DNI (8 dígitos) o RUC (11 dígitos) del remitente');
      if (!$('remNombre').value.trim()) m.push('nombre del remitente');
      if (!/^9\d{8}$/.test($('remTel').value.trim())) m.push('celular del remitente (9 dígitos, empieza con 9)');
      if (!st.destino) m.push('agencia de destino');
      if (!$('desNombre').value.trim()) m.push('nombre del destinatario');
      if (!/^\d{8}$/.test($('desDoc').value.trim())) m.push('DNI del destinatario');
      if (!/^9\d{8}$/.test($('desTel').value.trim())) m.push('celular del destinatario');
      if (st.tipoEntrega === 'domicilio' && $('desDir').value.trim().length < 8) m.push('dirección de entrega');
      if (st.bultos.some(b => b.tipo === 'paquete' && !(Number(b.peso) > 0))) m.push('peso de cada bulto');
      if (!$('contenido').value.trim()) m.push('contenido declarado');
      return m;
    }

    function resumen() {
      leer();
      segEnt.forEach(b => { b.classList.toggle('on', b.dataset.ent === st.tipoEntrega); b.setAttribute('aria-pressed', b.dataset.ent === st.tipoEntrega); });
      el.querySelector('[data-dir]').hidden = st.tipoEntrega !== 'domicilio';
      const box = el.querySelector('#resumen');
      if (!st.destino) { box.innerHTML = '<h2>Tarifa</h2>' + U.vacio('route', 'Elige el destino', 'La tarifa y la fecha de llegada se calculan apenas eliges a dónde va.'); return; }
      const T = LC.store.tarifa(st);
      const prom = M.promesa(Date.now(), st.origen, st.destino, st.servicio);
      const falta = faltantes();
      box.innerHTML = '<div class="res-top"><h2>Tarifa</h2><div class="seg2 seg-sm" role="radiogroup" aria-label="Servicio"><button type="button" data-srv="estandar">Estándar</button><button type="button" data-srv="express">Express</button></div></div>' +
        '<p class="res-ruta">' + esc(M.agencia(st.origen).ciudad) + icon('arrowR') + '<b>' + esc(M.agencia(st.destino).ciudad) + '</b><span class="muted">' + (T.km ? U.num(T.km) + ' km · ' : '') + esc(T.tramo) + '</span></p>' +
        '<ul class="desglose">' + T.lineas.map(l => '<li><span>' + esc(l.c) + '<small>' + esc(l.f) + '</small></span><b class="num">' + U.soles(l.m) + '</b></li>').join('') + '</ul>' +
        '<div class="res-total"><span>Total</span><b class="num">' + U.soles(T.total) + '</b></div>' +
        '<p class="res-prom">' + icon('clock') + '<span>Llega el <b>' + U.fechaDia(prom) + '</b> · ' + U.plural(T.dias, 'día hábil', 'días hábiles') + (st.tipoEntrega === 'agencia' ? ', listo para recoger' : ', entrega hasta las 19:00') + '</span></p>' +
        '<label class="campo">Cobro<select name="medio" form="none">' + ['Efectivo', 'Yape', 'Plin', 'Tarjeta', 'Transferencia'].map(m => '<option' + (m === st.medio ? ' selected' : '') + '>' + m + '</option>').join('') + '</select></label>' +
        (falta.length ? '<p class="res-falta">' + icon('alert') + '<span>Falta: ' + esc(falta.slice(0, 3).join(', ')) + (falta.length > 3 ? ' y ' + (falta.length - 3) + ' más' : '') + '.</span></p>' : '') +
        '<button type="button" class="btn btn-primary btn-lg res-ok" data-guardar>' + icon('print') + 'Registrar y emitir guía</button>' +
        '<p class="muted res-nota">La boleta se envía a SUNAT de forma simulada.</p>';
      box.querySelectorAll('[data-srv]').forEach(b => { b.classList.toggle('on', b.dataset.srv === st.servicio); b.onclick = () => { st.servicio = b.dataset.srv; resumen(); }; });
      box.querySelector('[name=medio]').onchange = ev => { st.medio = ev.target.value; };
      box.querySelector('[data-guardar]').onclick = guardar;
    }

    function consultar(cual) {
      if (cual === 'rem') {
        const doc = $('remDoc').value.trim();
        const hint = el.querySelector('[data-hint=rem]');
        const c = db.clientes.find(x => x.doc === doc);
        if (c) { $('remNombre').value = c.nombre; $('remTel').value = c.tel; hint.innerHTML = icon('check') + 'Cliente frecuente desde ' + U.fecha(c.desde) + '.'; st.clienteId = c.id; resumen(); return; }
        st.clienteId = null;
        if (/^\d{8}$/.test(doc)) { $('remNombre').value = NOMBRES_RENIEC[Number(doc.slice(-1)) % NOMBRES_RENIEC.length]; hint.textContent = 'Datos de RENIEC (simulado). Revisa que coincidan con el DNI físico.'; }
        else if (/^\d{11}$/.test(doc)) { $('remNombre').value = 'Comercial Demo ' + doc.slice(-3) + ' S.A.C.'; hint.textContent = 'Razón social de SUNAT (simulado).'; }
        else hint.textContent = 'Escribe un DNI de 8 dígitos o un RUC de 11.';
        resumen();
      } else {
        const doc = $('desDoc').value.trim();
        const hint = el.querySelector('[data-hint=des]');
        if (/^\d{8}$/.test(doc)) { $('desNombre').value = NOMBRES_RENIEC[(Number(doc.slice(-2)) + 3) % NOMBRES_RENIEC.length]; hint.textContent = 'Datos de RENIEC (simulado).'; }
        else hint.textContent = 'El DNI debe tener 8 dígitos.';
        resumen();
      }
    }

    function guardar() {
      leer();
      const falta = faltantes();
      if (falta.length) { U.toast('Completa: ' + falta.join(', ') + '.', 'error'); const primero = f.querySelector('input:invalid, select:invalid'); if (primero) primero.focus(); return; }
      const doc = $('remDoc').value.trim();
      const e = LC.envios.crear({
        origen: st.origen, destino: st.destino,
        remitente: { clienteId: st.clienteId || (db.clientes.find(c => c.doc === doc) || {}).id || null, nombre: $('remNombre').value.trim(), doc, tel: $('remTel').value.trim(), tipo: doc.length === 11 ? 'empresa' : 'persona' },
        destinatario: { nombre: $('desNombre').value.trim(), doc: $('desDoc').value.trim(), tel: $('desTel').value.trim(), dir: st.tipoEntrega === 'domicilio' ? $('desDir').value.trim() : '' },
        tipoEntrega: st.tipoEntrega, servicio: st.servicio,
        bultos: st.bultos.map(b => b.tipo === 'sobre' ? b : { tipo: 'paquete', peso: Number(b.peso), l: Number(b.l) || 0, a: Number(b.a) || 0, h: Number(b.h) || 0 }),
        contenido: $('contenido').value.trim(), valorDeclarado: st.valorDeclarado, contraEntrega: st.contraEntrega, medio: st.medio
      });
      LC.refrescarNav();
      el.innerHTML = '<div class="listo">' + LC.illus('paquete', 72) + '<h2>Envío ' + e.id + ' registrado</h2><p>' + esc(M.agencia(e.origen).ciudad) + ' → ' + esc(M.agencia(e.destino).ciudad) + ' · ' + U.soles(e.tarifa) + ' cobrado con ' + esc(e.pago.medio) + ' · llega el ' + U.fechaDia(e.promesa) + '.</p>' +
        LC.envios.barcode(e.id, 44) +
        '<div class="fila"><button class="btn btn-primary btn-lg" data-print>' + icon('print') + 'Imprimir guía y etiqueta</button><a class="btn btn-line btn-lg" href="#/recepcion" data-nuevo>' + icon('plus') + 'Nuevo envío</a><a class="btn btn-ghost btn-lg" href="#/envios?q=' + e.id + '">Ver el envío</a></div>' +
        (LC.tieneModulo('avisos') ? '<p class="muted">' + icon('whatsapp') + ' Se avisó por WhatsApp al destinatario (simulado).</p>' : '') + '</div>';
      el.querySelector('[data-print]').onclick = () => LC.envios.imprimirGuia(e);
      el.querySelector('[data-nuevo]').onclick = ev => { ev.preventDefault(); LC.refrescar(); };
    }

    segEnt.forEach(b => b.onclick = () => { st.tipoEntrega = b.dataset.ent; resumen(); });
    el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { st.bultos.push(b.dataset.add === 'sobre' ? { tipo: 'sobre', peso: 0.2, l: 0, a: 0, h: 0 } : { tipo: 'paquete', peso: '', l: '', a: '', h: '' }); pintarBultos(); resumen(); });
    el.querySelectorAll('[data-consulta]').forEach(b => b.onclick = () => consultar(b.dataset.consulta));
    $('remDoc').addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); consultar('rem'); } });
    $('desDoc').addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); consultar('des'); } });
    f.addEventListener('input', ev => { if (ev.target.closest('#resumen') || ev.target.dataset.b) return; resumen(); });
    f.addEventListener('change', ev => { if (ev.target.name === 'destino') resumen(); });
    f.addEventListener('submit', ev => ev.preventDefault());
    if (ejemplo) st.clienteId = ejemplo.id;
    pintarBultos();
    resumen();
    if (params.get('doc')) { $('remDoc').value = params.get('doc'); consultar('rem'); setTimeout(() => $('desDoc').focus(), 50); }
    else if (!sim) setTimeout(() => $('remDoc').focus(), 50);
  }

  LC.vistas.recepcion = { titulo: 'Nuevo envío', menu: 'Recepción', corto: 'Recibir', icono: 'plus', modulo: 'recepcion', render };
})();
