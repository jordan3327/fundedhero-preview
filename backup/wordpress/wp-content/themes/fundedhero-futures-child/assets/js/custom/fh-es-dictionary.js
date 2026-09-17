/* FH interpretacion inteligente al espanol — capa de correccion sobre GTranslate.
 * El ingles original NO se toca: este script solo mejora el ES cuando
 * <html lang="es"> (nodo exacto primero, luego frases; respeta Mayusculas).
 * Cubre texto, placeholders, alts y titulos. Sin dependencias. */
(function () {
  'use strict';

  /* [origenExacto, espanolNatural] — ordenado de largo a corto en la pasada de frases. */
  var PHRASES = [
    ['Think You Can Beat the Market? Prove It in', '¿Crees que puedes vencer al mercado? Demuéstralo en'],
    ['Stop chasing simulated profits.', 'Deja de perseguir ganancias simuladas.'],
    ['Trade real capital with FundedHero.', 'Opera con capital real con FundedHero.'],
    ['Request payouts on demand and keep up to 90% of profits', 'Solicita retiros a demanda y quédate con hasta el 90% de las ganancias'],
    ['Start with Hero ZERO, Hero ONE, or skip straight to live capital with Hero Live.', 'Empieza con Hero ZERO, Hero ONE o pasa directo a capital real con Hero Live.'],
    ['Real traders, real answers – not a bot. Fast responses whenever you need them.', 'Traders reales, respuestas reales, no un bot. Respuestas rápidas cuando las necesites.'],
    ['Live chat, quick answers, and direct access to our team and fellow traders.', 'Chat en vivo, respuestas rápidas y acceso directo a nuestro equipo y a otros traders.'],
    ['Three Steps To Your FundedHero Account', 'Tres pasos hacia tu cuenta FundedHero'],
    ['Experience the next level of prop trading.', 'Experimenta el siguiente nivel del prop trading.'],
    ['80% 1st payout / 85% 2nd payout / 90% 3rd payout', '80% 1.er retiro / 85% 2.º retiro / 90% 3.er retiro'],
    ['85% 1st payout / 90% 2nd payout / 95% 3rd payout', '85% 1.er retiro / 90% 2.º retiro / 95% 3.er retiro'],
    ['FLASH PROMO 55% OFF All Accounts', 'PROMO FLASH 55% OFF en todas las cuentas'],
    ['60% OFF SALE ENDS FRIDAY JULY 31 ON CFDs', 'Rebaja 60% OFF termina el viernes 31 de julio en CFD'],
    ['4 winning days (0.3% or more)', '4 días ganadores (0.3% o más)'],
    ['3 winning days (0.3% or more)', '3 días ganadores (0.3% o más)'],
    ['5 winning days (0.3% or more)', '5 días ganadores (0.3% o más)'],
    ['0% Phase 1 / 50% Payout', '0% Fase 1 / 50% en retiros'],
    ['3 Day Payouts', 'Retiros en 3 días'],
    ['Fastest payouts in the industry', 'Los retiros más rápidos de la industria'],
    ['Fastest payouts in the industry.', 'Los retiros más rápidos de la industria.'],
    ['Payout On Demand', 'Retiros a demanda'],
    ['Get paid as you request', 'Cobra cuando lo solicites'],
    ['Get paid as you request.', 'Cobra cuando lo solicites.'],
    ['One time payments', 'Pagos únicos'],
    ['One-Time Payment', 'Pago único'],
    ['no monthly charges', 'sin cargos mensuales'],
    ['No monthly charges, ever.', 'Sin cargos mensuales, nunca.'],
    ['no monthly fees, ever.', 'sin cargos mensuales, nunca.'],
    ['Instant Funding', 'Fondeo instantáneo'],
    ['No Activation Fee', 'Sin cargo de activación'],
    ['Most Affordable', 'Más accesible'],
    ['Most Popular', 'Más popular'],
    ['Live Capital Program', 'Programa de capital real'],
    ['Live Market Breakdowns', 'Análisis del mercado en vivo'],
    ['Live payouts', 'Retiros en vivo'],
    ['Start Your Day With', 'Empieza tu día con'],
    ['Traders Worldwide', 'Traders en todo el mundo'],
    ['In Funding', 'En fondeo'],
    ['Profit Split', 'Reparto de ganancias'],
    ['Profit Target', 'Meta de ganancia'],
    ['Drawdown Mode', 'Tipo de drawdown'],
    ['Daily Drawdown', 'Drawdown diario'],
    ['Max Drawdown', 'Drawdown máximo'],
    ['End of Day Trailing', 'Trailing de cierre diario'],
    ['Activation Fee', 'Cargo de activación'],
    ['Reset Fee', 'Costo de reset'],
    ['Max Size', 'Tamaño máximo'],
    ['Min Trading Days', 'Días mínimos de trading'],
    ['Maximum Payout', 'Retiro máximo'],
    ['Minimum Payout', 'Retiro mínimo'],
    ['1st Payout Goal', 'Meta del 1.er retiro'],
    ['2nd Payout Goal', 'Meta del 2.º retiro'],
    ['Payout Guaranteed', 'Retiro garantizado'],
    ['Phase 1 Target', 'Meta de Fase 1'],
    ['Phase 2 Target', 'Meta de Fase 2'],
    ['No Evaluation', 'Sin evaluación'],
    ['Challenge Rules', 'Reglas del desafío'],
    ['Funded Rules', 'Reglas de fondeo'],
    ['1. Choose Your Challenge', '1. Elige tu desafío'],
    ['2. Hit Your Target', '2. Alcanza tu objetivo'],
    ['3. Get Funded & Withdraw', '3. Obtén tu fondeo y retira'],
    ['Choose Your Challenge', 'Elige tu desafío'],
    ['Hit Your Target', 'Alcanza tu objetivo'],
    ['Choose account type', 'Elige el tipo de cuenta'],
    ['Platform: Volumetrica', 'Plataforma: Volumetrica'],
    ['News Trading', 'Trading de noticias'],
    ['Weekend Holding', 'Posiciones en fin de semana'],
    ['Unlimited Trading Period', 'Periodo de trading ilimitado'],
    ['Quick withdrawal', 'Retiros rápidos'],
    ['Clear rules', 'Reglas claras'],
    ['How It Works', 'Cómo funciona'],
    ['Join the FundedHero Community', 'Únete a la comunidad FundedHero'],
    ['Join Discord', 'Únete a Discord'],
    ['Watch on YouTube', 'Ver en YouTube'],
    ['Connect', 'Conecta'],
    ['and Thrive', 'y crece'],
    ['View Plans', 'Ver planes'],
    ['Get Help', 'Obtener ayuda'],
    ['Get Funded', 'Obtén tu fondeo'],
    ['Get funded', 'Obtén tu fondeo'],
    ['Buy Now', 'Comprar ahora'],
    ['Subscribe to our newsletter', 'Suscríbete a nuestro boletín'],
    ['Newsletter - FundedHero', 'Boletín - FundedHero'],
    ['Terms and Conditions', 'Términos y condiciones'],
    ['Privacy Policy', 'Política de privacidad'],
    ['All rights reserved.', 'Todos los derechos reservados.'],
    ['Subscribe', 'Suscribirse'],
    ['Follow us', 'Síguenos'],
    ['We Accept', 'Aceptamos'],
    ['Contact', 'Contacto'],
    ['Affiliate', 'Afiliados'],
    ['Skip to content', 'Saltar al contenido'],
    ['LIMITED TIME', 'TIEMPO LIMITADO'],
    ['Visit CFD', 'Visitar CFD'],
    ['1 Step', '1 fase'],
    ['2 Step', '2 fases'],
    ['Phase 1', 'Fase 1'],
    ['Phase 2', 'Fase 2'],
    ['Consistency', 'Consistencia'],
    ['Plans', 'Planes'],
    ['Rules', 'Reglas'],
    ['Login', 'Iniciar sesión'],
    ['Menu', 'Menú'],
    /* Correcciones a salidas tipicas del traductor automatico: */
    ['Cuenta financiada', 'Cuenta fondeada'],
    ['cuenta financiada', 'cuenta fondeada'],
    ['Cuentas financiadas', 'Cuentas fondeadas'],
    ['cuentas financiadas', 'cuentas fondeadas'],
    ['Obtener financiación', 'Obtén tu fondeo'],
    ['obtener financiación', 'obtener tu fondeo'],
    ['Pago a pedido', 'Retiro a demanda'],
    ['Pago bajo demanda', 'Retiro a demanda'],
    ['pago a pedido', 'retiro a demanda'],
    ['División de ganancias', 'Reparto de ganancias'],
    ['división de ganancias', 'reparto de ganancias'],
    ['Objetivo de ganancias', 'Meta de ganancia'],
    ['Comercio de noticias', 'Trading de noticias'],
    ['Tarifa de activación', 'Cargo de activación'],
    ['tarifa de activación', 'cargo de activación'],
    ['Cuota de restablecimiento', 'Costo de reset'],
    ['Período de negociación ilimitado', 'Periodo de trading ilimitado'],
    ['Disposición', 'Drawdown'],
    ['disposición máxima', 'drawdown máximo'],
    ['Reducción máxima', 'Drawdown máximo']
  ];

  /* Patrones dinamicos (toasts de retiros, tickers). */
  var PATTERNS = [
    [/\$\s?([\d,]+)\s+withdrawn/i, '$$$1 retirado'],
    [/(\d+)\s*hrs/i, '$1 h'],
    [/(\d+)\s*Mini\s*\/\s*(\d+)\s*Micro/i, '$1 Mini / $2 Micro']
  ];

  function isSpanish() {
    var l = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    return l.indexOf('es') === 0;
  }

  function norm(s) {
    return s.replace(/\s+/g, ' ').trim();
  }

  function fixString(s) {
    if (!s || s.indexOf('�') > -1) return s;
    var out = s, i, p;
    for (i = 0; i < PHRASES.length; i++) {
      p = PHRASES[i];
      if (out.indexOf(p[0]) > -1) out = out.split(p[0]).join(p[1]);
    }
    for (i = 0; i < PATTERNS.length; i++) {
      p = PATTERNS[i];
      if (p[0].test(out)) out = out.replace(p[0], p[1]);
    }
    return out;
  }

  var ATTRS = ['placeholder', 'alt', 'title', 'aria-label'];

  function fixNode(node) {
    if (node.nodeType === 3) {
      var v = fixString(node.nodeValue);
      if (v !== node.nodeValue) node.nodeValue = v;
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return;
    var i, a;
    for (i = 0; i < ATTRS.length; i++) {
      a = ATTRS[i];
      if (node.hasAttribute && node.hasAttribute(a)) {
        var v = fixString(node.getAttribute(a));
        if (v !== node.getAttribute(a)) node.setAttribute(a, v);
      }
    }
    var c = node.firstChild;
    while (c) {
      var next = c.nextSibling;
      fixNode(c);
      c = next;
    }
  }

  /* Botones: el traductor les pone "Obtén financiación"/"Acceso"; se fuerzan
     por selector para que nuestra version gane siempre, sin tocar nada mas. */
  var BTN_FIX = [
    ['.site-header .cta-button.super-btn, .gb-button-9f80bd18',
      ['Obtén financiación', 'Obtener financiación', 'Consigue financiación', 'Obtenga financiación'],
      'Obtén tu fondeo'],
    ['.site-header .cta-login',
      ['Acceso', 'Iniciar la sesión', 'Inicia sesión'],
      'Iniciar sesión']
  ];

  function normBtn(s) {
    return s.replace(/\s+/g, ' ').trim();
  }

  function fixButtons() {
    if (!isSpanish() || !document.querySelectorAll) return;
    var i, j, els, t;
    for (i = 0; i < BTN_FIX.length; i++) {
      try { els = document.querySelectorAll(BTN_FIX[i][0]); } catch (e) { continue; }
      for (j = 0; j < els.length; j++) {
        t = normBtn(els[j].textContent || '');
        if (BTN_FIX[i][1].indexOf(t) > -1 && t !== BTN_FIX[i][2]) {
          els[j].textContent = BTN_FIX[i][2];
        }
      }
    }
  }

  var timer = null;
  function schedule() {
    if (!isSpanish()) return;
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      if (!isSpanish()) return;
      try { fixNode(document.body); } catch (e) {}
      try { fixButtons(); } catch (e) {}
    }, 450);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  /* Repasos extra: el traductor llega en oleadas; se reintenta 1.5s, 3s y 6s. */
  setTimeout(schedule, 1500);
  setTimeout(schedule, 3000);
  setTimeout(schedule, 6000);
  if ('MutationObserver' in window) {
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['lang']
    });
  }
  window.addEventListener('hashchange', schedule);
  window.FH_ES = { fixString: fixString, phrases: PHRASES.length };
})();
