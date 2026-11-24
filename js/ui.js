/* Utilidades de interfaz: formato, plurales, estados, medidor de riesgo, panel, modal, toasts, gráficos */
(function () {
  const LC = (window.LC = window.LC || {});
  LC.vistas = LC.vistas || {};

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : (varios || uno + 's'));
  const pad = n => String(n).padStart(2, '0');
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  const hora = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const fecha = t => { const d = new Date(t); return d.getDate() + ' ' + MESES[d.getMonth()]; };
  const fechaDia = t => { const d = new Date(t); return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
  const fechaLarga = t => { const d = new Date(t); return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); };
  const esHoy = t => new Date(t).toDateString() === new Date().toDateString();
  const inicioDia = t => { const d = new Date(t || Date.now()); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function cuando(t) {
    const m = Math.round((Date.now() - t) / 6e4);
    if (m >= 0 && m < 1) return 'ahora';
    if (m > 0 && m < 60) return 'hace ' + m + ' min';
    if (esHoy(t)) return 'hoy ' + hora(t);
    const ay = new Date(); ay.setDate(ay.getDate() - 1);
    if (new Date(t).toDateString() === ay.toDateString()) return 'ayer ' + hora(t);
    const ma = new Date(); ma.setDate(ma.getDate() + 1);
    if (new Date(t).toDateString() === ma.toDateString()) return 'mañana ' + hora(t);
    return fechaDia(t) + ' ' + hora(t);
  }
  function duracion(h) {
    h = Math.max(0, h);
    if (h < 1) return Math.round(h * 60) + ' min';
    if (h < 48) return Math.round(h) + ' h';
    return plural(Math.round(h / 24), 'día');
  }
  const soles = (n, dec) => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: dec === 0 ? 0 : 2, maximumFractionDigits: dec === 0 ? 0 : 2 });
  const num = n => Number(n || 0).toLocaleString('es-PE');
  const nombreCorto = n => { const p = String(n || '').split(' '); return p[0] + (p[1] ? ' ' + p[1] : ''); };
  const iniciales = n => String(n || '?').split(' ').slice(0, 2).map(x => x[0]).join('');
  const avatar = (n, cls) => '<span class="avatar ' + (cls || '') + '" aria-hidden="true">' + esc(iniciales(n)) + '</span>';

  /* Estados del envío: etiqueta + glifo de avance (nunca solo color) */
  const ESTADOS = {
    recibido: { txt: 'En agencia de origen', corto: 'Recibido', paso: 1 },
    en_ruta: { txt: 'En camino', corto: 'En camino', paso: 2 },
    en_destino: { txt: 'En agencia de destino', corto: 'En destino', paso: 3 },
    en_reparto: { txt: 'En reparto', corto: 'En reparto', paso: 4 },
    entregado: { txt: 'Entregado', corto: 'Entregado', paso: 5 }
  };
  function pasos(n) {
    let s = '';
    for (let i = 0; i < 5; i++) s += '<rect x="' + (i * 5) + '" y="5" width="4" height="6" rx="1" fill="' + (i < n ? 'currentColor' : 'var(--line-2)') + '"/>';
    return '<svg class="pasos" viewBox="0 0 24 16" aria-hidden="true">' + s + '</svg>';
  }
  function estado(e, corto) {
    const s = ESTADOS[e.estado || e] || { txt: e, paso: 0 };
    let txt = corto ? s.corto : s.txt;
    if (e.estado === 'en_destino' && e.tipoEntrega === 'agencia') txt = corto ? 'Por recoger' : 'Listo para recoger';
    if (e.estado === 'en_destino' && e.tipoEntrega === 'domicilio' && e.programado) txt = corto ? 'Reparto hoy' : 'Programado para reparto hoy';
    return '<span class="estado est-' + (e.estado || e) + '">' + pasos(s.paso) + '<span>' + txt + '</span></span>';
  }

  /* Riesgo de retraso: glifo de 3 barras + texto */
  const NIVEL = { alto: 'Riesgo alto', medio: 'Riesgo medio', bajo: 'Riesgo bajo', listo: 'Listo' };
  function riesgoGlyph(nivel) {
    const n = nivel === 'alto' ? 3 : nivel === 'medio' ? 2 : 1;
    let b = '';
    for (let i = 0; i < 3; i++) { const h = 6 + i * 4; b += '<rect x="' + (1 + i * 5.5) + '" y="' + (17 - h) + '" width="4" height="' + h + '" rx="1" fill="' + (i < n ? 'currentColor' : 'var(--line-2)') + '"/>'; }
    return '<svg class="rg-g" viewBox="0 0 18 18" aria-hidden="true">' + b + '</svg>';
  }
  function riesgo(r, conNum) {
    if (r.nivel === 'listo') return '<span class="rg rg-listo">' + LC.icon('store') + '<span>Disponible</span></span>';
    return '<span class="rg rg-' + r.nivel + '">' + (r.nivel === 'alto' ? LC.icon(r.vencido ? 'clock' : 'alert') : riesgoGlyph(r.nivel)) + '<span>' + (r.vencido ? 'Vencido' : NIVEL[r.nivel]) + (conNum ? ' · ' + r.puntaje : '') + '</span></span>';
  }
  function medidor(r) {
    const segs = r.factores.filter(f => f.pts > 0).map(f => '<span class="seg seg-' + f.clave + '" style="width:' + f.pts + '%" title="' + esc(f.etiqueta + ': ' + f.pts + ' pts') + '"></span>').join('');
    const U = LC.motor.UMBRAL;
    const marcas = [['Medio', U.medio], ['Alto', U.alto]].map(m => '<span class="umbral" style="left:' + m[1] + '%"><i></i>' + m[0] + '</span>').join('');
    const lista = '<ul class="factores">' + r.factores.map(f => '<li><span class="sw seg-' + f.clave + '"></span><b>' + esc(f.etiqueta) + '</b><span class="mot">' + esc(f.motivo) + '</span><span class="pts num">+' + f.pts + '<small>/' + f.peso + '</small></span></li>').join('') + '</ul>';
    return '<div class="medidor"><div class="med-top"><span class="med-num num">' + r.puntaje + '<small>/100</small></span>' + riesgo(r) + '</div>' +
      '<div class="med-bar" role="img" aria-label="Riesgo de retraso ' + r.puntaje + ' de 100">' + segs + marcas + '</div>' + lista + '</div>';
  }

  function toast(msg, tipo) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast toast-' + (tipo || 'ok');
    el.innerHTML = LC.icon(tipo === 'error' ? 'alert' : tipo === 'info' ? 'bolt' : 'check') + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3800);
  }

  /* Panel lateral de detalle (en celular ocupa toda la pantalla) */
  let panelPrev = null;
  function panel(html, onClose) {
    cerrarPanel();
    panelPrev = document.activeElement;
    const w = document.createElement('div');
    w.className = 'panel-wrap';
    w.innerHTML = '<div class="panel-bg" data-close></div><aside class="panel" role="dialog" aria-modal="true" tabindex="-1">' + html + '</aside>';
    document.body.appendChild(w);
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => w.classList.add('in'));
    w.addEventListener('click', e => { if (e.target.closest('[data-close]')) cerrarPanel(); });
    w._onClose = onClose;
    w.querySelector('.panel').focus();
    return w.querySelector('.panel');
  }
  function cerrarPanel() {
    const w = document.querySelector('.panel-wrap');
    if (!w) return;
    if (w._onClose) w._onClose();
    w.remove();
    document.body.classList.remove('no-scroll');
    if (panelPrev && panelPrev.focus && document.contains(panelPrev)) panelPrev.focus();
  }

  function modal(titulo, cuerpo, botones) {
    return new Promise(res => {
      const d = document.createElement('dialog');
      d.className = 'modal';
      d.innerHTML = '<form method="dialog"><h3>' + esc(titulo) + '</h3><div class="modal-body">' + cuerpo + '</div><div class="modal-acc">' +
        (botones || [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Aceptar', 'btn-primary']]).map(b => '<button class="btn ' + b[2] + '" value="' + b[0] + '">' + b[1] + '</button>').join('') + '</div></form>';
      document.body.appendChild(d);
      const form = d.querySelector('form');
      let listo = false;
      // Se resuelve al enviar el formulario (síncrono) y, como respaldo, al cerrarse (Esc o cierre del navegador)
      const fin = v => { if (listo) return; listo = true; const data = new FormData(form); setTimeout(() => { if (d.open) d.close(); d.remove(); }, 0); res({ v, data }); };
      form.addEventListener('submit', e => fin(e.submitter ? e.submitter.value : 'ok'));
      d.addEventListener('close', () => fin(d.returnValue || 'cancelar'));
      d.addEventListener('cancel', () => fin('cancelar'));
      d.showModal();
    });
  }

  const vacio = (ic, titulo, texto, accion) => '<div class="vacio">' + LC.icon(ic) + '<h3>' + esc(titulo) + '</h3>' + (texto ? '<p>' + esc(texto) + '</p>' : '') + (accion || '') + '</div>';

  function barras(datos, opts) {
    opts = opts || {};
    const max = Math.max(1, ...datos.map(d => d.v));
    const h = opts.alto || 160;
    return '<div class="barras' + (opts.horizontal ? ' horiz' : '') + '" style="--h:' + h + 'px">' + datos.map(d =>
      '<div class="b" title="' + esc(d.l + ': ' + (d.fmt || d.v)) + '"><span class="bv num">' + esc(d.fmt || d.v) + '</span><span class="bb' + (d.marca ? ' marca' : '') + '" style="--v:' + (d.v / max * 100).toFixed(1) + '"></span><span class="bl">' + esc(d.l) + '</span></div>').join('') + '</div>';
  }

  /* Exportar a Excel: CSV con BOM y separador ; */
  function csv(nombre, filas) {
    const txt = '﻿' + filas.map(f => f.map(c => { const s = String(c == null ? '' : c); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = nombre + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function imprimir(html) {
    let el = document.getElementById('imprimible');
    if (!el) { el = document.createElement('div'); el.id = 'imprimible'; document.body.appendChild(el); }
    el.innerHTML = html;
    setTimeout(() => window.print(), 60);
  }

  LC.ui = { esc, plural, hora, fecha, fechaDia, fechaLarga, cuando, duracion, soles, num, esHoy, inicioDia, nombreCorto, iniciales, avatar, ESTADOS, estado, pasos, riesgo, medidor, toast, panel, cerrarPanel, modal, vacio, barras, csv, imprimir };
})();
