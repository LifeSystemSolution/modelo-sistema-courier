/* Web pública de LifeCargo Express: rastreo, cotizador (mismo motor del sistema), agencias */
(function () {
  const LC = (window.LC = window.LC || {});
  const U = LC.ui, esc = U.esc, icon = LC.icon, M = LC.motor;
  const wa = txt => 'https://wa.me/' + LC.planes.WHATSAPP + '?text=' + encodeURIComponent(txt);

  function tema(t) {
    try { if (t) localStorage.setItem('lifecargo-tema', t); } catch (e) { /* */ }
    let v = 'light';
    try { v = localStorage.getItem('lifecargo-tema') || 'light'; } catch (e) { /* */ }
    document.documentElement.dataset.theme = v;
    const b = document.getElementById('btn-tema');
    b.innerHTML = icon(v === 'dark' ? 'sun' : 'moon');
    b.setAttribute('aria-label', v === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro');
  }

  function rastreo() {
    const db = LC.store.db;
    const f = document.getElementById('f-track');
    const res = document.getElementById('track-res');
    const ej = [db.envios.find(e => e.estado === 'en_ruta'), db.envios.find(e => e.estado === 'en_destino' && e.tipoEntrega === 'agencia'), db.envios.find(e => e.estado === 'entregado')].filter(Boolean);
    document.getElementById('w-ej').innerHTML = 'Prueba con ' + ej.map(e => '<button type="button" class="w-chip num" data-cod="' + e.id + '">' + e.id + '</button>').join(' ');
    function buscar(cod) {
      cod = String(cod || '').trim().toUpperCase();
      if (!cod) { res.innerHTML = '<p class="w-err">' + icon('alert') + 'Escribe el código que aparece en tu guía.</p>'; return; }
      if (/^\d+$/.test(cod)) cod = 'LC-' + cod;
      const e = LC.store.envio(cod);
      res.innerHTML = e ? LC.seguimiento.tarjeta(e) : '<p class="w-err">' + icon('alert') + 'No encontramos el envío ' + esc(cod) + '. Revisa el código en tu guía: empieza con LC- y tiene seis números.</p>';
      if (e) history.replaceState(null, '', '#rastrear?cod=' + e.id);
    }
    f.onsubmit = ev => { ev.preventDefault(); buscar(f.cod.value); };
    document.getElementById('w-ej').querySelectorAll('[data-cod]').forEach(b => b.onclick = () => { f.cod.value = b.dataset.cod; buscar(b.dataset.cod); });
    const m = location.hash.match(/cod=([A-Z0-9-]+)/i);
    if (m) { f.cod.value = m[1]; buscar(m[1]); }
  }

  function rutaBand() {
    const orden = ['PIU', 'TRU', 'LIM', 'HYO', 'CUS', 'ARE'];
    document.getElementById('w-ruta').innerHTML = '<ol>' + orden.map(id => '<li' + (id === 'LIM' ? ' class="hub"' : '') + '><i></i><span>' + esc(M.agencia(id).ciudad) + '</span></li>').join('') + '</ol>';
  }

  function cotizador() {
    const f = document.getElementById('f-cot');
    const res = document.getElementById('cot-res');
    const opts = sel => M.AGENCIAS.map(a => '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + esc(a.ciudad) + '</option>').join('');
    f.innerHTML = '<div class="campos"><label class="campo">Desde<select name="origen">' + opts('LIM') + '</select></label><label class="campo">Hasta<select name="destino">' + opts('ARE') + '</select></label></div>' +
      '<div class="campo"><span>Qué envías</span><div class="seg2" role="radiogroup" aria-label="Tipo"><button type="button" data-tipo="paquete" class="on">' + icon('box') + 'Paquete</button><button type="button" data-tipo="sobre">' + icon('note') + 'Sobre</button></div></div>' +
      '<div class="campos w-med" data-med><label class="campo">Peso (kg)<input name="peso" type="number" min="0.1" step="0.1" value="3"></label><label class="campo">Largo (cm)<input name="l" type="number" min="1" value="40"></label><label class="campo">Ancho (cm)<input name="a" type="number" min="1" value="30"></label><label class="campo">Alto (cm)<input name="h" type="number" min="1" value="20"></label></div>' +
      '<div class="campo"><span>Entrega</span><div class="seg2" role="radiogroup" aria-label="Entrega"><button type="button" data-ent="agencia" class="on">' + icon('store') + 'En agencia</button><button type="button" data-ent="domicilio">' + icon('home') + 'A domicilio</button></div></div>' +
      '<label class="check"><input type="checkbox" name="express"> Express (llega un día hábil antes)</label>';
    const st = { tipo: 'paquete', ent: 'agencia' };
    function pintar() {
      const e = {
        origen: f.origen.value, destino: f.destino.value, servicio: f.express.checked ? 'express' : 'estandar', tipoEntrega: st.ent,
        bultos: [st.tipo === 'sobre' ? { tipo: 'sobre', peso: 0.2, l: 0, a: 0, h: 0 } : { tipo: 'paquete', peso: Number(f.peso.value) || 0, l: Number(f.l.value) || 0, a: Number(f.a.value) || 0, h: Number(f.h.value) || 0 }],
        valorDeclarado: 0, contraEntrega: 0
      };
      f.querySelector('[data-med]').hidden = st.tipo === 'sobre';
      f.querySelectorAll('[data-tipo]').forEach(b => b.classList.toggle('on', b.dataset.tipo === st.tipo));
      f.querySelectorAll('[data-ent]').forEach(b => b.classList.toggle('on', b.dataset.ent === st.ent));
      if (st.tipo === 'paquete' && !(Number(f.peso.value) > 0)) { res.innerHTML = '<p class="w-err">' + icon('alert') + 'Escribe el peso aproximado en kilos.</p>'; return; }
      const T = LC.store.tarifa(e);
      const llega = M.promesa(Date.now(), e.origen, e.destino, e.servicio);
      res.innerHTML = '<p class="muted">' + esc(M.agencia(e.origen).ciudad) + ' → ' + esc(M.agencia(e.destino).ciudad) + '</p><p class="w-precio num">' + U.soles(T.total) + '</p>' +
        '<p class="w-llega">' + icon('clock') + 'Si lo dejas hoy, llega el <b>' + U.fechaDia(llega) + '</b></p><ul class="desglose">' + T.lineas.map(l => '<li><span>' + esc(l.c) + '<small>' + esc(l.f) + '</small></span><b class="num">' + U.soles(l.m) + '</b></li>').join('') + '</ul>' +
        '<p class="muted w-nota">Precio referencial con las tarifas vigentes del sistema. El peso final se confirma en counter.</p>';
    }
    f.addEventListener('input', pintar);
    f.addEventListener('change', pintar);
    f.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => { st.tipo = b.dataset.tipo; pintar(); });
    f.querySelectorAll('[data-ent]').forEach(b => b.onclick = () => { st.ent = b.dataset.ent; pintar(); });
    f.onsubmit = ev => ev.preventDefault();
    pintar();
  }

  function agencias() {
    const db = LC.store.db;
    document.getElementById('w-horario').textContent = db.empresa.horario + '. Direcciones referenciales.';
    document.getElementById('w-ags').innerHTML = M.AGENCIAS.map(a => '<article class="w-ag">' + LC.illus('agencia', 44) + '<div><h3>' + esc(a.ciudad) + '</h3><p>' + esc(a.dir) + '</p><p class="muted">' + (a.id === 'LIM' ? 'Agencia principal y centro de distribución' : U.num(a.km) + ' km desde Lima · ' + U.plural(M.diasTransito('LIM', a.id, 'estandar'), 'día hábil', 'días hábiles') + ' desde Lima') + '</p></div></article>').join('');
    document.getElementById('w-razon').textContent = db.empresa.razon + ' · RUC ' + db.empresa.ruc + ' (ficticio)';
  }

  document.addEventListener('DOMContentLoaded', () => {
    LC.store.init();
    document.getElementById('w-logo').innerHTML = '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--brand)"/><path d="M8 9.5v12.5h7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M24.5 11.5a6 6 0 1 0 0 9" stroke="#fff" stroke-width="2.8" stroke-linecap="round" fill="none"/></svg><span class="logo-t oscuro">Life<b>Cargo</b> <em>Express</em></span>';
    document.getElementById('w-lock').innerHTML = icon('lock');
    document.getElementById('w-tienda-ill').innerHTML = LC.illus('paquete', 120) + LC.illus('cobro', 120) + LC.illus('moto', 120);
    tema();
    document.getElementById('btn-tema').onclick = () => tema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('wa-tienda').href = wa('Hola, tengo una tienda online y quiero enviar con cobro contra entrega (consulta desde la web de ejemplo LifeCargo).');
    document.getElementById('wa-contacto').href = wa('Hola, vi la web de ejemplo de LifeCargo Express y quiero una web así para mi negocio.');
    rastreo(); rutaBand(); cotizador(); agencias();
  });
})();
