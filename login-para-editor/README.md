# FundedHero — Login

Página de autenticación (login / signup / forgot) lista para integrar. Textos e IDs intactos del original `app/index.html`.

## Estructura

```
login-para-editor/
├── index.html                  # Página (3 paneles)
├── assets/
│   ├── css/modern-login.css    # Estilos
│   ├── js/modern-login.js      # Lógica (ver CONFIG abajo)
│   ├── images/favicon.png
│   ├── images/logo_auth.png
│   └── fonts/.gitkeep          # Reserva (usa Google Fonts Inter)
├── dist/
│   └── login-standalone.html   # Build de 1 archivo (preview rápida)
└── docs/
    ├── INTEGRATION.md          # Guía completa para el editor
    └── QA-CHECKLIST.md         # Pruebas de aceptación
```

## Uso rápido

```bash
# Opción 1: abrir directo
start index.html

# Opción 2: servir local (recomendado)
npx serve .
```

## CONFIG (único lugar a editar)

`assets/js/modern-login.js:152`:

```js
var LOGIN_REDIRECT = 'dashboard.html'; // → URL real del dashboard
```

Más links a ajustar en `index.html`: `terms-and-conditions.html`, `privacy-policy.html` (ver `docs/INTEGRATION.md`).

## Reglas (no romper)

- No renombrar IDs (`email`, `login-form`, `ml-login`, … lista completa en docs).
- No quitar `hidden`, `novalidate`, `defer` ni `type="button"`.
- Solo visual vía `assets/css/modern-login.css`. Lógica solo en `modern-login.js`.

Versión: `1.0.0` · Ver `CHANGELOG.md`.
