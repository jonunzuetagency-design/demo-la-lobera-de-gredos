/* La Lobera de Gredos — interacciones */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const hero = $('.hero');

  /* ---------- loader ---------- */
  const loader = $('.loader');
  const startHero = () => hero.classList.add('ready');
  if (loader && !reduce) {
    const done = () => {
      loader.classList.add('out');
      setTimeout(startHero, 250);
      setTimeout(() => loader.remove(), 1200);
    };
    const t0 = performance.now();
    const go = () => setTimeout(done, Math.max(0, 1500 - (performance.now() - t0)));
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
    setTimeout(done, 3200); // nunca más de 3s
  } else {
    loader && loader.remove();
    startHero();
  }

  /* ---------- vídeo de portada (YouTube muted autoplay) ---------- */
  // Vídeo propio en la web (sin YouTube): aparece cuando ya se está reproduciendo
  const hv = $('.hero__vid');
  if (hv) {
    const on = () => hv.parentElement.classList.add('on');
    hv.addEventListener('playing', on, { once: true });
    const p = hv.play(); if (p && p.catch) p.catch(() => {});
    if (!hv.paused) on();
  }

  /* ---------- split de líneas para titulares ---------- */
  const splitLines = el => {
    if (el.querySelector('.ln')) return;
    if (innerWidth <= 760) { el.innerHTML = `<span class="ln"><span>${el.innerHTML.trim()}</span></span>`; return; }
    const words = [];
    el.childNodes.forEach(n => {
      const em = n.nodeType === 1 && n.tagName === 'EM';
      (n.textContent || '').split(/\s+/).forEach(w => { if (w) words.push({ t: w, em }); });
    });
    el.innerHTML = words.map(w => `<span class="w-m">${w.em ? `<em>${w.t}</em>` : w.t}</span>`).join(' ');
    const spans = $$('.w-m', el);
    const lines = []; let top = null;
    spans.forEach((s, i) => {
      const y = s.offsetTop;
      if (top === null || Math.abs(y - top) > 4) { lines.push([]); top = y; }
      lines[lines.length - 1].push(words[i]);
    });
    el.innerHTML = lines.map((l, i) => `<span class="ln"><span style="transition-delay:${(i * 0.09).toFixed(2)}s">${
      l.map(w => w.em ? `<em>${w.t}</em>` : w.t).join(' ').replace(/<\/em> <em>/g, ' ')
    }</span></span>`).join('');
  };
  const doSplit = () => $$('[data-lines]').forEach(splitLines);
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]).then(doSplit);
  else doSplit();

  /* ---------- reveals ---------- */
  // (getBoundingClientRect en vez de IntersectionObserver: el clip-path a 0 anula la intersección)
  let pending = $$('[data-reveal],[data-clip],[data-lines]');
  let revTick = false;
  const checkReveal = () => {
    revTick = false;
    const lim = innerHeight * 0.92;
    pending = pending.filter(el => {
      const r = el.getBoundingClientRect();
      if (r.top < lim && r.bottom > -50) {
        if (el.hasAttribute('data-reveal') && el.parentElement) {
          const i = $$(':scope > [data-reveal]', el.parentElement).indexOf(el);
          el.style.transitionDelay = `${Math.min(i, 6) * 0.08}s`;
        }
        el.classList.add('in');
        return false;
      }
      return true;
    });
  };
  const queueReveal = () => { if (!revTick) { revTick = true; requestAnimationFrame(checkReveal); } };
  addEventListener('scroll', queueReveal, { passive: true });
  addEventListener('resize', queueReveal);
  queueReveal();
  setInterval(() => pending.length && queueReveal(), 600);

  /* ---------- contadores ---------- */
  const fmt = n => n.toLocaleString('es-ES').replace(/,/g, '.');
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count;
      cio.unobserve(el);
      if (reduce) return;
      const t0 = performance.now(), dur = 1600;
      const step = t => {
        const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
        const v = Math.round(end * k);
        el.textContent = el.dataset.format ? fmt(v).replace(/^(\d{1,3})(\d{3})$/, '$1.$2') : v;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- nav ---------- */
  const nav = $('[data-nav]');
  let lastY = 0;
  const onScrollNav = y => {
    const heroH = hero.offsetHeight - 240;
    nav.classList.toggle('is-solid', y > heroH);
    if (!nav.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > 300 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', () => onScrollNav(scrollY), { passive: true });

  // menú móvil
  const burger = $('[data-burger]'), menu = $('[data-menu]');
  const toggleMenu = open => {
    menu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- materia: imagen fija que cambia por capítulo ---------- */
  const frameImgs = $$('.materia__frame img');
  const matN = $('[data-mat-n]');
  const roman = ['I', 'II', 'III', 'IV'];
  let matIdx = 0;
  const setMat = i => {
    if (i === matIdx) return;
    frameImgs.forEach(im => im.classList.remove('was-on'));
    frameImgs[matIdx].classList.replace('is-on', 'was-on');
    frameImgs[i].classList.add('is-on');
    matIdx = i;
    if (matN) matN.textContent = roman[i];
  };
  const chapters = $$('.chapter');
  const chio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      chapters.forEach(c => c.classList.toggle('is-on', c === e.target));
      setMat(+e.target.dataset.chapter);
    });
  }, { rootMargin: '-48% 0px -48% 0px' });
  chapters.forEach(c => chio.observe(c));
  chapters[0] && chapters[0].classList.add('is-on');

  /* ---------- experiencias: paneles que se expanden ---------- */
  const xpItems = $$('.xp__item');
  const activate = it => xpItems.forEach(x => {
    const on = x === it; x.classList.toggle('is-active', on); x.setAttribute('aria-expanded', on);
  });
  xpItems.forEach(it => {
    it.addEventListener('click', () => activate(it));
    it.addEventListener('focus', () => activate(it));
    if (!touch) it.addEventListener('mouseenter', () => activate(it));
  });

  /* ---------- galería en bucle, arrastrable ---------- */
  const strip = $('[data-strip]'), track = $('[data-track]');
  if (strip && track) {
    track.innerHTML += track.innerHTML; // duplicar para el bucle
    $$('a', track).slice(track.children.length / 2).forEach(a => { a.setAttribute('tabindex', '-1'); a.setAttribute('aria-hidden', 'true'); });
    let x = 0, half = 0, speed = reduce ? 0 : 0.045, cur = speed, hovering = false, dragging = false, visible = false;
    let startX = 0, startPos = 0, moved = 0, vel = 0, lastPX = 0, lastT = 0;
    const measure = () => { half = track.scrollWidth / 2; };
    measure(); addEventListener('resize', measure);
    $$('img', track).forEach(im => im.addEventListener('load', measure));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(strip);
    let prev = performance.now();
    const loop = t => {
      const dt = Math.min(48, t - prev); prev = t;
      if (visible) {
        const target = hovering || dragging ? 0 : speed;
        cur += (target - cur) * (1 - Math.exp(-dt / 220));
        if (!dragging) { x -= cur * dt + vel * dt; vel *= Math.exp(-dt / 320); if (Math.abs(vel) < 0.001) vel = 0; }
        if (half) { while (x <= -half) x += half; while (x > 0) x -= half; }
        track.style.transform = `translate3d(${x}px,0,0)`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    strip.addEventListener('pointerdown', e => {
      dragging = true; moved = 0; startX = e.clientX; startPos = x; lastPX = e.clientX; lastT = performance.now(); vel = 0;
      strip.classList.add('dragging');
    });
    addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      if (moved > 6 && strip.setPointerCapture && !strip.hasPointerCapture(e.pointerId)) { try { strip.setPointerCapture(e.pointerId); } catch (_) {} }
      x = startPos + dx;
      const now = performance.now(); const dtt = Math.max(1, now - lastT);
      vel = -(e.clientX - lastPX) / dtt * 0.9; lastPX = e.clientX; lastT = now;
    });
    const end = () => { if (!dragging) return; dragging = false; strip.classList.remove('dragging'); };
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    strip.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    if (!touch) {
      strip.addEventListener('mouseenter', () => { hovering = true; });
      strip.addEventListener('mouseleave', () => { hovering = false; });
    }

    // cursor "Arrastra"
    const dc = $('.drag-cursor');
    if (dc && !touch) {
      let mx = 0, my = 0, cx = 0, cy = 0;
      addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
      strip.addEventListener('mouseenter', () => dc.classList.add('on'));
      strip.addEventListener('mouseleave', () => dc.classList.remove('on'));
      const follow = () => { cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; dc.style.left = cx + 'px'; dc.style.top = cy + 'px'; requestAnimationFrame(follow); };
      follow();
    }
  }

  /* ---------- opiniones ---------- */
  const qWrap = $('[data-quotes]');
  if (qWrap) {
    const qs = $$('.quote', qWrap), dots = $$('.quotes__nav button', qWrap), navq = $('.quotes__nav', qWrap);
    // palabras con máscara
    qs.forEach(q => {
      const bq = $('blockquote', q);
      const words = bq.textContent.trim().split(/\s+/);
      bq.innerHTML = words.map((w, i) => `<span class="w" style="transition-delay:${Math.min(i * 0.022, 0.9).toFixed(3)}s">${w}</span>`).join(' ');
    });
    let qi = 0, timer = null;
    const DUR = 7000;
    navq.style.setProperty('--qd', DUR / 1000 + 's');
    const show = i => {
      qi = (i + qs.length) % qs.length;
      qs.forEach((q, k) => q.classList.toggle('is-on', k === qi));
      dots.forEach((d, k) => { d.classList.remove('is-on'); void d.offsetWidth; d.classList.toggle('is-on', k === qi); });
      clearTimeout(timer); if (!reduce) timer = setTimeout(() => show(qi + 1), DUR);
    };
    dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
    // empezar cuando se vea
    let started = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) { started = true; qs[0].classList.remove('is-on'); requestAnimationFrame(() => show(0)); }
    }, { threshold: 0.3 }).observe(qWrap);
    qWrap.addEventListener('mouseenter', () => { navq.classList.add('paused'); clearTimeout(timer); });
    qWrap.addEventListener('mouseleave', () => { navq.classList.remove('paused'); if (started && !reduce) timer = setTimeout(() => show(qi + 1), 3500); });
    // swipe
    let sx = null;
    qWrap.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    qWrap.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(qi + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* ---------- lugares: imagen flotante ---------- */
  const pf = $('.place-float');
  if (pf && !touch) {
    const pimg = $('img', pf);
    let tx = 0, ty = 0, px = 0, py = 0, on = false;
    $$('.place').forEach(p => {
      p.addEventListener('mouseenter', () => { pimg.src = p.dataset.img; pf.classList.add('on'); on = true; });
      p.addEventListener('mouseleave', () => { pf.classList.remove('on'); on = false; });
    });
    addEventListener('mousemove', e => { tx = e.clientX + 24; ty = e.clientY - 100; }, { passive: true });
    const f = () => { px += (tx - px) * 0.16; py += (ty - py) * 0.16; if (on || pf.classList.contains('on')) pf.style.transform = `translate3d(${px}px,${py}px,0)`; requestAnimationFrame(f); };
    f();
  }

  /* ---------- FAQ: solo una abierta ---------- */
  const dets = $$('.faq details');
  dets.forEach(d => d.addEventListener('toggle', () => { if (d.open) dets.forEach(o => { if (o !== d) o.open = false; }); }));

  /* ---------- Lenis + GSAP (si cargan) ---------- */
  const boot = () => {
    let lenis = null;
    if (window.Lenis && !touch && !reduce) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on('scroll', ({ scroll }) => { onScrollNav(scroll); window.ScrollTrigger && ScrollTrigger.update(); });
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    // anclas
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = $(id); if (!t) return;
      e.preventDefault();
      const off = id === '#inicio' ? 0 : -10;
      if (lenis) lenis.scrollTo(t, { offset: off, duration: 1.4 });
      else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }));

    if (!window.gsap || !window.ScrollTrigger || reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    // portada: el título se hunde y el vídeo se acerca
    gsap.to('.hero__body', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__media', { scale: 1.12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__shade', { opacity: 1.0, backgroundColor: 'rgba(18,21,15,.35)', ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    // Almanzor parallax + título
    gsap.fromTo('.peak__img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.peak', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.peak__t', { yPercent: 40, opacity: 0, ease: 'power3.out', duration: 1.4, scrollTrigger: { trigger: '.peak', start: 'top 60%' } });
    // cierre: la imagen se abre
    gsap.fromTo('.cierre__img', { clipPath: 'inset(8% 6% 8% 6%)', scale: 1.15 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, ease: 'none', scrollTrigger: { trigger: '.cierre', start: 'top bottom', end: 'top top', scrub: true } });
    // figura de la finca con deriva
    gsap.to('.finca__fig--b', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.finca__grid', start: 'top bottom', end: 'bottom top', scrub: true } });
    // palabra gigante del pie
    gsap.from('.foot__word', { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  };
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot, { once: true });
})();
