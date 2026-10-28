// The living parts of the page: a dot field that parts around the cursor (and ripples out
// from the hero video while it plays), the launch globe, the install console, the FAQ
// board, and click sparks. Plain canvas and DOM, no dependencies. Everything stops when it
// is off screen, and holds still under prefers-reduced-motion.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);

  // Run a draw loop only while its element is on screen.
  function whenVisible(el, draw) {
    let on = false, raf = 0;
    const tick = (t) => { draw(t); if (on) raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(tick);
    }, { rootMargin: '120px' }).observe(el);
  }

  // ---------- dot field ----------
  // tone: 'ink' (dark dots on the orange hero) or 'cream' (light dots on dark sections).
  function field(canvas, { tone, gap = 26, reach = 150, ripple }) {
    const host = canvas.parentElement, ctx = canvas.getContext('2d');
    let W = 0, H = 0, mouse = { x: -1e4, y: -1e4 }, eased = { x: -1e4, y: -1e4 };
    const size = () => { const r = dpr(); W = host.clientWidth; H = host.clientHeight; canvas.width = W * r; canvas.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0); };
    size(); new ResizeObserver(size).observe(host);
    host.addEventListener('pointermove', (e) => { const r = host.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    host.addEventListener('pointerleave', () => { mouse = { x: -1e4, y: -1e4 }; });
    const base = tone === 'ink' ? [33, 2, 0] : [255, 237, 233];
    const hot = tone === 'ink' ? [33, 2, 0] : [255, 97, 52];
    const rest = tone === 'ink' ? 0.16 : 0.08;
    whenVisible(host, (t) => {
      // Ease the cursor so the field glides rather than snaps.
      eased.x += (mouse.x - eased.x) * 0.18; eased.y += (mouse.y - eased.y) * 0.18;
      if (mouse.x < -9e3) eased = { ...mouse };
      ctx.clearRect(0, 0, W, H);
      const rp = ripple ? ripple(t, host) : null;
      for (let y = gap / 2; y < H; y += gap) {
        for (let x = gap / 2; x < W; x += gap) {
          const dx = x - eased.x, dy = y - eased.y, d = Math.hypot(dx, dy);
          let f = reduce ? 0 : Math.max(0, 1 - d / reach);
          f = f * f * (3 - 2 * f);
          let glow = f;
          let px = x + (dx / (d || 1)) * f * 20, py = y + (dy / (d || 1)) * f * 20;
          if (rp) {
            // Rings travel outward from the video's edge.
            const ex = Math.max(rp.l - x, 0, x - rp.r), ey = Math.max(rp.t - y, 0, y - rp.b);
            const de = Math.hypot(ex, ey);
            if (de > 0) for (const ring of rp.rings) {
              const k = Math.max(0, 1 - Math.abs(de - ring.r) / 34) * ring.a;
              if (k > 0) { glow = Math.max(glow, k); const ux = ex ? Math.sign(x - (rp.l + rp.r) / 2) : 0, uy = ey ? Math.sign(y - (rp.t + rp.b) / 2) : 0; px += ux * k * 5; py += uy * k * 5; }
            }
          }
          const c = glow > 0.02 ? hot : base;
          const a = rest + glow * (tone === 'ink' ? 0.6 : 0.85);
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
          ctx.beginPath(); ctx.arc(px, py, 1.15 + glow * 2.1, 0, 6.2832); ctx.fill();
        }
      }
    });
  }

  // The hero's field ripples out from the video, one ring per beat, only while it plays.
  const hero = document.querySelector('.hero');
  const heroField = hero && hero.querySelector('canvas.field');
  const vid = document.getElementById('hero-vid');
  if (heroField) {
    const frame = document.querySelector('.hero-video');
    field(heroField, {
      tone: 'ink',
      ripple: (t, host) => {
        if (!frame || !vid || vid.paused || reduce) return null;
        const h = host.getBoundingClientRect(), v = frame.getBoundingClientRect();
        const beat = 60 / 114.84; // the hero's music, vol-11
        const phase = (vid.currentTime % (beat * 2)) / (beat * 2);
        const rings = [0, 0.5].map((o) => { const p = (phase + o) % 1; return { r: p * 260, a: (1 - p) * 0.7 }; });
        return { l: v.left - h.left, r: v.right - h.left, t: v.top - h.top, b: v.bottom - h.top, rings };
      },
    });
  }
  document.querySelectorAll('section canvas.field').forEach((c) => field(c, { tone: 'cream' }));

  // ---------- globe ----------
  const globeEl = document.querySelector('[data-globe]');
  if (globeEl) {
    const canvas = globeEl.querySelector('canvas'), ctx = canvas.getContext('2d');
    const names = ['X', 'TikTok', 'Reels', 'Shorts', 'LinkedIn', 'YouTube', 'Discord', 'Bluesky', 'Threads', 'Product Hunt', 'Reddit', 'README', 'Pinterest', 'Mastodon', 'Slack', 'WhatsApp'];
    const labels = names.map((n, i) => {
      const el = document.createElement('span');
      el.className = 'orbit'; el.textContent = n;
      const a = (i / names.length) * Math.PI * 2 - Math.PI / 2;
      const rad = globeEl.clientWidth < 520 ? 40 : 46;
      el.style.left = 50 + Math.cos(a) * rad + '%'; el.style.top = 50 + Math.sin(a) * rad + '%';
      globeEl.appendChild(el); return el;
    });
    const N = 2000, pts = [];
    for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = 2.39996 * i; pts.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
    let W = 0, H = 0, rot = 0.6, drag = null, spin = 0.0019;
    const size = () => { const r = dpr(); W = globeEl.clientWidth; H = globeEl.clientHeight; canvas.width = W * r; canvas.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0); };
    size(); new ResizeObserver(size).observe(globeEl);
    canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, r: rot }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => { if (drag) rot = drag.r + (e.clientX - drag.x) * 0.006; });
    canvas.addEventListener('pointerup', () => { drag = null; });
    const tilt = -0.35, ct = Math.cos(tilt), st = Math.sin(tilt);
    const proj = (p, R, cx, cy) => {
      const c = Math.cos(rot), s = Math.sin(rot);
      const x = p[0] * c - p[2] * s, z0 = p[0] * s + p[2] * c;
      const y = p[1] * ct - z0 * st, z = p[1] * st + z0 * ct;
      return [cx + x * R, cy + y * R, z];
    };
    const arcs = []; let next = 0, li = 0, seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const home = [0.25, -0.3, 0.92];
    whenVisible(globeEl, (t) => {
      const R = Math.min(W, H) * 0.36, cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);
      const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.35);
      halo.addColorStop(0, 'rgba(244,67,12,0.16)'); halo.addColorStop(1, 'rgba(244,67,12,0)');
      ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
      for (const p of pts) {
        const [x, y, z] = proj(p, R, cx, cy), front = z > 0;
        ctx.fillStyle = front ? `rgba(255,${(120 + 80 * z) | 0},${(90 + 60 * z) | 0},${0.25 + 0.75 * z})` : 'rgba(255,140,110,0.07)';
        ctx.beginPath(); ctx.arc(x, y, front ? 0.9 + 0.9 * z : 0.7, 0, 6.2832); ctx.fill();
      }
      if (!reduce && t > next) {
        next = t + 650;
        const th = rnd() * 6.2832, y = (rnd() - 0.5) * 1.4, r = Math.sqrt(1 - y * y);
        arcs.push({ to: [Math.cos(th) * r, y, Math.sin(th) * r], t: 0, label: li++ % names.length });
      }
      for (const a of arcs) {
        a.t += 0.014;
        const pa = proj(home, R, cx, cy), pb = proj(a.to, R, cx, cy);
        const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2, dx = mx - cx, dy = my - cy, dl = Math.hypot(dx, dy) || 1;
        const qx = mx + (dx / dl) * R * 0.55, qy = my + (dy / dl) * R * 0.55;
        const head = Math.min(1, a.t * 1.15), tail = Math.max(0, a.t - 0.55), alpha = a.t > 1 ? Math.max(0, 1.8 - a.t) : 0.95;
        ctx.strokeStyle = `rgba(255,97,52,${alpha})`; ctx.lineWidth = 1.8; ctx.beginPath();
        for (let i = 0; i <= 28; i++) { const u = tail + (head - tail) * (i / 28), x = (1 - u) ** 2 * pa[0] + 2 * (1 - u) * u * qx + u * u * pb[0], y = (1 - u) ** 2 * pa[1] + 2 * (1 - u) * u * qy + u * u * pb[1]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        if (a.t >= 1) {
          if (!a.landed) { a.landed = true; const el = labels[a.label]; el.classList.add('is-hit'); setTimeout(() => el.classList.remove('is-hit'), 900); }
          ctx.fillStyle = `rgba(255,97,52,${alpha})`; ctx.beginPath(); ctx.arc(pb[0], pb[1], 3.5, 0, 6.2832); ctx.fill();
        }
      }
      for (let i = arcs.length - 1; i >= 0; i--) if (arcs[i].t > 1.8) arcs.splice(i, 1);
      if (!drag && !reduce) rot += spin;
    });
  }

  // ---------- install console ----------
  const con = document.querySelector('[data-console]');
  if (con) {
    const routes = [
      { cmd: 'npx @irvinosazee/shipreel skill install', out: ['<span class="ok">✓</span> installed claude skill at ~/.claude/skills/shipreel', 'Restart your agent so it picks the skill up.'], note: 'Puts the skill in <code>~/.claude/skills</code>. Restart Claude Code and say <code>let\'s /shipreel</code>.' },
      { cmd: 'npx @irvinosazee/shipreel make', out: ['reading package.json, README, git history…', '<span class="ok">✓</span> render verified'], note: 'No agent needed. The standalone CLI fills a clean template from your package, README, git history and a capture of your site.' },
      { cmd: '/plugin marketplace add irvinosazee/shipreel', out: ['then:', '<span class="ok">/plugin install shipreel@shipreel</span>'], note: 'Inside Claude Code. Codex and opencode routes are in <a href="https://github.com/irvinosazee/shipreel#install" target="_blank" rel="noopener">the README</a>.' },
      { cmd: 'npx @irvinosazee/shipreel@latest skill install', out: ['<span class="ok">✓</span> updated to the latest release', 'every release ships with a video of what changed'], note: 'Run it again with <code>@latest</code>. Watch → Releases on GitHub for one notification per release.' },
    ];
    const tabs = [...con.querySelectorAll('[role="tab"]')], cmdEl = con.querySelector('.console-cmd'), out = con.querySelector('.console-out'), note = con.querySelector('.console-note'), copy = con.querySelector('.copy');
    let timer = 0, outs = [];
    const show = (i, animate) => {
      tabs.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      const r = routes[i];
      clearInterval(timer); outs.forEach(clearTimeout); outs = [];
      copy.dataset.copy = r.cmd; note.innerHTML = r.note; out.innerHTML = '';
      const done = () => r.out.forEach((l, j) => outs.push(setTimeout(() => out.insertAdjacentHTML('beforeend', `<div>${l}</div>`), animate ? 220 + j * 320 : 0)));
      if (!animate || reduce) { cmdEl.textContent = r.cmd; return done(); }
      let n = 0; cmdEl.textContent = '';
      timer = setInterval(() => { cmdEl.textContent = r.cmd.slice(0, ++n); if (n >= r.cmd.length) { clearInterval(timer); done(); } }, 22);
    };
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => show(i, true));
      b.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { const k = (i + d + tabs.length) % tabs.length; tabs[k].focus(); show(k, true); } });
    });
    show(0, false);
    // Type the first route once, when the console first comes into view.
    new IntersectionObserver(([e], io) => { if (e.isIntersecting) { show(0, true); io.disconnect(); } }, { threshold: 0.6 }).observe(con);
  }

  // ---------- counters ----------
  document.querySelectorAll('[data-count]').forEach((el) => {
    const to = Number(el.dataset.count);
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return; io.disconnect();
      if (reduce) return;
      const t0 = performance.now();
      const tick = (t) => { const k = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(to * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 }).observe(el);
  });

  // ---------- FAQ board ----------
  // The <details> list stays in the HTML (it works without JS and for readers);
  // here it becomes an index on the left and an answer panel that decrypts on the right.
  const list = document.querySelector('.faq-list');
  if (list && matchMedia('(min-width: 900px)').matches) {
    const items = [...list.querySelectorAll('details')];
    const board = document.createElement('div'); board.className = 'faq-board';
    const index = document.createElement('div'); index.className = 'faq-index'; index.setAttribute('role', 'tablist'); index.setAttribute('aria-label', 'questions');
    const panel = document.createElement('div'); panel.className = 'faq-panel'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-live', 'polite');
    panel.innerHTML = '<p class="faq-cmd"><span>$</span> shipreel faq <span class="faq-flag"></span></p><h3></h3><div class="faq-answer"></div>';
    board.append(index, panel);
    list.after(board); list.hidden = true;
    const flags = ['--brag', '--privacy', '--commercial', '--why-free', '--breaks', '--no-agent', '--updates'];
    const glyphs = '▚▞▖▗▘▝░▒';
    let tt = 0, cur = -1;
    const pick = (i) => {
      if (i === cur) return; cur = i;
      [...index.children].forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      panel.querySelector('.faq-flag').textContent = flags[i] || '';
      panel.querySelector('h3').textContent = items[i].querySelector('summary').textContent;
      const ans = panel.querySelector('.faq-answer');
      ans.innerHTML = items[i].querySelector('p').outerHTML;
      clearInterval(tt);
      if (reduce) return;
      const nodes = []; const walk = (n) => n.childNodes.forEach((c) => (c.nodeType === 3 ? nodes.push([c, c.textContent]) : walk(c))); walk(ans);
      const total = nodes.reduce((s, [, t]) => s + t.length, 0); let n = 0;
      tt = setInterval(() => {
        n += 7; let left = n;
        for (const [node, text] of nodes) {
          const show = Math.max(0, Math.min(text.length, left));
          let s = text.slice(0, show);
          if (left > 0 && left < text.length) for (let g = 0; g < Math.min(6, text.length - show); g++) s += glyphs[(Math.random() * glyphs.length) | 0];
          node.textContent = s;
          left -= text.length;
        }
        if (n >= total) { clearInterval(tt); nodes.forEach(([node, text]) => (node.textContent = text)); }
      }, 16);
    };
    items.forEach((d, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.innerHTML = `<span class="faq-i">0${i + 1}</span><span class="faq-q"></span><span class="faq-arr" aria-hidden="true">→</span>`;
      b.querySelector('.faq-q').textContent = d.querySelector('summary').textContent;
      b.addEventListener('click', () => pick(i));
      b.addEventListener('mouseenter', () => pick(i));
      b.addEventListener('focus', () => pick(i));
      b.addEventListener('keydown', (e) => { const k = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (k) { e.preventDefault(); index.children[(i + k + items.length) % items.length].focus(); } });
      index.appendChild(b);
    });
    pick(0);
  }

  // ---------- magnet + sparks ----------
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.buy--star').forEach((el) => {
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.32}px)`; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
  if (!reduce) {
    const sc = document.createElement('canvas'); sc.className = 'sparks'; sc.setAttribute('aria-hidden', 'true'); document.body.appendChild(sc);
    const sx = sc.getContext('2d'); let sparks = [], running = false;
    const size = () => { const r = dpr(); sc.width = innerWidth * r; sc.height = innerHeight * r; sx.setTransform(r, 0, 0, r, 0, 0); };
    size(); addEventListener('resize', size);
    const loop = () => {
      sx.clearRect(0, 0, innerWidth, innerHeight); sparks = sparks.filter((s) => s.t < 1);
      for (const s of sparks) { s.t += 0.05; const d = 8 + 30 * s.t, l = 11 * (1 - s.t); sx.strokeStyle = s.c; sx.lineWidth = 2; sx.beginPath(); sx.moveTo(s.x + Math.cos(s.a) * d, s.y + Math.sin(s.a) * d); sx.lineTo(s.x + Math.cos(s.a) * (d + l), s.y + Math.sin(s.a) * (d + l)); sx.stroke(); }
      if (sparks.length) requestAnimationFrame(loop); else running = false;
    };
    document.addEventListener('click', (e) => {
      const t = e.target.closest('.copy, .buy--star'); if (!t) return;
      const c = t.closest('.hero') ? '#210200' : '#ff6134';
      for (let i = 0; i < 10; i++) sparks.push({ x: e.clientX, y: e.clientY, a: (Math.PI * 2 * i) / 10, t: 0, c });
      if (!running) { running = true; requestAnimationFrame(loop); }
    });
  }
})();

// ---------- floating nav: sliding lamp, scroll-spy, page-as-timecode, star count ----------
(() => {
  const pill = document.querySelector('.pill');
  if (!pill) return;
  const links = [...pill.querySelectorAll('[data-spy]')], lamp = pill.querySelector('.lamp'), wrap = pill.querySelector('.pill-links');
  let active = null;
  const moveTo = (a) => {
    if (!a) { lamp.style.opacity = '0'; return; }
    const w = wrap.getBoundingClientRect(), r = a.getBoundingClientRect();
    lamp.style.left = r.left - w.left + 'px'; lamp.style.width = r.width + 'px'; lamp.style.opacity = '1';
  };
  links.forEach((a) => a.addEventListener('pointerenter', () => moveTo(a)));
  wrap.addEventListener('pointerleave', () => moveTo(active));
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = () => {
    const mid = innerHeight * 0.4;
    let on = null;
    sections.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) on = links[i]; });
    if (on !== active) { links.forEach((a) => a.classList.toggle('is-on', a === on)); active = on; if (!wrap.matches(':hover')) moveTo(on); }
    pill.classList.toggle('is-scrolled', scrollY > 40);
    const max = document.documentElement.scrollHeight - innerHeight, t = max > 0 ? (scrollY / max) * 22.7 : 0;
    const tc = document.getElementById('pill-tc'); if (tc) tc.textContent = `00:${String(Math.floor(t)).padStart(2, '0')}.${Math.floor((t % 1) * 10)}`;
  };
  addEventListener('scroll', spy, { passive: true }); addEventListener('resize', spy); spy();

  // Live star count, cached for the session; hidden if GitHub can't be reached.
  const show = (n) => { const b = document.getElementById('gh-stars'); if (b && n > 0) { b.textContent = n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n); b.hidden = false; } };
  let cached = null; try { cached = sessionStorage.getItem('shipreel-stars'); } catch {}
  if (cached) show(Number(cached));
  else fetch('https://api.github.com/repos/irvinosazee/shipreel').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) { show(j.stargazers_count); try { sessionStorage.setItem('shipreel-stars', j.stargazers_count); } catch {} } }).catch(() => {});
})();
