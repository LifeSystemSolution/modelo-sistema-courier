/* Íconos de interfaz (trazo 1.75) e ilustraciones dibujadas a mano por categoría */
(function () {
  const LC = (window.LC = window.LC || {});

  const ui = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    ticket: '<path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z"/><path d="M9 5v14" stroke-dasharray="2 2.5"/>',
    queue: '<path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4.5M12 17.5v.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.8 3.6-5.5 6.5-5.5s5.7 1.7 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.6 5.2"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    logout: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 9v6M10 9v6M13 9v6M16.5 9v6"/>',
    send: '<path d="M4 12 20 4l-6 16-3-7z"/><path d="m11 13 9-9"/>',
    filter: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/>',
    note: '<path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 12h8M8 16h6"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8.4 19z"/><path d="M9 9.2c0 2.8 2.6 5.6 5.6 5.8l1.3-1.4-1.8-1-.9.8c-1-.4-2.1-1.5-2.5-2.5l.8-.9-1-1.8z"/>',
    swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/>',
    pin: '<path d="M12 21s-7-6.3-7-12a7 7 0 0 1 14 0c0 5.7-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.7-.8 1.2v.9M12 17v.5"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.5M10 10h.5M14 10h.5M18 10h.5M7 14h10"/>',
    escalate: '<path d="M4 20h5v-5h5v-5h6"/><path d="m16 6 4 4-4 4" transform="translate(0 -4)"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    truck: '<path d="M2 6h12v10H2z"/><path d="M14 9h4l3 3.5V16h-7z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
    store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 11.5V20h14v-8.5M10 20v-5h4v5"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.1M18 14.5v.1"/>',
    scale: '<path d="M5 20h14"/><path d="M7 20 8.5 9h7L17 20"/><circle cx="12" cy="6" r="2.5"/>',
    sign: '<path d="M3 17c2.5 0 3-6 5-6s1.5 5 3.5 5 2.5-3 4-3 1.5 2 2.5 2"/><path d="M3 21h18"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>'
  };

  function icon(name, cls) {
    const p = ui[name] || ui.help;
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* Ilustraciones 64x64: trazo a mano (líneas ligeramente irregulares), relleno suave y un acento rojo */
  const S = 'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const F = 'fill="var(--ill-fill, var(--surface))"';
  const R = 'fill="var(--brand)"';
  const ill = {
    paquete:
      '<path ' + F + ' ' + S + ' d="M10.6 22.4 31.8 12.2l21.6 10.1-.3 24.6-21.5 10.6-21.2-10.3z"/>' +
      '<path ' + S + ' fill="none" d="M10.8 22.6 31.9 33l21.3-10.5M31.9 33l-.1 24.1"/>' +
      '<path fill="var(--brand)" d="M20.4 17.6 41.8 28l.1 7.6-4.6 2.2-.2-7.4-21.2-10.4z" opacity=".95"/>',
    sobre:
      '<path ' + F + ' ' + S + ' d="M9.8 17.4c14.8-.6 29.6-.5 44.3.2 1.4.1 2.4 1.2 2.4 2.6l-.3 25.4c0 1.4-1.1 2.5-2.5 2.5l-43.6.1c-1.4 0-2.5-1.1-2.5-2.5l.1-25.6c0-1.4 1-2.6 2.1-2.7z"/>' +
      '<path ' + S + ' fill="none" d="M8.6 19.4 31.4 34.6c.4.3 1 .3 1.4 0L55.4 19.6"/>' +
      '<path stroke="var(--brand)" stroke-width="2.6" stroke-linecap="round" fill="none" d="M14.6 42.2h12.6"/>',
    camion:
      '<path ' + F + ' ' + S + ' d="M5.6 17.8c9.8-.4 19.6-.4 29.4.1l.2 25.8-29.8.2z"/>' +
      '<path ' + F + ' ' + S + ' d="M35.2 26.4l11.6-.2 9.4 10.2-.2 7.4-20.8.2z"/>' +
      '<path ' + S + ' fill="var(--bg)" d="M40.2 29.6l5.4-.1 4.8 5.6-10.2.1z"/>' +
      '<circle cx="16" cy="45.6" r="5.2" ' + S + ' fill="var(--bg)"/><circle cx="45.4" cy="45.6" r="5.2" ' + S + ' fill="var(--bg)"/>' +
      '<path stroke="var(--brand)" stroke-width="2.6" stroke-linecap="round" fill="none" d="M11.4 26.4h16.8M11.4 32.4h10.2"/>',
    agencia:
      '<path ' + F + ' ' + S + ' d="M9.4 26.6 13.2 12.4c12.6-.5 25.2-.4 37.8.1l3.6 14.2"/>' +
      '<path ' + S + ' fill="none" d="M9.4 26.6c0 3 2.4 5.2 5.4 5.2s5.4-2.3 5.4-5.2c0 3 2.4 5.2 5.4 5.2s5.4-2.3 5.4-5.2c0 3 2.4 5.2 5.4 5.2s5.4-2.3 5.4-5.2c0 3 2.4 5.2 5.4 5.2s5.4-2.3 5.4-5.2"/>' +
      '<path ' + F + ' ' + S + ' d="M12.2 32.6l-.2 21.6 39.8.2.2-21.8"/>' +
      '<path ' + S + ' fill="var(--bg)" d="M26.4 54.2V41.6c3.6-.2 7.4-.2 11 0l.2 12.6"/>' +
      '<path fill="var(--brand)" d="M17 37.4c1.6-.1 3.2-.1 4.8 0l-.1 4.6c-1.6.1-3.2.1-4.8 0z"/>',
    moto:
      '<circle cx="15.4" cy="44.6" r="7.6" ' + S + ' fill="var(--bg)"/><circle cx="49.2" cy="44.6" r="7.6" ' + S + ' fill="var(--bg)"/>' +
      '<path ' + S + ' fill="none" d="M15.4 44.6 25.6 30.4h14.2l9.4 14.2M39.8 30.4l-3.6-9.6h6.6"/>' +
      '<path ' + F + ' ' + S + ' d="M14.2 19.4c5.4-.3 10.8-.3 16.2 0l-.2 11c-5.4.2-10.8.2-16.2 0z"/>' +
      '<path stroke="var(--brand)" stroke-width="2.6" stroke-linecap="round" fill="none" d="M18 24.8h8.6"/>',
    ruta:
      '<circle cx="14.6" cy="47.6" r="5.4" ' + S + ' fill="var(--bg)"/>' +
      '<path ' + S + ' fill="none" stroke-dasharray="1 5.4" d="M19.8 45.8c10.2-3.6 6-14.4 15.6-17.2 7-2 9.6-4.4 10.6-9.6"/>' +
      '<path ' + R + ' d="M46.6 7.6c-4.6 0-8.2 3.6-8.2 8.1 0 6 8.2 13.6 8.2 13.6s8.2-7.6 8.2-13.6c0-4.5-3.6-8.1-8.2-8.1z"/>' +
      '<circle cx="46.6" cy="15.8" r="2.8" fill="#fff"/>',
    cobro:
      '<path ' + F + ' ' + S + ' d="M8.6 20.2c15.4-.6 30.8-.5 46.2.1 1.4.1 2.4 1.2 2.4 2.6l-.3 20.4c0 1.4-1.1 2.5-2.5 2.5l-45.6.1c-1.4 0-2.5-1.1-2.5-2.5l.1-20.6c0-1.4 1-2.5 2.2-2.6z"/>' +
      '<circle cx="32" cy="33.2" r="6.4" stroke="var(--brand)" stroke-width="2.6" fill="none"/>' +
      '<path ' + S + ' fill="none" d="M14.4 27.4v.2M49.6 39v.2"/>'
  };

  function illus(cat, size) {
    const s = size || 48;
    return '<svg class="ill" width="' + s + '" height="' + s + '" viewBox="0 0 64 64" aria-hidden="true">' + (ill[cat] || ill.paquete) + '</svg>';
  }

  LC.icon = icon;
  LC.illus = illus;
})();
