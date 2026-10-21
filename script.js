(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGsap && !reduced;
  if (!motion) root.classList.add('reduced');

  /* ---------- Small utilities ---------- */
  $('#year').textContent = new Date().getFullYear();
  // Live clocks: <b data-clock="Asia/Kolkata"> etc. (defaults to London)
  const fmts = {};
  const clockFmt = tz => (fmts[tz] ||= new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' }));
  const ukZone = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'short' });
  const tick = () => {
    const now = new Date();
    $$('[data-clock]').forEach(el => (el.textContent = clockFmt(el.dataset.clock || 'Europe/London').format(now)));
    const z = (ukZone.formatToParts(now).find(p => p.type === 'timeZoneName') || {}).value || 'UK';
    $$('[data-tzname]').forEach(el => (el.textContent = z.replace('GMT+1', 'BST')));
  };
  tick(); setInterval(tick, 20000);

  $('#themeToggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Text splitting ---------- */
  const wrapWord = (text) => {
    const o = document.createElement('span'); o.className = 'word';
    const i = document.createElement('span'); i.textContent = text;
    o.appendChild(i); return o;
  };
  const splitInto = (target, text, fn) => {
    text.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) target.appendChild(document.createTextNode(' '));
      else target.appendChild(fn(part));
    });
  };
  $$('.split').forEach(el => {
    const nodes = [...el.childNodes]; el.textContent = '';
    nodes.forEach(n => {
      if (n.nodeType === 3) splitInto(el, n.textContent, wrapWord);
      else { const c = n.cloneNode(false); splitInto(c, n.textContent, wrapWord); el.appendChild(c); }
    });
  });
  $$('.scrub-text').forEach(el => {
    const txt = el.textContent.trim().replace(/\s+/g, ' '); el.textContent = '';
    splitInto(el, txt, w => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; return s; });
  });


  /* ---------- Contact form → email (FormSubmit) ---------- */
  const form = $('#contactForm');
  if (form) {
    const status = $('#cfStatus'), done = $('#cfDone'), send = $('.cform__send', form), sendLabel = $('.cform__label', form);
    const fields = {
      name:    { el: $('#cf-name'),  check: v => v.trim().length >= 2 || 'Please enter your name.' },
      email:   { el: $('#cf-email'), check: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.' },
      phone:   { el: $('#cf-phone'), check: v => !v.trim() || /^\+?[\d\s().-]{7,20}$/.test(v.trim()) || 'Use digits only, e.g. +44 7700 900123.' },
      message: { el: $('#cf-msg'),   check: v => v.trim().length >= 10 || 'A few more words, please (10+ characters).' }
    };
    const validate = (key) => {
      const f = fields[key], res = f.check(f.el.value), wrap = f.el.closest('.field');
      const ok = res === true;
      wrap.classList.toggle('is-bad', !ok);
      f.el.setAttribute('aria-invalid', String(!ok));
      $('.field__err', wrap).textContent = ok ? '' : res;
      return ok;
    };
    Object.keys(fields).forEach(k => {
      fields[k].el.addEventListener('blur', () => fields[k].el.value && validate(k));
      fields[k].el.addEventListener('input', () => {
        if (fields[k].el.closest('.field').classList.contains('is-bad')) validate(k);
        if (!form.querySelector('.field.is-bad')) setStatus('');
      });
    });
    const setStatus = (msg, kind = '') => { status.textContent = msg; status.className = 'cform__status' + (kind ? ' is-' + kind : ''); };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bad = Object.keys(fields).filter(k => !validate(k));
      if (bad.length) { fields[bad[0]].el.focus(); setStatus('Please fix the highlighted fields.', 'error'); return; }
      // bots fill the hidden field — quietly pretend it worked
      if ($('#cf-company').value) { form.classList.add('is-done'); done.hidden = false; return; }

      const data = {
        name: fields.name.el.value.trim(),
        email: fields.email.el.value.trim(),
        phone: fields.phone.el.value.trim() || '—',
        message: fields.message.el.value.trim(),
        _subject: `Portfolio message from ${fields.name.el.value.trim()}`,
        _template: 'table',
        _captcha: 'false'
      };
      send.disabled = true; form.classList.add('is-sending'); sendLabel.textContent = 'Sending…'; setStatus('');
      try {
        const res = await fetch(form.dataset.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && String(json.success) === 'true') {
          form.reset();
          form.classList.add('is-done'); done.hidden = false;
          if (window.gsap && !reduced) gsap.from(done.children, { y: 20, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'expo.out' });
        } else if (/activat/i.test(json.message || '')) {
          setStatus('This form is waiting for one-time activation by the site owner — please email me directly below for now.', 'error');
        } else {
          throw new Error(json.message || 'Request failed');
        }
      } catch (err) {
        setStatus('Couldn\'t send right now. Please email me directly at arunganesh1956@gmail.com.', 'error');
      } finally {
        send.disabled = false; form.classList.remove('is-sending'); sendLabel.textContent = 'Send message';
      }
    });
    $('#cfAgain').addEventListener('click', () => { form.classList.remove('is-done'); done.hidden = true; setStatus(''); fields.name.el.focus(); });
  }
  if (reduced) $$('.route__plane').forEach(p => p.remove());
  $$('.route').forEach(r => new IntersectionObserver(([en], ob) => { if (en.isIntersecting) { r.classList.add('is-in'); ob.disconnect(); } }, { threshold: 0.4 }).observe(r));


  /* ---------- Projects: card count ---------- */
  const projTotal = $('#projTotal');
  if (projTotal) projTotal.textContent = String($$('.pcard').length).padStart(2, '0');

  /* ---------- Repository index: live from GitHub ----------
     New public repos appear automatically. Tweak names/descriptions below. */
  const GH_USER = 'SAIndustries';
  const HIDE = ['SAIndustries.github.io', 'V.I.V.E.G.A.M'];                     // repos not to list
  const FEATURED = ['dq-lab', 'LOB-Market-Making', 'quant-signal-lab', 'SMI', 'Pomodoro-Timer'];
  const OVERRIDES = {
    'dq-lab': { name: 'DQ-Lab' },
    'LOB-Market-Making': { name: 'LOB Market Making' },
    'SMI': { name: 'SMIWatchEnv', desc: 'RL environment for silent myocardial infarction detection from wearable signals.' },
    'Pomodoro-Timer': { name: 'Bloom — Pomodoro Timer', desc: 'Interactive Pomodoro timer with a flower that grows through each focus session.' },
    'Stock-Market-Test': { name: 'Stock Market Prediction (LSTM)', desc: 'LSTM price prediction on yFinance data — my first market project, later rebuilt rigorously as quant-signal-lab.' },
    'Mini-SRP-Project': { name: 'Sentiment Analysis on YouTube Comments', desc: 'Text-mining research project classifying the sentiment of YouTube comments, with written report.' }
  };
  const LANG = { Python: '#3572A5', 'Jupyter Notebook': '#DA5B0B', HTML: '#e34c26', CSS: '#563d7c', JavaScript: '#f1e05a', TypeScript: '#3178c6', 'C++': '#f34b7d', Java: '#b07219', R: '#198CE7', 'C#': '#178600' };
  const reposList = $('#reposList'), reposStatus = $('#reposStatus');
  const esc = t => String(t ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });
  const renderRepos = (repos) => {
    const list = repos.filter(r => !r.fork && !r.archived && !HIDE.includes(r.name))
      .sort((a, b) => (FEATURED.includes(b.name) - FEATURED.includes(a.name)) || (new Date(b.pushed_at) - new Date(a.pushed_at)));
    if (!list.length) return;
    reposList.innerHTML = list.map(r => {
      const o = OVERRIDES[r.name] || {};
      const lang = r.language || '—';
      return `<li class="repo"><a href="${esc(r.html_url)}" target="_blank" rel="noopener">
        <span class="repo__name">${esc(o.name || r.name)}${FEATURED.includes(r.name) ? ' <em class="repo__feat">featured</em>' : ''}${r.stargazers_count > 2 ? ` <em class="repo__stars">★ ${r.stargazers_count}</em>` : ''}</span>
        <span class="repo__desc">${esc(o.desc || r.description || 'No description yet.')}</span>
        <span class="repo__lang"><i style="--c:${LANG[lang] || 'var(--faint)'}"></i>${esc(lang)}</span>
        <span class="repo__when">${monthYear.format(new Date(r.pushed_at))}</span>
        <span class="repo__go">↗</span></a></li>`;
    }).join('');
    reposStatus.textContent = `Live from GitHub · ${list.length} repositories`;
    if (window.gsap && !reduced) gsap.from($$('.repo', reposList), { opacity: 0, y: 16, stagger: 0.05, duration: 0.7, ease: 'expo.out' });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  if (reposList) {
    let cached = null;
    try { const c = JSON.parse(sessionStorage.getItem('gh-repos') || 'null'); if (c && Date.now() - c.t < 30 * 60e3) cached = c.d; } catch (e) {}
    if (cached) renderRepos(cached);
    else fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`, { headers: { Accept: 'application/vnd.github+json' } })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => { try { sessionStorage.setItem('gh-repos', JSON.stringify({ t: Date.now(), d })); } catch (e) {} renderRepos(d); })
      .catch(() => { /* keep the static list already in the HTML */ });
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const t = id.length > 1 ? $(id) : null;
    if (id === '#top' || t) { e.preventDefault(); scrollToEl(id === '#top' ? 0 : t); }
  }));

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const hero = $('.hero');
  const burger = $('#burger');
  const links = $('#navLinks');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const heroH = hero.offsetHeight - 80;
    nav.classList.toggle('on-hero', y < heroH && !nav.classList.contains('menu-open'));
    nav.classList.toggle('scrolled', y >= heroH);
    nav.classList.toggle('hidden', y > lastY && y > heroH && !nav.classList.contains('menu-open'));
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const setMenu = (open) => {
    links.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    if (lenis) open ? lenis.stop() : lenis.start();
    onScroll();
  };
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Custom cursor ---------- */
  if (fine && !reduced) {
    const ring = $('#cursor'), dot = $('#cursorDot'), label = $('#cursorLabel');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    root.classList.add('has-cursor');
    window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
    const loop = () => { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); };
    loop();
    const setState = (target) => {
      if (!target || !target.closest) return;
      const lab = target.closest('[data-cursor]');
      const link = target.closest('a, button');
      ring.classList.toggle('is-label', !!lab);
      ring.classList.toggle('is-link', !lab && !!link);
      label.textContent = lab ? lab.dataset.cursor : '';
    };
    document.addEventListener('pointerover', e => setState(e.target));
    // content moves under a still mouse while scrolling — re-check what's beneath it
    window.addEventListener('scroll', () => setState(document.elementFromPoint(mx, my)), { passive: true });
    document.addEventListener('pointerleave', () => { ring.style.opacity = 0; dot.style.opacity = 0; });
    document.addEventListener('pointerenter', () => { ring.style.opacity = ''; dot.style.opacity = ''; });
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && motion) {
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
      });
    });
  }

  /* ---------- Hero shapes: draggable, springy, colliding ---------- */
  const shapesWrap = $('#shapes');
  const shapes = $$('.shape', shapesWrap).map(el => ({
    el, depth: +el.dataset.depth, ang: +el.dataset.angle, angM: +el.dataset.angleMobile, dist: +el.dataset.dist,
    x: 0, y: 0, vx: 0, vy: 0, r: 0, sc: 1, drag: false, px: 0, py: 0
  }));
  // Where the face sits in assets/hero.jpg, as fractions of the image (centre x, centre y, radius incl. hair).
  const FACE = { x: 0.5125, y: 0.54, r: 0.072 };
  const face = { x: 0, y: 0, r: 0 };
  const heroMedia = $('.hero__media'), heroImg = $('.hero__media img');
  // Locate the face on screen, replicating object-fit: cover + object-position (ignores animated transforms).
  const locateFace = () => {
    const bw = heroImg.offsetWidth, bh = heroImg.offsetHeight;
    const iw = heroImg.naturalWidth || 2400, ih = heroImg.naturalHeight || 1350;
    const k = Math.max(bw / iw, bh / ih), dw = iw * k, dh = ih * k;
    const [px, py] = getComputedStyle(heroImg).objectPosition.split(' ').map(v => parseFloat(v) / 100);
    face.x = heroMedia.offsetLeft + (bw - dw) * px + FACE.x * dw;
    face.y = heroMedia.offsetTop + (bh - dh) * py + FACE.y * dh;
    face.r = FACE.r * dw;
  };
  let W = 0, H = 0, pointerX = 0.5, pointerY = 0.5, shapesVisible = true;
  const measure = () => {
    W = hero.offsetWidth; H = hero.offsetHeight;
    const mobile = W < 760;
    locateFace();
    // keep shapes out of the headline area: right half on desktop, top part on mobile
    const xMin = mobile ? 0 : W * 0.5, yMax = mobile ? H * 0.44 : H - 140;
    shapes.forEach(s => {
      s.r = s.el.offsetWidth / 2;
      const a = (mobile ? s.angM : s.ang) * Math.PI / 180;
      const d = face.r + s.r + s.dist * face.r;
      s.homeX = Math.min(W - s.r - 12, Math.max(xMin + s.r, face.x + Math.cos(a) * d));
      s.homeY = Math.min(yMax - s.r, Math.max(s.r + 84, face.y + Math.sin(a) * d));
      if (!s.x) { s.x = s.homeX; s.y = s.homeY; }
    });
  };
  if (!heroImg.complete) heroImg.addEventListener('load', measure);
  measure(); window.addEventListener('resize', measure);
  const placeShape = s => (s.el.style.transform = `translate(${s.x - s.r}px, ${s.y - s.r}px) scale(${s.sc})`);
  shapes.forEach(placeShape);

  shapes.forEach(s => {
    s.el.dataset.cursor = 'drag';
    s.el.addEventListener('pointerdown', e => {
      s.drag = true; s.el.setPointerCapture(e.pointerId);
      const r = hero.getBoundingClientRect();
      s.ox = e.clientX - r.left - s.x; s.oy = e.clientY - r.top - s.y;
      s.px = s.x; s.py = s.y;
      const hint = $('.shapes__hint'); if (hint) hint.style.opacity = 0;
    });
    s.el.addEventListener('pointermove', e => {
      if (!s.drag) return;
      const r = hero.getBoundingClientRect();
      s.px = s.x; s.py = s.y;
      s.x = e.clientX - r.left - s.ox; s.y = e.clientY - r.top - s.oy;
      s.vx = s.x - s.px; s.vy = s.y - s.py;
      if (!motion) placeShape(s);
    });
    const up = () => { s.drag = false; };
    s.el.addEventListener('pointerup', up); s.el.addEventListener('pointercancel', up);
  });
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    pointerX = (e.clientX - r.left) / r.width; pointerY = (e.clientY - r.top) / r.height;
  });
  new IntersectionObserver(([en]) => (shapesVisible = en.isIntersecting)).observe(hero);

  const physics = () => {
    if (shapesVisible) {
      const t = performance.now() / 1000;
      shapes.forEach((s, i) => {
        if (s.drag) return;
        const tx = s.homeX + (pointerX - 0.5) * -W * s.depth + Math.sin(t * 0.6 + i * 2) * 8;
        const ty = s.homeY + (pointerY - 0.5) * -H * s.depth + Math.cos(t * 0.5 + i) * 10;
        s.vx += (tx - s.x) * 0.006; s.vy += (ty - s.y) * 0.006;
        s.vx *= 0.94; s.vy *= 0.94;
        s.x += s.vx; s.y += s.vy;
        // politely keep clear of the face
        const fx = s.x - face.x, fy = s.y - face.y, fd = Math.hypot(fx, fy) || 1, fmin = face.r + s.r;
        if (fd < fmin) { const p = (fmin - fd); s.x += fx / fd * p * 0.25; s.y += fy / fd * p * 0.25; s.vx += fx / fd * p * 0.04; s.vy += fy / fd * p * 0.04; }
        // bounce off hero edges
        if (s.x < s.r) { s.x = s.r; s.vx *= -0.7; }
        if (s.x > W - s.r) { s.x = W - s.r; s.vx *= -0.7; }
        if (s.y < s.r) { s.y = s.r; s.vy *= -0.7; }
        if (s.y > H - s.r) { s.y = H - s.r; s.vy *= -0.7; }
      });
      // circle collisions
      for (let i = 0; i < shapes.length; i++) for (let j = i + 1; j < shapes.length; j++) {
        const a = shapes[i], b = shapes[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = a.r + b.r;
        if (d < min) {
          const push = (min - d) / 2, nx = dx / d, ny = dy / d;
          if (!a.drag) { a.x -= nx * push; a.y -= ny * push; a.vx -= nx * push * 0.3; a.vy -= ny * push * 0.3; }
          if (!b.drag) { b.x += nx * push; b.y += ny * push; b.vx += nx * push * 0.3; b.vy += ny * push * 0.3; }
        }
      }
      shapes.forEach(placeShape);
    }
    requestAnimationFrame(physics);
  };
  if (motion) physics();

  /* ---------- Orbit of skills ---------- */
  const orbit = $('#orbit'), orbitRing = $('#orbitRing');
  const skills = ['Python', 'SQL', 'Machine Learning', 'C++', 'Statistics', 'R', 'LLMs', 'Java', 'React',
                  'Spring Boot', 'Data Analysis', 'Power Automate', 'Excel', 'Client Pitching'];
  const items = skills.map(s => { const el = document.createElement('span'); el.className = 'orbit__item'; el.textContent = s; orbitRing.appendChild(el); return el; });
  let angle = 0, angVel = 0.0025, oDrag = false, oLastX = 0, orbitVisible = false;
  const renderOrbit = () => {
    const w = orbit.offsetWidth, rx = w * 0.41, ry = rx * 0.62;
    let best = -2, bestEl = null;
    items.forEach((el, i) => {
      const th = angle + (i / items.length) * Math.PI * 2;
      const depth = Math.sin(th);               // -1 back … 1 front
      const k = (depth + 1) / 2;
      const x = Math.cos(th) * rx, y = depth * ry;
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${0.7 + 0.4 * k})`;
      el.style.opacity = 0.3 + 0.7 * k;
      el.style.zIndex = depth > 0 ? 60 + Math.round(k * 20) : 10 + Math.round(k * 20);
      if (depth > best) { best = depth; bestEl = el; }
    });
    items.forEach(el => el.classList.toggle('hot', el === bestEl));
  };
  renderOrbit(); window.addEventListener('resize', renderOrbit);
  orbit.addEventListener('pointerdown', e => { oDrag = true; oLastX = e.clientX; orbit.setPointerCapture(e.pointerId); });
  orbit.addEventListener('pointermove', e => {
    if (!oDrag) return;
    const dx = e.clientX - oLastX; oLastX = e.clientX;
    angVel = dx * 0.006; angle += angVel;
    if (!motion) renderOrbit();
  });
  const oUp = () => (oDrag = false);
  orbit.addEventListener('pointerup', oUp); orbit.addEventListener('pointercancel', oUp);
  new IntersectionObserver(([en]) => (orbitVisible = en.isIntersecting)).observe(orbit);
  const orbitLoop = () => {
    if (orbitVisible && !oDrag) {
      const v = lenis ? lenis.velocity * 0.0004 : 0;
      angVel += (0.0025 - angVel) * 0.03;        // ease back to cruising speed
      angle += angVel + v;
      renderOrbit();
    }
    requestAnimationFrame(orbitLoop);
  };
  if (motion) orbitLoop();

  /* ---------- Marquee (reacts to scroll speed & direction) ---------- */
  const mq = $('#marquee');
  [...mq.children].forEach(c => mq.appendChild(c.cloneNode(true)));
  if (motion) {
    let mx = 0, dir = -1;
    gsap.ticker.add(() => {
      const v = lenis ? lenis.velocity : 0;
      if (v) dir = v > 0 ? -1 : 1;
      mx += dir * (0.6 + Math.min(Math.abs(v) * 0.25, 12));
      const half = mq.scrollWidth / 2;
      if (mx <= -half) mx += half; if (mx > 0) mx -= half;
      mq.style.transform = `translate3d(${mx}px,0,0)`;
    });
  }

  /* ---------- Without GSAP / reduced motion: we're done ---------- */
  const loader = $('#loader');
  if (!motion) {
    loader.remove();
    $$('.pcard').forEach(c => c.classList.add('in'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Intro ---------- */
  let seen = false;
  try { seen = sessionStorage.getItem('intro') === '1'; sessionStorage.setItem('intro', '1'); } catch (e) {}
  const heroLines = $$('.hero__title .line__in');
  const heroIns = $$('[data-hero-in]');
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set(heroIns, { opacity: 0, y: 24 });
  shapes.forEach(s => (s.sc = 0));
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (!seen) {
    const counter = { v: 0 };
    intro.from('.loader__name span', { yPercent: 100, duration: 0.9 })
         .from('.loader__name i', { scale: 0, duration: 0.6 }, '-=0.4')
         .to(counter, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: () => ($('#loadCount').textContent = Math.round(counter.v)) }, 0)
         .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=0.1');
  } else {
    intro.to(loader, { autoAlpha: 0, duration: 0.3 });
  }
  intro.from('.hero__media img', { scale: 1.25, duration: 1.8 }, '<0.1')
       .to(heroLines, { yPercent: 0, duration: 1.2, stagger: 0.1 }, '<0.2')
       .to(heroIns, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, '<0.3')
       .to(shapes, { sc: 1, duration: 1.4, stagger: 0.12, ease: 'elastic.out(1, 0.5)' }, '<')
       .add(() => loader.remove());

  /* ---------- Hero scroll parallax ---------- */
  gsap.to('.hero__media', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { y: -120, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '70% top', scrub: true } });

  /* ---------- Generic reveals ---------- */
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%', once: true,
    onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' })
  });
  $$('.split').forEach(h => {
    gsap.from($$('.word > span', h), {
      yPercent: 115, duration: 1.2, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: h, start: 'top 88%' }
    });
  });

  /* ---------- Count-up stats ---------- */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, dec = +(el.dataset.decimals || 0), o = { v: 0 };
    el.textContent = (0).toFixed(dec);
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = o.v.toFixed(dec)) });
  });

  /* ---------- Manifesto: circle wipe, giant sliding type ---------- */
  const track = $('.manifesto__track');
  gsap.set(['.manifesto__ring', '.contact__ring'], { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  const mtl = gsap.timeline({ scrollTrigger: { trigger: '#manifesto', start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true } });
  mtl.fromTo('.manifesto__sticky', { '--clip': '0%' }, { '--clip': '150%', ease: 'power2.in', duration: 0.18 }, 0)
     .fromTo(track, { x: 0 }, { x: () => -(track.scrollWidth - innerWidth * 0.95), ease: 'none', duration: 0.82 }, 0.06)
     .fromTo('.manifesto__ring', { rotate: 0, scale: 0.5 }, { rotate: 220, scale: 1.25, ease: 'none', duration: 1 }, 0)
     .from('.manifesto__copy', { opacity: 0, y: 40, duration: 0.15 }, 0.7);

  /* ---------- About ---------- */
  gsap.to('.about__photo img', { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom top', scrub: true } });
  $$('.scrub-text').forEach(p => {
    gsap.to($$('.w', p), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 78%', end: 'bottom 50%', scrub: true } });
  });

  /* ---------- Experience timeline line ---------- */
  gsap.to('.timeline__progress', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 70%', scrub: true } });

  /* ---------- Projects: horizontal scroll on desktop ---------- */
  const projTrack = $('#projTrack'), bar = $('#projBar'), now = $('#projNow');
  const cards = $$('.pcard');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 961px)', () => {
    const dist = () => Math.max(0, projTrack.scrollWidth - innerWidth);
    gsap.to(projTrack, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.projects', pin: true, start: 'top top', end: () => '+=' + dist(), scrub: 1, invalidateOnRefresh: true,
        onEnter: () => cards.forEach(c => c.classList.add('in')),
        onUpdate: self => {
          bar.style.transform = `scaleX(${0.25 + 0.75 * self.progress})`;
          now.textContent = String(Math.min(cards.length, 1 + Math.floor(self.progress * cards.length * 0.999))).padStart(2, '0');
        }
      }
    });
    // subtle skew while moving
    const skewTo = gsap.quickTo(cards, 'skewX', { duration: 0.5, ease: 'power3' });
    const st = ScrollTrigger.create({ trigger: '.projects', start: 'top top', end: () => '+=' + dist(),
      onUpdate: self => skewTo(gsap.utils.clamp(-3, 3, self.getVelocity() / -600)) });
    return () => st.kill();
  });
  mm.add('(max-width: 960px)', () => {
    cards.forEach(c => {
      gsap.from(c, { y: 60, opacity: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: c, start: 'top 88%', onEnter: () => c.classList.add('in') } });
    });
  });

  /* ---------- Contact ---------- */
  gsap.fromTo('.contact__ring', { scale: 0.4, rotate: -40 }, { scale: 1.1, rotate: 40, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* ---------- Active nav link ---------- */
  $$('#navLinks a').forEach(a => {
    const sec = $(a.getAttribute('href'));
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: s => s.isActive && ($$('#navLinks a').forEach(x => x.classList.remove('active')), a.classList.add('active')) });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
