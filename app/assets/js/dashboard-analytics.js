/* ============================================================
   dashboard-analytics.js — Extra sections for the modernized
   dashboard.html. Reads ONLY window.FHData. Pure additive:
   it renders into fh-* containers and never touches existing
   ids/events/links. Chart canvases (equity, monthly, terminal)
   are owned by dashboard-charts.js.
   ============================================================ */
(function () {
  'use strict';

  function data() {
    return window.FHData || null;
  }

  function money(v, signed) {
    if (v === null || v === undefined) return '\u2014';
    var s = v < 0 ? '-' : (signed ? '+' : '');
    return s + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ---------- account selector (demo context switch) ---------- */
  var ACC_STATE = { id: null };

  function selectedAccount() {
    var D = data();
    if (!D || !D.accounts || !D.accounts.length) return null;
    var i;
    for (i = 0; i < D.accounts.length; i++) {
      if (D.accounts[i].id === ACC_STATE.id) return D.accounts[i];
    }
    return D.accounts[0];
  }

  function accountStats() {
    var D = data();
    var acc = selectedAccount();
    if (!acc) return D ? D.statistics : null;
    return {
      accountBalance: acc.balance,
      equity: acc.balance,
      todayPnl: null,      /* no trade rows exist for this account yet */
      totalPnl: acc.pnl,
      maxDrawdown: null,
      dailyLossLimit: +(acc.size * 0.05).toFixed(2), /* standard daily rule, derived from demo size */
      profitTarget: null,
      tradingDays: null
    };
  }

  function accountRisk() {
    var D = data();
    var acc = selectedAccount();
    if (!acc) {
      var g = D ? D.risk : null;
      return g || { dailyLossUsedPct: null, drawdownUsedPct: null, targetPct: null, status: 'normal' };
    }
    return {
      dailyLossUsedPct: null,
      drawdownUsedPct: null,
      targetPct: acc.progress,
      status: 'normal',
      statusText: 'Demo · awaiting trade data'
    };
  }

  /* ---------- metrics ---------- */
  function renderMetrics(s) {
    var wrap = document.getElementById('fh-metrics');
    var D = data();
    if (!wrap || !D) return;
    if (!s) s = D.statistics;
    var items = [
      { label: 'Account Balance', value: money(s.accountBalance), cls: '', icon: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>' },
      { label: 'Equity', value: money(s.equity), cls: '', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="m9 11 3-3 3 3"/><path d="M12 16v-5"/>' },
      { label: "Today's P&L", value: money(s.todayPnl, true), cls: 'up', icon: '<path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' },
      { label: 'Total P&L', value: money(s.totalPnl, true), cls: s.totalPnl < 0 ? 'down' : 'up', icon: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>' },
      { label: 'Max Drawdown', value: money(s.maxDrawdown, true), cls: 'down', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>' },
      { label: 'Daily Loss Limit', value: money(s.dailyLossLimit), cls: '', icon: '<path d="m15.9 18.3-5.4-5.4"/><path d="M11.6 23.1 21.2 13.5"/><path d="M13.8 21.3 21 14"/><path d="M12.7 2.4 2.4 12.7a2 2 0 0 0 0 2.8l6.4 6.4a2 2 0 0 0 2.8 0l10.2-10.2"/>' },
      { label: 'Profit Target', value: money(s.profitTarget), cls: '', icon: '<path d="M15 4.5v5H4.7a2.7 2.7 0 0 0 0 5H15v5"/><path d="M18 6a3 3 0 0 0-3-3"/><path d="M18 18a3 3 0 0 0 3-3"/><rect x="15" y="4" width="8" height="16" rx="2"/>' },
      { label: 'Trading Days', value: s.tradingDays === null || s.tradingDays === undefined ? '\u2014' : String(s.tradingDays), cls: '', icon: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>' }
    ];
    wrap.innerHTML = items.map(function (it) {
      return '<div class="fh-metric"><span class="fh-m-icon">' + it.icon +
        '</span><div class="fh-m-label">' + it.label + '</div><div class="fh-m-value ' + it.cls + '">' + it.value +
        '</div><div class="fh-m-note">' + (D.meta.demo ? 'demo' : 'live') + '</div></div>';
    }).join('');
  }

  /* ---------- risk ---------- */
  function renderRisk(r) {
    var wrap = document.getElementById('fh-risk-rows');
    var statusWrap = document.getElementById('fh-risk-status');
    var D = data();
    if (!wrap || !D) return;
    if (!r) r = D.risk;

    var status = r.status === 'warn' ? 'warn' : (r.status === 'danger' ? 'danger' : 'ok');
    var statusText = r.statusText || (r.status === 'warn' ? 'Near limit' : (r.status === 'danger' ? 'Breached' : 'Safe'));
    if (statusWrap) statusWrap.innerHTML = '<span class="fh-status ' + status + '"><i></i>' + statusText + '</span>';

    function row(label, val, pct, bar) {
      return '<div class="fh-risk-row"><div class="fh-risk-top"><span>' + label + '</span><b>' + (val === null || val === undefined ? '\u2014' : val) + '</b></div>' +
        (pct === null || pct === undefined
          ? '<div class="fh-bar muted"></div>'
          : '<div class="fh-bar ' + (bar || '') + '"><i data-w="' + pct + '%"></i></div>') + '</div>';
    }
    var HTML = row('Daily loss used', r.dailyLossUsedPct === null || r.dailyLossUsedPct === undefined ? '\u2014' : r.dailyLossUsedPct + '%', r.dailyLossUsedPct, '') +
      row('Max drawdown used', r.drawdownUsedPct === null || r.drawdownUsedPct === undefined ? '\u2014' : r.drawdownUsedPct + '%', r.drawdownUsedPct, 'green') +
      row('First payout target', r.targetPct === null || r.targetPct === undefined ? '\u2014' : r.targetPct + '%', r.targetPct, '');
    wrap.innerHTML = HTML;

    if (!window.IntersectionObserver) {
      var bars = wrap.querySelectorAll('.fh-bar i');
      for (var i = 0; i < bars.length; i++) bars[i].style.width = bars[i].getAttribute('data-w');
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          var b = en.target.querySelector('.fh-bar i');
          if (b) b.style.width = b.getAttribute('data-w');
        });
      }, { threshold: 0.3 });
      var rowsEl = wrap.querySelectorAll('.fh-risk-row');
      for (var r2 = 0; r2 < rowsEl.length; r2++) io.observe(rowsEl[r2]);
    }
  }

  /* ---------- KPI list ---------- */
  function kpiRow(label, value, na) {
    return '<div class="fh-kpi"><span class="k">' + label + '</span><span class="v ' + (na ? 'na' : '') + '">' + value + '</span></div>';
  }

  function renderKpis() {
    var wrap = document.getElementById('fh-kpis');
    var D = data();
    if (!wrap || !D) return;
    var s = D.statistics;
    function orDash(v, fmt) {
      if (v === null || v === undefined) return { v: '\u2014', na: true };
      if (fmt === 'pct') return { v: v + '%', na: false };
      if (fmt === 'money') return { v: money(v, true), na: false };
      return { v: String(v), na: false };
    }
    var rows = [
      ['Win Rate', orDash(s.winRate, 'pct')],
      ['Loss Rate', orDash(s.lossRate, 'pct')],
      ['Profit Factor', orDash(s.profitFactor, null)],
      ['Average Trade', orDash(s.avgTrade, 'money')],
      ['Best Trade', orDash(s.bestTrade, 'money')],
      ['Worst Trade', orDash(s.worstTrade, 'money')],
      ['Winning Days', orDash(s.winningDays, null)],
      ['Losing Days', orDash(s.losingDays, null)]
    ];
    wrap.innerHTML = rows.map(function (r) { return kpiRow(r[0], r[1].v, r[1].na); }).join('');
  }

  /* ---------- positions / orders ---------- */
  function emptyRow(msg) {
    return '<tr><td colspan="7"><div class="fh-empty-cell"><div class="fh-empty-box">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>' +
      '<b>' + msg + '</b><small>Ready to stream once a broker / API backend is connected.</small></div></div></td></tr>';
  }

  function renderTable(wrapId, headCells, rows, emptyMsg) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.innerHTML = '<div class="fh-table-wrap"><table><thead><tr>' +
      headCells.map(function (c, i) { return '<th class="' + (i === 0 ? '' : 'num') + '">' + c + '</th>'; }).join('') +
      '</tr></thead><tbody>' + (rows.length ? rows : emptyRow(emptyMsg)) + '</tbody></table></div>';
  }

  function renderPositions() {
    var D = data();
    if (!D) return;
    renderTable('fh-positions', ['Symbol', 'Side', 'Quantity', 'Entry', 'Current', 'Unrealized P&L', 'Status'], D.positions, 'No open positions');
  }

  function renderOrders() {
    var D = data();
    if (!D) return;
    renderTable('fh-orders', ['Symbol', 'Type', 'Side', 'Quantity', 'Price', 'Status'], D.orders, 'No orders yet');
  }

  /* ---------- calendar ---------- */
  function renderCalendar() {
    var wrap = document.getElementById('fh-cal');
    var D = data();
    if (!wrap || !D) return;
    var cal = D.calendar;
    var dims = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var first = new Date(cal.year, cal.month, 1).getDay();
    var total = new Date(cal.year, cal.month + 1, 0).getDate();
    var state = {};
    cal.days.forEach(function (d) { state[d.d] = d.s; });
    var today = new Date();
    var isCurMonth = today.getFullYear() === cal.year && today.getMonth() === cal.month;

    var cells = '';
    for (var b = 0; b < first; b++) cells += '<div class="fh-cal-day blank"></div>';
    for (var d = 1; d <= total; d++) {
      var s = state[d] || '';
      var extra = isCurMonth && today.getDate() === d ? ' style="outline:1px solid rgba(255,198,41,.55);outline-offset:2px"' : '';
      cells += '<div class="fh-cal-day ' + s + '"' + extra + '>' + d + '</div>';
    }
    wrap.innerHTML = '<div class="fh-cal-head"><b>' + cal.label + '</b><span class="fh-chip-demo">demo</span></div>' +
      '<div class="fh-cal-dow">' + dims.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>' +
      '<div class="fh-cal-grid">' + cells + '</div>' +
      '<div class="fh-cal-legend"><span><i class="w"></i>Winning day</span><span><i class="l"></i>Losing day</span><span><i class="o"></i>No trade</span></div>';
  }

  /* ---------- notifications ---------- */
  var NOTIF_ICON = {
    payout_paid: ['green', '<path d="m12 15 2 2 4-4"/><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>'],
    payout_approved: ['green', '<path d="M21 12a9 9 0 1 1-9-9"/><path d="M12 7v5l3 3"/><path d="M21 3v6h-6"/>'],
    account_funded: ['gold', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>'],
    drawdown: ['red', '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'],
    target: ['blue', '<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>'],
    system: ['slate', '<path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>']
  };

  function renderNotifications() {
    var wrap = document.getElementById('fh-notif-list');
    var D = data();
    if (!wrap || !D) return;
    wrap.innerHTML = D.notifications.map(function (n) {
      var t = NOTIF_ICON[n.type] || NOTIF_ICON.system;
      return '<div class="fh-notif"><span class="fh-notif-icon ' + t[0] + '"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px">' + t[1] + '</svg></span>' +
        '<div style="flex:1;min-width:0"><div class="fh-notif-t">' + n.title + '</div><div class="fh-notif-b">' + n.body + '</div>' +
        '<div class="fh-notif-time">' + n.time + '</div></div></div>';
    }).join('');
  }

  /* ---------- account selector dropdown (mirrors live listbox) ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var DOT = { red: '#ef4444', green: '#22c55e', gold: '#f59e0b', slate: '#64748b', blue: '#3b82f6' };

  function renderAccountSelector() {
    var wrap = document.getElementById('fh-acc-select');
    var D = data();
    if (!wrap || !D || !D.accounts || !D.accounts.length) return;
    var sel = selectedAccount();
    ACC_STATE.id = sel.id;
    var triggerId = 'fh-acc-trigger';

    function optionHtml(a, alt) {
      return '<div class="fh-acc-option' + (a.id === ACC_STATE.id ? ' sel' : '') + '" role="option" aria-selected="' + (a.id === ACC_STATE.id ? 'true' : 'false') + '" data-id="' + esc(a.id) + '">' +
        '<div class="fh-acc-opt-text" title="' + esc(a.id) + '">' + esc(a.id) + '</div>' +
        (alt ? '<div class="fh-acc-opt-alt">' + esc(alt) + '</div>' : '') +
        '<span class="fh-acc-dot" style="background-color:' + (DOT[a.chip] || DOT.slate) + '"></span></div>';
    }

    function groupHtml(status, items) {
      return '<div class="fh-acc-group">' +
        '<div class="fh-acc-group-head">' + esc(status) +
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg></div>' +
        items.join('') + '</div>';
    }

    function buildGroups(filter) {
      var groups = {};
      D.accounts.forEach(function (a) {
        var hay = a.id + ' ' + a.name + ' ' + a.status;
        if (filter && hay.toLowerCase().indexOf(filter.toLowerCase()) === -1) return;
        (groups[a.status] = groups[a.status] || []).push(a);
      });
      return Object.keys(groups).sort().map(function (k) {
        return groupHtml(k, groups[k].map(function (a) { return optionHtml(a); }));
      }).join('');
    }

    function altText(acc) {
      return acc.size ? '$' + acc.size.toLocaleString('en-US') + ' \u00b7 ' + acc.name : acc.name;
    }

    wrap.innerHTML =
      '<button type="button" class="fh-acc-trigger" id="' + triggerId + '" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="fh-acc-t-text" title="' + esc(sel.id) + '">' + esc(sel.id) + '</span>' +
      '<span class="fh-acc-t-chev"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg></span>' +
      '</button>' +
      '<div class="fh-acc-menu" role="listbox" aria-labelledby="' + triggerId + '">' +
      '<div class="fh-acc-search"><input type="text" placeholder="Search accounts..." aria-label="Search accounts" value="" /></div>' +
      '<div class="fh-acc-groups">' + buildGroups('') + '</div>' +
      '<div class="fh-acc-menu-foot"><em>demo</em></div>' +
      '</div>';

    var trigger = wrap.querySelector('.fh-acc-trigger');
    function setOpen(open) {
      wrap.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!wrap.classList.contains('open'));
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) setOpen(false);
    });

    var search = wrap.querySelector('.fh-acc-search input');
    search.addEventListener('input', function () {
      var q = this.value.trim();
      var groupsEl = wrap.querySelector('.fh-acc-groups');
      groupsEl.innerHTML = buildGroups(q) || '<div class="fh-acc-empty" role="note">No accounts found</div>';
    });

    wrap.querySelector('.fh-acc-groups').addEventListener('click', function (e) {
      var opt = e.target.closest ? e.target.closest('.fh-acc-option') : null;
      if (!opt) return;
      e.stopPropagation();
      ACC_STATE.id = opt.getAttribute('data-id');
      setOpen(false);
      renderMetrics(accountStats());
      renderRisk(accountRisk());
      renderAccountSelector();
    });
  }

  /* ---------- boot ---------- */
  function init() {
    if (!data()) return;
    renderAccountSelector();
    renderMetrics(accountStats());
    renderKpis();
    renderRisk(accountRisk());
    renderPositions();
    renderOrders();
    renderCalendar();
    renderNotifications();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();