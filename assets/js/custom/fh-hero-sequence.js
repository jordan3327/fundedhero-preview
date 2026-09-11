/* FH hero sequence v2 — PNG originales tal cual (FH_R_Secuence/secuencia/),
 * estilo Apple product pages: precarga en segundo plano con progreso,
 * 30fps en loop, retina-ready y responsive. Arranca al tener 30 cuadros
 * y sigue cargando el resto sin parpadear. Si falla, queda el <video>. */
(function () {
  'use strict';

  var COUNT = 105;
  var FPS = 30;
  var FRAME_MS = 1000 / FPS;
  var CONCURRENCY = 8;
  var TIMEOUT_MS = 90000;

  var video = document.querySelector('video.gb-media-c91759a2');
  if (!video || !window.requestAnimationFrame) return;
  try {
    if (window.matchMedia &&
        (matchMedia('(prefers-reduced-motion: reduce)').matches ||
         matchMedia('(max-width: 1023px)').matches ||
         (navigator.connection && navigator.connection.saveData))) return;
    if (navigator.deviceMemory && navigator.deviceMemory < 4) return;
  } catch (e) {}

  var poster = video.getAttribute('poster') || '';
  var base = poster.slice(0, poster.lastIndexOf('/') + 1);
  var DIR = base + 'FH_R_Secuence/logo-web/frame-';

  function src(i) {
    var n = String(i);
    while (n.length < 3) n = '0' + n;
    return DIR + n + '.png';
  }

  var wrap = video.parentNode;
  var frames = new Array(COUNT + 1);
  var loaded = 0, failed = 0, inflight = 0, next = 1;
  var started = false, dead = false;

  var bar = document.createElement('div');
  bar.className = 'fh-seq-load';
  bar.setAttribute('aria-hidden', 'true');
  var fill = document.createElement('span');
  bar.appendChild(fill);
  wrap.appendChild(bar);

  function paint() {
    fill.style.width = Math.round((loaded / COUNT) * 100) + '%';
  }

  function cleanup() {
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function loadOne(i) {
    inflight++;
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      frames[i] = img;
      loaded++;
      inflight--;
      paint();
      pump();
      maybeStart();
    };
    img.onerror = function () {
      failed++;
      inflight--;
      pump();
      maybeStart();
    };
    img.src = src(i);
  }

  function pump() {
    if (dead || started && loaded + failed >= COUNT) return;
    while (next <= COUNT && inflight < CONCURRENCY) {
      loadOne(next++);
    }
  }

  function maybeStart() {
    if (started || dead) return;
    if (loaded + failed >= COUNT) {
      if (failed > 10) { dead = true; cleanup(); return; } // fallback: queda el video
      startLoop();
    }
  }

  setTimeout(function () {
    if (!started) { dead = true; cleanup(); }
  }, TIMEOUT_MS);

  var canvas = null, ctx = null;
  var cssW = 0, cssH = 0, dpr = 1;
  var idx = 1, acc = 0, last = 0, visible = true, drewOnce = false;

  function fit() {
    var r = wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : null;
    var w = (r && r.width) || video.clientWidth || 761;
    var h = (r && r.height) || video.clientHeight || 673;
    try {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    } catch (e) { dpr = 1; }
    cssW = Math.max(1, Math.round(w));
    cssH = Math.max(1, Math.round(h));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
  }

  function draw() {
    var img = frames[idx];
    if (!img) return;
    var sw = img.naturalWidth || 880, sh = img.naturalHeight || 880;
    var s = Math.max(canvas.width / sw, canvas.height / sh);
    var dw = sw * s, dh = sh * s;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    drewOnce = true;
  }

  function tick(now) {
    if (dead) return;
    if (visible && !document.hidden) {
      if (!last) last = now;
      acc += now - last;
      last = now;
      var moved = false, guard = 0;
      while (acc >= FRAME_MS && guard < 4) {
        guard++;
        acc -= FRAME_MS;
        var n = idx + 1;
        if (n > COUNT) n = 1;
        if (frames[n]) { idx = n; moved = true; }
        else { acc = 0; break; }
      }
      if (moved || !drewOnce) draw();
    } else {
      last = 0;
    }
    requestAnimationFrame(tick);
  }

  function startLoop() {
    if (started || dead) return;
    started = true;
    window.FH_SEQ_STARTED = true;
    canvas = document.createElement('canvas');
    canvas.className = video.className;
    canvas.setAttribute('aria-hidden', 'true');
    wrap.insertBefore(canvas, video);
    ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    fit();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { fit(); draw(); }).observe(wrap);
    } else {
      window.addEventListener('resize', function () { fit(); draw(); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es.length ? es[0].isIntersecting : true;
        if (visible) last = 0;
      }, { threshold: 0 }).observe(wrap);
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) last = 0;
    });
    video.style.display = 'none';
    video.setAttribute('aria-hidden', 'true');
    try {
      if (!video.paused) video.pause();
    } catch (e) {}
    cleanup();
    draw();
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pump);
  } else {
    pump();
  }
  window.FH_SEQ = { frames: COUNT, fps: FPS };
})();
