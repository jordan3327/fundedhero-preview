/* ============================================================
   Login button router (local)
   Redirects every .cta-login button to the local replica of the
   dashboard section (app/index.html) instead of the online
   https://app.fundedherofutures.com/
   ============================================================ */
(function () {
  'use strict';

  var LOCAL_APP_URL = 'app/index.html';

  function boot() {
    document.querySelectorAll('.cta-login').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (e && e.preventDefault) e.preventDefault();
        window.location.href = LOCAL_APP_URL;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
