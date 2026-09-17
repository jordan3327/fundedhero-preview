/* ============================================================
   Local dashboard section (app.fundedherofutures.com replica)
   Demo interactions only. No backend, nothing is sent.
   ============================================================ */
(function () {
  'use strict';

  function boot() {
    var form = document.getElementById('login-form');
    var message = document.getElementById('login-message');
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var forgot = document.getElementById('forgot-password');
    var create = document.getElementById('create-account');

    var hideTimer = null;

    function showMessage(text, isError) {
      if (!message) return;
      message.textContent = text;
      message.hidden = false;
      message.classList.toggle('is-error', !!isError);
      void message.offsetWidth;
      message.classList.add('is-visible');
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        message.classList.remove('is-visible');
      }, 4000);
    }

    function clearInvalid() {
      if (email) email.classList.remove('fh-input-invalid');
      if (password) password.classList.remove('fh-input-invalid');
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearInvalid();

        var emailValue = email ? email.value.trim() : '';
        var passValue = password ? password.value : '';
        var emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailValue);

        if (!emailOk) {
          if (email) {
            email.classList.add('fh-input-invalid');
            email.focus();
          }
          showMessage('Enter a valid email address.', true);
          return;
        }

        if (!passValue) {
          if (password) {
            password.classList.add('fh-input-invalid');
            password.focus();
          }
          showMessage('Password is required.', true);
          return;
        }

        showMessage('Local preview - login is not connected here. Nothing was sent.', false);
      });
    }

    [email, password].forEach(function (field) {
      if (!field) return;
      field.addEventListener('input', function () {
        field.classList.remove('fh-input-invalid');
      });
    });

    if (forgot) {
      forgot.addEventListener('click', function (e) {
        e.preventDefault();
        showMessage('Local preview - password recovery is not connected here.', false);
      });
    }

    if (create) {
      create.addEventListener('click', function (e) {
        e.preventDefault();
        showMessage('Local preview - account creation is not connected here.', false);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
