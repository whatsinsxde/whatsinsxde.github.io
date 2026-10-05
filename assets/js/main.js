(() => {
  'use strict';

  const C = window.SITE_CONFIG;
  const FONT = window.ASCII_FONT || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ACCENT = '#FFB224'; // to samo co --accent w css
  const BAR = 18;
  let asciiLines = [];
  let asciiDone = false;

  if (!C) {
    showError('Nie udało się wczytać assets/js/config.js, najpewniej błąd składni (brakujący przecinek albo cudzysłów).\nOtwórz konsolę przeglądarki (F12), żeby zobaczyć numer linii.');
    return;
  }

  const safe = (area) => ({
    get(k) { try { return window[area].getItem(k); } catch { return null; } },
    set(k, v) { try { window[area].setItem(k, v); } catch {} },
  });
  const store = safe('localStorage');
  const session = safe('sessionStorage');

  const UI = {
    nav: {
      about: { pl: 'o-mnie', en: 'about' },
      skills: { pl: 'umiejetnosci', en: 'skills' },
      projects: { pl: 'projekty', en: 'projects' },
      contact: { pl: 'kontakt', en: 'contact' },
    },
    label: {
      about: { pl: 'O mnie', en: 'About' },
      skills: { pl: 'Umiejętności', en: 'Skills' },
      projects: { pl: 'Projekty', en: 'Projects' },
      contact: { pl: 'Kontakt', en: 'Contact' },
    },
    ctaProjects: { pl: 'zobacz projekty', en: 'view projects' },
    ctaCv: { pl: 'pobierz CV', en: 'download CV' },
    more: { pl: 'więcej na GitHubie', en: 'more on GitHub' },
    contactH: { pl: 'Porozmawiajmy', en: "Let's talk" },
    contactP: {
      pl: 'Masz ofertę pracy, coś do przetestowania albo po prostu chcesz pogadać o bezpieczeństwie? Napisz, zwykle odpowiadam w ciągu 24 godzin.',
      en: 'Got a job offer, something that needs testing, or just want to talk security? Drop me a line, I usually reply within 24 hours.',
    },
    contactBtn: { pl: 'napisz maila', en: 'send an email' },
    copy: { pl: 'kopiuj', en: 'copy' },
    copied: { pl: 'skopiowano do schowka', en: 'copied to clipboard' },
    top: { pl: 'na górę', en: 'back to top' },
    built: { pl: 'zbudowane od zera, bez frameworków', en: 'hand-built, no frameworks' },
    status: { done: { pl: 'gotowe', en: 'done' }, wip: { pl: 'w trakcie', en: 'in progress' } },
    noProjects: { pl: 'Projekty pojawią się tu wkrótce.', en: 'Projects coming soon.' },
    hint: { pl: "wpisz 'help', aby zobaczyć dostępne komendy", en: "type 'help' to see available commands" },
  };
  const SECTIONS = ['about', 'skills', 'projects', 'contact'];

  const isI18n = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('pl' in v || 'en' in v);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const strip = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };
  const dl = (l) => (l ? ` data-l="${l}"` : '');

  let lang = initialLang();
  const pick = (v, l = lang) => (isI18n(v) ? (v[l] ?? v.pl ?? v.en) : v);
  const both = (v, fn) => (isI18n(v) ? fn(v.pl ?? v.en, 'pl') + fn(v.en ?? v.pl, 'en') : fn(v, null));
  const T = (v) => both(v, (s, l) => (l ? `<span${dl(l)}>${esc(s)}</span>` : esc(s)));
  const H = (v) => both(v, (s, l) => (l ? `<span${dl(l)}>${s}</span>` : s));

  function initialLang() {
    const saved = store.get('lang');
    if (saved === 'pl' || saved === 'en') return saved;
    if (C.defaultLang === 'pl' || C.defaultLang === 'en') return C.defaultLang;
    return (navigator.language || '').toLowerCase().startsWith('pl') ? 'pl' : 'en';
  }

  function setLang(l, save) {
    lang = l;
    document.documentElement.lang = l;
    $$('[data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === l)));
    document.title = pick(C.title) || C.fullName || 'Portfolio';
    if (save) store.set('lang', l);
  }

  try {
    setLang(lang);
    render();
    initNav();
    initReveal();
    initCards();
    initCopy();
    initTerminal();
    try { initHeroCanvas(); } catch (err) { console.warn('hero canvas:', err); }
    boot().then(startHero);
    hello();
  } catch (err) {
    console.error(err);
    document.documentElement.classList.remove('booting');
    showError('Błąd podczas budowania strony: ' + err.message + '\nSprawdź, czy w config.js nie brakuje jakiegoś pola.');
  }

  function render() {
    $('#brand-nick').textContent = C.nick;
    $('#sr-name').textContent = C.fullName;

    $('#nav-links').innerHTML = SECTIONS.map((k) =>
      `<a class="nav-link" href="#${k}" data-nav="${k}"><span class="br">[</span> ${T(UI.nav[k])} <span class="br">]</span></a>`
    ).join('');
    $('#mobile-menu').innerHTML = SECTIONS.map((k, i) =>
      `<a href="#${k}" style="--i:${i}"><span class="num">0${i + 1}</span><span><span class="tl">~/</span>${T(UI.nav[k])}</span></a>`
    ).join('');

    $$('.sec-head').forEach((el) => {
      const k = el.dataset.sec;
      const i = SECTIONS.indexOf(k) + 1;
      el.innerHTML =
        `<div class="sec-label"><span class="num">0${i}</span><span>${T(UI.label[k])}</span><span class="rule"></span></div>` +
        `<h2 class="sec-title"><span class="tl">~/</span>${both(UI.nav[k], (s, l) => `<span class="typed"${dl(l)} style="--n:${s.length}">${s}</span>`)}<span class="cursor" aria-hidden="true"></span></h2>`;
    });

    $('#tagline').innerHTML = H(C.tagline || '');
    let cta = `<a class="btn btn-primary" href="#projects">${T(UI.ctaProjects)} <span class="arr">→</span></a>`;
    cta += `<a class="btn" href="#contact">~/${T(UI.nav.contact)}</a>`;
    if (C.cv) cta += both(C.cv, (href, l) => `<a class="btn"${dl(l)} href="${esc(href)}" target="_blank" rel="noopener">${T(UI.ctaCv)} <span class="arr">↓</span></a>`);
    $('#hero-cta').innerHTML = cta;
    if (C.status && C.status.available) {
      $('#hero-status').innerHTML = `<span class="pulse" aria-hidden="true"></span>${T(C.status.text)}`;
    }

    const paras = C.about?.paragraphs || [];
    $('#about-text').innerHTML = both(paras, (arr, l) =>
      (arr || []).map((p, i) => `<p class="reveal"${dl(l)} style="--i:${i}">${p}</p>`).join('')
    );
    const stats = C.about?.stats || [];
    $('#stats').innerHTML = stats.map((s, i) =>
      `<div class="stat reveal" style="--i:${i}"><div class="stat-val"><span class="count" data-to="${Number(s.value) || 0}">0</span><span class="sfx">${esc(s.suffix || '')}</span></div><div class="stat-label">${T(s.label)}</div></div>`
    ).join('');

    $('#skills-grid').innerHTML = (C.skills || []).map((g, gi) =>
      `<div class="card skill-card reveal" style="--i:${gi}">
        <h3 class="skill-head"><span class="dim">//</span> ${T(g.group)}</h3>
        ${(g.items || []).map((it) => {
          const lvl = Math.max(0, Math.min(100, Number(it.level) || 0));
          return `<div class="bar-row">
            <span class="bar-name">${T(it.name)}</span>
            <div class="bar-line">
              <span class="bar" data-level="${lvl}" role="img" aria-label="${lvl}%"><span class="br">[</span><span class="segs">${'<i></i>'.repeat(BAR)}</span><span class="br">]</span></span>
              <span class="bar-pct">${reduceMotion ? lvl : 0}%</span>
            </div>
          </div>`;
        }).join('')}
      </div>`
    ).join('');
    if (C.tools && C.tools.length) {
      $('#tools').innerHTML =
        `<p class="tools-cmd"><span class="acc">$</span>ls ~/tools</p>` +
        `<ul class="chips">${C.tools.map((t, i) => `<li class="chip" style="--i:${i}">${esc(t)}</li>`).join('')}</ul>`;
    }

    $('#projects-grid').innerHTML = (C.projects || []).map((p, i) => {
      const links = Object.entries(p.links || {});
      const first = links[0] ? links[0][1] : null;
      const st = p.status ? (UI.status[p.status] ? T(UI.status[p.status]) : esc(p.status)) : '';
      return `<article class="card project reveal" style="--i:${i % 2}">
        <div class="project-top">
          <h3 class="project-title"><span class="tl">~/</span><span class="scramble">${esc(p.name)}</span></h3>
          ${first ? `<a class="project-arrow" href="${esc(first)}" target="_blank" rel="noopener" aria-label="${esc(p.name)}">↗</a>` : ''}
        </div>
        <div class="project-meta">${p.year ? `<span>${esc(p.year)}</span>` : ''}${st ? `<span class="badge ${esc(p.status)}">${st}</span>` : ''}</div>
        <p class="card-desc">${H(p.desc || '')}</p>
        <div class="project-foot">
          <ul class="tags">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="links">${links.map(([name, href]) => `<a class="link-br" href="${esc(href)}" target="_blank" rel="noopener"><span class="br">[</span> ${esc(name)} <span class="br">]</span></a>`).join('')}</div>
        </div>
      </article>`;
    }).join('') || `<p class="card-desc reveal">${T(UI.noProjects)}</p>`;
    if (C.moreProjects) {
      $('#projects-more').innerHTML = `<a class="btn reveal" href="${esc(C.moreProjects)}" target="_blank" rel="noopener">${T(UI.more)} <span class="arr">→</span></a>`;
    }

    const contacts = C.contact || [];
    const mail = contacts.find((c) => String(c.href || '').startsWith('mailto:'));
    $('#contact-intro').innerHTML =
      `<h3>${T(UI.contactH)}<span class="acc">_</span></h3><p>${T(UI.contactP)}</p>` +
      (mail ? `<a class="btn btn-primary" href="${esc(mail.href)}">${T(UI.contactBtn)} <span class="arr">→</span></a>` : '');
    $('#contact-table').innerHTML = contacts.map((c) => {
      const ext = !String(c.href || '').startsWith('mailto:');
      return `<div class="c-row">
        <span class="c-label">${T(c.label)}</span>
        <a class="c-val" href="${esc(c.href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(c.value)}</a>
        <span class="c-act">${c.copy ? `<button type="button" class="copy-btn" data-copy="${esc(c.value)}">${T(UI.copy)}</button>` : ''}<span class="c-arrow" aria-hidden="true">→</span></span>
      </div>`;
    }).join('');

    $('#footer').innerHTML =
      `<span>© ${new Date().getFullYear()} ${esc(C.fullName)}</span>` +
      `<span>${T(UI.built)}</span>` +
      `<a href="#top">↑ ${T(UI.top)}</a>`;
  }

  function boot() {
    return new Promise((resolve) => {
      const root = document.documentElement;
      if (!root.classList.contains('booting')) return resolve();
      session.set('booted', '1');

      const user = `${slug(C.nick)}@portfolio`;
      const ok = '[ <span class="ok">OK</span> ] ';
      const lines = [
        `<span class="ok">${esc(user)}</span>:~$ ./intro.sh`,
        `${ok}mounting /home/${esc(slug(C.nick))}`,
        `${ok}loading modules: recon, exploit, report`,
        `${ok}establishing encrypted channel ... tls1.3`,
        `${ok}checking coffee levels ... sufficient`,
        `<span class="grant">&gt; access granted. welcome.</span>`,
      ];
      const log = $('#boot-log');
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((e) => removeEventListener(e, finish));
        $('#boot').classList.add('done');
        setTimeout(() => root.classList.remove('booting'), 450);
        resolve();
      };
      ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((e) => addEventListener(e, finish, { passive: true }));

      (async () => {
        for (const l of lines) {
          if (done) return;
          log.innerHTML += l + '\n';
          await wait(l.includes('grant') ? 380 : 120 + Math.random() * 60);
        }
        finish();
      })();
    });
  }

  function asciiRows(text) {
    const rows = ['', '', '', '', '', ''];
    for (const ch of text.toUpperCase()) {
      const g = FONT[ch] || FONT['?'] || ['', '', '', '', '', ''];
      for (let i = 0; i < 6; i++) rows[i] += g[i];
    }
    const trail = Math.min(...rows.map((r) => r.length - r.trimEnd().length));
    return rows.map((r) => r.slice(0, r.length - trail));
  }

  const CW = 10, CH = 20;
  function cellShape(ch, x, y) {
    const g = 2.6, mx = x + CW / 2, my = y + CH / 2, r = x + CW, b = y + CH;
    const ln = (d) => `<path class="ln" d="${d}"/>`;
    switch (ch) {
      case '═': return ln(`M${x} ${my - g}H${r}M${x} ${my + g}H${r}`);
      case '║': return ln(`M${mx - g} ${y}V${b}M${mx + g} ${y}V${b}`);
      case '╗': return ln(`M${x} ${my - g}H${mx + g}V${b}M${x} ${my + g}H${mx - g}V${b}`);
      case '╔': return ln(`M${r} ${my - g}H${mx - g}V${b}M${r} ${my + g}H${mx + g}V${b}`);
      case '╝': return ln(`M${x} ${my + g}H${mx + g}V${y}M${x} ${my - g}H${mx - g}V${y}`);
      case '╚': return ln(`M${r} ${my + g}H${mx - g}V${y}M${r} ${my - g}H${mx + g}V${y}`);
      default: return '';
    }
  }

  function asciiSVG(lines, animate) {
    const cols = Math.max(...lines.map((l) => l.length));
    let body = '';
    lines.forEach((l, r) => {
      const chars = [...l];
      for (let c = 0; c < chars.length; c++) {
        const ch = chars[c];
        let shape;
        if (ch === '█' || ch === '▀' || ch === '▄') {
          let n = 1;
          while (chars[c + n] === ch) n++;
          const y = r * CH + (ch === '▄' ? CH / 2 : 0);
          const h = ch === '█' ? CH + 0.5 : CH / 2 + 0.3;
          shape = `<rect x="${c * CW}" y="${y}" width="${n * CW + 0.5}" height="${h}"/>`;
          c += n - 1;
        } else {
          shape = cellShape(ch, c * CW, r * CH);
        }
        if (!shape) continue;
        body += animate
          ? `<g class="c" style="--d:${Math.round((c / cols) * 900 + Math.random() * 450)}ms">${shape}</g>`
          : shape;
      }
    });
    return `<svg viewBox="0 0 ${cols * CW} ${lines.length * CH}" fill="currentColor" aria-hidden="true">${body}</svg>`;
  }

  let asciiKey = '';
  function layoutAscii() {
    const box = $('#ascii');
    const inner = $('#hero-inner');
    const cs = getComputedStyle(inner);
    const avail = Math.min(960, inner.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    const text = String(C.asciiName || C.nick || '').trim() || '?';
    const colW = (lines) => Math.min(13.2, avail / Math.max(...lines.map((l) => l.length)));

    let lines = asciiRows(text);
    const words = text.split(/\s+/);
    if (colW(lines) < 4.2 && words.length > 1) {
      const blocks = words.map(asciiRows);
      const max = Math.max(...blocks.map((bl) => bl[0].length));
      lines = blocks.flatMap((bl, i) => {
        const pad = ' '.repeat(Math.floor((max - bl[0].length) / 2));
        return (i ? [''] : []).concat(bl.map((r) => pad + r));
      });
    }
    asciiLines = lines;
    const cols = Math.max(...lines.map((l) => l.length));
    box.style.width = Math.floor(colW(lines) * cols) + 'px';

    const key = lines.join('\n');
    if (key === asciiKey) return;
    asciiKey = key;
    box.innerHTML =
      `<div class="a-main">${asciiSVG(lines, !asciiDone)}</div>` +
      `<div class="a-ga">${asciiSVG(lines, false)}</div>` +
      `<div class="a-gb">${asciiSVG(lines, false)}</div>`;
  }

  function decodeAscii() {
    const box = $('#ascii');
    if (reduceMotion) { asciiDone = true; box.classList.add('decoded'); return Promise.resolve(); }
    box.classList.add('decoding');
    return wait(1350 + 650).then(() => {
      asciiDone = true;
      box.classList.add('decoded');
    });
  }

  function glitchLoop() {
    const box = $('#ascii');
    let t;
    const fire = () => {
      box.classList.remove('glitch');
      void box.offsetWidth;
      box.classList.add('glitch');
      clearTimeout(t);
      t = setTimeout(() => box.classList.remove('glitch'), 600);
    };
    box.addEventListener('mouseenter', fire);
    const loop = () => {
      if (!document.hidden) fire();
      setTimeout(loop, 4000 + Math.random() * 5000);
    };
    setTimeout(loop, 2500);
  }

  function typewriter() {
    const el = $('#typed');
    const roles = () => pick(C.roles) || [];
    if (reduceMotion) {
      const upd = () => { el.textContent = roles().join(' · '); };
      upd();
      $$('[data-set-lang]').forEach((b) => b.addEventListener('click', upd));
      return;
    }
    let ri = 0, ci = 0, del = false;
    const tick = () => {
      const list = roles();
      if (!list.length) return;
      const word = list[ri % list.length];
      if (!del) {
        ci++;
        el.textContent = word.slice(0, ci);
        if (ci >= word.length) { del = true; return setTimeout(tick, 2000); }
        return setTimeout(tick, 55 + Math.random() * 55);
      }
      ci = Math.min(ci, word.length) - 1;
      el.textContent = word.slice(0, ci);
      if (ci <= 0) { del = false; ri++; return setTimeout(tick, 380); }
      return setTimeout(tick, 28);
    };
    tick();
  }

  function startHero() {
    layoutAscii();
    $('#hero').classList.add('hero-ready');
    decodeAscii().then(() => { if (!reduceMotion) glitchLoop(); });
    setTimeout(typewriter, reduceMotion ? 0 : 700);

    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layoutAscii, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutAscii);
  }

  function initHeroCanvas() {
    const hero = $('#hero');
    const cv = $('#hero-canvas');
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const GAP = 24;
    const LABELS = ['22/tcp open', '80/tcp open', '443/tcp open', '445/tcp open', '3389/tcp open', '8080/tcp open',
      '10.10.14.7', '10.10.11.42', '192.168.1.13', '172.16.0.5', '200 OK', '403 → 200', 'uid=0(root)', '$ id', 'shell ✓', 'hash cracked'];
    let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, ox = 0, oy = 0;
    let base = null;
    let excl = { x0: 0, y0: 0, x1: 0, y1: 0 };
    const mouse = { x: -1e4, y: -1e4 };
    let pings = [], packets = [];
    let scanY = -120, last = 0, lastPing = 0, running = false, inView = true;

    function resize() {
      const r = hero.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) { base = null; return; }
      W = r.width; H = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / GAP) + 1; rows = Math.ceil(H / GAP) + 1;
      ox = (W - (cols - 1) * GAP) / 2; oy = (H - (rows - 1) * GAP) / 2;

      base = document.createElement('canvas');
      base.width = cv.width; base.height = cv.height;
      const b = base.getContext('2d');
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.fillStyle = 'rgba(180, 155, 120, 0.15)';
      for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) b.fillRect(ox + c * GAP - 0.75, oy + rr * GAP - 0.75, 1.5, 1.5);

      const ir = $('#hero-inner').getBoundingClientRect();
      const pad = 30;
      const midW = Math.min(ir.width, 760);
      excl = { x0: r.width / 2 - midW / 2 - pad, x1: r.width / 2 + midW / 2 + pad, y0: ir.top - r.top - pad, y1: ir.bottom - r.top + pad };
      if (!running) drawStatic();
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      if (base) ctx.drawImage(base, 0, 0, W, H);
    }

    function spawnPing(now) {
      let x, y, tries = 0;
      do {
        x = ox + ((Math.random() * cols) | 0) * GAP;
        y = oy + ((Math.random() * rows) | 0) * GAP;
        tries++;
      } while (tries < 12 && x > excl.x0 && x < excl.x1 && y > excl.y0 && y < excl.y1);
      if (x > excl.x0 && x < excl.x1 && y > excl.y0 && y < excl.y1) return;
      const p = { x, y, born: now, life: 2800, label: Math.random() < 0.5 ? LABELS[(Math.random() * LABELS.length) | 0] : null };
      const alive = pings.filter((q) => now - q.born < q.life * 0.6);
      if (alive.length && Math.random() < 0.65) {
        const from = alive[(Math.random() * alive.length) | 0];
        const pts = [{ x: from.x, y: from.y }, { x, y: from.y }, { x, y }];
        const len = Math.abs(x - from.x) + Math.abs(y - from.y);
        if (len > GAP * 3) packets.push({ pts, len, born: now, speed: 0.32 });
      }
      pings.push(p);
      if (pings.length > 10) pings.shift();
    }

    function pointOnPath(pk, d) {
      const a = pk.pts[0], b = pk.pts[1], c = pk.pts[2];
      const l1 = Math.abs(b.x - a.x);
      if (d <= l1) return { x: a.x + Math.sign(b.x - a.x) * d, y: a.y };
      return { x: b.x, y: b.y + Math.sign(c.y - b.y) * (d - l1) };
    }

    function frame(now) {
      if (!running) return;
      if (!base) { requestAnimationFrame(frame); return; }
      const dt = Math.min(50, now - (last || now));
      last = now;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);
      ctx.fillStyle = ACCENT;

      scanY += dt * (H / 7500);
      if (scanY > H + 140) scanY = -140;
      const band = 70;
      const r0 = Math.max(0, Math.floor((scanY - band - oy) / GAP));
      const r1 = Math.min(rows - 1, Math.ceil((scanY + band - oy) / GAP));
      for (let rr = r0; rr <= r1; rr++) {
        const y = oy + rr * GAP;
        const a = 1 - Math.abs(y - scanY) / band;
        if (a <= 0) continue;
        ctx.globalAlpha = a * a * 0.4;
        for (let c = 0; c < cols; c++) ctx.fillRect(ox + c * GAP - 1, y - 1, 2, 2);
      }
      const g = ctx.createLinearGradient(0, scanY - 40, 0, scanY);
      g.addColorStop(0, 'rgba(255,178,36,0)');
      g.addColorStop(1, 'rgba(255,178,36,0.05)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(0, scanY - 40, W, 40);
      ctx.fillStyle = ACCENT;

      if (mouse.x > -1e3) {
        const R = 150;
        const c0 = Math.max(0, Math.floor((mouse.x - R - ox) / GAP)), c1 = Math.min(cols - 1, Math.ceil((mouse.x + R - ox) / GAP));
        const q0 = Math.max(0, Math.floor((mouse.y - R - oy) / GAP)), q1 = Math.min(rows - 1, Math.ceil((mouse.y + R - oy) / GAP));
        for (let c = c0; c <= c1; c++) for (let rr = q0; rr <= q1; rr++) {
          const x = ox + c * GAP, y = oy + rr * GAP;
          const d = Math.hypot(x - mouse.x, y - mouse.y);
          if (d > R) continue;
          const a = Math.pow(1 - d / R, 1.6);
          const s = 1.5 + a * 1.6;
          ctx.globalAlpha = a * 0.85;
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }

      packets = packets.filter((pk) => (now - pk.born) * pk.speed < pk.len + 160);
      for (const pk of packets) {
        const d = (now - pk.born) * pk.speed;
        ctx.globalAlpha = 0.1 * Math.max(0, 1 - Math.max(0, d - pk.len) / 160);
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pk.pts[0].x, pk.pts[0].y);
        ctx.lineTo(pk.pts[1].x, pk.pts[1].y);
        ctx.lineTo(pk.pts[2].x, pk.pts[2].y);
        ctx.stroke();
        if (d <= pk.len) {
          for (let k = 0; k < 6; k++) {
            const pt = pointOnPath(pk, Math.max(0, d - k * 7));
            ctx.globalAlpha = (1 - k / 6) * 0.9;
            const s = 2.6 - k * 0.3;
            ctx.fillRect(pt.x - s / 2, pt.y - s / 2, s, s);
          }
        }
      }

      if (now - lastPing > 700) { spawnPing(now); lastPing = now; }
      pings = pings.filter((p) => now - p.born < p.life);
      ctx.font = '500 10px "JetBrains Mono", monospace';
      for (const p of pings) {
        const t = (now - p.born) / p.life;
        const fade = t < 0.1 ? t / 0.1 : 1 - Math.max(0, (t - 0.6) / 0.4);
        ctx.globalAlpha = fade;
        ctx.fillRect(p.x - 1.75, p.y - 1.75, 3.5, 3.5);
        const rt = (t * 2.2) % 1;
        ctx.globalAlpha = (1 - rt) * 0.55 * fade;
        ctx.strokeStyle = ACCENT;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + rt * 22, 0, Math.PI * 2);
        ctx.stroke();
        if (p.label) {
          const shown = Math.min(p.label.length, Math.floor(t * 60));
          ctx.globalAlpha = fade * 0.75;
          ctx.fillText(p.label.slice(0, shown), p.x + 9, p.y - 7);
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion || !inView || document.hidden) return;
      running = true; last = 0;
      requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    resize();
    let rt;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 150); };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(hero);
    else addEventListener('resize', onResize);
    const move = (x, y) => {
      const r = cv.getBoundingClientRect();
      mouse.x = x - r.left; mouse.y = y - r.top;
    };
    hero.addEventListener('pointermove', (e) => move(e.clientX, e.clientY), { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  function initNav() {
    const nav = $('#nav');
    const progress = $('#progress');
    const menu = $('#mobile-menu');
    const btn = $('#menu-btn');

    $$('[data-set-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.setLang, true)));

    const links = $$('.nav-link');
    const secs = SECTIONS.map((id) => document.getElementById(id));
    let current = null;
    const updateActive = () => {
      const line = innerHeight * 0.4;
      let id = null;
      secs.forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
      if (id === current) return;
      current = id;
      links.forEach((l) => l.classList.toggle('active', l.dataset.nav === id));
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        const max = document.documentElement.scrollHeight - innerHeight;
        nav.classList.toggle('scrolled', y > 10);
        progress.style.setProperty('--p', max > 0 ? Math.min(1, y / max) : 0);
        updateActive();
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    links.forEach((l) => l.addEventListener('mouseenter', () => {
      const span = $$('[data-l]', l).find((s) => s.dataset.l === lang) || l;
      scramble(span, 350);
    }));

    const setMenu = (open) => {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', () => setMenu(menu.hidden));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    addEventListener('resize', () => { if (innerWidth > 820 && !menu.hidden) setMenu(false); });
  }

  function initReveal() {
    const targets = $$('.reveal, .sec-head, .tools, .stats');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => { el.classList.add('in'); onReveal(el); });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        onReveal(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((el) => io.observe(el));
  }

  function onReveal(el) {
    if (el.classList.contains('skill-card')) animateBars(el);
    if (el.classList.contains('stats')) animateCounts(el);
  }

  function animateBars(card) {
    $$('.bar', card).forEach((bar, i) => {
      const lvl = Number(bar.dataset.level);
      const segs = $$('.segs i', bar);
      const pct = bar.parentElement.querySelector('.bar-pct');
      const total = Math.round((lvl / 100) * segs.length);
      const set = (p) => {
        const n = Math.round(total * p);
        segs.forEach((sg, k) => sg.classList.toggle('on', k < n));
        pct.textContent = Math.round(lvl * p) + '%';
      };
      if (reduceMotion) return set(1);
      tween(1000, set, 200 + i * 130);
    });
  }

  function animateCounts(box) {
    $$('.count', box).forEach((el, i) => {
      const to = Number(el.dataset.to);
      if (reduceMotion) { el.textContent = to; return; }
      tween(1400, (p) => { el.textContent = Math.round(to * p); }, i * 120);
    });
  }

  function tween(dur, fn, delay = 0) {
    setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        fn(1 - Math.pow(1 - t, 3));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
  }

  function initCards() {
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', e.clientX - r.left + 'px');
        card.style.setProperty('--my', e.clientY - r.top + 'px');
      });
      const title = $('.scramble', card);
      if (title) card.addEventListener('mouseenter', () => scramble(title, 450));
    });
  }

  function scramble(el, dur = 400) {
    if (reduceMotion || el._scrambling) return;
    const orig = el.textContent;
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_-/<>#$%';
    el._scrambling = true;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const fixed = Math.floor(t * orig.length);
      el.textContent = orig.split('').map((ch, i) => (i < fixed || ch === ' ' ? ch : chars[(Math.random() * chars.length) | 0])).join('');
      if (t < 1) requestAnimationFrame(step);
      else { el.textContent = orig; el._scrambling = false; }
    };
    requestAnimationFrame(step);
  }

  function initCopy() {
    document.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-copy]');
      if (!b) return;
      const text = b.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
      }
      toast(pick(UI.copied));
    });
  }

  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function initTerminal() {
    const term = $('#terminal');
    const out = $('#term-out');
    const body = $('#term-body');
    const input = $('#term-input');
    const inputLine = $('#term-input-line');
    const user = `${slug(C.nick)}@portfolio`;
    const PROMPT = `<span class="t-prompt">${esc(user)}:<span class="path">~</span>$</span>`;
    $('#term-prompt').innerHTML = PROMPT;
    $('#term-title').textContent = `${user}: ~`;

    const history = [];
    let hIdx = 0;
    let autoplaying = false, skipAuto = false;
    const L = (o) => pick(o);

    const print = (html, cls = 't-out') => {
      const d = document.createElement('div');
      d.className = cls;
      d.innerHTML = html;
      out.appendChild(d);
      body.scrollTop = body.scrollHeight;
      return d;
    };
    const blank = () => print('');
    const hint = () => print(`<span class="t-dim"># ${esc(L(UI.hint))}</span>`);

    const bar = (lvl, n = 12) => {
      const k = Math.round((lvl / 100) * n);
      return `<span class="t-dim">[</span><span class="t-acc">${'#'.repeat(k)}</span><span class="t-dim">${'.'.repeat(n - k)}]</span>`;
    };
    const jsonVal = (v) => {
      if (Array.isArray(v)) return `[${v.map((s) => `<span class="t-str">"${esc(s)}"</span>`).join(', ')}]`;
      if (typeof v === 'number' || typeof v === 'boolean') return `<span class="t-acc">${v}</span>`;
      return `<span class="t-str">"${esc(v)}"</span>`;
    };
    const factsJSON = () => {
      const f = C.about?.facts || [];
      print('{');
      f.forEach((x, i) => print(`  <span class="t-key">"${esc(x.key)}"</span>: ${jsonVal(pick(x.value))}${i < f.length - 1 ? ',' : ''}`));
      print('}');
    };
    const skillsOut = () => {
      (C.skills || []).forEach((g) => {
        print(`<span class="t-dim">//</span> <span class="t-acc">${esc(pick(g.group))}</span>`);
        (g.items || []).forEach((it) => print(`  ${esc(String(pick(it.name)).padEnd(24))} ${bar(it.level)} <span class="t-dim">${it.level}%</span>`));
      });
      if (C.tools?.length) print(`<span class="t-dim">// tools:</span> ${esc(C.tools.join(', '))}`);
    };
    const contactOut = () => {
      (C.contact || []).forEach((c) => {
        const ext = !String(c.href).startsWith('mailto:');
        print(`  <span class="t-dim">${esc(String(pick(c.label)).padEnd(12))}</span><a href="${esc(c.href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(c.value)}</a>`);
      });
    };
    const goTo = (id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    const sectionFromArg = (a = '') => {
      const s = a.replace(/^~?\/?/, '').replace(/\/$/, '').toLowerCase();
      if (['', '~', '..', '/', 'home', 'top'].includes(s)) return 'top';
      return SECTIONS.find((k) => k === s || UI.nav[k].pl === s || UI.nav[k].en === s) || null;
    };
    const FILES = ['whoami.json', 'skills.txt', 'contact.txt', 'projects/'];

    const CMDS = {
      help: () => {
        const rows = [
          ['whoami', { pl: 'kim jestem', en: 'who am I' }],
          ['about', { pl: 'krótko o mnie', en: 'short bio' }],
          ['skills', { pl: 'umiejętności', en: 'skills' }],
          ['projects', { pl: 'projekty', en: 'projects' }],
          ['contact', { pl: 'kontakt', en: 'contact info' }],
          ...(C.cv ? [['cv', { pl: 'otwórz CV', en: 'open CV' }]] : []),
          ['cd <sekcja>', { pl: 'przewiń do sekcji, np. cd projekty', en: 'scroll to a section, e.g. cd projects' }],
          ['ls, cat', { pl: 'pliki', en: 'files' }],
          ['neofetch', { pl: 'info o systemie', en: 'system info' }],
          ['lang pl|en', { pl: 'zmień język', en: 'switch language' }],
          ['clear', { pl: 'wyczyść ekran', en: 'clear screen' }],
        ];
        rows.forEach(([c, d]) => print(`  <span class="t-acc">${esc(c.replace('<sekcja>', lang === 'pl' ? '<sekcja>' : '<section>').padEnd(14))}</span><span class="t-dim">${esc(L(d))}</span>`));
      },
      whoami: () => {
        const role = (pick(C.roles) || [])[0];
        print(`${esc(C.fullName)}${role ? ` <span class="t-dim">-</span> <span class="t-acc">${esc(role)}</span>` : ''}`);
      },
      about: () => {
        const paras = pick(C.about?.paragraphs) || [];
        paras.forEach((p, i) => { if (i) blank(); print(esc(strip(p))); });
      },
      skills: skillsOut,
      projects: () => {
        (C.projects || []).forEach((p) => {
          const href = Object.values(p.links || {})[0];
          const name = href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(p.name)}</a>` : esc(p.name);
          print(`<span class="t-acc">→</span> ${name} <span class="t-dim">${esc(strip(pick(p.desc) || ''))}</span>`);
        });
        if (!C.projects?.length) print(`<span class="t-dim">${esc(L(UI.noProjects))}</span>`);
        print(`<span class="t-dim"># cd ${esc(L(UI.nav.projects))}</span>`);
      },
      contact: contactOut,
      socials: contactOut,
      cv: () => {
        if (!C.cv) return print(`<span class="t-err">cv: ${lang === 'pl' ? 'jeszcze niedostępne' : 'not available yet'}</span>`);
        const href = pick(C.cv);
        print(`<span class="t-dim">opening</span> <a href="${esc(href)}" target="_blank" rel="noopener">${esc(href)}</a>`);
        window.open(href, '_blank', 'noopener');
      },
      cd: (args) => {
        const s = sectionFromArg(args[0]);
        if (!s) return print(`<span class="t-err">cd: ${esc(args[0])}: No such file or directory</span>`);
        print(`<span class="t-dim">→ ~/${s === 'top' ? '' : esc(L(UI.nav[s]))}</span>`);
        goTo(s === 'top' ? 'top' : s);
      },
      ls: (args) => {
        const all = args.some((a) => /^-\w*a/.test(a));
        const files = (all ? ['.', '..', '.secret'] : []).concat(FILES);
        print(files.map((f) => (f.endsWith('/') || f.startsWith('.') ? `<span class="t-key">${f}</span>` : f)).join('  '));
      },
      cat: (args) => {
        const f = (args[0] || '').replace(/^\.\//, '');
        if (!f) return print('<span class="t-err">cat: missing operand</span>');
        if (f === 'whoami.json' || f === 'about.json') return factsJSON();
        if (f === 'skills.txt') return skillsOut();
        if (f === 'contact.txt') return contactOut();
        if (f.replace(/\/$/, '') === 'projects') return print(`<span class="t-err">cat: ${esc(f)}: Is a directory</span>`);
        if (f === '.secret') {
          print('<span class="t-acc">flag{y0u_r34d_th3_s0urc3_0r_gu3ss3d_1t}</span>');
          return print(`<span class="t-dim">${lang === 'pl' ? 'dobra robota. teraz zostało mnie zatrudnić ;)' : 'nice. now all that is left is to hire me ;)'}</span>`);
        }
        print(`<span class="t-err">cat: ${esc(f)}: No such file or directory</span>`);
      },
      neofetch: () => {
        const logo = [
          "     .-----.    ",
          "    / .---. \\   ",
          "    | |   | |   ",
          "  .-'-'---'-'-. ",
          "  |    .-.    | ",
          "  |    '-'    | ",
          "  |     |     | ",
          "  '-----------' ",
        ];
        const up = Math.round(performance.now() / 1000);
        const fact = (k) => pick((C.about?.facts || []).find((f) => f.key === k)?.value);
        const info = [
          `<span class="t-acc">${esc(user)}</span>`,
          `<span class="t-dim">${'-'.repeat(user.length)}</span>`,
          `<span class="t-key">os</span>: portfolio-os (web)`,
          `<span class="t-key">role</span>: ${esc((pick(C.roles) || [])[0] || '')}`,
          `<span class="t-key">location</span>: ${esc(fact('location') || '-')}`,
          `<span class="t-key">shell</span>: js-bash 1.0`,
          `<span class="t-key">uptime</span>: ${Math.floor(up / 60)}m ${up % 60}s`,
          `<span class="t-key">theme</span>: dark (always)`,
        ];
        logo.forEach((l, i) => print(`<span class="t-acc">${l}</span>${info[i] || ''}`));
      },
      lang: (args) => {
        const l = (args[0] || '').toLowerCase();
        if (l !== 'pl' && l !== 'en') return print('<span class="t-dim">usage: lang pl | lang en</span>');
        setLang(l, true);
        print(l === 'pl' ? 'język: polski' : 'language: english');
      },
      echo: (args) => print(esc(args.join(' '))),
      date: () => print(esc(new Date().toString())),
      history: () => history.forEach((h, i) => print(`  <span class="t-dim">${String(i + 1).padStart(3)}</span>  ${esc(h)}`)),
      clear: () => { out.innerHTML = ''; },
      sudo: () => print(`<span class="t-err">${esc(slug(C.nick))} is not in the sudoers file. This incident will be reported.</span>`),
      rm: (args) => print(args.some((a) => a.includes('r')) ? `<span class="t-err">${lang === 'pl' ? 'dobra próba.' : 'nice try.'}</span>` : '<span class="t-err">rm: permission denied</span>'),
      exit: () => print(`<span class="t-dim">${lang === 'pl' ? 'wylogowywanie... żart. stąd nie ma wyjścia ;)' : 'logging out... just kidding. there is no escape ;)'}</span>`),
    };
    CMDS.ll = () => CMDS.ls(['-la']);
    CMDS.hire = () => { print(`<span class="t-acc">${lang === 'pl' ? 'świetny wybór →' : 'great choice →'}</span>`); goTo('contact'); };

    function run(raw, echo = true) {
      const line = raw.trim();
      if (echo) print(`${PROMPT} <span class="t-cmd">${esc(raw)}</span>`);
      if (!line) return;
      if (echo) { history.push(line); hIdx = history.length; }
      const [cmd, ...args] = line.split(/\s+/);
      const fn = CMDS[cmd.toLowerCase()];
      if (fn) fn(args);
      else { print(`<span class="t-err">bash: ${esc(cmd)}: command not found</span>`); hint(); }
    }

    async function typeCmd(cmd) {
      const d = print(`${PROMPT} <span class="t-cmd"></span>`);
      const span = $('.t-cmd', d);
      for (const ch of cmd) {
        if (skipAuto) { span.textContent = cmd; break; }
        span.textContent += ch;
        await wait(55 + Math.random() * 70);
      }
      if (!skipAuto) await wait(260);
    }

    async function autoplay() {
      autoplaying = true;
      inputLine.hidden = true;
      await typeCmd('whoami');
      run('whoami', false);
      if (!skipAuto) await wait(450);
      await typeCmd('cat whoami.json');
      run('cat whoami.json', false);
      if (!skipAuto) await wait(350);
      blank();
      hint();
      autoplaying = false;
      inputLine.hidden = false;
      body.scrollTop = body.scrollHeight;
    }

    if (reduceMotion) { skipAuto = true; autoplay(); }
    else {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { io.disconnect(); setTimeout(autoplay, 350); }
      }, { threshold: 0.35 });
      io.observe(term);
    }

    body.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      if (autoplaying) { skipAuto = true; return; }
      if (String(getSelection())) return;
      input.focus({ preventScroll: true });
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        run(input.value);
        input.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hIdx > 0) { hIdx--; input.value = history[hIdx]; }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; }
        else { hIdx = history.length; input.value = ''; }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const parts = input.value.split(' ');
        let pool;
        if (parts.length === 1) pool = Object.keys(CMDS);
        else if (parts[0] === 'cat') pool = FILES.concat('.secret');
        else if (parts[0] === 'cd') pool = SECTIONS.map((k) => L(UI.nav[k]));
        else if (parts[0] === 'lang') pool = ['pl', 'en'];
        else return;
        const cur = parts[parts.length - 1];
        const hits = pool.filter((p) => p.startsWith(cur));
        if (hits.length === 1) { parts[parts.length - 1] = hits[0]; input.value = parts.join(' ') + (parts.length === 1 ? ' ' : ''); }
        else if (hits.length > 1) { print(`${PROMPT} <span class="t-cmd">${esc(input.value)}</span>`); print(hits.join('  ')); }
      } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
        e.preventDefault();
        out.innerHTML = '';
      } else if (e.key.toLowerCase() === 'c' && e.ctrlKey && !getSelection().toString()) {
        print(`${PROMPT} <span class="t-cmd">${esc(input.value)}</span><span class="t-dim">^C</span>`);
        input.value = '';
      }
    });
  }

  function slug(s) {
    return String(s || 'user').toLowerCase().replace(/[^a-z0-9_-]+/g, '') || 'user';
  }

  function showError(msg) {
    const d = document.createElement('div');
    d.className = 'config-error';
    d.textContent = msg;
    const add = () => document.body.appendChild(d);
    document.body ? add() : addEventListener('DOMContentLoaded', add);
  }

  function hello() {
    const mail = (C.contact || []).find((c) => String(c.href || '').startsWith('mailto:'));
    console.log(
      `%c${asciiRows(String(C.asciiName || C.nick)).join('\n')}`,
      `color:${ACCENT};font-family:monospace;line-height:1.1`
    );
    console.log(
      `%c${lang === 'pl' ? 'Zaglądasz do źródła? Lubię to.' : 'Reading the source? I like that.'}${mail ? ' → ' + mail.value : ''}\n${lang === 'pl' ? 'psst: w terminalu spróbuj' : 'psst: in the terminal, try'} "ls -a"`,
      'color:#A39887;font-family:monospace'
    );
  }
})();
