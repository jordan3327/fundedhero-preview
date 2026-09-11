/* FH hero sequence — optimised logo frames (webp) on <canvas>, 30fps loop.
 * Loads from assets/img/FH_R_Secuence/logo-web/frame-###.webp
 * Shows existing <img> until the canvas has drawn its first frame. */
(function () {
  'use strict';

  var DIR = 'assets/img/FH_R_Secuence/logo-web/frame-';
  var EXT = '.webp';
  var COUNT = 105;
  var FPS = 30;
  var FRAME_MS = 1000 / FPS;
  var CONCURRENCY = 6;
  var TIMEOUT_MS = 60000;

  var container = document.getElementById('fh-hero-seq');
  if (!container) return;
  var canvas = document.getElementById('fh-hero-canvas');
  if (!canvas || !canvas.getContext) return;

  function src(i) {
    var n = String(i);
    while (n.length < 3) n = '0' + n;
    return DIR + n + EXT;
  }

  var frames = new Array(COUNT + 1);
  var inflight = 0, next = 1, finished = false, loaded = 0, failed = 0;
  var fallback = document.getElementById('fh-hero-fallback');

  var bar = document.createElement('div');
  bar.className = 'fh-seq-load';
  bar.setAttribute('aria-hidden', 'true');
  var fill = document.createElement('span');
  bar.appendChild(fill);
  container.appendChild(bar);

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
      fill.style.width = Math.round((loaded / COUNT) * 100) + '%';
      if (loaded === 1) startLoop();
      pump();
      if (loaded + failed >= COUNT) finish();
    };
    img.onerror = function () {
      failed++;
      inflight--;
      pump();
      if (loaded + failed >= COUNT) finish();
    };
    img.src = src(i);
  }

  function pump() {
    if (finished) return;
    while (next <= COUNT && inflight < CONCURRENCY) {
      loadOne(next++);
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    cleanup();
  }

  setTimeout(finish, TIMEOUT_MS);

  var ctx, dpr = 1;
  var idx = 1, acc = 0, last = 0, visible = true, started = false;

  function fit() {
    var r = container.getBoundingClientRect();
    var w = r.width || 400;
    var h = r.height || 400;
    try { dpr = Math.min(window.devicePixelRatio || 1, 2); } catch (e) { dpr = 1; }
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }

  function draw() {
    var img = frames[idx];
    if (!img) return;
    var sw = img.naturalWidth || 3200, sh = img.naturalHeight || 3200;
    var s = Math.max(canvas.width / sw, canvas.height / sh);
    var dw = sw * s, dh = sh * s;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  }

  function tick(now) {
    if (visible && !document.hidden) {
      if (!last) last = now;
      acc += now - last;
      last = now;
      var guard = 0;
      while (acc >= FRAME_MS && guard < 4) {
        guard++;
        acc -= FRAME_MS;
        var n = idx + 1;
        if (n > COUNT) n = 1;
        if (frames[n]) { idx = n; }
        else { acc = 0; break; }
      }
      draw();
    } else {
      last = 0;
    }
    requestAnimationFrame(tick);
  }

  function startLoop() {
    if (started) return;
    started = true;
    ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    fit();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { fit(); draw(); }).observe(container);
    } else {
      window.addEventListener('resize', function () { fit(); draw(); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es.length ? es[0].isIntersecting : true;
        if (visible) last = 0;
      }, { threshold: 0 }).observe(container);
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) last = 0;
    });
    draw();
    if (fallback) fallback.style.display = 'none';
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pump);
  } else {
    pump();
  }
})();