/* FH hero sequence — WebM logo animation loop.
 * Plays assets/img/FH_R_Secuence/webm/0001-0105.webm on a <video>
 * in real time (native 30fps), started as soon as possible. */
(function () {
  'use strict';

  var SRC = 'assets/img/FH_R_Secuence/webm/0001-0105.webm';
  var FALLBACK_SRC = 'assets/img/Sin-titulo-1.png';
  var TIMEOUT_MS = 60000;

  var container = document.querySelector('.fh-hero-3d');
  if (!container) return;

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

  function showFallback() {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    container.innerHTML =
      '<img src="' + FALLBACK_SRC + '" alt="FundedHero Futures" style="width:100%;height:100%;object-fit:contain;" />';
  }

  var el = document.createElement('video');
  if (reducedMotion() || typeof el.play !== 'function') {
    el = null;
    showFallback();
    return;
  }

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
  }, false);

  el.addEventListener('error', function () {
    showFallback();
  }, false);

  container.style.position = 'relative';
  container.insertBefore(el, container.firstChild);
  var p = el.play();
  if (p && p.catch) p.catch(function () {});

  setTimeout(function () {
    if (!playing) showFallback();
  }, TIMEOUT_MS);
})();