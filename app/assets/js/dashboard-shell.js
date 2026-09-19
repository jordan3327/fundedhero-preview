/* ============================================================
   dashboard-shell.js — Additive enhancer for the ORIGINAL pages.
   It never removes or replaces existing behaviour; it only ADDS
   (mobile drawer, sidebar collapse, missing Logout wiring, and
   a prepared table toolbar). Existing file names, hrefs and ids
   are NOT touched.
   ============================================================ */
(function () {
  'use strict';

  var LOGIN_PAGE = 'index.html';

  function byExactText(selector, text) {
    var list = document.querySelectorAll(selector);
    var found = [];
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      var own = '';
      for (var j = 0; j < el.childNodes.length; j++) {
        if (el.childNodes[j].nodeType === 3) own += el.childNodes[j].nodeValue;
      }
      if (own.trim().toLowerCase() === text.toLowerCase()) found.push(el);
    }
    return found;
  }

  function findSidebar() {
    var list = document.querySelectorAll('aside');
    for (var i = 0; i < list.length; i++) {
      if (list[i].className.indexOf('border-r') !== -1 && list[i].className.indexOf('sb') === -1) {
        return list[i];
      }
    }
    return null;
  }

  function findToggle() {
    var btn = document.querySelector('button .lucide-panel-left');
    if (btn) return btn.closest('button');
    var svg = document.querySelector('.lucide-panel-left');
    return svg ? svg.parentElement : null;
  }

  /* ---------- Logout (additive: old pages render Logout as a div) ---------- */
  function wireLogout() {
    if (document.body.getAttribute('data-fh-logout')) return;
    document.body.setAttribute('data-fh-logout', '1');
    byExactText('div, [role="button"], span', 'Logout').forEach(function (el) {
      if (el.getAttribute('data-fh-wired-logout')) return;
      el.setAttribute('data-fh-wired-logout', '1');
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = LOGIN_PAGE;
      });
    });
  }

  /* ---------- drawer / collapse ---------- */
  function bootShell() {
    var aside = findSidebar();
    var toggle = findToggle();
    if (!aside || !toggle) { wireLogout(); return; }

    var backdrop = document.createElement('div');
    backdrop.className = 'fh-shell-backdrop';
    backdrop.id = 'fh-shell-backdrop';
    document.body.appendChild(backdrop);

    function isMobile() {
      return window.innerWidth < 1024;
    }

    function sync() {
      if (!isMobile()) {
        aside.classList.remove('fh-shell-open');
        backdrop.classList.remove('show');
        document.body.classList.remove('fh-shell-lock');
      }
    }

    function setOpen(open) {
      aside.classList.toggle('fh-shell-open', open);
      backdrop.classList.toggle('show', open);
      document.body.classList.toggle('fh-shell-lock', open);
    }

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (isMobile()) {
        setOpen(!aside.classList.contains('fh-shell-open'));
      } else {
        aside.classList.toggle('fh-shell-collapsed');
      }
    });

    backdrop.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    /* close drawer when navigating from the sidebar */
    aside.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href]') : null;
      var buy = e.target.closest ? e.target.closest('button') : null;
      if (!link && !buy) return;
      setTimeout(function () { setOpen(false); }, 0);
    });

    window.addEventListener('resize', function () { sync(); });
    sync();
  }

  /* ---------- table toolbar (prepared, non destructive) ---------- */
  function bootToolbars() {
    var tables = Array.prototype.slice.call(document.querySelectorAll('table.border-separate'));
    tables.forEach(function (table) {
      if (table.getAttribute('data-fh-toolbar')) return;
      table.setAttribute('data-fh-toolbar', '1');
      var tbody = table.querySelector('tbody');
      if (!tbody) return;

      var controls = document.createElement('div');
      controls.className = 'fh-controls';
      controls.innerHTML =
        '<div class="fh-search">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' +
        '<input type="search" placeholder="Search rows..." aria-label="Search" /></div>' +
        '<span class="fh-count"><b class="fh-count-n">0</b> rows</span>';

      table.parentNode.insertBefore(controls, table);

      var input = controls.querySelector('input');
      var count = controls.querySelector('.fh-count-n');
      var theadTh = Array.prototype.slice.call(table.querySelectorAll('thead th') || []);
      var sortIdx = -1, sortDir = 1;
      var pager = document.createElement('div');
      pager.className = 'fh-pager';
      pager.style.display = 'none';
      pager.innerHTML =
        '<button type="button" class="fh-pg-btn" data-dir="-1" aria-label="Previous">&lsaquo;</button>' +
        '<span class="fh-pg-info">Page <b class="fh-pg-cur">1</b> / <b class="fh-pg-tot">1</b></span>' +
        '<button type="button" class="fh-pg-btn" data-dir="1" aria-label="Next">&rsaquo;</button>';
      table.parentNode.insertBefore(pager, table.nextSibling);

      var PAGE = 10, page = 1;

      function dataRows() {
        var rows = tbody.querySelectorAll('tr');
        var out = [];
        for (var r = 0; r < rows.length; r++) {
          var row = rows[r];
          if (row.querySelectorAll('td').length < 2) continue;
          if (/no data found/i.test(row.textContent)) continue;
          out.push(row);
        }
        return out;
      }

      function parseVal(s) {
        var t = (s || '').replace(/[$,%\s]/g, '');
        var n = parseFloat(t);
        var m = /^-?\d*\.?\d+$/.test(t) ? n : NaN;
        var dd = Date.parse(s);
        if (!isNaN(m)) return { n: m };
        if (!isNaN(dd)) return { d: dd };
        return { s: (s || '').toLowerCase() };
      }

      function cellText(row, idx) {
        var tds = row.querySelectorAll('td,th');
        return tds[idx] ? tds[idx].textContent.trim() : '';
      }

      function render() {
        var q = (input.value || '').trim().toLowerCase();
        var rows = dataRows();
        if (sortIdx >= 0) {
          rows.sort(function (a, b) {
            var va = parseVal(cellText(a, sortIdx));
            var vb = parseVal(cellText(b, sortIdx));
            var res = 0;
            if (va.n !== undefined && vb.n !== undefined) res = va.n - vb.n;
            else if (va.d !== undefined && vb.d !== undefined) res = va.d - vb.d;
            else res = String(va.s || '').localeCompare(String(vb.s || ''));
            return res * sortDir;
          });
        }
        var vis = [];
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var show = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
          row.style.display = show ? '' : 'none';
          if (show) vis.push(row);
        }
        count.textContent = String(vis.length);
        var total = Math.max(1, Math.ceil(vis.length / PAGE));
        if (page > total) page = total;
        if (vis.length > PAGE) {
          pager.style.display = '';
          pager.querySelector('.fh-pg-cur').textContent = String(page);
          pager.querySelector('.fh-pg-tot').textContent = String(total);
          var start = (page - 1) * PAGE;
          for (var r2 = 0; r2 < vis.length; r2++) {
            vis[r2].style.display = (r2 >= start && r2 < start + PAGE) ? '' : 'none';
          }
        } else {
          pager.style.display = 'none';
        }
        var all = tbody.querySelectorAll('tr');
        for (var r3 = 0; r3 < all.length; r3++) {
          if (all[r3].querySelectorAll('td').length < 2) all[r3].style.display = '';
        }
      }

      input.addEventListener('input', function () { page = 1; render(); });
      var pgBtns = pager.querySelectorAll('.fh-pg-btn');
      for (var b = 0; b < pgBtns.length; b++) {
        pgBtns[b].addEventListener('click', function () {
          var cur = parseInt(pager.querySelector('.fh-pg-cur').textContent, 10) || 1;
          var tot = parseInt(pager.querySelector('.fh-pg-tot').textContent, 10) || 1;
          var next = cur + parseInt(this.getAttribute('data-dir'), 10);
          if (next < 1) next = 1;
          if (next > tot) next = tot;
          page = next;
          render();
        });
      }
      for (var t = 0; t < theadTh.length; t++) {
        theadTh[t].addEventListener('click', function () {
          var idx = theadTh.indexOf(this);
          if (sortIdx === idx) { sortDir = -sortDir; } else { sortIdx = idx; sortDir = 1; }
          for (var u = 0; u < theadTh.length; u++) {
            theadTh[u].classList.remove('fh-sorted-up', 'fh-sorted-down');
          }
          this.classList.add(sortDir === 1 ? 'fh-sorted-up' : 'fh-sorted-down');
          page = 1;
          render();
        });
      }
      render();
    });
  }

  function init() {
    try {
      wireLogout();
      bootShell();
      bootToolbars();
    } catch (err) {
      if (window.console) console.log('[fh-shell] skipped:', err && err.message);
    }
  }

  window.FHShell = {
    init: init,
    version: '1.0.0'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();