/* FH hero sequence — WebM logo animation loop.
 * Plays assets/img/FH_R_Secuence/webm/0001-0105.webm on a <video>
 * in real time (native 30fps), started as soon as possible. */
(function () {
  'use strict';

  var SRC = 'assets/img/FH_R_Secuence/webm/0001-0105.webm';
  var TIMEOUT_MS = 60000;

  var container = document.getElementById('fh-hero-seq');
  if (!container) return;
  var fallback = document.getElementById('fh-hero-fallback');

  function reducedMotion() {
    try {
      if (window.matchMedia &&
          (matchMedia('(prefers-reduced-motion: reduce)').matches ||
           matchMedia('(max-width: 767px)').matches ||
           (navigator.connection && navigator.connection.saveData))) {
        return true;
      }
      if (navigator.deviceMemory && navigator.deviceMemory < 2) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  var el = document.createElement('video');
  if (reducedMotion() || typeof el.play !== 'function') return;

  el.setAttribute('aria-hidden', 'true');
  el.muted = true;
  el.loop = true;
  el.autoplay = true;
  el.playsInline = true;
  el.setAttribute('webkit-playsinline', '');
  el.preload = 'auto';
  el.playbackRate = 1;
  el.src = SRC;
  el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;background:transparent;opacity:0;';

  var playing = false;
  el.addEventListener('playing', function () {
    if (playing) return;
    playing = true;
    el.style.opacity = '1';
    if (fallback) fallback.style.display = 'none';
  }, false);

  el.addEventListener('error', function () {
    if (fallback) fallback.style.display = '';
    if (el.parentNode) el.parentNode.removeChild(el);
  }, false);

  container.insertBefore(el, container.firstChild);
  var p = el.play();
  if (p && p.catch) p.catch(function () {});

  setTimeout(function () {
    if (!playing && fallback) fallback.style.display = '';
  }, TIMEOUT_MS);
})();