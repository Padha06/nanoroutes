(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };

  var scrambleGen = {};
  function scrambleTo(el, text, key) {
    if (!el) return;
    var k = key || el.id || 'x';
    var gen = (scrambleGen[k] = (scrambleGen[k] || 0) + 1);
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var start = performance.now(), dur = 560;
    (function frame(t) {
      if (scrambleGen[k] !== gen) return;
      var p = Math.min(1, (t - start) / dur), out = '';
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (c === ' ' || c === '·' || c === '—' || c === '/') { out += c; continue; }
        out += (p > (i + 1) / text.length) ? c : chars[(Math.random() * chars.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ---------- preloader ---------- */
  var pre = $('#preloader');
  var preNum = $('#preloadNum');
  var preBar = $('#preloadBar');

  function revealHero() {
    var hero = $('.hero-title');
    if (hero) hero.classList.add('in');
  }
  function finishLoad() {
    if (pre) pre.classList.add('done');
    document.body.classList.remove('is-loading');
    revealHero();
    window.setTimeout(function () { if (pre) pre.style.display = 'none'; }, 1100);
    refresh();
  }

  if (reduce) {
    if (pre) pre.style.display = 'none';
    document.body.classList.remove('is-loading');
    revealHero();
  } else if (pre) {
    var dur = 1500, t0 = performance.now();
    (function tick(t) {
      var k = clamp((t - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - k, 3);
      var v = Math.round(e * 100);
      if (preNum) preNum.textContent = v < 10 ? '0' + v : '' + v;
      if (preBar) preBar.style.width = v + '%';
      if (k < 1) { requestAnimationFrame(tick); } else { finishLoad(); }
    })(t0);
  } else {
    document.body.classList.remove('is-loading');
  }

  /* ---------- header, progress, chapter ---------- */
  var header = $('#siteHeader');
  var progress = $('#scrollProgress');
  var chapterEl = $('#headerChapter');
  var chapterNum = chapterEl ? $('.hc-num', chapterEl) : null;
  var chapterName = chapterEl ? $('.hc-name', chapterEl) : null;
  var sections = $$('[data-chapter]');

  /* ---------- menu ---------- */
  var menu = $('#menu');
  var menuBtn = $('#menuBtn');
  var menuClose = $('#menuClose');
  var lastFocus = null;

  var pageChrome = [$('#siteHeader'), $('main'), $('.site-footer')];
  function setPageInert(on) {
    pageChrome.forEach(function (el) {
      if (!el) return;
      if (on) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }

  function openMenu() {
    lastFocus = document.activeElement;
    menu.classList.add('open');
    menu.removeAttribute('aria-hidden');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setPageInert(true);
    window.setTimeout(function () { if (menuClose) menuClose.focus(); }, 420);
  }
  function closeMenu() {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setPageInert(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { menu.classList.contains('open') ? closeMenu() : openMenu(); });
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (menu) menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) {
    if (!menu || !menu.classList.contains('open')) return;
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.slice.call(menu.querySelectorAll('a[href],button:not([disabled])'))
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- reveal + line masks ---------- */
  var revealEls = $$('.reveal');
  var lineEls = $$('.hero-title, .sec-title, .vision-title, .contact-title');
  var nets = $$('.net');

  function drawNet(svg) {
    var els = svg.querySelectorAll('line,path,circle,rect');
    for (var i = 0; i < els.length; i++) els[i].style.transitionDelay = (reduce ? 0 : i * 16) + 'ms';
    svg.classList.add('is-drawn');
  }

  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { ro.observe(el); });

    var lo = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); lo.unobserve(e.target); } });
    }, { threshold: 0.25 });
    lineEls.forEach(function (el) { lo.observe(el); });

    var no = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { drawNet(e.target); no.unobserve(e.target); } });
    }, { threshold: 0.2 });
    nets.forEach(function (s) { no.observe(s); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    lineEls.forEach(function (el) { el.classList.add('in'); });
    nets.forEach(drawNet);
  }

  /* ---------- NIS pipeline ---------- */
  var nisSteps = $$('.nis-step');
  var nisStages = $$('.nd-stage');
  var nisLabel = $('#nisPipeLabel');
  var nisNames = ['Capture', 'Interpret', 'Explain', 'Act'];
  var isMobile = function () { return window.innerWidth <= 900; };

  function updateNis() {
    if (!nisSteps.length) return;
    var vh = window.innerHeight, best = 0, bestD = Infinity;

    if (isMobile()) {
      /* On mobile with sticky cards, detect which card is currently "stuck" */
      for (var i = nisSteps.length - 1; i >= 0; i--) {
        var r = nisSteps[i].getBoundingClientRect();
        /* A card is "stuck" when its top is near its designated sticky position */
        if (r.top <= 310) { best = i; break; }
      }
    } else {
      for (var j = 0; j < nisSteps.length; j++) {
        var rr = nisSteps[j].getBoundingClientRect();
        var d = Math.abs((rr.top + rr.height / 2) - vh / 2);
        if (d < bestD) { bestD = d; best = j; }
      }
    }

    nisSteps.forEach(function (s, i) { s.classList.toggle('active', i === best); });
    nisStages.forEach(function (g, i) { g.classList.toggle('active', i === best); });
    if (nisLabel) scrambleTo(nisLabel, nisNames[best], 'nis');
  }

  /* ---------- pinned horizontal research ---------- */
  var pin = $('[data-pin]');
  var track = $('#pinTrack');
  var pinBar = $('#pinBar');
  var pinTop = 0, pinMax = 0;

  function measurePin() {
    if (!pin || !track) return;
    if (window.innerWidth <= 900) {
      pin.style.height = '';
      track.style.transform = '';
      if (pinBar) pinBar.style.width = '0%';
      pinTop = 0; pinMax = 0;
      return;
    }
    track.style.transform = 'translateX(0px)';
    var vw = document.documentElement.clientWidth;
    pinMax = Math.max(0, track.scrollWidth - vw);
    pin.style.height = (window.innerHeight + pinMax) + 'px';
    pinTop = pin.getBoundingClientRect().top + window.scrollY;
  }
  function updatePin() {
    if (!pin || !track || pinMax === 0) return;
    var p = clamp((window.scrollY - pinTop) / Math.max(1, pinMax), 0, 1);
    track.style.transform = 'translateX(' + (-p * pinMax) + 'px)';
    if (pinBar) pinBar.style.width = (p * 100) + '%';
  }

  /* ---------- roadmap ---------- */
  var roadmap = $('.roadmap');
  var roadmapBar = $('#roadmapBar');
  function updateRoadmap() {
    if (!roadmap || !roadmapBar) return;
    var r = roadmap.getBoundingClientRect();
    var passed = clamp(window.innerHeight * 0.72 - r.top, 0, r.height);
    roadmapBar.style.height = (passed / r.height * 100) + '%';
  }

  /* ---------- scroll loop ---------- */
  var ticking = false;
  function onFrame() {
    ticking = false;
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    }
    if (sections.length) {
      var mid = y + window.innerHeight * 0.42, current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= mid) current = sections[i];
      }
      var n = current.getAttribute('data-chapter');
      var nm = current.getAttribute('data-chapter-name');
      if (chapterNum && chapterNum.textContent !== n) chapterNum.textContent = n;
      if (chapterName && chapterName.textContent !== nm) scrambleTo(chapterName, nm, 'chap');
    }
    var net = $('.hero-net-wrap');
    if (net) net.style.transform = 'translateY(' + (Math.min(y, window.innerHeight) * 0.14) + 'px)';
    updateNis();
    updatePin();
    updateRoadmap();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }
  function refresh() { measurePin(); onFrame(); }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measurePin(); onScroll(); });
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

  /* ---------- accordion ---------- */
  $$('.acc-head').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc-item');
      var panel = $('.acc-panel', item);
      var isOpen = item.classList.contains('open');
      $$('.acc-item.open').forEach(function (o) {
        if (o !== item) {
          o.classList.remove('open');
          $('.acc-panel', o).style.height = '0px';
          $('.acc-head', o).setAttribute('aria-expanded', 'false');
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        panel.style.height = '0px';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        panel.style.height = panel.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- triad ---------- */
  var triad = $('#triad');
  if (triad) {
    var tIcons = $$('.triad-icon', triad);
    var tRings = $$('.triad-rings circle', triad);
    var tLabels = $$('.triad-label', triad);
    var order = { neuro: 0, ai: 1, chip: 2 };
    var triadKeys = ['neuro', 'ai', 'chip'];
    var triadAutoTimer = null;
    var triadCurrent = 0;

    function setTriad(key) {
      var idx = order[key];
      triadCurrent = idx;
      tIcons.forEach(function (g, i) { g.classList.toggle('active', i === idx); });
      tRings.forEach(function (c, i) {
        c.classList.toggle('active-ring', i === idx);
        c.style.opacity = i === idx ? '.85' : '.22';
      });
      tLabels.forEach(function (l) { l.classList.toggle('active', l.getAttribute('data-for') === key); });
    }

    tLabels.forEach(function (l) {
      var key = l.getAttribute('data-for');
      l.addEventListener('mouseenter', function () { stopTriadAuto(); setTriad(key); });
      l.addEventListener('focus', function () { stopTriadAuto(); setTriad(key); });
      l.addEventListener('click', function () { setTriad(key); });
    });

    /* auto-cycle for smoother mobile experience */
    function startTriadAuto() {
      if (triadAutoTimer) return;
      triadAutoTimer = setInterval(function () {
        triadCurrent = (triadCurrent + 1) % 3;
        setTriad(triadKeys[triadCurrent]);
      }, 2500);
    }
    function stopTriadAuto() {
      if (triadAutoTimer) { clearInterval(triadAutoTimer); triadAutoTimer = null; }
    }

    /* Start auto-cycle when triad enters viewport */
    if ('IntersectionObserver' in window && !reduce) {
      var triadObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { setTriad('neuro'); startTriadAuto(); }
          else { stopTriadAuto(); }
        });
      }, { threshold: 0.15 });
      triadObs.observe(triad);
    }
  }

  /* ---------- cursor ---------- */
  var cursor = $('#cursor');
  if (cursor && canHover) {
    var label = document.createElement('span');
    label.className = 'cursor-label mono';
    cursor.appendChild(label);
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; cursor.classList.add('is-active'); }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(loop);
    })();
    $$('a, button, [data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('is-hover');
        label.textContent = el.getAttribute('data-cursor') || '';
      });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); label.textContent = ''; });
    });
  }

  /* ---------- form ---------- */
  var form = $('#contactForm');
  if (form) {
    var submitBtn = form.querySelector('[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.dataset.busy) return;
      form.dataset.busy = '1';
      if (submitBtn) {
        submitBtn.disabled = true;
        var label = submitBtn.querySelector('span');
        if (label) label.textContent = 'Sending…';
      }
      var d = new FormData(form);
      var name = String(d.get('name') || '').trim().slice(0, 80);
      var email = String(d.get('email') || '').trim().slice(0, 254);
      var role = String(d.get('role') || '').trim();
      var message = String(d.get('message') || '').trim().slice(0, 2000);
      var subject = 'Nanoroutes enquiry — ' + role + ' — ' + name;
      var body = 'Name: ' + name + '\nEmail: ' + email + '\nI am a: ' + role + '\n\n' + message;
      var note = $('#formNote');
      if (note) note.textContent = 'Opening your email client…';
      window.location.href = 'mailto:hello@nanoroutes.in?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.setTimeout(function () {
        delete form.dataset.busy;
        if (submitBtn) {
          submitBtn.disabled = false;
          var l = submitBtn.querySelector('span');
          if (l) l.textContent = 'Send message';
        }
      }, 2500);
    });
  }

  /* ---------- neural field ---------- */
  (function () {
    var canvas = document.getElementById('neuralField');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1, parts = [];
    var mouse = { x: -9999, y: -9999 };
    var LINK = 150, RED = '#e5231b';
    function seed() {
      var n = Math.round(Math.min(110, Math.max(45, (w * h) / 16000)));
      parts = [];
      for (var i = 0; i < n; i++) {
        var bx = (Math.random() - 0.5) * 0.5, by = (Math.random() - 0.5) * 0.5;
        parts.push({ x: Math.random() * w, y: Math.random() * h, vx: bx, vy: by, bx: bx, by: by, r: Math.random() * 1.5 + 0.8, red: Math.random() < 0.07 });
      }
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    function step() {
      ctx.clearRect(0, 0, w, h);
      var i, j, p, q, dx, dy, d2, d, a;
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (canHover) {
          dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
          var R = 130;
          if (d2 < R * R && d2 > 0.01) { d = Math.sqrt(d2); var rep = (1 - d / R) * 0.5; p.vx += dx / d * rep; p.vy += dy / d * rep; }
        }
        p.vx += (p.bx - p.vx) * 0.03; p.vy += (p.by - p.vy) * 0.03;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -24) p.x = w + 24; else if (p.x > w + 24) p.x = -24;
        if (p.y < -24) p.y = h + 24; else if (p.y > h + 24) p.y = -24;
      }
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        for (j = i + 1; j < parts.length; j++) {
          q = parts[j]; dx = p.x - q.x; dy = p.y - q.y; d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            d = Math.sqrt(d2); a = (1 - d / LINK) * 0.15;
            ctx.strokeStyle = (p.red || q.red) ? 'rgba(229,35,27,' + (a * 1.7) + ')' : 'rgba(10,10,10,' + a + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      if (canHover) {
        var MR = 190;
        for (i = 0; i < parts.length; i++) {
          p = parts[i]; dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
          if (d2 < MR * MR) {
            d = Math.sqrt(d2); a = (1 - d / MR) * 0.2;
            ctx.strokeStyle = 'rgba(10,10,10,' + a + ')'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        ctx.fillStyle = p.red ? RED : 'rgba(10,10,10,0.5)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
    }
    function loop() { step(); requestAnimationFrame(loop); }
    if (reduce) {
      resize(); step();
      window.addEventListener('resize', function () { resize(); step(); });
      return;
    }
    resize();
    requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener('blur', function () { mouse.x = -9999; mouse.y = -9999; });
  })();

  /* ---------- magnetic ---------- */
  if (canHover && !reduce) {
    $$('.mag').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * 0.28) + 'px,' + (y * 0.28) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- signals off when reduced ---------- */
  if (reduce) { var sg = $('#signals'); if (sg) sg.style.display = 'none'; }

  refresh();
})();
