/* Galería: mosaico filtrable + visor a pantalla completa */
(() => {
  const P = [
    ['cand-h001', 'casas', 'Casa de piedra y entramado de madera', 'b'],
    ['cand-h002', 'casas', 'Casa de piedra entre árboles', ''],
    ['cand-h003', 'casas', 'Camino de losas hacia una de las casas', ''],
    ['cand-h000', 'agua', 'La piscina, con Gredos enfrente', 'b'],
    ['cand-h004', 'casas', 'Terraza a la sombra en la finca', ''],
    ['media-35-casitarobleweb', 'casas', 'Casita de piedra bajo los robles', ''],
    ['cand-h005', 'dentro', 'Comedor con vigas de madera y estufa', 't'],
    ['cand-h006', 'dentro', 'Comedor de la casa central', ''],
    ['cand-h009', 'dentro', 'Habitación con baño propio', ''],
    ['cand-h010', 'dentro', 'Habitación de matrimonio', ''],
    ['cand-h008', 'dentro', 'Dormitorio bajo las vigas', ''],
    ['cand-h011', 'agua', 'El cielo reflejado en la piscina', 'w'],
    ['cand-h012', 'agua', 'Piscina entre pinos y granito', ''],
    ['media-41-charcar', 'agua', 'Charca y cascada en una garganta', 't'],
    ['cand-h016', 'agua', 'Poza de agua cristalina', ''],
    ['cand-h019', 'agua', 'Agua y bosque en el valle', ''],
    ['media-34-cerezo', 'casas', 'Casita de piedra entre flores', ''],
    ['media-03-madro-o-web', 'casas', 'Madroño junto a una de las casas', ''],
    ['media-01-gredos-nevado-web', 'sierra', 'Gredos nevado en otoño', 'w'],
    ['media-29-atardecerloberar', 'sierra', 'Atardecer desde La Lobera', ''],
    ['cand-h007', 'dentro', 'Salón con ventanales a la sierra', ''],
    ['media-40-almanzor', 'sierra', 'El Almanzor, 2.592 m', 'b'],
    ['media-23-caballos2', 'sierra', 'Ruta a caballo entre piornos', ''],
    ['media-24-tirolina', 'sierra', 'Tirolina en el valle', ''],
    ['cand-h013', 'pueblo', 'Puente sobre el río en Arenas', ''],
    ['cand-h014', 'pueblo', 'Castillo de Arenas de San Pedro', 't'],
    ['cand-h018', 'pueblo', 'Arenas de San Pedro desde lo alto', 'w'],
  ];
  const CAT = { casas: 'Casas', dentro: 'Dentro', agua: 'Agua', sierra: 'Sierra', pueblo: 'Arenas' };
  const $ = (s, c = document) => c.querySelector(s);
  const grid = $('[data-grid]');
  grid.innerHTML = P.map(([f, c, t, s], i) => `
    <button type="button" class="g-item ${s}" data-i="${i}" data-c="${c}" aria-label="Ver foto: ${t}">
      <img src="img/${f}-t.webp" alt="${t}" loading="${i < 8 ? 'eager' : 'lazy'}" width="900" height="675">
      <figcaption><span class="mono">${String(i + 1).padStart(2, '0')} · ${CAT[c]}</span>${t}</figcaption>
    </button>`).join('');
  const items = [...grid.children];

  items.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 0.07}s`; });
  const check = () => items.forEach(el => {
    if (el.classList.contains('in') || el.classList.contains('is-out')) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.95 && r.bottom > -50) el.classList.add('in');
  });
  addEventListener('scroll', () => requestAnimationFrame(check), { passive: true });
  addEventListener('resize', check);
  check(); setInterval(check, 700);

  // filtros
  let list = P.map((_, i) => i);
  document.querySelectorAll('[data-filters] button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-filters] button').forEach(x => x.classList.toggle('is-on', x === b));
    const f = b.dataset.f;
    items.forEach(el => {
      const show = f === 'all' || el.dataset.c === f;
      el.classList.toggle('is-out', !show);
      if (show) { el.classList.remove('in'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in'))); }
    });
    list = items.filter(el => !el.classList.contains('is-out')).map(el => +el.dataset.i);
  }));

  // visor
  const lb = $('[data-lb]'), img = $('[data-img]', lb), cap = $('[data-cap]', lb), cnt = $('[data-count]', lb), prog = $('[data-prog]', lb);
  let pos = 0, open = false, lastFocus = null;
  const pad = n => String(n).padStart(2, '0');
  const preload = i => { const k = list[(i + list.length) % list.length]; const im = new Image(); im.src = `img/${P[k][0]}.webp`; };
  const render = (dir = 0) => {
    const k = list[pos], [f, , t] = P[k];
    const next = new Image(); next.src = `img/${f}.webp`;
    const apply = () => {
      img.classList.remove('from-r', 'from-l');
      if (dir) { img.classList.add(dir > 0 ? 'from-r' : 'from-l'); void img.offsetWidth; }
      img.src = next.src; img.alt = t;
      requestAnimationFrame(() => img.classList.remove('from-r', 'from-l'));
    };
    // mientras carga la grande, enseñar la miniatura
    if (!next.complete) { img.src = `img/${f}-t.webp`; img.alt = t; next.decode().then(() => { if (list[pos] === k) img.src = next.src; }).catch(() => {}); if (dir) { img.classList.add(dir > 0 ? 'from-r' : 'from-l'); void img.offsetWidth; requestAnimationFrame(() => img.classList.remove('from-r', 'from-l')); } }
    else apply();
    cap.textContent = t;
    cnt.textContent = `${pad(pos + 1)} / ${pad(list.length)}`;
    prog.style.transform = `scaleX(${(pos + 1) / list.length})`;
    preload(pos + 1); preload(pos - 1);
    history.replaceState(null, '', `#${k}`);
  };
  const go = d => { pos = (pos + d + list.length) % list.length; render(d); };
  const openAt = k => {
    pos = Math.max(0, list.indexOf(k)); if (list.indexOf(k) < 0) { list = P.map((_, i) => i); pos = k; }
    lastFocus = document.activeElement;
    lb.hidden = false; lb.classList.add('opening'); document.body.classList.add('lb-open');
    requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.remove('opening')));
    open = true; render(0); $('[data-close]', lb).focus({ preventScroll: true });
  };
  const close = () => {
    if (!open) return; open = false;
    lb.classList.add('closing');
    setTimeout(() => { lb.hidden = true; lb.classList.remove('closing'); document.body.classList.remove('lb-open'); }, 650);
    history.replaceState(null, '', location.pathname);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  };
  items.forEach(el => el.addEventListener('click', () => openAt(+el.dataset.i)));
  $('[data-prev]', lb).addEventListener('click', () => go(-1));
  $('[data-next]', lb).addEventListener('click', () => go(1));
  $('[data-close]', lb).addEventListener('click', close);
  $('[data-stage]', lb).addEventListener('click', e => { if (e.target === e.currentTarget) close(); });
  addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Escape') close();
  });
  // swipe
  let sx = null, sy = null;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    sx = sy = null;
  });

  // abrir desde la portada (galeria.html#n)
  const h = parseInt(location.hash.slice(1), 10);
  if (!isNaN(h) && h >= 0 && h < P.length) openAt(h);
})();
