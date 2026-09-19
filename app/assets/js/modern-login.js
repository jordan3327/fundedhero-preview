/* ============================================================
   Login screen - modern design (21st.dev style)
   WebGL dot background: @pulseawan - modern-login-signup
   Form behaviour mirrors the online login (no backend here).
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------- WebGL dots ----------------------------- */
  var active = true;
  var renderer, geometry, material, scene, camera, animationId;

  function initThree(THREE) {
    var canvas = document.getElementById('ml-canvas');
    if (!canvas || !active) return;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2) },
      u_opacities: { value: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0] },
      u_colors: {
        value: [
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1)
        ]
      },
      u_total_size: { value: 20.0 },
      u_dot_size: { value: 6.0 },
      u_reverse: { value: 0 }
    };

    material = new THREE.ShaderMaterial({
      vertexShader: [
        'precision mediump float;',
        'uniform vec2 u_resolution;',
        'out vec2 fragCoord;',
        'void main() {',
        '  gl_Position = vec4(position, 1.0);',
        '  fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;',
        '  fragCoord.y = u_resolution.y - fragCoord.y;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'in vec2 fragCoord;',
        '',
        'uniform float u_time;',
        'uniform float u_opacities[10];',
        'uniform vec3 u_colors[6];',
        'uniform float u_total_size;',
        'uniform float u_dot_size;',
        'uniform vec2 u_resolution;',
        'uniform int u_reverse;',
        '',
        'out vec4 fragColor;',
        '',
        'float PHI = 1.61803398874989484820459;',
        'float random(vec2 xy) {',
        '  return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);',
        '}',
        'void main() {',
        '  vec2 st = fragCoord.xy;',
        '  st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));',
        '  st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));',
        '',
        '  float opacity = step(0.0, st.x) * step(0.0, st.y);',
        '',
        '  vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));',
        '',
        '  float frequency = 5.0;',
        '  float show_offset = random(st2);',
        '  float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));',
        '  opacity *= u_opacities[int(rand * 10.0)];',
        '',
        '  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));',
        '  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));',
        '',
        '  vec3 color = u_colors[int(show_offset * 6.0)];',
        '',
        '  float animation_speed_factor = 3.0;',
        '  vec2 center_grid = u_resolution / 2.0 / u_total_size;',
        '  float dist_from_center = distance(center_grid, st2);',
        '',
        '  float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);',
        '',
        '  opacity *= step(timing_offset_intro, u_time * animation_speed_factor);',
        '  opacity *= clamp((1.0 - step(timing_offset_intro + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);',
        '',
        '  fragColor = vec4(color, opacity);',
        '  fragColor.rgb *= fragColor.a;',
        '}'
      ].join('\n'),
      uniforms: uniforms,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
      transparent: true
    });

    geometry = new THREE.PlaneGeometry(2, 2);
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    var startTime = performance.now();
    var animate = function () {
      if (!active) return;
      animationId = requestAnimationFrame(animate);
      uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', handleResize);
  }

  function handleResize() {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (material) {
      material.uniforms.u_resolution.value.set(window.innerWidth * 2, window.innerHeight * 2);
    }
  }

  function loadThree(callback) {
    if (window.THREE) {
      callback(window.THREE);
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = function () {
      if (window.THREE) callback(window.THREE);
    };
    document.head.appendChild(script);
  }

  /* ------------------------------- Form ------------------------------- */
  // Local stand-in for the online dashboard route (app.fundedherofutures.com/dashboard).
  var LOGIN_REDIRECT = 'dashboard.html';

  var panes = {
    login: document.getElementById('ml-login'),
    signup: document.getElementById('ml-signup'),
    forgot: document.getElementById('ml-forgot')
  };

  function showPane(name) {
    Object.keys(panes).forEach(function (key) {
      if (panes[key]) panes[key].hidden = key !== name;
    });
  }

  function setError(msgEl, message) {
    if (!msgEl) return;
    msgEl.textContent = message;
    msgEl.hidden = !message;
  }

  function emailValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function markInvalid(input, invalid) {
    if (!input) return;
    if (invalid) {
      input.classList.add('ml-input-invalid');
    } else {
      input.classList.remove('ml-input-invalid');
    }
  }

  function bootForm() {
    var form = document.getElementById('login-form');
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var remember = document.getElementById('remember');
    var loginError = document.getElementById('login-error');
    var forgot = document.getElementById('forgot-password');
    var create = document.getElementById('create-account');
    var backToLogin = document.getElementById('back-to-login');
    var forgotBack = document.getElementById('forgot-back');

    // Prefill "Remember me" from a previous visit.
    if (remember && localStorage.getItem('fh_remember') === '1') {
      remember.checked = true;
      if (email && localStorage.getItem('fh_email')) {
        email.value = localStorage.getItem('fh_email');
      }
    }

    // --- LOGIN ---
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        setError(loginError, '');
        var ok = true;

        if (!email || !emailValid(email.value)) {
          markInvalid(email, true);
          ok = false;
        } else {
          markInvalid(email, false);
        }

        if (!password || !password.value) {
          markInvalid(password, true);
          ok = false;
        } else {
          markInvalid(password, false);
        }

        if (!ok) {
          setError(loginError, 'Please enter a valid email and password.');
          return;
        }

        var btn = form.querySelector('.ml-submit');
        var original = btn ? btn.textContent : '';
        if (btn) btn.textContent = 'Logging in...';

        // Local demo: no real request is sent. Redirect like the online app.
        setTimeout(function () {
          if (remember && remember.checked) {
            localStorage.setItem('fh_remember', '1');
            if (email) localStorage.setItem('fh_email', email.value.trim());
          } else {
            localStorage.removeItem('fh_remember');
          }
          if (btn) btn.textContent = original;
          window.location.href = LOGIN_REDIRECT;
        }, 600);
      });
    }

    // --- VIEW SWITCHING ---
    if (create) {
      create.addEventListener('click', function (e) {
        e.preventDefault();
        showPane('signup');
      });
    }

    if (backToLogin) {
      backToLogin.addEventListener('click', function (e) {
        e.preventDefault();
        showPane('login');
      });
    }

    if (forgot) {
      forgot.addEventListener('click', function (e) {
        e.preventDefault();
        showPane('forgot');
      });
    }

    if (forgotBack) {
      forgotBack.addEventListener('click', function (e) {
        e.preventDefault();
        showPane('login');
      });
    }
  }

  /* ------------------------------ Sign up ------------------------------ */
  function bootSignup() {
    var form = document.getElementById('signup-form');
    if (!form) return;

    var firstName = document.getElementById('first-name');
    var lastName = document.getElementById('last-name');
    var signupEmail = document.getElementById('signup-email');
    var signupPassword = document.getElementById('signup-password');
    var signupConfirm = document.getElementById('signup-password-confirm');
    var agreeTerms = document.getElementById('agree-terms');
    var error = document.getElementById('signup-error');
    var success = document.getElementById('signup-success');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setError(error, '');
      setError(success, '');
      var ok = true;

      [firstName, lastName, signupEmail, signupPassword, signupConfirm].forEach(function (input) {
        if (!input || !input.value.trim()) markInvalid(input, true);
        else markInvalid(input, false);
      });

      if (!firstName || !firstName.value.trim()) ok = false;
      if (!lastName || !lastName.value.trim()) ok = false;

      if (!signupEmail || !emailValid(signupEmail.value)) {
        markInvalid(signupEmail, true);
        ok = false;
      }

      if (!signupPassword || signupPassword.value.length < 6) {
        markInvalid(signupPassword, true);
        ok = false;
      } else {
        markInvalid(signupPassword, false);
      }

      if (!signupConfirm || signupConfirm.value !== signupPassword.value) {
        markInvalid(signupConfirm, true);
        ok = false;
      } else {
        markInvalid(signupConfirm, false);
      }

      if (!agreeTerms || !agreeTerms.checked) {
        setError(error, 'You must agree to the Terms & Conditions.');
        return;
      }

      if (!ok) {
        setError(error, 'Please complete all fields to create your account.');
        return;
      }

      var btn = form.querySelector('.ml-submit');
      var original = btn ? btn.textContent : '';
      if (btn) btn.textContent = 'Creating account...';

      // Local demo: no data is sent. Show a success state like the online flow.
      setTimeout(function () {
        if (btn) btn.textContent = original;
        form.reset();
        setError(success, 'Your account has been created successfully! You can now log in.');
        setTimeout(function () {
          var loginEmail = document.getElementById('email');
          if (loginEmail && signupEmail) loginEmail.value = signupEmail.value.trim();
          showPane('login');
        }, 1600);
      }, 700);
    });
  }

  /* ------------------------- Forgot password --------------------------- */
  function bootForgot() {
    var form = document.getElementById('forgot-form');
    if (!form) return;

    var forgotEmail = document.getElementById('forgot-email');
    var error = document.getElementById('forgot-error');
    var success = document.getElementById('forgot-success');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setError(error, '');
      setError(success, '');

      if (!forgotEmail || !emailValid(forgotEmail.value)) {
        markInvalid(forgotEmail, true);
        setError(error, 'Please enter a valid email address.');
        return;
      }

      markInvalid(forgotEmail, false);

      var btn = form.querySelector('.ml-submit');
      var original = btn ? btn.textContent : '';
      if (btn) btn.textContent = 'Sending...';

      // Local demo: no email is sent. Mirrors the online confirmation message.
      setTimeout(function () {
        if (btn) btn.textContent = original;
        setError(success, 'If an account exists for that email, a reset link has been sent.');
        form.reset();
      }, 700);
    });
  }

  /* -------------------------- Reset fields ----------------------------- */
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('ml-input')) {
      markInvalid(e.target, false);
    }
  });

  function boot() {
    bootForm();
    bootSignup();
    bootForgot();
    loadThree(initThree);
  }

  window.addEventListener('pagehide', function () {
    active = false;
    window.removeEventListener('resize', handleResize);
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) renderer.dispose();
    if (geometry) geometry.dispose();
    if (material) material.dispose();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
