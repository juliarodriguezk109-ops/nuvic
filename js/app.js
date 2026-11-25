/* ==========================================================================
   NUVIC · Mejoras en el navegador
   Interfaz: lo dibuja js/sitio.js y esto agrega:
   menú lateral, avisos, sugerencias en vivo, requisitos de contraseña,
   formato de tarjeta y cuenta regresiva para reenviar el correo.
   ========================================================================== */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Avisos */
  function aviso(texto) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = texto; t.classList.add('is-visible');
    clearTimeout(aviso.t); aviso.t = setTimeout(() => t.classList.remove('is-visible'), 3500);
  }
  const auto = $('.toast[data-auto]');
  if (auto) aviso.t = setTimeout(() => auto.classList.remove('is-visible'), 3500);
  $$('[data-aviso]').forEach(b => b.addEventListener('click', () => aviso(b.dataset.aviso)));

  /* Mascota: al tocarla da un salto */
  $$('.mascota').forEach(m => {
    m.addEventListener('click', () => { m.classList.remove('is-salto'); void m.offsetWidth; m.classList.add('is-salto'); });
    m.addEventListener('animationend', e => { if (e.animationName === 'masc-salto') m.classList.remove('is-salto'); });
  });

  /* Menú lateral */
  const boton = $('.btn-menu'), cajon = $('.cajon');
  if (boton && cajon) {
    const alternar = abrir => {
      boton.setAttribute('aria-expanded', String(abrir));
      document.body.style.overflow = abrir ? 'hidden' : '';
      if (abrir) { cajon.hidden = false; requestAnimationFrame(() => cajon.classList.add('is-abierto')); }
      else { cajon.classList.remove('is-abierto'); setTimeout(() => { if (!cajon.classList.contains('is-abierto')) cajon.hidden = true; }, 220); }
    };
    boton.addEventListener('click', e => { e.preventDefault(); alternar(!cajon.classList.contains('is-abierto')); });
    $('.cajon__velo', cajon).addEventListener('click', () => alternar(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && cajon.classList.contains('is-abierto')) alternar(false); });
  }

  /* Formularios: quitar el error al corregir */
  $$('form').forEach(f => f.addEventListener('input', e => {
    e.target.closest('.campo')?.classList.remove('is-error');
    const al = $('[data-alerta]', f); if (al) al.hidden = true;
  }));

  /* Requisitos de contraseña en vivo */
  $$('[data-requisitos]').forEach(lista => {
    const input = lista.closest('form')?.querySelector('input[name="clave"]'); if (!input) return;
    const pintar = () => {
      const c = input.value, r = { largo: c.length >= 8, mayus: /[A-ZÁÉÍÓÚÑ]/.test(c), numero: /\d/.test(c) };
      $$('[data-req]', lista).forEach(li => li.classList.toggle('is-ok', r[li.dataset.req]));
    };
    input.addEventListener('input', pintar); pintar();
  });

  /* Reenviar enlace: cuenta regresiva */
  const reenviar = $('[data-espera]'), cuenta = $('[data-cuenta]');
  if (reenviar && cuenta) {
    let resta = +reenviar.dataset.espera;
    const tic = () => {
      reenviar.disabled = resta > 0; reenviar.style.opacity = resta > 0 ? '.55' : '';
      cuenta.textContent = resta > 0 ? `Puedes reenviarlo en 0:${String(resta).padStart(2, '0')}` : 'Ya puedes reenviar el enlace.';
      if (resta-- > 0) setTimeout(tic, 1000);
    };
    tic();
  }

  /* Pago: formato de tarjeta y vencimiento */
  const pago = $('[data-pago]');
  if (pago) {
    const f = pago.elements;
    f.tarjeta.addEventListener('input', () => { f.tarjeta.value = f.tarjeta.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); });
    f.vence.addEventListener('input', () => { const d = f.vence.value.replace(/\D/g, '').slice(0, 4); f.vence.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; });
    f.cvv.addEventListener('input', () => { f.cvv.value = f.cvv.value.replace(/\D/g, '').slice(0, 4); });
  }

  /* Confirmación en dos toques (cancelar membresía): el primer toque cambia el texto */
  $$('form[data-confirmar]').forEach(f => f.addEventListener('submit', () => {
    if (f.dataset.ok) return;
    setTimeout(() => { f.dataset.ok = '1'; $('button', f).textContent = f.dataset.confirmar; });
  }));

  /* Buscar: sugerencias mientras escribes */
  const input = $('[data-sugerir]'), lista = $('[data-lista]'), titulo = $('[data-titulo-lista]');
  if (input && lista) {
    const original = lista.innerHTML, tituloOriginal = titulo.textContent;
    let t, ultima = '';
    const pintar = async () => {
      const q = input.value.trim();
      if (q === ultima) return; ultima = q;
      if (!q) { lista.innerHTML = original; titulo.textContent = tituloOriginal; return; }
      try {
        const r = window.NUVIC.sugerencias(q);
        if (r.q !== input.value.trim()) return;
        titulo.textContent = r.resultados.length ? 'Sugerencias' : 'Sin coincidencias';
        lista.innerHTML = r.resultados.map(p => `<a class="sugerencia sugerencia--producto" href="comparar.html?p=${encodeURIComponent(p.slug)}"><img src="${esc(p.imagen)}" alt="" width="36" height="36"><span>${esc(p.nombre)}<small>${p.desde === 'Agotado' ? 'Agotado' : 'desde ' + esc(p.desde)}</small></span><span class="flecha">›</span></a>`).join('')
          + `<a class="sugerencia" href="productos.html?q=${encodeURIComponent(q)}"><img src="img/iconos/icono-lupa.svg" alt="" width="18"><span>Buscar “${esc(q)}”</span><span class="flecha">›</span></a>`;
      } catch {
        titulo.textContent = 'Sin conexión';
        lista.innerHTML = '<p class="nota" style="padding:14px">No pudimos cargar las sugerencias. Revisa tu conexión; puedes buscar igual con Enter.</p>';
      }
    };
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(pintar, 180); });
    if (input.value) pintar();
    input.focus(); input.setSelectionRange(input.value.length, input.value.length);
  }
})();
