/* ==========================================================================
   NUVIC · Versión para GitHub Pages
   Es la misma página que la versión PHP, pero todo corre en el navegador:
   - los comercios, productos y precios vienen de js/datos.js
   - las cuentas, la lista, los puntos y la membresía se guardan en este
     navegador (localStorage). Es una demo: no hay servidor ni cobros reales.
   Cada archivo .html solo dice qué página es (<body data-page="...">);
   este script dibuja el contenido.
   ========================================================================== */
(() => {
  'use strict';
  const D = window.NUVIC_DATOS;
  const CONFIG = { puntos_compra: 12, precio_plus: 3.99, meta_nivel: 500, dominio: '@uca.edu.sv' };
  const CAT_COMERCIO = { barberias: 'Barberías', farmacias: 'Farmacias', librerias: 'Librerías', copias: 'Copias', floristerias: 'Florerías', salones: 'Salones', lavanderias: 'Lavanderías', gasolineras: 'Gasolineras' };
  const CAT_PRODUCTO = { medicinas: 'Medicinas', copias: 'Copias', flores: 'Flores', utiles: 'Útiles', servicios: 'Servicios' };
  const MAPA_DE_PRODUCTO = { medicinas: 'farmacias', copias: 'copias', flores: 'floristerias', utiles: 'librerias', servicios: 'barberias' };
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* ------------------------------------------------------------------ util */
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const Q = new URLSearchParams(location.search);
  const get = k => Q.get(k) || '';
  const url = (p, params = {}) => { const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')).toString(); return p + '.html' + (s ? '?' + s : ''); };
  const ir = a => { location.href = a; throw new Error('redirigiendo'); };
  const dinero = n => { if (n === null || n === undefined) return 'Consultar'; n = +n; return '$' + (Math.floor(n) === n && n >= 10 ? String(n) : n.toFixed(2)); };
  const img = r => 'img/' + r;
  const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
  const mapa_google = n => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(n + ' UCA San Salvador');
  const fechaDe = s => new Date(String(s).replace(' ', 'T'));
  const ahora = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
  const masTiempo = ms => { const d = new Date(Date.now() + ms), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
  const fecha = s => { if (!s) return ''; const d = fechaDe(s); return d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); };
  const hora12 = d => (d.getHours() % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (d.getHours() < 12 ? 'am' : 'pm');
  const fecha_hora = s => {
    const d = fechaDe(s), hoy = new Date(), ayer = new Date(Date.now() - 864e5), mismo = (a, b) => a.toDateString() === b.toDateString();
    if (mismo(d, hoy)) return 'Hoy ' + hora12(d);
    if (mismo(d, ayer)) return 'Ayer ' + hora12(d);
    return d.getDate() + ' ' + MESES[d.getMonth()];
  };
  const hora_ampm = h => (h >= 24 || h === 0) ? '12:00 am' : (h > 12 ? h - 12 : h) + ':00 ' + (h < 12 ? 'am' : 'pm');
  const abierto = c => { const h = new Date().getHours(); return h >= c.abre && h < c.cierra; };
  const requisitos = c => ({ largo: c.length >= 8, mayus: /[A-ZÁÉÍÓÚÑ]/.test(c), numero: /\d/.test(c) });
  const clave_valida = c => Object.values(requisitos(c)).every(Boolean);
  const correo_valido = c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) && c.toLowerCase().endsWith(CONFIG.dominio);
  const iniciales = n => n.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const codigoAzar = (pre, n = 6) => pre + [...crypto.getRandomValues(new Uint8Array(n))].map(b => '0123456789ABCDEF'[b % 16]).join('');
  // Huella de la contraseña (demo: la cuenta vive solo en este navegador)
  const huella = s => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (const ch of 'nuvic:' + s) { const c = ch.codePointAt(0); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16); };

  /* ---------------------------------------------------------------- datos */
  const comercioPorId = Object.fromEntries(D.comercios.map(c => [c.id, c]));
  const comercio = slug => D.comercios.find(c => c.slug === slug) || null;
  const producto = slug => D.productos.find(p => p.slug === slug) || null;
  const precios_de = p => D.precios.filter(r => r.p === p.id).map(r => ({ ...r, ...pick(comercioPorId[r.c]) }))
    .sort((a, b) => (b.disponible - a.disponible) || (a.precio - b.precio));
  const pick = c => ({ slug: c.slug, nombre: c.nombre, distancia: c.distancia, foto: c.foto, categoria: c.categoria });
  const comparables = D.productos.filter(p => p.comparable).map(p => {
    const pr = D.precios.filter(r => r.p === p.id), disp = pr.filter(r => r.disponible).map(r => r.precio);
    return { ...p, desde: disp.length ? Math.min(...disp) : null, comercios: pr.length };
  });
  const buscar_productos = (q = '', cat = null, lim = 0) => {
    let l = comparables.filter(p => (!q || p.nombre.toLowerCase().includes(q.toLowerCase())) && (!cat || p.categoria === cat));
    l = l.sort((a, b) => (b.popular - a.popular) || (a.id - b.id));
    return lim ? l.slice(0, lim) : l;
  };

  /* --------------------------------------------------------------- estado */
  const CLAVE = 'nuvic_estado_v2';
  let E;
  const nuevoEstado = () => {
    const u = { ...D.demo.usuario, clave: huella(D.demo.usuario.clave) };
    return {
      sigId: 1000, sesion: null, usuarios: [u],
      lista: { [u.id]: [...D.demo.lista] }, alertas: {}, movimientos: D.demo.movimientos.map(m => ({ ...m, uid: u.id })),
      canjes: [], codigosUsados: {}, ofertasAct: [], pagos: [], busquedas: { ...D.busquedas }, recuperacion: null, intentos: 0, bloqueo: 0, comparados: {},
    };
  };
  try { E = JSON.parse(localStorage.getItem(CLAVE)); } catch { E = null; }
  if (!E || !E.usuarios) E = nuevoEstado();
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch { /* modo privado: no se guarda */ } };
  const id = () => ++E.sigId;
  const aviso = t => { try { sessionStorage.setItem('nuvic_aviso', t); } catch { } };
  const usuario = () => E.usuarios.find(u => u.id === E.sesion) || null;
  const plus_activo = u => !!(u && u.plus_hasta && fechaDe(u.plus_hasta) > new Date());
  const exigir_sesion = () => usuario() || ir(url('login', { next: location.pathname.split('/').pop() + location.search }));
  const destino_seguro = n => (n && /^[a-z0-9\-]+\.html(\?[^\s]*)?$/i.test(n)) ? n : 'perfil.html';
  const sumar_puntos = (u, pts, titulo, tipo, detalle) => { u.puntos += pts; const m = { id: id(), uid: u.id, titulo, tipo, detalle, puntos: pts, creado: ahora() }; E.movimientos.push(m); return m.id; };
  const lista_de = u => (E.lista[u.id] = E.lista[u.id] || []);
  const busquedas_populares = n => Object.entries(E.busquedas).sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t);

  /* ------------------------------------------------------------ plantilla */
  const ICONOS = {
    inicio: ['0 0 18 18', '<path d="M1 8L9 1L17 8"/><path d="M3 7V17H15V7"/><path d="M7 17V11H11V17"/>'],
    productos: ['0 0 20 18', '<path d="M5 1V17"/><path d="M1 5L5 1L9 5"/><path d="M15 17V1"/><path d="M11 13L15 17L19 13"/>'],
    mapa: ['0 0 16 20', '<path d="M8 19C8 19 1 12.8 1 8a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="8" cy="8" r="2.5"/>'],
    lista: ['0 0 20 19', '<path d="M9.8 1L12.5 6.6L18.6 7.5L14.2 11.8L15.2 17.9L9.8 15L4.4 17.9L5.4 11.8L1 7.5L7.1 6.6L9.8 1Z"/>'],
    puntos: ['0 0 20 20', '<circle cx="10" cy="10" r="9"/><path d="M10 6V14"/><path d="M6 10H14"/>'],
    recompensas: ['0 0 20 20', '<path d="M1 9V1H9L19 11L11 19L1 9Z"/><path d="M5.5 5.5H5.51"/>'],
    plus: ['0 0 20 18', '<path d="M1 5L5.5 9L10 2L14.5 9L19 5L17 16H3L1 5Z"/>'],
    ofertas: ['0 0 20 20', '<path d="M15 5L5 15"/><circle cx="5.5" cy="5.5" r="2.5"/><circle cx="14.5" cy="14.5" r="2.5"/>'],
    perfil: ['0 0 18 20', '<circle cx="9" cy="6" r="5"/><path d="M1 19C1 15 4.6 12 9 12C13.4 12 17 15 17 19"/>'],
    salir: ['0 0 20 20', '<path d="M8 19H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h5"/><path d="M14 15L19 10L14 5"/><path d="M19 10H7"/>'],
  };
  const icono_menu = k => `<svg class="menu-icono" viewBox="${ICONOS[k][0]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[k][1]}</svg>`;
  const PAGINA = document.body.dataset.page;
  const enlaces_menu = () => {
    const u = usuario(), plus = plus_activo(u);
    const items = [['inicio', 'Inicio', 'index'], ['productos', 'Productos', 'productos'], ['mapa', 'Mapa', 'mapa'], ['lista', 'Mi lista', 'mi-lista'], ['puntos', 'Mis puntos', 'mis-puntos'], ['recompensas', 'Recompensas', 'recompensas'],
      ['plus', plus ? 'Mi membresía' : 'Nuvic Plus', plus ? 'mi-membresia' : 'membresia'], ['ofertas', 'Ofertas', 'ofertas']];
    if (u) items.push(['perfil', 'Perfil', 'perfil']);
    let h = items.map(([k, t, p]) => `<a class="menu-panel__item${p === PAGINA ? ' is-actual' : ''}" href="${p}.html"${p === PAGINA ? ' aria-current="page"' : ''}>${icono_menu(k)}${e(t)}</a>`).join('');
    if (u) h += `<form data-accion="salir"><button class="btn btn--secundario" type="submit">${icono_menu('salir')}Cerrar sesión</button></form><p class="nota">Sesión iniciada como ${e(u.correo)}</p>`;
    else h += '<a class="btn btn--primario" href="login.html">Entrar con cuenta UCA</a><p class="nota">Nuvic solo compara precios. No vende productos.</p>';
    return h;
  };
  const cabecera = titulo => {
    document.title = 'Nuvic — ' + titulo;
    const u = usuario();
    const accion = u ? `<a class="btn-puntos" href="mis-puntos.html" style="display:grid;place-items:center">★ ${u.puntos} pts</a>` : '<a class="btn-entrar" href="login.html" style="display:grid;place-items:center">Entrar</a>';
    return `<header class="encabezado"><a class="logo" href="index.html"><img src="img/logo-nuvic.svg" alt="Nuvic"></a>${accion}`
      + '<a class="btn-menu" href="menu.html" aria-label="Menú" aria-expanded="false"><span></span><span></span><span></span></a></header>'
      + `<div class="cajon" hidden><nav class="menu-panel cajon__panel" aria-label="Menú principal">${enlaces_menu()}</nav><button class="cajon__velo" type="button" aria-label="Cerrar menú"></button></div>`;
  };
  const pie = (con = true) => con ? '<footer class="pie"><img class="logo-pie" src="img/logo-nuvic-blanco.svg" alt="Nuvic"><p class="pie__lema">Compara precios en el campus.</p><ul class="pie__nav">'
    + '<li><a href="index.html">Inicio</a></li><li><a href="productos.html">Productos</a></li><li><a href="mapa.html">Mapa</a></li>'
    + '<li><a href="mi-lista.html">Mi lista</a></li><li><a href="mis-puntos.html">Mis puntos</a></li><li><a href="recompensas.html">Recompensas</a></li>'
    + '</ul><p class="pie__nota">Precios de referencia · pueden variar en el comercio</p></footer>' : '';

  /* ---------------------------------------------------------- componentes */
  const flecha = () => '<span class="flecha">›</span>';
  const estado = (t, tipo) => `<span class="estado estado--${tipo}">${e(t)}</span>`;
  const tarjeta_producto = (p, etq = false) => `<a class="producto" href="${url('comparar', { p: p.slug })}"><div class="producto__foto"><img src="${e(img(p.imagen))}" alt=""></div>`
    + (etq ? '<span class="etiqueta">Menor precio</span>' : '') + `<h3 class="producto__nombre">${e(p.nombre)}</h3><p class="producto__meta">${plural(p.comercios, 'comercio', 'comercios')}</p>`
    + `<div class="producto__pie"><span class="precio">${p.desde !== null ? 'desde ' + dinero(p.desde) : 'Agotado'}</span>${flecha()}</div></a>`;
  const aviso_caja = (t, txt) => `<div class="aviso"><span class="aviso__icono">!</span><div><p class="aviso__titulo">${e(t)}</p><p class="aviso__texto">${e(txt)}</p></div></div>`;
  const mascota = (tipo, circulo = false) => `<button class="mascota mascota--${tipo}${circulo ? ' mascota--circulo' : ''}" type="button" aria-label="Mascota de Nuvic, tócala"><img src="img/mascota/${tipo}.svg" alt=""></button>`;
  const vacio = (icono, titulo, texto, grande = false, exito = false, extra = '', masc = null) => {
    const ic = masc ? mascota(masc, !exito) : exito ? '<div class="icono-exito"><img src="img/iconos/icono-check.svg" alt="" width="40"></div>'
      : `<div class="icono-circulo${grande ? ' icono-circulo--lg' : ''}"><div class="icono-circulo__interno"><img src="img/iconos/${icono}.svg" alt=""></div></div>`;
    return `<div class="estado-vacio">${ic}<h1 class="estado-vacio__titulo${grande ? ' estado-vacio__titulo--sm' : ''}">${e(titulo)}</h1><p class="estado-vacio__texto">${texto}</p>${extra}</div>`;
  };
  const campo = (label, name, tipo = 'text', ph = '', valor = '', extra = '') => `<div class="campo"><label for="f-${name}">${e(label)}</label><input id="f-${name}" name="${name}" type="${tipo}" placeholder="${e(ph)}" value="${e(valor)}"${extra}></div>`;
  const alerta = () => '<p class="alerta-error" data-alerta hidden></p>';
  const requisitos_lista = () => '<ul class="requisitos" data-requisitos><li data-req="largo">Mínimo 8 caracteres</li><li data-req="mayus">Una letra mayúscula</li><li data-req="numero">Un número</li></ul>';
  // Muestra un error en un formulario (sin recargar la página)
  const error = (f, texto, campos = []) => {
    const a = f.querySelector('[data-alerta]'); a.textContent = texto; a.hidden = false;
    f.querySelectorAll('.campo').forEach(c => c.classList.toggle('is-error', campos.includes(c.querySelector('input')?.name)));
    throw new Error('validación');
  };

  /* --------------------------------------------------------------- páginas */
  const P = {};
  const no_encontrado = () => { cabecera_y('Página no encontrada'); return '<main class="pagina"><div><h1 class="pagina__titulo">Página no encontrada</h1></div>'
    + vacio('icono-sin-resultados', 'No encontramos esta página', 'Puede que el enlace haya cambiado o ya no exista.', true, false, '', 'busca')
    + '<div class="botones"><a class="btn btn--primario" href="index.html">Ir al inicio</a><a class="btn btn--secundario" href="mapa.html">Ver comercios en el mapa</a></div></main>'; };
  let titulo = 'Nuvic';
  const cabecera_y = t => { titulo = t; };
  P['404'] = no_encontrado;

  P.index = () => {
    const u = usuario(); cabecera_y('Inicio');
    const pop = comparables.filter(p => p.popular).slice(0, 4);
    const cerca = ['farmacia-real', 'libreria-la-iberica', 'centro-copias-uca'].map(comercio).sort((a, b) => parseFloat(a.distancia) - parseFloat(b.distancia));
    return `<section class="hero"><div class="hero__mascota">${mascota('saluda')}</div><h1 class="hero__titulo">Compara precios <em>en el campus</em></h1>
      <p class="hero__texto">${u ? 'Hola, ' + e(u.nombre.split(' ')[0]) + '. ' : ''}Encuentra dónde sale más barato lo que necesitas, sin salir de la universidad.</p>
      <a class="buscador" href="buscar.html" role="search" aria-label="Buscar productos"><img src="img/iconos/icono-lupa.svg" alt="" width="20" height="20"><span class="buscador__falso">Busca un producto</span><span class="btn-primario" style="display:grid;place-items:center">Buscar</span></a>
      <div class="chips">${['farmacias', 'librerias', 'copias', 'floristerias', 'salones', 'barberias', 'lavanderias'].map(c => `<a class="chip" href="${url('mapa', { cat: c })}">${CAT_COMERCIO[c]}</a>`).join('')}</div></section>
      <section class="seccion"><div class="seccion__cabecera"><h2 class="seccion__titulo">Productos más buscados</h2><a class="seccion__enlace" href="productos.html">Ver todos</a></div>
      <div class="productos">${pop.map((p, i) => tarjeta_producto(p, i % 2 === 0)).join('')}</div></section>
      <section class="seccion"><div class="seccion__cabecera"><h2 class="seccion__titulo">Cómo funciona</h2></div><ol class="pasos lista">
      <li class="paso"><span class="paso__numero">1</span><div><p class="paso__titulo">Busca un producto</p><p class="paso__texto">Escribe lo que necesitas o elige una categoría.</p></div></li>
      <li class="paso"><span class="paso__numero">2</span><div><p class="paso__titulo">Compara precios</p><p class="paso__texto">Mira el precio en cada comercio, del menor al mayor.</p></div></li>
      <li class="paso"><span class="paso__numero">3</span><div><p class="paso__titulo">Ve al comercio</p><p class="paso__texto">Ábrelo en el mapa y llega con Google Maps.</p></div></li></ol></section>
      <section class="seccion"><div class="seccion__cabecera"><h2 class="seccion__titulo">Comercios cerca</h2></div><div class="comercios">
      ${cerca.map(c => `<a class="comercio" href="${url('comercio', { c: c.slug })}"><img class="comercio__foto" src="${e(img(c.foto))}" alt=""><div class="comercio__info"><p class="comercio__nombre">${e(c.nombre)}</p><p class="comercio__meta">${e(c.distancia)}</p></div>${flecha()}</a>`).join('')}</div></section>
      <section class="banner-mapa"><h2 class="banner-mapa__titulo">Encuentra comercios <em>en el mapa</em></h2><p class="banner-mapa__texto">Con ubicación y ruta de Google Maps.</p><a class="btn-primario" href="mapa.html" style="display:inline-grid;place-items:center">Abrir mapa</a></section>`;
  };

  P.menu = () => { cabecera_y('Menú'); sinPie = true; return `<nav class="menu-panel">${enlaces_menu()}</nav><a class="velo" href="index.html" aria-label="Cerrar menú" style="display:block"></a>`; };
  let sinPie = false;

  P.buscar = () => { cabecera_y('Buscar');
    return `<main class="pagina"><div><h1 class="pagina__titulo">Productos</h1><p class="pagina__subtitulo">¿Qué necesitas hoy?</p></div>
      <form class="buscador buscador--simple buscador--activo" action="productos.html" method="get" role="search"><img src="img/iconos/icono-lupa.svg" alt="" width="20">
      <input type="search" name="q" placeholder="Escribe un producto" autocomplete="off" autofocus data-sugerir value="${e(get('q'))}"></form>
      <h2 class="paso__titulo" style="font-size:15px;margin-top:6px" data-titulo-lista>Búsquedas populares</h2>
      <div class="lista-sugerencias" data-lista>${busquedas_populares(5).map(t => `<a class="sugerencia" href="${url('productos', { q: t })}"><img src="img/iconos/icono-lupa.svg" alt="" width="18"><span>${e(t)}</span>${flecha()}</a>`).join('')}</div></main>`; };

  P.productos = () => {
    const q = get('q').trim().slice(0, 60), cat = CAT_PRODUCTO[get('cat')] ? get('cat') : null;
    const lista = buscar_productos(q, cat), n = lista.length;
    if (q && n) { const t = q.toLowerCase(); E.busquedas[t] = (E.busquedas[t] || 0) + 1; guardar(); }
    const sub = q ? (n ? plural(n, 'resultado', 'resultados') + ' para “' + q + '”' : 'Sin resultados') : plural(n, 'producto para comparar', 'productos para comparar');
    cabecera_y(q ? 'Resultados · ' + q : 'Productos');
    return `<main class="pagina"><div><h1 class="pagina__titulo">Productos</h1><p class="pagina__subtitulo">${e(sub)}</p></div>
      <form class="buscador buscador--simple" action="productos.html" method="get" role="search"><img src="img/iconos/icono-lupa.svg" alt="" width="20">
      <input type="search" name="q" placeholder="Buscar producto" value="${e(q)}" aria-label="Buscar producto">${cat ? `<input type="hidden" name="cat" value="${e(cat)}">` : ''}${q ? '<a class="buscador__borrar" href="buscar.html" aria-label="Borrar búsqueda">×</a>' : ''}</form>
      <div class="chips chips--fila"><a class="chip${cat ? '' : ' is-activo'}" href="${url('productos', { q })}">Todos</a>${Object.entries(CAT_PRODUCTO).map(([k, t]) => `<a class="chip${cat === k ? ' is-activo' : ''}" href="${url('productos', { q, cat: k })}">${t}</a>`).join('')}</div>
      ${n ? `<div class="productos">${lista.map(p => tarjeta_producto(p, p.popular && !q)).join('')}</div>${q || cat ? '<a class="btn btn--secundario btn--medio" href="productos.html">Ver todos los productos</a>' : ''}`
        : vacio('icono-sin-resultados', 'No encontramos productos', 'Revisa la ortografía o prueba con otra palabra.', true, false, '', 'busca')
        + `<h2 class="paso__titulo" style="font-size:15px">Prueba con</h2><div class="chips">${busquedas_populares(4).map(t => `<a class="chip" href="${url('productos', { q: t })}">${e(t)}</a>`).join('')}</div>`
        + '<div class="botones"><a class="btn btn--primario" href="buscar.html">Limpiar búsqueda</a><a class="btn btn--secundario" href="productos.html">Ver todos los productos</a></div>'}</main>`;
  };

  P.comparar = () => {
    const p = producto(get('p') || 'paracetamol-500-mg'); if (!p || !p.comparable) return no_encontrado();
    const u = usuario();
    if (u && !E.comparados[p.id]) { E.comparados[p.id] = 1; u.comparaciones++; guardar(); }
    const pr = precios_de(p), disp = pr.filter(r => r.disponible), ago = pr.filter(r => !r.disponible);
    const ahorro = disp.length > 1 ? disp[disp.length - 1].precio - disp[0].precio : 0;
    const guardado = u && lista_de(u).includes(p.slug), alertaOn = u && (E.alertas[u.id] || []).includes(p.slug);
    cabecera_y(p.nombre);
    return `<main class="pagina"><p class="migas"><a href="index.html">Inicio</a> › <a href="productos.html">Productos</a> › ${e(p.nombre)}</p>
      ${disp.length ? `<div class="foto-producto"><div class="foto-producto__imagen"><img src="${e(img(p.imagen_grande || p.imagen))}" alt=""></div>${ahorro > 0 ? `<span class="estado estado--menor estado--grande">Ahorra hasta ${dinero(+ahorro.toFixed(2))}</span>` : ''}</div>` : ''}
      <div><h1 class="pagina__titulo pagina__titulo--detalle">${e(p.nombre)}</h1><p class="migas">${e(p.detalle)} · ${disp.length ? 'mismo producto en ' + plural(pr.length, 'comercio', 'comercios') : 'actualizado hoy'}</p></div>
      ${!disp.length ? aviso_caja('Agotado en todos los comercios', 'Actualizado ' + fecha_hora(ahora())) : ago.length ? aviso_caja(ago[0].nombre + ' ya no lo tiene', 'Te mostramos dónde sí está disponible.') : ''}
      ${disp.length ? '<div class="subtitulo-fila"><h2 class="subtitulo">Precios por comercio</h2><small>Menor a mayor</small></div>' : ''}
      <div class="lista">${pr.map((r, i) => { const ok = r.disponible, mejor = ok && i === 0 && disp.length > 1;
        return `<article class="opcion${mejor ? ' is-mejor' : ''}${ok ? '' : ' is-agotado'}"><img class="opcion__foto" src="${e(img(r.foto))}" alt="">
          <div class="opcion__info"><a class="opcion__nombre" href="${url('comercio', { c: r.slug })}">${e(r.nombre)}</a><p class="opcion__meta">${e(r.distancia)}</p>${ok ? `<a class="opcion__enlace" href="${e(mapa_google(r.nombre))}" target="_blank" rel="noopener">Cómo llegar ›</a>` : ''}</div>
          <div class="opcion__lado"><span class="opcion__precio">${dinero(r.precio)}</span>${mejor ? estado('Menor precio', 'menor') : ok ? '' : estado('Agotado', 'agotado')}</div></article>`; }).join('')}</div>
      <div class="botones">${disp.length
        ? `<form data-accion="lista"><button class="btn ${guardado ? 'btn--secundario' : 'btn--primario'}" type="submit">${guardado ? '✓ En tu lista · Quitar' : '☆ Guardar en mi lista'}</button></form><a class="btn btn--secundario" href="${url('mapa', { cat: MAPA_DE_PRODUCTO[p.categoria] })}">Ver en el mapa</a>`
        : `<form data-accion="alerta"><button class="btn ${alertaOn ? 'btn--secundario' : 'btn--primario'}" type="submit"${alertaOn ? ' disabled' : ''}>${alertaOn ? '✓ Te avisaremos' : 'Avisarme cuando haya'}</button></form><a class="btn btn--secundario" href="${url('productos', { cat: p.categoria })}">Ver productos similares</a>`}</div></main>`;
  };

  P.mapa = () => {
    const cat = CAT_COMERCIO[get('cat')] ? get('cat') : 'barberias';
    const cs = D.comercios.filter(c => c.categoria === cat);
    const sel = cs.find(c => c.slug === get('c')) || [...cs].sort((a, b) => a.desde - b.desde)[0];
    const abiertos = cs.filter(abierto);
    cabecera_y('Mapa · ' + CAT_COMERCIO[cat]);
    let sin = '';
    if (!abiertos.length) {
      const abre = Math.min(...cs.map(c => c.abre));
      const alterna = Object.keys(CAT_COMERCIO).find(k => k !== cat && D.comercios.some(c => c.categoria === k && abierto(c)));
      sin = `<section class="sin-abiertos">${mascota('dormido', true)}<h2 class="seccion__titulo">No hay comercios abiertos ahora</h2><p class="estado-vacio__texto">Las ${CAT_COMERCIO[cat].toLowerCase()} cerca de la UCA abren a las ${hora_ampm(abre)}.</p>`
        + (alterna ? `<a class="btn btn--primario" href="${url('mapa', { cat: alterna })}">Ver ${CAT_COMERCIO[alterna].toLowerCase()} abiertas</a>` : '') + '</section>';
    }
    const h = new Date().getHours();
    return `<main class="pagina"><div><h1 class="pagina__titulo pagina__titulo--auth">Mapa de comercios</h1><p class="pagina__subtitulo" style="font-size:13px">Toca un comercio para ver sus precios.</p></div>
      <div class="chips chips--fila">${Object.entries(CAT_COMERCIO).map(([k, t]) => `<a class="chip${k === cat ? ' is-activo' : ''}" href="${url('mapa', { cat: k })}">${t}</a>`).join('')}</div>
      <div class="mapa"><svg class="mapa__fondo" viewBox="0 0 362 380" preserveAspectRatio="none" aria-hidden="true"><rect width="362" height="380" fill="#f5f5f5"/>
      <g fill="#e8eaed"><rect x="0" y="0" width="64" height="62" rx="6"/><rect x="240" y="0" width="122" height="62" rx="6"/><rect x="0" y="88" width="64" height="70" rx="6"/><rect x="82" y="88" width="140" height="70" rx="6"/><rect x="240" y="88" width="122" height="70" rx="6"/><rect x="0" y="184" width="64" height="78" rx="6"/><rect x="82" y="184" width="140" height="78" rx="6"/><rect x="240" y="184" width="122" height="78" rx="6"/><rect x="0" y="288" width="64" height="92" rx="6"/><rect x="82" y="288" width="140" height="92" rx="6"/></g>
      <rect x="82" y="0" width="140" height="62" rx="6" fill="#cfe8cf"/><rect x="240" y="288" width="122" height="92" rx="6" fill="#cfe8cf"/><rect x="0" y="68" width="362" height="12" fill="#fde9a8"/><rect x="0" y="345" width="190" height="35" fill="#aadaff"/>
      <circle cx="122" cy="320" r="22" fill="#4f8ef7" fill-opacity=".18"/><circle cx="122" cy="320" r="8" fill="#4f8ef7" stroke="#fff" stroke-width="3"/>
      <text x="126" y="30" font-size="8.5" fill="#3c7a3c" font-family="Poppins">Parque UCA</text><text x="20" y="117" font-size="8.5" fill="#5f6368" font-family="Poppins">Blvd. Campus</text><text x="156" y="248" font-size="8.5" fill="#5f6368" font-family="Poppins">Calle Central</text></svg>
      ${cs.map(c => `<a class="pin${sel && c.id === sel.id ? ' is-activo' : ''}" href="${url('mapa', { cat, c: c.slug })}" style="left:${c.pin_x}px;top:${c.pin_y}px" aria-label="${e(c.nombre)}"><span class="pin__precio">${dinero(c.desde)}</span><img class="pin__foto" src="${e(img(c.pin))}" alt=""></a>`).join('')}
      <span class="mapa__marca">Google Maps</span></div>
      ${sel ? `<article class="comercio-destacado"><img class="comercio-destacado__foto" src="${e(img(sel.foto))}" alt=""><div class="comercio-destacado__info"><p class="comercio-destacado__nombre">${e(sel.nombre)}</p><p class="comercio__meta">${e(sel.distancia)}</p>
        <span>${abierto(sel) ? estado('Abierto ahora', 'disponible estado--grande') : estado('Cerrado · abre ' + hora_ampm(sel.abre), 'cerrado estado--grande')}</span><p class="comercio-destacado__precio"><small>desde</small>${dinero(sel.desde)}</p></div></article>
        <div class="botones botones--par"><a class="btn btn--secundario btn--medio" href="${e(mapa_google(sel.nombre))}" target="_blank" rel="noopener">Cómo llegar</a><a class="btn btn--oscuro btn--medio" href="${url('comercio', { c: sel.slug })}">Ver precios</a></div>` : ''}
      ${sin}<h2 class="subtitulo" style="margin-top:10px">Todos los comercios</h2><div class="lista">
      ${cs.map(c => `<a class="menu-item" href="${url('comercio', { c: c.slug })}"><div><strong>${e(c.nombre)}</strong><small>${e(c.distancia)} · desde ${dinero(c.desde)}</small></div><span style="display:grid;justify-items:end;gap:2px">${abierto(c) ? estado('Abierto', 'disponible estado--grande') : estado('Cerrado', 'cerrado estado--grande') + `<small style="font-size:11px;color:var(--texto)">Abre ${h >= c.cierra ? 'mañana ' : ''}${hora_ampm(c.abre)}</small>`}</span></a>`).join('')}</div></main>`;
  };

  P.comercio = () => {
    const c = comercio(get('c')); if (!c) return no_encontrado();
    const items = D.precios.filter(r => r.c === c.id).map(r => ({ ...r, ...D.productos.find(p => p.id === r.p), precio: r.precio, descripcion: r.descripcion }));
    const secs = {}; items.forEach(it => (secs[it.seccion] = secs[it.seccion] || []).push(it));
    const ago = items.filter(i => !i.disponible), maps = mapa_google(c.nombre);
    cabecera_y(c.nombre);
    const n = Object.keys(secs).length;
    return `<main class="pagina"><p class="migas"><a href="index.html">Inicio</a> › <a href="${url('mapa', { cat: c.categoria })}">Mapa</a> › ${e(c.nombre)}</p><img class="portada" src="${e(img(c.portada))}" alt="">
      <div><h1 class="pagina__titulo pagina__titulo--detalle">${e(c.nombre)}</h1><p class="pagina__subtitulo pagina__subtitulo--sm subtitulo-con-etiqueta">${e(c.descripcion)}${c.ejemplo ? ' <span class="estado estado--nueva">Precios de ejemplo</span>' : ''}</p></div>
      <section class="tarjeta"><ul class="info-comercio" style="list-style:none;margin:0;padding:0 0 0 12px"><li><img src="img/iconos/icono-ubicacion.svg" alt="" width="20">${e(c.direccion)}</li>
      <li><img src="img/iconos/icono-horario.svg" alt="" width="20"><span>${e(c.horario)} · ${abierto(c) ? '<span style="color:var(--verde)">Abierto ahora</span>' : '<span style="color:var(--coral)">Cerrado</span>'}</span></li>
      ${c.horario2 ? `<li><img src="img/iconos/icono-horario.svg" alt="" width="20">${e(c.horario2)}</li>` : ''}</ul></section>
      ${ago.length ? aviso_caja(ago[0].nombre + ' ya no está disponible', 'Este comercio se quedó sin existencias.') : ''}
      <h2 class="subtitulo">Precios en este comercio</h2>${items.length ? '' : '<p class="nota" style="text-align:left">Este comercio todavía no tiene precios cargados. El precio “desde” del mapa es de referencia.</p>'}
      ${Object.entries(secs).map(([s, l]) => (n > 1 ? `<h3 class="categoria">${e(s)}</h3>` : '') + '<div class="lista">' + l.map(it => {
        const ok = it.disponible, tag = it.comparable ? `a href="${url('comparar', { p: it.slug })}"` : 'article', fin = it.comparable ? 'a' : 'article';
        const lado = it.precio === null ? '<span class="item-precio__consultar">Consultar</span>'
          : (it.desde ? '<small class="item-precio__unidad">desde</small>' : '') + `<span class="item-precio__precio">${dinero(it.precio)}</span>` + (it.unidad ? `<small class="item-precio__unidad">${e(it.unidad)}</small>` : '');
        return `<${tag} class="item-precio item-precio--alto${ok ? '' : ' is-agotado'}"><img class="item-precio__foto item-precio__foto--lg" src="${e(img(it.imagen))}" alt="">
          <div class="item-precio__info"><p class="item-precio__nombre">${e(it.nombre)}</p>${it.descripcion ? `<p class="item-precio__meta">${e(it.descripcion)}</p>` : ''}${it.etiqueta ? estado(it.etiqueta, 'nota') : ''}</div>
          <div class="item-precio__lado">${lado}${ok ? '' : estado('No disponible', 'no-disponible')}</div></${fin}>`; }).join('') + '</div>').join('')}
      ${c.extra_titulo ? `<section class="tarjeta info-extra"><p class="info-extra__titulo">${e(c.extra_titulo)}</p>${c.extra_texto.split('\n').map(l => `<p>${e(l)}</p>`).join('')}</section>` : ''}
      <p class="nota">${e(c.nota_precios)}</p><div class="botones">${c.contacto_url
        ? `<a class="btn btn--primario" href="${e(c.contacto_url)}"${c.contacto_url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${e(c.contacto_texto)}</a><a class="btn btn--secundario" href="${e(maps)}" target="_blank" rel="noopener">Cómo llegar en Google Maps</a>`
        : `<a class="btn btn--primario" href="${e(maps)}" target="_blank" rel="noopener">Cómo llegar en Google Maps</a>`}</div></main>`;
  };

  P['mi-lista'] = () => {
    const u = exigir_sesion(); cabecera_y('Mi lista');
    const items = lista_de(u).map(producto).filter(Boolean);
    if (!items.length) return '<main class="pagina"><div><h1 class="pagina__titulo">Mi lista</h1></div>' + vacio('icono-lista', 'Tu lista está vacía', 'Agrega productos para comparar su precio total.', true, false, '', 'busca')
      + '<div class="botones"><a class="btn btn--primario" href="productos.html">Buscar productos</a><a class="btn btn--secundario" href="ofertas.html">Ver ofertas</a></div></main>';
    let total = 0, sin = 0; const agot = [];
    items.forEach(it => { const d = precios_de(it).filter(r => r.disponible); it.mejor = d[0] || null; if (d.length) { total += d[0].precio; sin += d[d.length - 1].precio; } else agot.push(it.nombre); });
    total = +total.toFixed(2); sin = +sin.toFixed(2);
    return `<main class="pagina"><div><h1 class="pagina__titulo">Mi lista</h1><p class="pagina__subtitulo">${plural(items.length, 'producto que quieres comparar', 'productos que quieres comparar')}</p></div>
      ${agot.length ? aviso_caja(plural(agot.length, 'producto ya no está disponible', 'productos ya no están disponibles'), agot.join(', ') + ' se agotó en todos los comercios.') : ''}
      <div class="lista">${items.map(it => `<article class="item-precio item-lista${it.mejor ? '' : ' is-agotado'}"><a href="${url('comparar', { p: it.slug })}"><img class="item-precio__foto" src="${e(img(it.imagen))}" alt=""></a>
        <a class="item-precio__info" href="${url('comparar', { p: it.slug })}"><p class="item-precio__nombre">${e(it.nombre)}</p><p class="item-precio__meta">${it.mejor ? e(it.mejor.nombre) : 'Agotado en todos los comercios'}</p></a>
        <div class="item-precio__lado"><span class="item-precio__precio">${it.mejor ? dinero(it.mejor.precio) : '—'}</span><form data-accion="quitar"><button class="btn-quitar" type="submit" name="quitar" value="${e(it.slug)}" aria-label="Quitar ${e(it.nombre)}">Quitar</button></form></div></article>`).join('')}</div>
      <section class="tarjeta-oscura total"><p class="total__etiqueta">Total al menor precio de cada producto</p><div class="total__fila"><span class="total__monto">${dinero(total)}</span>${sin > total ? `<span class="total__ahorro">Ahorras hasta ${dinero(+(sin - total).toFixed(2))}</span>` : ''}</div>
      <p class="total__nota">Sin comparar: <strong>${dinero(sin)}</strong></p></section>
      <div class="botones"><a class="btn btn--primario" href="mapa.html">Ver comercios en el mapa</a><a class="btn btn--secundario" href="productos.html">Agregar más productos</a></div></main>`;
  };

  /* ---- cuenta */
  P.login = () => {
    if (usuario()) ir(destino_seguro(get('next')));
    cabecera_y('Iniciar sesión');
    return `<main class="pagina"><div><h1 class="pagina__titulo pagina__titulo--auth">Entra con tu cuenta UCA</h1><p class="pagina__subtitulo">Para sumar y canjear tus puntos.</p></div>
      <form class="formulario" data-accion="login" novalidate style="margin-top:28px">
      ${campo('Correo institucional', 'correo', 'email', 'nombre@uca.edu.sv', '', ' autocomplete="email" required')}${campo('Contraseña', 'clave', 'password', '••••••••', '', ' autocomplete="current-password" required')}${alerta()}
      <a class="enlace" href="olvide.html" style="justify-self:end">¿Olvidaste tu contraseña?</a><button class="btn btn--solido" type="submit" style="margin-top:8px">Iniciar sesión</button>
      <p class="separador" style="margin:10px 0">o continúa con</p><button class="btn btn--secundario" type="button" data-aviso="El inicio con Microsoft necesita registrar la app en Azure. Por ahora entra con tu correo y contraseña.">Cuenta UCA (Microsoft)</button></form>
      <p class="pregunta" style="margin:22px 0 14px">¿No tienes cuenta? <a href="registro.html">Crear cuenta</a></p><p class="nota demo-nota">Cuenta de prueba: <b>ana.martinez@uca.edu.sv</b> · <b>Nuvic2026</b></p></main>`;
  };
  P.registro = () => {
    if (usuario()) ir('perfil.html'); cabecera_y('Crear cuenta');
    return `<main class="pagina"><div><h1 class="pagina__titulo pagina__titulo--auth">Crear cuenta</h1><p class="pagina__subtitulo">Con tu carné y correo institucional UCA.</p></div>
      <form class="formulario" data-accion="registro" novalidate style="margin-top:28px">${campo('Nombre completo', 'nombre', 'text', 'Ana Martínez', '', ' autocomplete="name"')}${campo('Carné UCA', 'carne', 'text', '00123425', '', ' inputmode="numeric" maxlength="8"')}
      ${campo('Correo institucional', 'correo', 'email', 'nombre@uca.edu.sv', '', ' autocomplete="email"')}${campo('Contraseña', 'clave', 'password', 'Mínimo 8 caracteres', '', ' autocomplete="new-password"')}${requisitos_lista()}
      <label class="casilla" style="margin:12px 0"><input type="checkbox" name="terminos" value="1"> Acepto los términos y la política de privacidad</label>${alerta()}<button class="btn btn--solido" type="submit">Crear cuenta</button></form>
      <p class="pregunta" style="margin:22px 0 30px">¿Ya tienes cuenta? <a href="login.html">Inicia sesión</a></p></main>`;
  };
  P.olvide = () => { cabecera_y('Olvidé mi contraseña');
    return `<main class="pagina"><a class="enlace enlace--volver" href="login.html">‹ Volver a iniciar sesión</a>${vacio('icono-candado', '¿Olvidaste tu contraseña?', 'Escribe tu correo institucional y te enviaremos un enlace para crear una nueva.')}
      <form class="formulario" data-accion="olvide" novalidate>${campo('Correo institucional', 'correo', 'email', 'nombre@uca.edu.sv', '', ' autocomplete="email"')}${alerta()}<button class="btn btn--primario btn--grande" type="submit" style="margin-top:16px">Enviar enlace</button></form>
      <p class="pregunta" style="margin:22px 0 30px">¿Ya la recordaste? <a href="login.html">Iniciar sesión</a></p></main>`; };
  P['correo-enviado'] = () => {
    const r = E.recuperacion; if (!r) ir('olvide.html'); cabecera_y('Revisa tu correo');
    const espera = Math.max(0, 45 - Math.floor((Date.now() - r.enviado) / 1000));
    return `<main class="pagina">${vacio('icono-correo', 'Revisa tu correo', `Enviamos un enlace a <strong style="display:block;color:var(--azul-noche);font-size:14px">${e(r.correo)}</strong>`)}
      <section class="tarjeta"><p class="aviso__titulo" style="color:var(--azul-noche)">¿No lo ves?</p><p class="item-precio__meta" style="font-size:12px">Revisa la carpeta de spam o correo no deseado.<br>El enlace vence en 30 minutos.</p></section>
      <div class="botones"><a class="btn btn--primario btn--grande" href="${url('nueva-contrasena', { token: r.token })}">Abrir mi correo</a><form data-accion="reenviar"><button class="btn btn--secundario" type="submit" data-espera="${espera}"${espera ? ' disabled' : ''}>Reenviar enlace</button></form></div>
      <p class="separador" data-cuenta></p><p class="nota demo-nota">Modo demo: no se envían correos de verdad, así que “Abrir mi correo” abre el enlace que llegaría a tu bandeja.</p><a class="enlace enlace--volver" href="login.html">‹ Volver a iniciar sesión</a></main>`;
  };
  const recuperacionValida = t => { const r = E.recuperacion; return r && t && r.token === t && Date.now() - r.enviado < 30 * 60e3 ? r : null; };
  P['nueva-contrasena'] = () => {
    if (!recuperacionValida(get('token'))) ir('enlace-vencido.html'); cabecera_y('Nueva contraseña');
    return `<main class="pagina">${vacio('icono-candado', 'Crea tu nueva contraseña', 'Que sea distinta a las que usaste antes.')}<form class="formulario" data-accion="nueva-clave" novalidate>
      ${campo('Nueva contraseña', 'clave', 'password', 'Mínimo 8 caracteres', '', ' autocomplete="new-password"')}${campo('Confirmar contraseña', 'clave2', 'password', 'Repite tu contraseña', '', ' autocomplete="new-password"')}
      <div style="margin:10px 0">${requisitos_lista()}</div>${alerta()}<button class="btn btn--primario btn--grande" type="submit">Guardar contraseña</button></form></main>`;
  };
  P['enlace-vencido'] = () => { cabecera_y('El enlace venció'); return '<main class="pagina">' + vacio('icono-reloj', 'El enlace venció', 'Por seguridad, los enlaces duran 30 minutos. Pide uno nuevo para continuar.')
    + '<a class="btn btn--primario btn--grande" href="olvide.html">Pedir un enlace nuevo</a><a class="enlace enlace--volver" href="login.html">‹ Volver a iniciar sesión</a></main>'; };
  P['contrasena-actualizada'] = () => { cabecera_y('Contraseña actualizada'); return '<main class="pagina">' + vacio(null, 'Contraseña actualizada', 'Ya puedes entrar con tu nueva contraseña.', false, true, '', 'celebra')
    + '<a class="btn btn--primario btn--grande" href="login.html">Iniciar sesión</a></main>'; };
  P.perfil = () => {
    const u = exigir_sesion(), plus = plus_activo(u), n = lista_de(u).length; cabecera_y('Perfil');
    return `<main class="pagina"><div><h1 class="pagina__titulo">Perfil</h1></div><section class="perfil"><span class="avatar">${e(iniciales(u.nombre))}</span><div><p class="perfil__nombre">${e(u.nombre)}</p>
      <p class="perfil__meta">${e(u.carrera || 'Carné ' + u.carne)}</p>${estado('Cuenta UCA verificada', 'verificada')}</div></section>
      <div class="cifras"><div class="cifra"><strong>${u.puntos}</strong><span>Puntos</span></div><div class="cifra"><strong>${u.comparaciones}</strong><span>Comparaciones</span></div></div>
      <div class="lista"><a class="menu-item" href="mi-lista.html"><div><strong>Mi lista</strong><small>${plural(n, 'producto guardado', 'productos guardados')}</small></div>${flecha()}</a>
      <a class="menu-item" href="mis-puntos.html"><div><strong>Historial de puntos</strong><small>Compras y canjes</small></div>${flecha()}</a>
      <a class="menu-item" href="${plus ? 'mi-membresia.html' : 'membresia.html'}"><div><strong>Nuvic Plus</strong><small>${plus ? 'Activo hasta el ' + fecha(u.plus_hasta) : 'Ahorra más con la membresía'}</small></div>${flecha()}</a></div>
      <form data-accion="salir"><button class="btn btn--secundario" type="submit">Cerrar sesión</button></form>
      <p class="nota demo-nota">Esta es una demo: tu cuenta y tus puntos se guardan solo en este navegador. <button class="enlace" type="button" data-reiniciar style="background:none;border:0;padding:0;font:inherit;cursor:pointer;text-decoration:underline">Reiniciar la demo</button></p></main>`;
  };

  /* ---- puntos */
  P['mis-puntos'] = () => {
    const u = exigir_sesion(), meta = CONFIG.meta_nivel, falta = Math.max(0, meta - u.puntos); cabecera_y('Mis puntos');
    const mov = E.movimientos.filter(m => m.uid === u.id).sort((a, b) => (fechaDe(b.creado) - fechaDe(a.creado)) || (b.id - a.id)).slice(0, 30);
    return `<main class="pagina"><div><h1 class="pagina__titulo">Mis puntos</h1><p class="pagina__subtitulo">Tu saldo y tu historial</p></div>
      <section class="tarjeta-oscura saldo"><p class="saldo__etiqueta">Tienes</p><p class="saldo__cifra"><strong>${u.puntos}</strong><span>puntos</span></p><div class="progreso progreso--oscuro" style="margin-top:6px"><div class="progreso__barra" style="width:${Math.min(100, Math.round(u.puntos / meta * 100))}%"></div></div>
      <p class="saldo__nota">${falta ? `Te faltan ${falta} para Nivel Ahorrador` : '¡Ya alcanzaste el Nivel Ahorrador!'}</p></section>
      <div class="botones botones--par"><a class="btn btn--primario btn--medio" href="recompensas.html">Canjear</a><a class="btn btn--secundario btn--medio" href="escanear-qr.html">Escanear QR</a></div>
      <h2 class="subtitulo" style="margin-top:22px">Historial de puntos</h2><div class="lista">${mov.map(m => `<div class="movimiento"><div><strong>${e(m.titulo)}</strong><small>${e(m.tipo)} · ${e(fecha_hora(m.creado))}</small></div><span class="movimiento__puntos${m.puntos < 0 ? ' is-canje' : ''}">${(m.puntos > 0 ? '+' : '−') + Math.abs(m.puntos)} pts</span></div>`).join('')}
      ${mov.length ? '' : '<p class="nota">Todavía no tienes movimientos. Escanea el QR de tu próxima compra.</p>'}</div></main>`;
  };
  P['escanear-qr'] = () => {
    const u = exigir_sesion(); cabecera_y('Escanear QR');
    const ult = E.movimientos.filter(m => m.uid === u.id && m.tipo === 'Compra').sort((a, b) => (fechaDe(b.creado) - fechaDe(a.creado)) || (b.id - a.id))[0];
    return `<main class="pagina"><p class="migas"><a href="index.html">Inicio</a> › <a href="mis-puntos.html">Mis puntos</a> › Escanear QR</p>
      <div><h1 class="pagina__titulo pagina__titulo--detalle">Escanear QR de compra</h1><p class="pagina__subtitulo pagina__subtitulo--sm">Después de comprar en un comercio participante, escanea el código que te muestra.</p></div>
      <form data-accion="simular"><button class="escaner" type="submit" style="width:100%;border:0;display:block"><div class="escaner__marco"><span></span></div><p class="escaner__texto">Toca para simular el escaneo del QR</p></button></form>
      ${ult ? `<div class="comercio" style="border-radius:18px"><div class="comercio__info"><p class="comercio__nombre">${e(ult.titulo)}</p><p class="comercio__meta">${e(ult.detalle)}</p></div>${estado('+' + ult.puntos + ' puntos', 'puntos')}</div>` : ''}
      <form class="formulario" data-accion="codigo" novalidate>${campo('Ingresar código manual', 'codigo', 'text', 'NV-XXXX', '', ' autocomplete="off" style="text-transform:uppercase"')}${alerta()}<button class="btn btn--secundario" type="submit" style="height:50px">Validar código</button></form>
      <p class="nota demo-nota">Códigos de prueba: ${D.codigos.map(c => c.codigo).join(' · ')} (cada uno sirve una vez)</p><p class="nota">Nuvic no vende: el pago lo haces en el comercio.</p></main>`;
  };
  P['puntos-validados'] = () => {
    const u = exigir_sesion(), m = E.movimientos.find(x => x.id === +get('m') && x.uid === u.id); if (!m) ir('mis-puntos.html'); cabecera_y('Transacción validada');
    return `<main class="pagina"><div class="estado-vacio">${mascota('celebra')}<h1 class="estado-vacio__titulo" style="font-size:22px">Transacción validada</h1><p class="estado-vacio__resultado">+${m.puntos}</p><p class="estado-vacio__texto" style="font-size:13.5px">puntos sumados a tu cuenta</p></div>
      <section class="tarjeta filas"><div class="fila"><span>Comercio</span><strong>${e(m.titulo)}</strong></div><div class="fila"><span>Compra</span><strong>${e(m.detalle)}</strong></div><div class="fila"><span>Puntos acumulados</span><strong>${u.puntos} pts</strong></div></section>
      <div class="botones"><a class="btn btn--primario" href="mis-puntos.html">Ver mis puntos</a><a class="btn btn--secundario" href="productos.html">Seguir comparando</a></div></main>`;
  };
  P.recompensas = () => {
    const u = exigir_sesion(); cabecera_y('Recompensas');
    return `<main class="pagina"><div><h1 class="pagina__titulo">Recompensas</h1><p class="pagina__subtitulo">Tienes ${u.puntos} puntos para canjear</p></div><div class="lista">
      ${D.recompensas.map(r => `<a class="recompensa" href="${url('recompensa', { r: r.slug })}"><div class="recompensa__foto icono-tile" style="background:${e(r.color)};width:76px;height:76px"><img src="${e(img(r.icono))}" alt="" width="34"></div>
        <div style="flex:1"><p class="recompensa__nombre">${e(r.nombre)}</p><p class="recompensa__comercio">${e(r.comercio)}</p><p class="recompensa__puntos" style="margin-top:2px;font-size:15px">${r.costo} pts</p></div>
        ${u.puntos >= r.costo ? estado('Disponible', 'disponible') : estado('Faltan ' + (r.costo - u.puntos), 'no-disponible')}</a>`).join('')}</div><a class="btn btn--secundario" href="escanear-qr.html">Sumar puntos con QR</a></main>`;
  };
  const recompensa = s => D.recompensas.find(r => r.slug === s);
  P.recompensa = () => {
    const u = exigir_sesion(), r = recompensa(get('r') || 'lavado-gratis'); if (!r) return no_encontrado();
    const falta = Math.max(0, r.costo - u.puntos); cabecera_y(r.nombre);
    return `<main class="pagina"><p class="migas"><a href="recompensas.html">Recompensas</a> › ${e(r.nombre)}</p><div><h1 class="pagina__titulo pagina__titulo--detalle">${e(r.nombre)}</h1></div>
      <section class="recompensa"><div class="recompensa__foto icono-tile" style="background:${e(r.color)}"><img src="${e(img(r.icono))}" alt="" width="36"></div><div><p class="recompensa__nombre">${e(r.detalle)}</p><p class="recompensa__comercio">${e(r.comercio)}</p><p class="recompensa__puntos">${r.costo} pts</p></div></section>
      <section class="tarjeta"><div class="progreso-cabecera">Tu progreso <span>${Math.min(u.puntos, r.costo)} / ${r.costo}</span></div><div class="progreso"><div class="progreso__barra" style="width:${Math.min(100, Math.round(u.puntos / r.costo * 100))}%"></div></div>
      <p class="paso__titulo" style="margin-top:18px;font-size:14px">${falta ? `Te faltan ${falta} puntos.` : '¡Ya puedes canjearlo!'}</p><p class="paso__texto">${falta ? 'Suma puntos comprando en comercios participantes.' : `Se descontarán ${r.costo} puntos de tu saldo.`}</p></section>
      <div class="botones">${falta ? '<button class="btn is-deshabilitado" type="button" disabled>Canjear (faltan puntos)</button>' : `<a class="btn btn--primario" href="${url('confirmar-canje', { r: r.slug })}">Canjear por ${r.costo} pts</a>`}
      <a class="btn btn--secundario" href="${falta ? 'escanear-qr.html' : 'mapa.html'}">${falta ? 'Sumar puntos con QR' : 'Ver comercios participantes'}</a></div></main>`;
  };
  P['confirmar-canje'] = () => {
    const u = exigir_sesion(), r = recompensa(get('r')); if (!r) return no_encontrado();
    const quedan = u.puntos - r.costo; if (quedan < 0) ir(url('recompensa', { r: r.slug })); cabecera_y('Confirmar canje');
    return `<main class="pagina"><p class="migas"><a href="recompensas.html">Recompensas</a> › ${e(r.nombre)}</p><div><h1 class="pagina__titulo pagina__titulo--detalle">Confirmar canje</h1></div>
      <section class="recompensa"><div class="recompensa__foto icono-tile" style="background:${e(r.color)}"><img src="${e(img(r.icono))}" alt="" width="60"></div><div><p class="recompensa__nombre" style="font-size:17px">${e(r.nombre)}</p><p class="recompensa__comercio">${e(r.comercio)}</p><p class="recompensa__puntos">${r.costo} pts</p></div></section>
      <section class="tarjeta filas"><div class="fila"><span>Tus puntos</span><strong>${u.puntos} pts</strong></div><div class="fila"><span>Costo de la recompensa</span><strong class="is-negativo">−${r.costo} pts</strong></div><div class="fila"><span>Te quedarán</span><strong>${quedan} pts</strong></div></section>
      <p class="nota">${e(r.aviso)}</p><form class="botones" data-accion="canjear"><button class="btn btn--primario btn--grande" type="submit">Confirmar canje</button><a class="btn btn--secundario" href="mis-puntos.html">Cancelar</a></form></main>`;
  };
  P['recompensa-canjeada'] = () => {
    const u = exigir_sesion(), c = E.canjes.find(x => x.id === +get('c') && x.uid === u.id); if (!c) ir('recompensas.html');
    const r = recompensa(c.recompensa); cabecera_y('Recompensa canjeada');
    return `<main class="pagina">${vacio(null, 'Recompensa canjeada', 'Úsala en ' + e(r.comercio) + '. Muestra el código en el comercio.', false, true, '', 'celebra')}
      <section class="tarjeta filas"><div class="fila"><span>Puntos usados</span><strong class="is-negativo">−${c.puntos} pts</strong></div><div class="fila"><span>Puntos restantes</span><strong>${u.puntos} pts</strong></div>
      <div class="fila"><span>Código</span><strong style="letter-spacing:1px">${e(c.codigo)}</strong></div><div class="fila"><span>Canjeado</span><strong>${e(fecha_hora(c.creado))}</strong></div></section>
      <div class="botones"><a class="btn btn--solido" href="index.html">Volver al inicio</a><a class="btn btn--secundario" href="mis-puntos.html">Ver mis puntos</a></div></main>`;
  };

  /* ---- membresía y ofertas */
  P.membresia = () => {
    const plus = plus_activo(usuario()), precio = dinero(CONFIG.precio_plus), dest = plus ? 'mi-membresia.html' : 'confirmar-membresia.html'; cabecera_y('Nuvic Plus');
    return `<main class="pagina"><span class="estado estado--plus">Nuvic Plus</span><div><h1 class="pagina__titulo" style="font-size:25px">Ahorra más con <em>tu membresía</em></h1><p class="pagina__subtitulo" style="font-size:13px">Ofertas exclusivas en los comercios del campus.</p></div>
      <section class="tarjeta-oscura tarjeta-oscura--plan plan"><div class="plan__cabecera"><span class="plan__nombre">Nuvic Plus</span><span class="estado">Más popular</span></div><p class="plan__precio"><strong>${precio}</strong><span>al Mes</span></p><p class="plan__nota">Menos de $0.35 al día · cancela cuando quieras</p></section>
      <a class="btn btn--primario btn--grande" href="${dest}">${plus ? 'Ver mi membresía' : 'Hazte miembro'}</a><h2 class="seccion__titulo" style="margin-top:22px">Lo que incluye</h2><div class="lista">
      <div class="beneficio"><div><strong>Ofertas exclusivas</strong><small>Descuentos en farmacias, librerías y gasolineras.</small></div></div><div class="beneficio"><div><strong>Puntos x2</strong><small>Suma el doble en cada compra con QR.</small></div></div>
      <div class="beneficio"><div><strong>Alertas de precio</strong><small>Te avisamos cuando baja un producto de tu lista.</small></div></div><div class="beneficio"><div><strong>Recompensas solo para miembros</strong><small>Canjes que el resto no ve.</small></div></div></div>
      <h2 class="seccion__titulo" style="margin-top:22px">Gratis o Plus</h2><table class="tabla-planes"><tr><th></th><th>Gratis</th><th>Plus</th></tr>
      ${[['Comparar precios', '✓', '✓'], ['Mapa de comercios', '✓', '✓'], ['Puntos por compra', 'x1', 'x2'], ['Ofertas exclusivas', '–', '✓'], ['Alertas de precio', '–', '✓'], ['Recompensas Plus', '–', '✓']].map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('')}</table>
      <a class="btn btn--primario btn--grande" href="${dest}">${plus ? 'Ver mi membresía' : `Hazte miembro por ${precio}/mes`}</a><p class="nota">Pago seguro · Cancela cuando quieras</p></main>`;
  };
  P['confirmar-membresia'] = () => {
    const u = exigir_sesion(); if (plus_activo(u)) ir('mi-membresia.html'); const precio = dinero(CONFIG.precio_plus); cabecera_y('Confirmar membresía');
    return `<main class="pagina"><p class="migas"><a href="membresia.html">Membresía</a> › Confirmar</p><div><h1 class="pagina__titulo pagina__titulo--detalle">Confirmar membresía</h1></div>
      <section class="tarjeta resumen-pago"><div class="resumen-pago__producto"><span class="resumen-pago__icono">★</span><div><p class="perfil__nombre" style="font-size:16px">Nuvic Plus</p><p class="perfil__meta">1 Mes · renovación Mensual</p></div><span class="resumen-pago__precio">${precio}</span></div>
      <div class="fila" style="font-size:13px"><span>Total hoy</span><strong style="font-size:15px">${precio}</strong></div></section><h2 class="subtitulo" style="margin-top:14px">Método de pago</h2><div class="metodo-pago">💳 Tarjeta de crédito o débito</div>
      <form class="formulario" data-accion="pagar" novalidate data-pago>${campo('Número de tarjeta', 'tarjeta', 'text', '0000 0000 0000 0000', '', ' inputmode="numeric" autocomplete="off" maxlength="19"')}
      <div class="campos-par">${campo('Vencimiento', 'vence', 'text', 'MM / AA', '', ' inputmode="numeric" autocomplete="off" maxlength="7"')}${campo('CVV', 'cvv', 'text', '123', '', ' inputmode="numeric" autocomplete="off" maxlength="4"')}</div>
      <label class="casilla" style="margin:16px 0"><input type="checkbox" name="terminos" value="1"> Acepto los términos de la membresía</label>${alerta()}<button class="btn btn--solido btn--grande" type="submit">Pagar ${precio}</button></form>
      <p class="nota">Se renueva cada mes. Puedes cancelar desde tu perfil.</p><p class="nota demo-nota">Simulación: no se hace ningún cobro y la tarjeta no se guarda. Prueba con 4242 4242 4242 4242. No escribas datos de una tarjeta real.</p></main>`;
  };
  P['membresia-activada'] = () => {
    const u = exigir_sesion(); if (!plus_activo(u)) ir('membresia.html'); cabecera_y('¡Ya eres miembro!');
    return `<main class="pagina">${vacio(null, '¡Ya eres miembro!', 'Nuvic Plus activo hasta el ' + fecha(u.plus_hasta), false, true, '', 'celebra')}<section class="tarjeta tarjeta--xl lista" style="gap:22px;padding:20px 16px">
      <div class="beneficio beneficio--plano beneficio--compacto"><div><strong>Ofertas exclusivas desbloqueadas</strong></div></div><div class="beneficio beneficio--plano beneficio--compacto"><div><strong>Puntos x2 en cada compra</strong></div></div>
      <div class="beneficio beneficio--plano beneficio--compacto"><div><strong>Alertas de precio activadas</strong></div></div></section><div class="botones"><a class="btn btn--primario" href="ofertas.html">Ver ofertas</a><a class="btn btn--secundario" href="index.html">Ir al inicio</a></div></main>`;
  };
  P['mi-membresia'] = () => {
    const u = exigir_sesion(); if (!plus_activo(u)) ir('membresia.html'); cabecera_y('Mi membresía');
    const usadas = E.ofertasAct.filter(a => a.uid === u.id).length, pago = E.pagos.filter(p => p.uid === u.id).pop();
    return `<main class="pagina"><div><h1 class="pagina__titulo">Mi membresía</h1></div><section class="tarjeta-oscura tarjeta-oscura--plan" style="display:grid;gap:6px"><span class="estado estado--plus">Nuvic Plus</span>
      <div class="total__fila"><span class="total__monto" style="font-size:26px">Activa</span><strong style="color:#fff;font-size:18px">${dinero(CONFIG.precio_plus)}</strong></div>
      <div class="total__fila"><span class="total__nota" style="font-size:12.5px">Hasta el ${fecha(u.plus_hasta)}</span><span class="total__nota">${pago ? 'Tarjeta •••• ' + e(pago.ultimos4) : 'Renovación mensual'}</span></div></section>
      <div class="cifras"><div class="cifra cifra--sm" style="min-height:92px"><strong>${u.puntos}</strong><span>puntos</span></div><div class="cifra cifra--sm" style="min-height:92px"><strong>${usadas}</strong><span>ofertas usadas</span></div></div>
      <h2 class="subtitulo" style="margin-top:14px">Tus beneficios</h2><div class="lista">${['Ofertas exclusivas', 'Puntos x2 en cada compra', 'Alertas de precio', 'Recompensas solo para miembros'].map(b => `<div class="beneficio beneficio--compacto"><div><strong>${b}</strong></div></div>`).join('')}</div>
      <div class="botones"><a class="btn btn--primario" href="ofertas.html">Ver ofertas</a><form data-accion="cancelar-plus" data-confirmar="Toca de nuevo para confirmar"><button class="btn btn--secundario" type="submit" style="font-size:14px">Cancelar membresía</button></form></div></main>`;
  };
  const oferta = s => { const o = D.ofertas.find(x => x.slug === s); if (!o) return null; const c = comercioPorId[o.comercio_id]; return { ...o, comercio: c.nombre, categoria: c.categoria }; };
  P.ofertas = () => {
    const u = usuario(), plus = plus_activo(u);
    const cats = { farmacias: 'Farmacias', librerias: 'Librerías', copias: 'Copias', floristerias: 'Florerías', barberias: 'Barberías', salones: 'Salones', lavanderias: 'Lavanderías' };
    const cat = cats[get('cat')] ? get('cat') : null, of = D.ofertas.map(o => oferta(o.slug)).filter(o => !cat || o.categoria === cat); cabecera_y('Ofertas');
    return `<main class="pagina"><div><h1 class="pagina__titulo">Ofertas</h1><p class="pagina__subtitulo">Ahorra más en los comercios del campus</p></div>
      ${plus ? `<a class="tarjeta-oscura banner-plus banner-plus--miembro" href="mi-membresia.html" style="padding-left:20px"><p class="banner-plus__titulo">Eres miembro Nuvic Plus</p><p class="banner-plus__texto" style="font-size:11.5px">Activo hasta el ${fecha(u.plus_hasta)}</p></a>`
        : `<section class="tarjeta-oscura banner-plus"><p class="banner-plus__titulo">Desbloquea todas las ofertas</p><p class="banner-plus__texto">Con Nuvic Plus por ${dinero(CONFIG.precio_plus)} al mes</p><a class="btn btn--primario" href="membresia.html">Hazte miembro</a></section>`}
      <div class="chips chips--fila"><a class="chip${cat ? '' : ' is-activo'}" href="ofertas.html">Todas</a>${Object.entries(cats).map(([k, t]) => `<a class="chip${cat === k ? ' is-activo' : ''}" href="${url('ofertas', { cat: k })}">${t}</a>`).join('')}</div>
      <div class="lista">${of.map(o => { const bloq = o.solo_miembros && !plus;
        return `<a class="oferta${bloq ? ' is-bloqueada' : ''}" href="${bloq ? 'membresia.html' : url('oferta', { o: o.slug })}">${o.imagen && !o.color ? `<img class="oferta__foto" src="${e(img(o.imagen))}" alt="">` : `<div class="oferta__foto icono-tile" style="background:${e(o.color)}">${o.imagen ? `<img src="${e(img(o.imagen))}" alt="" width="30">` : ''}</div>`}
          <div class="oferta__info"><p class="oferta__titulo">${e(o.titulo)}</p><p class="oferta__meta">${e(o.comercio)} · ${e(o.vigencia)}</p>${o.nueva ? estado('Nueva', 'nueva') : o.solo_miembros ? estado('Solo miembros', 'miembros') : ''}</div>${bloq ? '' : flecha()}</a>`; }).join('')}
      ${of.length ? '' : '<p class="nota">No hay ofertas en esta categoría por ahora.</p>'}</div></main>`;
  };
  P.oferta = () => {
    const o = oferta(get('o')); if (!o) return no_encontrado(); const plus = plus_activo(usuario()); cabecera_y(o.titulo);
    return `<main class="pagina"><p class="migas"><a href="ofertas.html">Ofertas</a> › ${e(o.titulo)}</p><div class="foto-producto" style="border-radius:22px"><div class="foto-producto__imagen" style="height:170px;border-radius:18px${o.color ? ';background:' + e(o.color) : ''}">${o.imagen ? `<img src="${e(img(o.imagen))}" alt=""${o.color ? ' style="width:64px;height:64px"' : ''}>` : ''}</div>
      ${o.solo_miembros ? '<span class="estado estado--miembros-oscuro estado--grande">Solo miembros</span>' : o.nueva ? '<span class="estado estado--nueva estado--grande">Nueva</span>' : ''}</div>
      <div><h1 class="pagina__titulo pagina__titulo--detalle">${e(o.titulo_largo)}</h1><p class="pagina__subtitulo pagina__subtitulo--sm">${e(o.comercio)}</p></div>
      <section class="tarjeta filas"><div class="fila"><span>Válida hasta</span><strong>${e(o.valida_hasta)}</strong></div><div class="fila"><span>Uso</span><strong>${e(o.uso)}</strong></div><div class="fila"><span>Aplica en</span><strong>${e(o.aplica)}</strong></div></section>
      <h2 class="subtitulo" style="margin-top:10px">Cómo usarla</h2><ol class="pasos-mini"><li>Toca "Activar oferta" para generar tu código.</li><li>Muéstralo en el comercio antes de pagar.</li><li>El descuento se aplica en tu compra.</li></ol>
      <div class="botones">${o.solo_miembros && !plus ? '<a class="btn btn--primario btn--grande" href="membresia.html">Hazte miembro para activarla</a>' : '<form data-accion="activar-oferta"><button class="btn btn--primario btn--grande" type="submit">Activar oferta</button></form>'}
      <a class="btn btn--secundario btn--medio" href="${url('mapa', { cat: o.categoria })}">Ver el comercio en el mapa</a></div></main>`;
  };
  P['oferta-codigo'] = () => {
    const u = exigir_sesion(), a = E.ofertasAct.find(x => x.id === +get('a') && x.uid === u.id); if (!a) ir('ofertas.html');
    const o = oferta(a.oferta), vigente = fechaDe(a.expira) > new Date(), n = 25; cabecera_y('Oferta lista para usar');
    let s = 0; for (const ch of a.codigo) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    const azar = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) >>> 16 & 1;
    const fin = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    let celdas = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fin(x, y) && azar()) celdas += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([x, y]) => { celdas += `<rect x="${x + .5}" y="${y + .5}" width="6" height="6" fill="none" stroke="#002941"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`; });
    return `<main class="pagina"><p class="migas"><a href="ofertas.html">Ofertas</a> › Código de la oferta</p><div><h1 class="pagina__titulo pagina__titulo--detalle">${vigente ? 'Oferta lista para usar' : 'Este código venció'}</h1><p class="pagina__subtitulo pagina__subtitulo--sm">${e(o.titulo_largo)} · ${e(o.comercio)}</p></div>
      <div class="codigo-qr"${vigente ? '' : ' style="opacity:.35"'}><svg viewBox="0 0 ${n} ${n}" width="230" height="230" fill="#002941" shape-rendering="crispEdges" aria-label="Código ${e(a.codigo)}">${celdas}</svg></div>
      <div class="centrado"><p class="codigo-qr__texto" style="font-size:22px;letter-spacing:2px">${e(a.codigo)}</p><p class="codigo-qr__texto">Muestra este código en el comercio</p><p class="nota">Válido hasta las ${hora12(fechaDe(a.expira))} · un solo uso</p></div>
      <div class="botones"><a class="btn btn--primario" href="ofertas.html">Listo</a><a class="btn btn--secundario" href="ofertas.html">Ver más ofertas</a></div></main>`;
  };

  /* ------------------------------------------------------------- acciones */
  const A = {
    salir() { E.sesion = null; E.comparados = {}; guardar(); aviso('Cerraste sesión'); ir('index.html'); },
    lista() {
      const u = exigir_sesion(), s = get('p') || 'paracetamol-500-mg', l = lista_de(u), i = l.indexOf(s);
      if (i >= 0) { l.splice(i, 1); aviso('Quitado de tu lista'); } else { l.push(s); aviso('Guardado en tu lista'); }
      guardar(); ir(location.href);
    },
    alerta() { const u = exigir_sesion(), l = (E.alertas[u.id] = E.alertas[u.id] || []), s = get('p'); if (!l.includes(s)) l.push(s); guardar(); aviso('Te avisaremos cuando vuelva a estar disponible.'); ir(location.href); },
    quitar(f, ev) { const u = exigir_sesion(), s = ev.submitter?.value, l = lista_de(u); if (l.includes(s)) l.splice(l.indexOf(s), 1); guardar(); aviso('Quitado de tu lista'); ir('mi-lista.html'); },
    login(f) {
      const correo = f.correo.value.trim().toLowerCase(), clave = f.clave.value;
      if (E.bloqueo > Date.now()) error(f, `Demasiados intentos. Espera ${Math.ceil((E.bloqueo - Date.now()) / 1000)} segundos.`, ['correo', 'clave']);
      if (!correo || !clave) error(f, 'Escribe tu correo y tu contraseña.', ['correo', 'clave']);
      if (!correo_valido(correo)) error(f, 'Usa tu correo institucional que termina en ' + CONFIG.dominio, ['correo', 'clave']);
      const u = E.usuarios.find(x => x.correo === correo);
      if (u && u.clave === huella(clave)) { E.sesion = u.id; E.intentos = 0; E.comparados = {}; guardar(); ir(destino_seguro(get('next'))); }
      if (++E.intentos >= 5) { E.bloqueo = Date.now() + 60e3; E.intentos = 0; }
      guardar(); f.clave.value = ''; error(f, 'Correo o contraseña incorrectos.', ['correo', 'clave']);
    },
    registro(f) {
      const nombre = f.nombre.value.trim().replace(/\s+/g, ' '), carne = f.carne.value.trim(), correo = f.correo.value.trim().toLowerCase(), clave = f.clave.value;
      if (nombre.length < 3) error(f, 'Escribe tu nombre completo.', ['nombre']);
      if (!/^\d{8}$/.test(carne)) error(f, 'El carné UCA tiene 8 números.', ['carne']);
      if (!correo_valido(correo)) error(f, 'Usa tu correo institucional que termina en ' + CONFIG.dominio, ['correo']);
      if (!clave_valida(clave)) error(f, 'La contraseña no cumple los requisitos.', ['clave']);
      if (!f.terminos.checked) error(f, 'Acepta los términos y la política de privacidad para continuar.');
      if (E.usuarios.some(u => u.correo === correo)) error(f, 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.', ['correo']);
      if (E.usuarios.some(u => u.carne === carne)) error(f, 'Ese carné ya está registrado.', ['carne']);
      const u = { id: id(), nombre, carne, correo, clave: huella(clave), carrera: null, puntos: 0, comparaciones: 0, plus_hasta: null, creado: ahora() };
      E.usuarios.push(u); sumar_puntos(u, 50, 'Bono de bienvenida', 'Regalo', 'Por crear tu cuenta');
      E.sesion = u.id; E.comparados = {}; guardar(); aviso('¡Cuenta creada! Te regalamos 50 puntos.'); ir('perfil.html');
    },
    olvide(f) {
      const correo = f.correo.value.trim().toLowerCase(); if (!correo_valido(correo)) error(f, 'Usa tu correo institucional que termina en ' + CONFIG.dominio, ['correo']);
      E.recuperacion = { correo, token: codigoAzar('', 24).toLowerCase(), enviado: Date.now() }; guardar(); ir('correo-enviado.html');
    },
    reenviar() { const r = E.recuperacion; if (r && Date.now() - r.enviado >= 45e3) { r.token = codigoAzar('', 24).toLowerCase(); r.enviado = Date.now(); guardar(); aviso('Te enviamos un enlace nuevo.'); } ir('correo-enviado.html'); },
    'nueva-clave'(f) {
      const r = recuperacionValida(get('token')); if (!r) ir('enlace-vencido.html');
      const c1 = f.clave.value, c2 = f.clave2.value, u = E.usuarios.find(x => x.correo === r.correo);
      if (!clave_valida(c1)) error(f, 'La contraseña no cumple los requisitos.', ['clave']);
      if (c1 !== c2) error(f, 'Las contraseñas no coinciden.', ['clave2']);
      if (!u) error(f, 'No hay una cuenta con ese correo. Crea una cuenta nueva.');
      if (u.clave === huella(c1)) error(f, 'Usa una contraseña distinta a la anterior.', ['clave']);
      u.clave = huella(c1); E.recuperacion = null; guardar(); ir('contrasena-actualizada.html');
    },
    simular() {
      const u = exigir_sesion(), pts = CONFIG.puntos_compra * (plus_activo(u) ? 2 : 1);
      const op = D.precios.filter(r => r.disponible && r.precio !== null && D.productos.find(p => p.id === r.p).comparable), r = op[Math.floor(Math.random() * op.length)];
      const mid = sumar_puntos(u, pts, comercioPorId[r.c].nombre, 'Compra', D.productos.find(p => p.id === r.p).nombre + ' · ' + dinero(r.precio)); guardar(); ir(url('puntos-validados', { m: mid }));
    },
    codigo(f) {
      const u = exigir_sesion(), cod = f.codigo.value.trim().toUpperCase(), cc = D.codigos.find(c => c.codigo === cod);
      if (!cc) error(f, 'Ese código no existe. Revísalo en tu ticket.', ['codigo']);
      if (E.codigosUsados[cod]) error(f, 'Ese código ya se usó.', ['codigo']);
      E.codigosUsados[cod] = u.id;
      const mid = sumar_puntos(u, CONFIG.puntos_compra * (plus_activo(u) ? 2 : 1), comercioPorId[cc.comercio_id].nombre, 'Compra', cc.compra + ' · ' + dinero(cc.monto)); guardar(); ir(url('puntos-validados', { m: mid }));
    },
    canjear() {
      const u = exigir_sesion(), r = recompensa(get('r'));
      if (!r || u.puntos < r.costo) { aviso('Todavía no tienes puntos suficientes.'); ir(url('recompensa', { r: get('r') })); }
      u.puntos -= r.costo; const c = { id: id(), uid: u.id, recompensa: r.slug, puntos: r.costo, codigo: codigoAzar('RC-'), creado: ahora() };
      E.canjes.push(c); E.movimientos.push({ id: id(), uid: u.id, titulo: r.nombre, tipo: 'Canje', detalle: r.comercio, puntos: -r.costo, creado: ahora() });
      guardar(); ir(url('recompensa-canjeada', { c: c.id }));
    },
    pagar(f) {
      const u = exigir_sesion(), num = f.tarjeta.value.replace(/\D/g, ''), v = f.vence.value.replace(/\D/g, ''), cvv = f.cvv.value.replace(/\D/g, '');
      const luhn = n => [...n].reverse().reduce((s, d, i) => { let x = +d; if (i % 2) { x *= 2; if (x > 9) x -= 9; } return s + x; }, 0) % 10 === 0;
      const mm = +v.slice(0, 2), aa = +v.slice(2, 4), finMes = v.length === 4 && mm >= 1 && mm <= 12 ? new Date(2000 + aa, mm, 0, 23, 59, 59) : new Date(0);
      if (num.length !== 16 || !luhn(num)) error(f, 'Revisa el número de la tarjeta.', ['tarjeta']);
      if (finMes < new Date()) error(f, 'La fecha de vencimiento no es válida.', ['vence']);
      if (!/^\d{3,4}$/.test(cvv)) error(f, 'El CVV tiene 3 o 4 números.', ['cvv']);
      if (!f.terminos.checked) error(f, 'Acepta los términos de la membresía para continuar.');
      const h = new Date(); h.setMonth(h.getMonth() + 1); u.plus_hasta = h.toISOString().slice(0, 19).replace('T', ' ');
      E.pagos.push({ uid: u.id, concepto: 'Nuvic Plus · 1 mes', monto: CONFIG.precio_plus, ultimos4: num.slice(-4), creado: ahora() }); guardar(); ir('membresia-activada.html');
    },
    'cancelar-plus'() { const u = exigir_sesion(); u.plus_hasta = null; guardar(); aviso('Cancelaste tu membresía.'); ir('membresia.html'); },
    'activar-oferta'() {
      const u = exigir_sesion(), o = oferta(get('o'));
      if (o.solo_miembros && !plus_activo(u)) { aviso('Esta oferta es solo para miembros Nuvic Plus.'); ir('membresia.html'); }
      let a = E.ofertasAct.find(x => x.uid === u.id && x.oferta === o.slug && fechaDe(x.expira) > new Date());
      if (!a) { a = { id: id(), uid: u.id, oferta: o.slug, codigo: codigoAzar('NV-'), expira: masTiempo(3 * 3600e3), creado: ahora() }; E.ofertasAct.push(a); guardar(); }
      ir(url('oferta-codigo', { a: a.id }));
    },
  };

  /* ---------------------------------------------------------------- dibujar */
  window.NUVIC = {
    // sugerencias para la pantalla Buscar (las usa js/app.js)
    sugerencias: q => ({ q, resultados: q ? buscar_productos(q.slice(0, 60), null, 6).map(p => ({ slug: p.slug, nombre: p.nombre, desde: p.desde !== null ? dinero(p.desde) : 'Agotado', imagen: img(p.imagen) })) : [] }),
  };
  let cuerpo;
  try { cuerpo = (P[PAGINA] || no_encontrado)(); }
  catch (err) { if (err.message === 'redirigiendo') return; throw err; }
  let avisoTxt = ''; try { avisoTxt = sessionStorage.getItem('nuvic_aviso') || ''; sessionStorage.removeItem('nuvic_aviso'); } catch { }
  document.body.innerHTML = '<div class="app">' + cabecera(titulo) + cuerpo + pie(!sinPie) + '</div>' + (avisoTxt ? `<div class="toast is-visible" role="status" data-auto>${e(avisoTxt)}</div>` : '');
  document.title = 'Nuvic — ' + titulo;

  document.addEventListener('submit', ev => {
    const f = ev.target.closest('form[data-accion]'); if (!f) return;
    ev.preventDefault();
    if (f.dataset.confirmar && !f.dataset.ok) return; // primer toque: lo maneja js/app.js
    try { A[f.dataset.accion](f, ev); } catch (err) { if (!['redirigiendo', 'validación'].includes(err.message)) throw err; }
  });
  document.addEventListener('click', ev => {
    if (ev.target.closest('[data-reiniciar]')) { localStorage.removeItem(CLAVE); aviso('Reiniciaste la demo'); location.href = 'index.html'; }
  });
})();
