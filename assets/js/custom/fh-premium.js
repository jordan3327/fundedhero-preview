/* =============================================================
   FundedHero Futures — Premium layer JS
   Sin dependencias. Respeta prefers-reduced-motion y pantallas táctiles.
   ============================================================= */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var WEBM = 'assets/img/FH_R_Secuence/webm/0001-0105.webm';

  /* ------------------------------------------------------------
     0. Desactivar popup Kadence duplicado (seguridad extra)
  ------------------------------------------------------------ */
  try {
    if (window.kadenceConversionsConfig && window.kadenceConversionsConfig.items) {
      window.kadenceConversionsConfig.items = '{}';
    }
  } catch (e) { /* noop */ }

  /* ------------------------------------------------------------
     1. Preloader cinematográfico con el webm del logo
  ------------------------------------------------------------ */
  (function preloader() {
    var pre = document.getElementById('fh-preloader');
    if (!pre) return;
    var start = Date.now();
    var video = pre.querySelector('video');
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      var elapsed = Date.now() - start;
      var wait = REDUCED ? 0 : Math.max(0, 1600 - elapsed);
      setTimeout(function () { pre.classList.add('is-done'); }, wait);
    }
    function tryPlay() {
      if (!video) { finish(); return; }
      video.defaultMuted = true;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.setAttribute('poster', 'assets/img/Sin-titulo-1.png');
      var p = video.play();
      if (p && p.catch) p.catch(function () { finish(); video.pause(); });
    }
    if (REDUCED) { finish(); return; }
    if (window.requestIdleCallback) {
      window.requestIdleCallback(tryPlay, { timeout: 900 });
    } else {
      setTimeout(tryPlay, 60);
    }
    if (window.addEventListener) {
      var limit = 9000;
      window.addEventListener('load', finish);
      setTimeout(function () { finish(); }, limit);
    } else {
      finish();
    }
  })();

  /* ------------------------------------------------------------
     2. Countdown en vivo (marquee)
  ------------------------------------------------------------ */
  (function countdown() {
    var els = document.querySelectorAll('.fh-countdown');
    if (!els.length) return;
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    function tickAll() {
      var now = Date.now();
      els.forEach(function (el) {
        var end = new Date(el.getAttribute('data-deadline')).getTime();
        if (!isFinite(end)) return;
        var d = Math.max(0, end - now);
        if (d === 0) { el.textContent = '55% OFF — ends soon'; return; }
        var days = Math.floor(d / 86400000);
        var h = Math.floor((d % 86400000) / 3600000);
        var m = Math.floor((d % 3600000) / 60000);
        var s = Math.floor((d % 60000) / 1000);
        var out = days > 0 ? days + 'd ' : '';
        el.textContent = out + pad(h) + ':' + pad(m) + ':' + pad(s) + ' left';
      });
    }
    tickAll();
    if (REDUCED) return;
    setInterval(tickAll, 1000);
  })();

  /* ------------------------------------------------------------
     3. Contadores animados (proof strip)
  ------------------------------------------------------------ */
  (function counters() {
    var els = document.querySelectorAll('[data-count-target]');
    if (!els.length) return;
    function fmt(el, v) {
      var dec = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
      if (dec > 0) {
        return Number(v.toFixed(dec)).toLocaleString('en-US', {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec
        });
      }
      return Math.round(v).toLocaleString('en-US');
    }
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count-target'));
      var dur = parseInt(el.getAttribute('data-count-duration') || '1400', 10);
      if (!isFinite(target)) return;
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      if (REDUCED) { el.innerHTML = prefix + '<b>' + fmt(el, target) + '</b>' + suffix; return; }
      el.innerHTML = prefix + '<b>' + fmt(el, 0) + '</b>' + suffix;
      var t0 = performance.now();
      function frame(t) {
        var p = Math.min(1, (t - t0) / dur);
        p = 1 - Math.pow(1 - p, 3);
        var v = target * p;
        el.innerHTML = prefix + '<b>' + fmt(el, v) + '</b>' + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------
     4. Tick de payout en vivo (rotación)
  ------------------------------------------------------------ */
  (function livePayout() {
    var el = document.getElementById('fh-live-payout-text');
    if (!el) return;
    var rows = [
      ['$2,410', 'Alexandria, VA', '12 min ago'],
      ['$8,940', 'London, UK', '38 min ago'],
      ['$3,275', 'Austin, TX', '1 hr ago'],
      ['$12,050', 'Toronto, CA', '2 hrs ago'],
      ['$5,600', 'Miami, FL', '3 hrs ago'],
      ['$1,920', 'Berlin, DE', '4 hrs ago']
    ];
    var i = 0;
    el.innerHTML = rows[0][0] + ' paid to <span>' + rows[0][1] + '</span> · ' + rows[0][2];
    if (REDUCED) return;
    setInterval(function () {
      i = (i + 1) % rows.length;
      var r = rows[i];
      el.style.opacity = 0;
      setTimeout(function () {
        el.innerHTML = r[0] + ' paid to <span>' + r[1] + '</span> · ' + r[2];
        el.style.opacity = 1;
      }, 260);
    }, 6000);
  })();

  /* ------------------------------------------------------------
     5. FAQ acordeón
  ------------------------------------------------------------ */
  (function faq() {
    var items = document.querySelectorAll('.fh-faq__item');
    if (!items.length) return;
    items.forEach(function (item) {
      var q = item.querySelector('.fh-faq__q');
      if (!q) return;
      q.addEventListener('click', function () {
        var open = item.classList.toggle('is-open');
        items.forEach(function (other) {
          if (other !== item) other.classList.remove('is-open');
        });
        var a = item.querySelector('.fh-faq__a');
        if (a) a.setAttribute('aria-hidden', open ? 'false' : 'true');
      });
    });
  })();

  /* ------------------------------------------------------------
     6. Botones magnéticos
  ------------------------------------------------------------ */
  (function magnetic() {
    if (!FINE || REDUCED) return;
    var els = document.querySelectorAll('.cta-button, .fs-cta, .pf-card__buy, .super-btn, .gb-button-b0a1b4fa, [data-magnetic]');
    if (!els.length) return;
    els.forEach(function (el) {
      el.classList.add('fh-magnetic');
      el.addEventListener('pointerenter', function () {
        el.style.transition = 'transform .12s ease-out';
      });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var relX = e.clientX - (r.left + r.width / 2);
        var relY = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + relX * 0.2 + 'px,' + relY * 0.3 + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = 'translate(0,0)';
      });
    });
  })();

  /* ------------------------------------------------------------
     7. Tilt 3D en cards (precios + testimonios)
  ------------------------------------------------------------ */
  (function tilt() {
    if (!FINE || REDUCED) return;
    var selectors = '.pf-carousel__track > .pf-card, [data-tilt] > *';
    var els = document.querySelectorAll(selectors);
    if (!els.length) return;
    els.forEach(function (card) {
      card.classList.add('fh-tilt');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 6) + 'deg) translateZ(0)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)';
        card.style.transform = '';
        setTimeout(function () { card.style.transition = ''; }, 500);
      });
    });
  })();

  /* ------------------------------------------------------------
     8. Parallax sutil (logo 3D + hero copy)
  ------------------------------------------------------------ */
  (function parallax() {
    if (!FINE || REDUCED) return;
    var targets = document.querySelectorAll('.fh-hero-3d');
    if (!targets.length) return;
    var ticking = false;
    function apply() {
      ticking = false;
      var sy = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (sy < window.innerHeight * 1.4) {
        targets.forEach(function (el) {
          el.style.transform = 'translateY(' + (sy * 0.14) + 'px)';
        });
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    window.addEventListener('resize', apply, { passive: true });
  })();

  /* ------------------------------------------------------------
     9. Cursor personalizado (solo escritorio)
  ------------------------------------------------------------ */
  (function cursor() {
    if (!FINE || REDUCED || (window.innerWidth < 900)) return;
    var dot = document.createElement('div');
    dot.className = 'fh-cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'fh-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add('fh-cursor-on');
    var x = 0, y = 0, rx = 0, ry = 0, raf = null;
    document.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      dot.style.transform = 'translate(' + (x - 3.5) + 'px,' + (y - 3.5) + 'px)';
      var t = e.target;
      var interactive = t && t.closest && t.closest('a, button, [data-tilt], .pf-card, .fh-faq__item, input, select, textarea');
      document.documentElement.classList.toggle('fh-cursor-grow', !!interactive);
      if (!raf) {
        raf = requestAnimationFrame(function tick() {
          rx += (x - rx) * 0.18;
          ry += (y - ry) * 0.18;
          ring.style.transform = 'translate(' + (rx - 17) + 'px,' + (ry - 17) + 'px)';
          raf = null;
        });
      }
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      dot.style.opacity = 0; ring.style.opacity = 0;
    });
    document.addEventListener('pointerenter', function () {
      dot.style.opacity = 1; ring.style.opacity = 1;
    });
  })();

  /* ------------------------------------------------------------
     10. Shine dorado en títulos de héroe/secciones
  ------------------------------------------------------------ */
  (function shine() {
    if (REDUCED) return;
    var els = document.querySelectorAll(
      '.fh-hero [data-aos="fade-up"] h1, ' +
      '.gb-headline-6cf30d5b, ' +
      '.gb-headline-d3b7aea8, ' +
      '.fh-faq-title, .fh-testimonials__head h2, .fh-proof h2'
    );
    els.forEach(function (el) { el.classList.add('fh-shine'); });
  })();
})();