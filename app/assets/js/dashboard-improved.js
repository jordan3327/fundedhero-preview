(function () {
  'use strict';

  var BUY_CHALLENGE_PAGE = '../index.html#gb-container-698ba205';
  var LOGIN_PAGE = 'index.html';

  var STATS = [
    { id: 'payouts', label: 'Total payouts', value: 12450.0, prefix: '$', format: 'money', delta: 18.2, up: true, note: 'vs last 30 days', spark: [2, 4, 3, 6, 5, 8, 7, 11, 9, 13, 12, 16], icon: 'wallet' },
    { id: 'accounts', label: 'Total accounts', value: 24, format: 'int', delta: 3.0, up: true, note: '2 new this month', spark: [4, 5, 4, 7, 8, 7, 9, 10, 11, 12, 13, 15], icon: 'layers' },
    { id: 'passed', label: 'Passed accounts', value: 14, format: 'int', delta: 58.3, up: true, note: 'pass rate overall', spark: [3, 4, 5, 5, 6, 7, 6, 8, 9, 9, 11, 12], icon: 'award' },
    { id: 'funded', label: 'Funded accounts', value: 9, format: 'int', delta: 2.0, up: true, note: '2 new this month', spark: [2, 3, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9], icon: 'banknote' },
    { id: 'trades', label: 'Total trades', value: 1284, format: 'int', delta: 12.4, up: true, note: 'avg 42.8 / day', spark: [8, 9, 7, 10, 11, 10, 12, 13, 12, 14, 15, 16], icon: 'candlestick' },
    { id: 'pnl', label: 'Total P&L', value: 8930.55, prefix: '+$', format: 'money', delta: 22.1, up: true, note: 'since first account', spark: [1, 2, 1, 3, 4, 3, 5, 6, 7, 8, 9, 11], icon: 'trending' }
  ];

  var MONTHS = [
    { m: 'Oct', v: 12.4 }, { m: 'Nov', v: 14.1 }, { m: 'Dec', v: 13.8 }, { m: 'Jan', v: 16.2 },
    { m: 'Feb', v: 18.9 }, { m: 'Mar', v: 17.4 }, { m: 'Apr', v: 21.3 }, { m: 'May', v: 24.8 },
    { m: 'Jun', v: 23.1 }, { m: 'Jul', v: 27.6 }, { m: 'Aug', v: 29.2 }, { m: 'Sep', v: 33.5 }
  ];

  var PAYOUTS = [
    { method: 'PayPal', date: 'Sep 12, 2026', amt: '$2,500.00', status: 'paid' },
    { method: 'Bank Transfer', date: 'Aug 28, 2026', amt: '$1,850.00', status: 'paid' },
    { method: 'PayPal', date: 'Aug 09, 2026', amt: '$2,000.00', status: 'paid' }
  ];

  var ACCOUNTS = [
    { name: 'Future 50K', balance: '52,318.75', pnl: '+2,318.75', pnlPct: '+4.64%', up: true, target: 46, hint: 'First payout target', stage: '2-Step', status: 'Funded', chip: 'green', lead: '2-Step' },
    { name: 'Future 100K', balance: '104,610.80', pnl: '+4,610.80', pnlPct: '+4.61%', up: true, target: 41, hint: 'First payout target', stage: '2-Step', status: 'Funded', chip: 'green', lead: '2-Step' },
    { name: 'Future 25K', balance: '26,140.55', pnl: '+1,140.55', pnlPct: '+4.56%', up: true, target: 64, hint: '1-Step funding', stage: '1-Step', status: 'Funded', chip: 'gold', lead: '1-Step' }
  ];

  var ICONS = {
    wallet: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
    layers: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>',
    award: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    banknote: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
    candlestick: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M9 5v4"/><rect width="4" height="6" x="7" y="9" rx="1"/><path d="M9 15v2"/><path d="M17 3v2"/><rect width="4" height="8" x="15" y="5" rx="1"/><path d="M17 13v3"/></svg>',
    trending: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>'
  };

  var range = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  function fmtMoney(v) {
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function svgPoints(vals, w, h) {
    var max = Math.max.apply(null, vals);
    var min = Math.min.apply(null, vals);
    var span = (max - min) || 1;
    return vals.map(function (v, i) {
      var x = (i / (vals.length - 1)) * w;
      var y = h - 3 - ((v - min) / span) * (h - 6);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }

  function buildSpark(idPath, vals) {
    return '<svg class="spark" viewBox="0 0 100 34" preserveAspectRatio="none"><polyline points="' + svgPoints(vals, 100, 34) + '" stroke="' + (idPath === 'pnl' ? '#07c585' : '#ffd24d') + '"/></svg>';
  }

  function renderStats() {
    var wrap = document.getElementById('stats');
    if (!wrap) return;
    wrap.innerHTML = STATS.map(function (s, i) {
      return '<article class="stat-card anim" style="animation-delay:' + (i * 60) + 'ms" data-key="' + s.label + '" data-val="' + s.value + '">' +
        '<div class="stat-top"><div><div class="stat-label">' + s.label + '</div><div class="stat-value" data-count="' + s.format + '" data-target="' + s.value + (s.prefix ? '" data-prefix="' + s.prefix : '') + '">' + (s.prefix || '') + '0.00</div></div>' +
        '<span class="stat-icon">' + ICONS[s.icon] + '</span></div>' +
        '<div class="stat-meta"><span class="delta ' + (s.up ? 'up' : 'down') + '">' + (s.up ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide" style="width:10px;height:10px"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide" style="width:10px;height:10px"><path d="m5 12 7 7 7-7"/><path d="M12 19V5"/></svg>') + s.delta + '%</span><span class="stat-note">' + s.note + '</span></div>' +
        buildSpark(s.id, s.spark) +
        '</article>';
    }).join('');
  }

  function renderChart() {
    var wrap = document.getElementById('chart-bars');
    if (!wrap) return;
    var max = Math.max.apply(null, MONTHS.map(function (d) { return d.v; }));
    wrap.innerHTML = MONTHS.map(function (d, i) {
      return '<div class="bar" style="height:' + Math.round((d.v / max) * 100) + '%; transition-delay:' + (i * 45) + 'ms" data-v="' + d.v + '"><span>$' + d.v + 'K</span></div>';
    }).join('');
    document.getElementById('chart-labels').innerHTML = MONTHS.map(function (d) { return '<span>' + d.m + '</span>'; }).join('');
  }

  function renderPayouts() {
    var wrap = document.getElementById('payouts');
    if (!wrap) return;
    wrap.innerHTML = PAYOUTS.map(function (p) {
      var isGold = p.method === 'PayPal';
      return '<div class="pay-row"><span class="pay-icon ' + (isGold ? 'gold' : 'green') + '">' + (isGold ?
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" style="width:16px;height:16px"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' :
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" style="width:16px;height:16px"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>') + '</span>' +
        '<div class="pay-body"><div class="t">' + p.method + '</div><div class="d">' + p.date + '</div></div>' +
        '<div class="pay-amt">' + p.amt + '<small>' + p.status + '</small></div></div>';
    }).join('');
  }

  function renderAccounts() {
    var wrap = document.getElementById('accounts');
    if (!wrap) return;
    wrap.innerHTML = ACCOUNTS.map(function (a, i) {
      return '<article class="acct-card anim" style="animation-delay:' + (i * 80) + 'ms">' +
        '<div class="acct-top"><div><div class="acct-name">' + a.name + '</div>' +
        '<div class="acct-stage"><span class="chip ' + a.chip + '">' + a.status + '</span><span class="chip slate">' + a.lead + '</span></div></div>' +
        '<span class="pay-icon ' + (a.chip === 'green' ? 'green' : 'gold') + '">' + ICONS.layers + '</span></div>' +
        '<div><div class="acct-balance">$' + a.balance + '</div></div>' +
        '<div class="acct-pnl">Net P&L <b class="up">' + a.pnl + '  (' + a.pnlPct + ')</b></div>' +
        '<div><div class="progress"><i style="width:0%" data-w="' + a.target + '%"></i></div><div class="progress-label"><span>' + a.hint + '</span><span>' + a.target + '%</span></div></div>' +
        '<div class="acct-actions"><button class="btn-outline" data-act="view" data-acc="' + a.name + '">View</button>' +
        '<button class="btn-outline" data-act="share" data-acc="' + a.name + '"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" style="width:14px;height:14px"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 4v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4"/><path d="M10 22h4"/><path d="M7 8H2"/><path d="M22 8h-5"/></svg> Share</button></div>' +
        '</article>';
    }).join('');
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" style="width:16px;height:16px"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M12 7v5l3 3"/><path d="M21 3v6h-6"/></svg>' + msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    var isMoney = el.getAttribute('data-count') === 'money';
    var prefix = el.getAttribute('data-prefix') || (isMoney ? '$' : '');
    var dur = 850, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = target * eased;
      el.textContent = prefix + (isMoney ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(v).toLocaleString('en-US'));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var drawerOpen = false;
  function setDrawer(open) {
    drawerOpen = open;
    document.getElementById('sidebar').classList.toggle('open', open);
    document.getElementById('drawer-backdrop').classList.toggle('show', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  function wire() {
    var burger = document.getElementById('burger');
    var close = document.getElementById('sb-close');
    var backdrop = document.getElementById('drawer-backdrop');
    if (burger) burger.addEventListener('click', function () { setDrawer(true); });
    if (close) close.addEventListener('click', function () { setDrawer(false); });
    if (backdrop) backdrop.addEventListener('click', function () { setDrawer(false); });

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!t) return;
      var act = t.getAttribute('data-act');
      if (act === 'view') toast('Vista de demo: ' + t.getAttribute('data-acc'));
      if (act === 'share') toast('Enlace de la cuenta copiado: ' + t.getAttribute('data-acc'));
    });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-buy]') : null;
      if (!btn) return;
      e.preventDefault();
      window.location.href = BUY_CHALLENGE_PAGE;
    });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-logout]') : null;
      if (!btn) return;
      window.location.href = LOGIN_PAGE;
    });

    var bell = document.getElementById('bell');
    if (bell) bell.addEventListener('click', function () {
      toast('3 notificaciones nuevas en tu bandeja (demo)');
    });

    var platform = document.getElementById('platform');
    if (platform) platform.addEventListener('click', function () {
      toast('Demo local: la plataforma se abre en la sesión real');
    });

    var segWrap = document.getElementById('seg');
    if (segWrap) segWrap.addEventListener('click', function (e) {
      if (!e.target.closest('button')) return;
      var btns = segWrap.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove('on');
      e.target.classList.add('on');
      toast('Periodo cambiado a ' + e.target.textContent);
    });
  }

  function observerReady(root) {
    if (!window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        io.unobserve(t);
        if (t.classList.contains('bar')) { t.style.transform = 'scaleY(1)'; return; }
        if (t.querySelector('i') && t.querySelector('i').getAttribute('data-w')) {
          t.querySelector('i').style.width = t.querySelector('i').getAttribute('data-w');
          return;
        }
        var counter = t.querySelector('[data-count]');
        if (counter) countUp(counter);
      });
    }, { threshold: 0.3 });
    var targets = root.querySelectorAll('.bar, .stat-card, .acct-card, .progress');
    for (var i = 0; i < targets.length; i++) io.observe(targets[i]);
  }

  function init() {
    renderStats();
    renderChart();
    renderPayouts();
    renderAccounts();
    wire();
    observerReady(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();