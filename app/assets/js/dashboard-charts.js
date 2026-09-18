/* ============================================================
   dashboard-charts.js — Premium charts for dashboard.html.
   Uses ONLY local vendor libraries (assets/vendor) so it works
   offline and fast:
     - Apache ECharts -> Equity curve, Monthly performance AND
       the trading terminal (native candlestick chart).
   NO TradingView / Lightweight Charts anywhere in this project.
   Every chart is labelled DEMO / simulated. Nothing here claims
   a live market connection, and nothing reads real prices.
   Pure additive: it renders into fh-* containers only.
   ============================================================ */
(function () {
  'use strict';

  var charts = [];
  var registry = { equity: null, monthly: null, terminal: null };

  function data() {
    return window.FHData || null;
  }

  /* ---------- deterministic fake-candle generator (demo only) ---------- */
  function hashStr(s) {
    var h = 1779033703;
    for (var i = 0; i < s.length; i++) {
      h = (h ^ s.charCodeAt(i)) >>> 0;
      h = Math.imul(h, 3432918353) >>> 0;
      h = (h + 461845907) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gauss(rnd) {
    var u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  var INSTRUMENTS = {
    ES:  { label: 'ES', name: 'E-mini S&P 500', base: 6052.25, tick: 2, vol: 9.5,   point: '$50' },
    NQ:  { label: 'NQ', name: 'E-mini Nasdaq-100', base: 22185.50, tick: 2, vol: 38,  point: '$20' },
    YM:  { label: 'YM', name: 'Mini Dow Jones', base: 44318,  tick: 0, vol: 70,    point: '$5' },
    RTY: { label: 'RTY', name: 'E-mini Russell 2000', base: 2327.8, tick: 1, vol: 4.2, point: '$50' },
    GC:  { label: 'GC', name: 'Gold', base: 2724.6, tick: 1, vol: 6.5, point: '$100' },
    CL:  { label: 'CL', name: 'Crude Oil', base: 72.42, tick: 2, vol: 0.48, point: '$1,000' }
  };

  function demoCandles(sym, n) {
    var cfg = INSTRUMENTS[sym];
    var rnd = mulberry32(hashStr(sym));
    var out = [];
    var price = cfg.base;
    var start = new Date(2026, 8, 18); /* Sep 18 2026 demo end */
    for (var i = 0; i < n; i++) {
      var date = new Date(start);
      date.setDate(start.getDate() - (n - 1 - i));
      var dt = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
      var open = price;
      var drift = cfg.vol * 0.06;
      var close = open + drift + gauss(rnd) * cfg.vol * 0.55;
      var hi = Math.max(open, close) + Math.abs(gauss(rnd)) * cfg.vol * 0.5;
      var lo = Math.min(open, close) - Math.abs(gauss(rnd)) * cfg.vol * 0.5;
      price = close;
      out.push({ time: dt, open: +open.toFixed(2), high: +hi.toFixed(2), low: +lo.toFixed(2), close: +close.toFixed(2), volume: Math.round(800 + Math.abs(gauss(rnd)) * 6400) });
    }
    return out;
  }

  function fmtPrice(v, sym) {
    var dec = INSTRUMENTS[sym] ? INSTRUMENTS[sym].tick : 2;
    return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  /* ---------- trading terminal (native ECharts candlestick — no TradingView) ---------- */
  function renderTerminalQuote(sym, candles) {
    var priceEl = document.getElementById('fh-term-price');
    var changeEl = document.getElementById('fh-term-change');
    if (!priceEl || !changeEl) return;
    var last = candles[candles.length - 1].close;
    var first = candles[0].close;
    var diff = last - first;
    var pct = (diff / first) * 100;
    priceEl.textContent = fmtPrice(last, sym);
    var up = diff >= 0;
    changeEl.textContent = (up ? '+' : '') + diff.toFixed(2) + ' (' + (up ? '+' : '') + pct.toFixed(2) + '%)';
    changeEl.className = 'fh-term-change ' + (up ? 'up' : 'down');
    var sub = document.getElementById('fh-term-point');
    if (sub) sub.textContent = 'Point value ' + (INSTRUMENTS[sym] ? INSTRUMENTS[sym].point : '—') + ' · ' + sym + ' futures · simulated';
  }

  function buildInstruments() {
    var wrap = document.getElementById('fh-term-instr');
    if (!wrap) return;
    wrap.innerHTML = Object.keys(INSTRUMENTS).map(function (sym) {
      return '<button type="button" class="fh-term-chip' + (sym === 'ES' ? ' on' : '') + '" data-sym="' + sym + '">' + INSTRUMENTS[sym].label + '</button>';
    }).join('');
    var chips = wrap.querySelectorAll('.fh-term-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function () {
        var sym = this.getAttribute('data-sym');
        var list = wrap.querySelectorAll('.fh-term-chip');
        for (var j = 0; j < list.length; j++) list[j].classList.remove('on');
        this.classList.add('on');
        window.FHCharts && window.FHCharts.setInstrument(sym);
      });
    }
  }

  var TERM_COLOR_UP = '#07c585';
  var TERM_COLOR_DOWN = '#FF4F52';

  function initTerminal() {
    var container = document.getElementById('fh-term-chart');
    if (!container) return;
    if (!window.echarts) {
      container.innerHTML = '<div class="fh-chart-na">Chart library not loaded — terminal view unavailable.</div>';
      return;
    }
    var chart = window.echarts.init(container, null, { renderer: 'canvas' });
    registry.terminal = {
      chart: chart,
      set: function (sym) {
        var cd = demoCandles(sym, 150);
        chart.setOption({
          animation: false,
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', crossStyle: { color: 'rgba(255,198,41,.55)' }, label: { backgroundColor: '#DDB231', color: '#000' } },
            backgroundColor: '#11151F',
            borderColor: '#2A2C40',
            textStyle: { color: '#fff', fontSize: 12 },
            formatter: function (params) {
              var d = params[0].data;
              var up = d[1] >= d[0];
              return params[0].axisValue + '<br/>O ' + d[0].toFixed(2) +
                '<br/>C <span style="color:' + (up ? TERM_COLOR_UP : TERM_COLOR_DOWN) + '">' + d[1].toFixed(2) + '</span>' +
                '<br/>L ' + d[2].toFixed(2) + '<br/>H ' + d[3].toFixed(2);
            }
          },
          grid: { left: 10, right: 12, top: 14, bottom: 8, containLabel: true },
          xAxis: {
            type: 'category',
            data: cd.map(function (c) { return c.time; }),
            boundaryGap: true,
            axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } },
            axisLabel: { color: '#6E7180', fontSize: 10, hideOverlap: true },
            axisTick: { show: false },
            splitLine: { show: false }
          },
          yAxis: {
            type: 'value',
            scale: true,
            splitLine: { lineStyle: { color: 'rgba(255,255,255,.05)' } },
            axisLabel: { color: '#6E7180', fontSize: 10 },
            axisLine: { show: false },
            axisTick: { show: false }
          },
          dataZoom: [
            { type: 'inside', start: 55, end: 100 },
            {
              type: 'slider', start: 55, end: 100, height: 14, bottom: 0,
              borderColor: 'rgba(255,255,255,.08)', backgroundColor: 'rgba(255,255,255,.02)',
              fillerColor: 'rgba(255,198,41,.12)',
              handleStyle: { color: '#DDB231', borderColor: '#DDB231' },
              textStyle: { color: 'transparent' },
              dataBackground: { lineStyle: { color: 'rgba(255,255,255,.3)' }, areaStyle: { color: 'rgba(255,255,255,.08)' } }
            }
          ],
          series: [{
            name: sym,
            type: 'candlestick',
            data: cd.map(function (c) { return [c.open, c.close, c.low, c.high]; }),
            itemStyle: { color: TERM_COLOR_UP, color0: TERM_COLOR_DOWN, borderColor: TERM_COLOR_UP, borderColor0: TERM_COLOR_DOWN },
            emphasis: { itemStyle: { borderWidth: 1.5 } }
          }]
        });
        if (chart.resize) chart.resize();
        renderTerminalQuote(sym, cd);
      }
    };
    registry.terminal.set(session.instrument || 'ES');
    charts.push({ resize: function () { if (chart && chart.resize) chart.resize(); } });
  }

  var session = {};
  function setInstrument(sym) {
    if (!INSTRUMENTS[sym]) return;
    session.instrument = sym;
    document.getElementById('fh-term-name').textContent = sym + ' · ' + INSTRUMENTS[sym].name;
    if (registry.terminal) registry.terminal.set(sym);
  }

  /* ---------- Equity curve (ECharts / SVG fallback) ---------- */
  function equityArrays() {
    var D = data();
    if (!D || !D.monthly || !D.monthly.length) return null;
    var labels = D.monthly.map(function (m) { return m.m; });
    var vals = D.monthly.map(function (m) { return m.v; }); /* demo cumulative */
    return { labels: labels, vals: vals };
  }

  function svgEquity(wrap, labels, vals) {
    var w = 620, h = 240, padL = 46, padB = 26, padT = 12, padR = 12;
    var top = Math.max.apply(null, vals) * 1.08;
    var min = 0;
    function x(i) { return padL + (i / (vals.length - 1)) * (w - padL - padR); }
    function y(v) { return padT + (1 - (v - min) / (top - min)) * (h - padT - padB); }
    var pts = vals.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    var grid = '';
    for (var g = 0; g <= 3; g++) {
      var gy = padT + (g / 3) * (h - padT - padB);
      var val = top - (g / 3) * (top - min);
      grid += '<line class="fh-grid-line" x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (w - padR) + '" y2="' + gy.toFixed(1) + '"/>' +
        '<text class="fh-axis-label" x="' + (padL - 8) + '" y="' + (gy + 3).toFixed(1) + '" text-anchor="end">$' + Math.round(val / 1000) + 'K</text>';
    }
    var xlabels = labels.map(function (l, i) {
      return '<text class="fh-axis-label" x="' + x(i).toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle">' + l + '</text>';
    }).join('');
    wrap.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-label="Equity curve">' +
      '<defs><linearGradient id="fhEqGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#FFC629" stop-opacity="0.28"/><stop offset="100%" stop-color="#FFC629" stop-opacity="0.02"/></linearGradient>' +
      '<linearGradient id="fhEqStroke" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#DDB231"/><stop offset="100%" stop-color="#FFC629"/></linearGradient></defs>' + grid +
      '<path class="fh-area-path" d="M' + pts + ' L' + x(vals.length - 1).toFixed(1) + ',' + (h - padB) + ' L' + x(0).toFixed(1) + ',' + (h - padB) + ' Z"/>' +
      '<polyline class="fh-line-path" points="' + pts + '"/>' + xlabels + '</svg>';
  }

  function initEquity() {
    var wrap = document.getElementById('fh-equity');
    if (!wrap) return;
    var e = equityArrays();
    if (!e) return;
    if (!window.echarts) { svgEquity(wrap, e.labels, e.vals); return; }
    var el = document.createElement('div');
    el.style.cssText = 'width:100%;height:240px';
    wrap.innerHTML = '';
    wrap.appendChild(el);
    var chart = window.echarts.init(el, null, { renderer: 'canvas' });
    chart.setOption({
      animationDuration: 800,
      grid: { left: 56, right: 16, top: 18, bottom: 30 },
      tooltip: { trigger: 'axis', backgroundColor: '#11151F', borderColor: '#2A2C40', textStyle: { color: '#fff', fontSize: 12 }, valueFormatter: function (v) { return '$' + (v * 1000).toLocaleString('en-US'); } },
      xAxis: { type: 'category', data: e.labels, boundaryGap: false, axisLine: { lineStyle: { color: '#2A2C40' } }, axisLabel: { color: '#A7A7A7' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,.05)' } }, axisLabel: { color: '#A7A7A7', formatter: function (v) { return '$' + v + 'K'; } } },
      series: [{
        name: 'Equity (demo)', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
        data: e.vals,
        lineStyle: { width: 3, color: '#FFC629' },
        itemStyle: { color: '#FFC629' },
        areaStyle: { color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,198,41,.28)' }, { offset: 1, color: 'rgba(255,198,41,.02)' }]) }
      }]
    });
    registry.equity = chart;
    charts.push({ resize: function () { chart.resize(); } });
  }

  /* ---------- Monthly performance (ECharts / CSS fallback) ---------- */
  function monthlyArrays() {
    var e = equityArrays();
    if (!e) return null;
    var labels = e.labels;
    var deltas = e.vals.map(function (v, i) { return i === 0 ? v : +(v - e.vals[i - 1]).toFixed(1); });
    return { labels: labels, vals: deltas };
  }

  function cssMonthly(wrap, labels, vals) {
    var max = Math.max.apply(null, vals.map(function (v) { return Math.abs(v); }));
    wrap.innerHTML = '<div class="fh-css-bars">' + vals.map(function (v, i) {
      var up = v >= 0;
      var h = Math.max(4, Math.round((Math.abs(v) / max) * 100));
      return '<div class="fh-css-col" title="' + (up ? '+' : '') + v + 'K"><i class="' + (up ? 'up' : 'down') + '" style="height:' + h + '%;transform:translateY(' + (up ? '0' : '100%') + ')"></i><span>' + labels[i] + '</span></div>';
    }).join('') + '</div>';
  }

  function initMonthly() {
    var wrap = document.getElementById('fh-monthly');
    if (!wrap) return;
    var m = monthlyArrays();
    if (!m) return;
    if (!window.echarts) { cssMonthly(wrap, m.labels, m.vals); return; }
    var el = document.createElement('div');
    el.style.cssText = 'width:100%;height:220px';
    wrap.innerHTML = '';
    wrap.appendChild(el);
    var chart = window.echarts.init(el, null, { renderer: 'canvas' });
    var avg = m.vals.reduce(function (a, b) { return a + b; }, 0) / m.vals.length;
    chart.setOption({
      animationDuration: 800,
      grid: { left: 48, right: 16, top: 24, bottom: 30 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#11151F', borderColor: '#2A2C40', textStyle: { color: '#fff', fontSize: 12 }, valueFormatter: function (v) { return (v >= 0 ? '+' : '') + '$' + v.toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'K'; } },
      xAxis: { type: 'category', data: m.labels, axisLine: { lineStyle: { color: '#2A2C40' } }, axisLabel: { color: '#A7A7A7' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,.05)' } }, axisLabel: { color: '#A7A7A7', formatter: function (v) { return (v >= 0 ? '+' : '') + v + 'K'; } } },
      series: [{
        name: 'Monthly P&L (demo)', type: 'bar', barMaxWidth: 26,
        data: m.vals.map(function (v) {
          return {
            value: v,
            itemStyle: {
              borderRadius: [3, 3, 0, 0],
              color: v >= 0 ? 'linear-gradient(180deg,#07c585,#0a8f63)' : 'linear-gradient(180deg,#FF4F52,#b3383a)'
            }
          };
        }),
        markLine: {
          symbol: 'none', silent: true, label: { formatter: 'avg ' + avg.toFixed(1) + 'K', color: '#A7A7A7', fontSize: 10 },
          lineStyle: { color: 'rgba(255,198,41,.7)', type: 'dashed', width: 1 },
          data: [{ yAxis: +avg.toFixed(2) }]
        }
      }]
    });
    registry.monthly = chart;
    charts.push({ resize: function () { chart.resize(); } });
  }

  /* ---------- boot ---------- */
  function init() {
    if (!data()) return;
    try {
      buildInstruments();
      initTerminal();
      initEquity();
      initMonthly();
      window.addEventListener('resize', function () {
        for (var i = 0; i < charts.length; i++) { try { charts[i].resize(); } catch (e) {} }
      });
    } catch (err) {
      if (window.console) console.log('[fh-charts] partial:', err && err.message);
    }
  }

  window.FHCharts = {
    init: init,
    setInstrument: setInstrument,
    instruments: INSTRUMENTS,
    version: '1.0.0'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();