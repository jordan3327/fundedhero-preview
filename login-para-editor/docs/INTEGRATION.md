# Guía de integración — Login FundedHero

Origen: `fundedhero-preview/app/index.html`. Textos originales intactos.

## 1. Archivos y rutas (mantener relativas)

| Archivo | Rol |
|---|---|
| `index.html` | Estructura + 3 paneles |
| `assets/css/modern-login.css` | Estilos (299 líneas) |
| `assets/js/modern-login.js` | Lógica (416 líneas) |
| `assets/images/logo_auth.png` | Logo `.ml-logo` |
| `assets/images/favicon.png` | Favicon |
| `dist/login-standalone.html` | Solo preview (no usar en prod) |

## 2. IDs críticos — NO renombrar

- Fondo: `ml-canvas`
- Paneles: `ml-login`, `ml-signup`, `ml-forgot`
- Login: `login-form`, `email`, `password`, `remember`, `login-error`, `forgot-password`, `create-account`
- Signup: `signup-form`, `first-name`, `last-name`, `signup-email`, `signup-password`, `signup-password-confirm`, `agree-terms`, `signup-error`, `signup-success`, `back-to-login`
- Forgot: `forgot-form`, `forgot-email`, `forgot-error`, `forgot-success`, `forgot-back`

Clases usadas por CSS/JS: `.ml-root .ml-canvas .ml-vignette .ml-card .ml-logo .ml-pane .ml-title .ml-sub .ml-form .ml-field .ml-label .ml-input .ml-remember .ml-check .ml-link .ml-msg .ml-success .ml-submit .ml-switch .ml-link-btn .ml-footer .ml-input-invalid`.

## 3. Funciones JS (`assets/js/modern-login.js`)

- `showPane(name)` — alterna paneles con `hidden`.
- `bootForm()` — valida email con regex, demo con `setTimeout 600ms` → `LOGIN_REDIRECT`.
- `bootSignup()` — valida nombre, email, `password.length >= 6`, confirm igual, `agree-terms`; éxito con `setTimeout 700ms`.
- `bootForgot()` — valida email; mensaje de confirmación.
- `emailValid()`, `markInvalid()`, `setError()`.
- Fondo WebGL: `loadThree(initThree)` carga `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` (lazy) + `handleResize` + limpieza en `pagehide`.
- `Remember me`: `localStorage fh_remember / fh_email`.
- Todos los cambios de panel usan `e.preventDefault()`.

## 4. CONFIG — lo único a cambiar

1. `assets/js/modern-login.js:152`:
   ```js
   var LOGIN_REDIRECT = 'dashboard.html'; // → URL real
   ```
2. `index.html:55,92`: links `../pages/terms-and-conditions.html` y `../pages/privacy-policy.html` → URLs finales.
3. Conectar `login-form` / `signup-form` / `forgot-form` al backend real (hoy demo local).

## 5. Dependencias externas

- Google Fonts `Inter 400/500/600/700` (en `<head>`).
- Three.js r128 CDN (carga el propio JS, tolera fallo: sin fondo sigue el formulario).
- Sin jQuery ni frameworks.

## 6. Procedimiento recomendado

1. Copiar `index.html` + `assets/` al destino (ej. `/login/`).
2. Ajustar CONFIG (§4).
3. Pasar `docs/QA-CHECKLIST.md`.
4. Desplegar. Para builders, maquetar desde `index.html` (no desde `dist/`, que es solo preview).
