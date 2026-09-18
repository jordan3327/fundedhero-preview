/* ============================================================
   Local login clone controller (demo)
   Opens the local login overlay instead of app.fundedherofutures.com
   ============================================================ */
(function () {
  'use strict';

  function boot() {
    var overlay = document.getElementById('fh-login-clone');
    if (!overlay) return;

    var closeBtn = document.getElementById('fh-login-close');
    var form = document.getElementById('fh-login-form');
    var errorEl = document.getElementById('fh-login-error');
    var demoEl = document.getElementById('fh-login-demo');
    var emailEl = document.getElementById('fh-login-email');
    var passEl = document.getElementById('fh-login-password');

    function openLogin(e) {
      if (e && e.preventDefault) e.preventDefault();
      overlay.removeAttribute('hidden');
      overlay.classList.add('is-open');
      document.body.classList.add('fhl-no-scroll');
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
      setTimeout(function () {
        if (emailEl) emailEl.focus();
      }, 60);
    }

    function closeLogin() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('fhl-no-scroll');
    }

    document.querySelectorAll('.cta-login').forEach(function (btn) {
      btn.addEventListener('click', openLogin);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLogin);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeLogin();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') closeLogin();
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = '';
        var v = {
          email: emailEl ? emailEl.value.trim() : '',
          pass: passEl ? passEl.value : ''
        };

        if (!v.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) {
          msg = 'Enter a valid email address.';
        } else if (!v.pass) {
          msg = 'Password is required.';
        }

        if (msg) {
          if (errorEl) { errorEl.textContent = msg; errorEl.hidden = false; }
          if (demoEl) { demoEl.hidden = true; demoEl.textContent = ''; }
          return;
        }

        if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
        if (demoEl) {
          demoEl.textContent = 'Welcome back! (demo) - Local preview, nothing was sent.';
          demoEl.hidden = false;
        }
        if (form) form.reset();
      });
    }

    document.querySelectorAll('#fh-login-clone a.fhl-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        if (demoEl) {
          demoEl.textContent =
            (link.getAttribute('data-demo') || 'Demo preview only.') + ' Nothing was sent.';
          demoEl.hidden = false;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();