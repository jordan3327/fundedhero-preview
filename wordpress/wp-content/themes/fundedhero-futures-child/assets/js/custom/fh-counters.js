/* Contadores animados de la barra de stats: de 0 al valor objetivo.
   Se disparan cuando el contenedor `.stt-bar.reveal` pasa a `is-visible`
   (entra en pantalla). Sin dependencias. Respeta prefers-reduced-motion
   y los separadores de miles y decimales ("$450k", "100,000+", "TrustScore 4.8"). */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      el.innerHTML = prefix + '<b>' + fmt(el, target * p) + '</b>' + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var byTrigger = new Map();
  var triggers = [];
  els.forEach(function (el) {
    var trigger = el.closest('.fh-stats .reveal') || el;
    if (!byTrigger.has(trigger)) {
      byTrigger.set(trigger, []);
      triggers.push(trigger);
    }
    byTrigger.get(trigger).push(el);
  });

  function fire(trigger) {
    (byTrigger.get(trigger) || []).forEach(run);
  }

  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { fire(entry.target); io.unobserve(entry.target); }
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

  triggers.forEach(function (trigger) {
    if (trigger.classList.contains('is-visible')) fire(trigger);
    else io.observe(trigger);
  });
})();