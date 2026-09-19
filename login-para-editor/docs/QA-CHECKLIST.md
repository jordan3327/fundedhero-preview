# QA Checklist — Login

Marcar antes de dar por integrada la página.

## Visual

- [ ] Tarjeta `.ml-card` centrada, logo visible, fondo de puntos (puede tardar ~1s por Three.js).
- [ ] Sin scroll horizontal en 360px / 768px / 1440px.
- [ ] Foco visible dorado con teclado (Tab).

## Funcional

- [ ] Login vacío → `Please enter a valid email and password.` en `#login-error`.
- [ ] Login válido → redirige a `LOGIN_REDIRECT`.
- [ ] `Create one` → muestra `#ml-signup`; `Login` (`#back-to-login`) → vuelve.
- [ ] Signup incompleto → errores inline; pass < 6 o confirm distinto → error; sin `agree-terms` → `You must agree…`; válido → `Your account has been created…` y vuelve a login (email copiado).
- [ ] `Forgot password` → `#ml-forgot`; email inválido → error; válido → `If an account exists…`; `Back to login` → vuelve.
- [ ] `Remember me` persiste `fh_email` entre recargas.
- [ ] Consola (F12) con 0 errores. Three.js puede loguear warning de CDN, aceptable.

## Integración

- [ ] Rutas `assets/css|js|images` resuelven (sin 404).
- [ ] `LOGIN_REDIRECT` y Terms/Privacy apuntan a URLs finales.
- [ ] Formularios conectados al backend (o marcado como demo pendiente).
