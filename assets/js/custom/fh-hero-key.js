/* FH hero keying: vuelve transparente el negro del video en vivo (canvas),
 * asi las particulas se ven detras. El <video> original SOLO se oculta
 * despues del primer frame keyeado OK; si algo falla (CORS file://,
 * autoplay bloqueado) el video queda visible. Solo presentacion. */
(function () {
  'use strict';
  var video = document.querySelector('video.gb-media-c91759a2');
  if (!video || !window.requestAnimationFrame) return;
  try {
    if (window.matchMedia &&
        (matchMedia('(prefers-reduced-motion: reduce)').matches ||
         matchMedia('(max-width: 768px)').matches)) return;
  } catch (e) {}
  // Canvas 2d con lectura de pixeles: si no existe, no se hace nada.
  var probe = document.createElement('canvas');
  if (!probe.getContext) return;
  var W = 760, H = 760, T0 = 14, T1 = 38;

  function start() {
    if (video.readyState < 2) {
      video.addEventListener('canplay', start, { once: true });
      return;
    }
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.className = video.className;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.display = 'none';
    video.parentNode.insertBefore(canvas, video);
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) { canvas.parentNode.removeChild(canvas); return; }
    var buf = document.createElement('canvas');
    buf.width = W;
    buf.height = H;
    var bctx = buf.getContext('2d', { willReadFrequently: true });
    if (!bctx) { canvas.parentNode.removeChild(canvas); return; }
    var revealed = false, dead = false, i, l, a, p, d;

    function abort() {
      if (dead) return;
      dead = true;
      try {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        video.style.display = '';
        video.removeAttribute('aria-hidden');
        var pr = video.play();
        if (pr && pr.catch) pr.catch(function () {});
      } catch (e) {}
    }

    function frame() {
      if (dead) return;
      if (window.FH_SEQ_STARTED) { // la secuencia tomo el mando: ceder
        try {
          if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        } catch (e) {}
        dead = true;
        return;
      }
      if (!video.paused && !video.ended) {
        try {
          bctx.drawImage(video, 0, 0, W, H);
          d = bctx.getImageData(0, 0, W, H);
        } catch (e) {
          abort(); // CORS (file://) u otro bloqueo: dejar el video.
          return;
        }
        p = d.data;
        for (i = 0; i < p.length; i += 4) {
          l = (p[i] * 77 + p[i + 1] * 150 + p[i + 2] * 29) >> 8;
          if (l <= T0) a = 0;
          else if (l >= T1) a = 255;
          else a = ((l - T0) * 255 / (T1 - T0)) | 0;
          if (a < p[i + 3]) p[i + 3] = a;
        }
        ctx.putImageData(d, 0, 0);
        if (!revealed) {
          revealed = true;
          canvas.style.display = '';
          video.style.display = 'none';
          video.setAttribute('aria-hidden', 'true');
        }
      } else if (!revealed) {
        // Autoplay bloqueado: reintentar al primer gesto, mientras se ve el video.
        var kick = function () {
          try {
            var pr = video.play();
            if (pr && pr.catch) pr.catch(function () {});
          } catch (e) {}
        };
        document.addEventListener('pointerdown', kick, { once: true });
        document.addEventListener('touchend', kick, { once: true });
        setTimeout(function () { if (!revealed && !dead) requestAnimationFrame(frame); }, 800);
        return;
      }
      requestAnimationFrame(frame);
    }
    try {
      var pr = video.play();
      if (pr && pr.catch) pr.catch(function () {});
    } catch (e) {}
    requestAnimationFrame(frame);
    // Red de seguridad: si en 6s no hubo frame, mostrar el video.
    setTimeout(function () { if (!revealed) abort(); }, 6000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
