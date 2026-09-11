/*
 * PropFirm Tools — Vista de tarjetas (layout="cards")
 *
 * El HTML lo genera PHP entero. Este archivo sólo se encarga de:
 *   - alternar pestañas de familia, paso y fase
 *   - mover el carrusel y mantener flechas/puntos en sintonía
 *   - el Buy Now de cada tarjeta
 *
 * La vista clásica vive en variation-block.js y no comparte estado con esta.
 */
jQuery(function ($) {
    'use strict';

    var BLOCK = '.propfirm-cards-block';

    var REDUCED_MOTION = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var FAMILY_EXIT_MS = REDUCED_MOTION ? 0 : 170;

    /* ----------------------------------------------------------------
     * Pestañas
     * -------------------------------------------------------------- */

    function switchPanel($tabs, $panels, key, attr, $block) {
        if (!$panels.length) return;

        var el = $tabs[0];
        var $current = $panels.filter('.is-active');
        var $next = $panels.filter(function () { return $(this).data(attr) === key; });

        $tabs.each(function () {
            var isMatch = $(this).data(attr) === key;
            $(this).toggleClass('is-active', isMatch).attr('aria-selected', isMatch ? 'true' : 'false');
        });

        if (!$next.length || ($next.is($current) && !$.data(el, 'pfTicking'))) return;

        window.clearTimeout($.data(el, 'pfTimer'));
        $.data(el, 'pfTimer', null);

        var proceed = function () {
            $.data(el, 'pfTicking', false);
            $panels.removeClass('is-leaving');
            $next.addClass('is-active is-enter');
            refreshVisibleCarousels($block);
        };

        // Comprobar la visibilidad ANTES de quitar is-active (el panel pasa
        // a display:none en cuanto se lo quitamos).
        var wasVisible = $current.length && $current.is(':visible');

        $panels.removeClass('is-active is-enter');
        $panels.not($current).removeClass('is-leaving');

        if (wasVisible) {
            $current.addClass('is-leaving');
            $.data(el, 'pfTicking', true);
            $.data(el, 'pfTimer', window.setTimeout(proceed, FAMILY_EXIT_MS));
        } else {
            proceed();
        }
    }

    $(document).on('click', '.pf-family-tab', function () {
        var $block = $(this).closest(BLOCK);
        switchPanel(
            $block.find('.pf-family-tab'),
            $block.find('.pf-family-panel'),
            $(this).data('family'),
            'family',
            $block
        );
    });

    $(document).on('click', '.pf-step-tab', function () {
        var $panel = $(this).closest('.pf-family-panel');
        switchPanel(
            $panel.find('> .pf-step-tabs .pf-step-tab'),
            $panel.find('> .pf-step-panel'),
            $(this).data('step'),
            'step',
            $(this).closest(BLOCK)
        );
    });

    $(document).on('click', '.pf-card__phase-tab', function () {
        var $card = $(this).closest('.pf-card');
        var phase = $(this).data('phase');

        $card.find('.pf-card__phase-tab').each(function () {
            var isMatch = $(this).data('phase') === phase;
            $(this).toggleClass('is-active', isMatch).attr('aria-selected', isMatch ? 'true' : 'false');
        });

        $card.find('.pf-card__rules').each(function () {
            this.hidden = ($(this).data('phase') !== phase);
        });
    });

    /* ----------------------------------------------------------------
     * Carrusel
     *
     * Se desplaza de a una tarjeta. El índice máximo es
     * (total - visibles), de modo que la última posición siempre deja
     * la vista llena en lugar de dejar huecos al final.
     * -------------------------------------------------------------- */

    function visibleCount($carousel) {
        var $cards = $carousel.find('.pf-card');
        if (!$cards.length) return 1;

        var viewport = $carousel.find('.pf-carousel__viewport').width();
        var step = cardStep($carousel);
        if (!viewport || !step) return 1;

        return Math.max(1, Math.round(viewport / step));
    }

    function cardStep($carousel) {
        var $cards = $carousel.find('.pf-card');
        if ($cards.length < 2) {
            return $cards.outerWidth(true) || 0;
        }
        // Distancia real entre dos tarjetas: incluye el gap del flex,
        // que no aparece en outerWidth().
        return Math.abs($cards.eq(1).position().left - $cards.eq(0).position().left);
    }

    function maxIndex($carousel) {
        var total = $carousel.find('.pf-card').length;
        return Math.max(0, total - visibleCount($carousel));
    }

    function renderDots($carousel, index, max) {
        var $dots = $carousel.find('.pf-carousel__dots');
        if ($dots.children().length !== max + 1) {
            $dots.empty();
            for (var i = 0; i <= max; i++) {
                $dots.append(
                    $('<button type="button" class="pf-carousel__dot"></button>').attr('data-index', i)
                );
            }
        }
        $dots.children().each(function (i) {
            $(this).toggleClass('is-active', i === index);
        });
    }

    function goTo($carousel, index) {
        var max = maxIndex($carousel);
        index = Math.min(Math.max(index, 0), max);

        $carousel.data('index', index);
        $carousel.toggleClass('is-static', max === 0);

        $carousel.find('.pf-carousel__track').css(
            'transform', 'translateX(' + (-index * cardStep($carousel)) + 'px)'
        );

        $carousel.find('.pf-carousel__nav--prev').prop('disabled', index <= 0);
        $carousel.find('.pf-carousel__nav--next').prop('disabled', index >= max);

        renderDots($carousel, index, max);
    }

    function refreshVisibleCarousels($scope) {
        $scope.find('.pf-carousel').each(function () {
            var $carousel = $(this);
            if (!$carousel.is(':visible')) return;
            goTo($carousel, $carousel.data('index') || 0);
        });
        syncAllHints();
    }

    $(document).on('click', '.pf-carousel__nav--prev', function () {
        var $carousel = $(this).closest('.pf-carousel');
        goTo($carousel, ($carousel.data('index') || 0) - 1);
    });

    $(document).on('click', '.pf-carousel__nav--next', function () {
        var $carousel = $(this).closest('.pf-carousel');
        goTo($carousel, ($carousel.data('index') || 0) + 1);
    });

    $(document).on('click', '.pf-carousel__dot', function () {
        goTo($(this).closest('.pf-carousel'), parseInt($(this).attr('data-index'), 10) || 0);
    });

    /* ----------------------------------------------------------------
     * Swipe táctil (móvil): deslizar las tarjetas con el dedo.
     *
     * Reutiliza goTo/cardStep/maxIndex para mantener flechas y puntos en
     * sintonía. En los extremos se permite un arrastre elástico (no se
     * va más allá del primer/último slide). Sólo se activa en pantallas
     * táctiles; en escritorio las flechas siguen funcionando.
     * -------------------------------------------------------------- */

    var TOUCH_POINTER = window.matchMedia &&
        (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);

    function attachSwipe() {
        if (!TOUCH_POINTER) return;
        if ($(document).data('pf-swiping')) return;
        $(document).data('pf-swiping', true);

        // Estado de arrastre por viewport (delegado: aguanta aunque el
        // plugin regenere los carruseles al cambiar de pestaña).
        function dragState(vp) {
            var s = $.data(vp, 'pf-drag');
            if (!s) {
                s = { dragging: false, moved: false, startX: 0, startY: 0, dx: 0 };
                $.data(vp, 'pf-drag', s);
            }
            return s;
        }

        $(document).on('pointerdown.pfswipe', '.pf-carousel__viewport', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            var vp = this;
            var $vp = $(vp);
            var $carousel = $vp.closest('.pf-carousel');
            var s = dragState(vp);
            s.dragging = true;
            s.moved = false;
            s.startX = e.clientX;
            s.startY = e.clientY;
            s.dx = 0;
            try { vp.setPointerCapture(e.pointerId); } catch (err) {}
            $carousel.find('.pf-carousel__track').addClass('pf-swipe-dragging');
            $carousel.data('pf-dragging', true);
            $carousel.data('pf-user-swiped', true);
        });

        $(document).on('pointermove.pfswipe', '.pf-carousel__viewport', function (e) {
            var vp = this;
            var s = dragState(vp);
            if (!s.dragging) return;
            var $carousel = $(vp).closest('.pf-carousel');
            var $track = $carousel.find('.pf-carousel__track');

            var ddx = e.clientX - s.startX;
            var ddy = e.clientY - s.startY;

            // Gesto vertical: se suelta el arrastre y la página hace
            // scroll normal.
            if (!s.moved && Math.abs(ddy) > 8 && Math.abs(ddy) > Math.abs(ddx)) {
                s.dragging = false;
                $track.removeClass('pf-swipe-dragging');
                return;
            }
            if (Math.abs(ddx) > 6) s.moved = true;

            s.dx = ddx;
            var index = $carousel.data('index') || 0;
            var base = -index * cardStep($carousel);
            var max = maxIndex($carousel);
            // Resistencia elástica al llegar al primer o último slide.
            var extra = 0;
            if ((index <= 0 && ddx > 0) || (index >= max && ddx < 0)) {
                extra = ddx * 0.35;
            }
            $track.css('transform', 'translateX(' + (base + s.dx + extra) + 'px)');
        });

        function endDrag(e) {
            var s = dragState(this);
            if (!s.dragging) return;
            s.dragging = false;
            var $carousel = $(this).closest('.pf-carousel');
            var $track = $carousel.find('.pf-carousel__track');
            $carousel.data('pf-dragging', false);
            $track.removeClass('pf-swipe-dragging');

            if (!s.moved) {
                goTo($carousel, $carousel.data('index') || 0);
                return;
            }

            var index = $carousel.data('index') || 0;
            var threshold = cardStep($carousel) * 0.22;
            var target = index;
            if (s.dx <= -threshold) target = index + 1;
            else if (s.dx >= threshold) target = index - 1;
            goTo($carousel, target);
            if (target !== index) dismissSwipeHint($carousel);
        }

        $(document).on('pointerup.pfswipe pointercancel.pfswipe', '.pf-carousel__viewport', endDrag);

        // Un arrastre no debe disparar los botones de la tarjeta.
        $(document).on('click.pfswipe', '.pf-carousel__viewport', function (e) {
            var s = dragState(this);
            if (!s.moved) return;
            e.preventDefault();
            e.stopPropagation();
        }, true);
    }

    attachSwipe();
    $(document).on('pf:carousels:rendered', attachSwipe);

    /* ----------------------------------------------------------------
     * Hint "desliza para ver más planes"
     *
     * Pequeña píldora que se muestra bajo el carrusel SÓLO en pantallas
     * táctiles pequeñas, mientras el carrusel sea deslizable y esté
     * visible. Desaparece al primer deslizamiento real.
     * -------------------------------------------------------------- */

    var SWIPE_HINT_SVG =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
        'aria-hidden="true">' +
        '<path d="M3 9h13"/><path d="M13 5l4 4-4 4"/>' +
        '<path d="M3 15h13"/><path d="M13 11l4 4-4 4"/></svg>';

    function touchClass() {
        if (TOUCH_POINTER) {
            document.documentElement.classList.add('pf-touch');
        }
    }

    function syncSwipeHint($carousel) {
        if (!TOUCH_POINTER) return;
        if ($carousel.data('pf-user-swiped')) return;

        var swipable = maxIndex($carousel) > 0 && $carousel.is(':visible');
        if (!swipable) {
            $carousel.next('.pf-swipe-hint').addClass('is-hidden');
            return;
        }

        var $hint = $carousel.next('.pf-swipe-hint');
        if (!$hint.length) {
            $hint = $('<div class="pf-swipe-hint" role="note">' +
                SWIPE_HINT_SVG +
                '<span>Desliza para ver más planes</span></div>');
            $carousel.after($hint);
            scheduleNudge($carousel);
        }
        $hint.removeClass('is-hidden');
    }

    function syncAllHints() {
        $('.pf-carousel').each(function () {
            syncSwipeHint($(this));
        });
    }

    function dismissSwipeHint($carousel) {
        var $hint = $carousel.next('.pf-swipe-hint');
        if ($hint.length) {
            $hint.addClass('is-hidden');
            setTimeout(function () { $hint.remove(); }, 450);
        }
    }

    /* ----------------------------------------------------------------
     * "Tirón" de atención (mind-game)
     *
     * Cuando aparecen las tarjetas, un "pull-and-release" breve desplaza el
     * carrusel hacia la izquierda (asomando el borde de la siguiente
     * tarjeta) y regresa con suavidad. Sugiere al visitante que hay más
     * planes y que debe deslizar. Se repite un par de veces con calma y
     * se detiene en cuanto el usuario toca o abandona la vista.
     * -------------------------------------------------------------- */

    var NUDGE_STEPS = 2;
    var NUDGE_DWELL = 320;
    var NUDGE_GAP = 2900;

    function nudgeOnce($carousel) {
        var $track = $carousel.find('.pf-carousel__track');
        var index = $carousel.data('index') || 0;
        var step = cardStep($carousel);
        if (!step) return;

        $track.addClass('pf-peek');
        $track.css('transform', 'translateX(' + (-Math.round(step * 0.18)) + 'px)');
        setTimeout(function () {
            $track.removeClass('pf-peek');
            goTo($carousel, index);
        }, NUDGE_DWELL);
    }

    function scheduleNudge($carousel) {
        if (REDUCED_MOTION) return;
        if ($carousel.data('pf-nudge-done')) return;
        $carousel.data('pf-nudge-done', true);

        var repeats = 0;
        (function tick() {
            if ($carousel.data('pf-user-swiped')) return;
            if (!$carousel.is(':visible')) return;
            if (($carousel.data('index') || 0) !== 0) return;
            if (!$carousel.data('pf-dragging')) nudgeOnce($carousel);

            repeats++;
            if (repeats < NUDGE_STEPS) {
                setTimeout(tick, NUDGE_GAP);
            }
        })();
    }

    touchClass();
    syncAllHints();

    /* ----------------------------------------------------------------
     * Buy Now
     *
     * Misma mecánica que la vista clásica (?custom_add_to_cart=...),
     * pero la variación sale de la tarjeta en vez de los selectores.
     * -------------------------------------------------------------- */

    $(document).on('click', '.pf-card__buy', function (e) {
        e.preventDefault();

        var $btn = $(this);
        var $card = $btn.closest('.pf-card');
        var $block = $btn.closest(BLOCK);

        var productId = $block.data('product-id');
        var variationId = parseInt($card.attr('data-variation-id'), 10);
        if (!productId || !variationId) return;

        var targetUrl = '';
        if ($block.attr('data-enable-custom-buy-now') === 'yes') {
            targetUrl = $card.attr('data-custom-buy-now-url') ||
                        $block.attr('data-custom-buy-now-url') || '';
        }

        if (!targetUrl) {
            targetUrl = window.location.origin + window.location.pathname +
                        '?custom_add_to_cart=' + encodeURIComponent(productId) +
                        '&variation_id=' + encodeURIComponent(variationId);

            // Los atributos van en la URL para que WooCommerce resuelva la
            // variación aunque el ID ya no exista.
            var attributes = {};
            try {
                attributes = JSON.parse($card.attr('data-attributes') || '{}') || {};
            } catch (err) {
                attributes = {};
            }
            Object.keys(attributes).forEach(function (key) {
                if (attributes[key] === '') return;
                targetUrl += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(attributes[key]);
            });

            // El cupón que produjo el precio mostrado viaja al checkout. Sin
            // esto el cliente ve un precio rebajado y luego paga el completo.
            var couponCode = $block.attr('data-coupon-code') || '';
            if (couponCode) {
                targetUrl += '&coupon_code=' + encodeURIComponent(couponCode);
            }
        }

        $block.find('.pf-card__buy').prop('disabled', true);
        $block.find('.pf-cards-loader').prop('hidden', false);
        window.location.href = targetUrl;
    });

    /* ----------------------------------------------------------------
     * Copiar código de cupón desde la tarjeta
     * -------------------------------------------------------------- */

    $(document).on('click', '.pf-card__promo .coupon-code-badge', function () {
        var $badge = $(this);
        var code = $badge.attr('data-code');
        if (!code || !navigator.clipboard) return;

        navigator.clipboard.writeText(code).then(function () {
            var $strong = $badge.find('strong');
            var original = $strong.text();
            $strong.text('Copied!');
            setTimeout(function () { $strong.text(original); }, 1500);
        }).catch(function () { /* el portapapeles puede estar bloqueado */ });
    });

    /* ----------------------------------------------------------------
     * Arranque y recálculo
     * -------------------------------------------------------------- */

    function initAll() {
        $(BLOCK).each(function () {
            refreshVisibleCarousels($(this));
        });
    }

    initAll();

    var resizeTimer = null;
    $(window).on('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initAll, 150);
    });

    // Las fuentes web cambian el ancho de las tarjetas al cargar.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(initAll);
    }

    // Botón "atrás" del navegador (bfcache): reactiva los botones.
    window.addEventListener('pageshow', function () {
        $('.pf-card__buy').prop('disabled', false);
        $('.pf-cards-loader').prop('hidden', true);
        initAll();
    });
});

/* GTranslate: banderas locales (images/gtranslate-flags) en lugar de la ruta
 * del plugin (wp-content/plugins/gtranslate/...) que no existe en el mirror. */
(function () {
    'use strict';

    var TARGET = document.getElementById('gt-wrapper-45572365');

    function flagRoot() {
        var el = document.querySelector('script[src*="variation-cards.js"]');
        if (el && el.src) {
            return el.src.replace(/js\/variation-cards\.js.*$/, '') + 'images/gtranslate-flags/';
        }
        return 'images/gtranslate-flags/';
    }

    function fixFlags() {
        if (!TARGET) return true;
        var root = flagRoot();
        var total = 0;

        TARGET.querySelectorAll('img').forEach(function (img) {
            var lang = (img.getAttribute('alt') || '').trim();
            if (!lang) return;
            total += 1;
            var local = root + lang + '.svg';
            var lazy = img.getAttribute('data-gt-lazy-src');
            if (lazy) img.setAttribute('data-gt-lazy-src', local);
            var src = img.getAttribute('src') || '';
            if (!src || src.indexOf('/flags/') !== -1) {
                img.setAttribute('src', local);
            }
        });

        return TARGET.querySelectorAll('.gt_options img').length > 0;
    }

    function initFlags() {
        if (fixFlags()) return;
        setTimeout(initFlags, 250);
    }

    initFlags();
})();

/* Botones a otras secciones: redirigen al repo local, nunca al sitio online original.
   Intercepta la navegación forzada (fasada en captura, antes de los handler inline). */
(function () {
    var SECTION_URL = '#pricing-plan';

    function handle(e) {
        var btn = e.target && e.target.closest ? e.target.closest('.cta-button') : null;
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        window.location.assign(SECTION_URL);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            document.addEventListener('click', handle, true);
        });
    } else {
        document.addEventListener('click', handle, true);
    }
})();

/* Popup "$100k": permitir cerrar haciendo clic fuera del modal (overlay_close).
   Refuerza la config del widget si la reorg devuelve el valor original. */
(function () {
    function enableOverlayClose() {
        try {
            var items = window.kadenceConversions && window.kadenceConversions.items;
            if (items && items['5748']) {
                items['5748'].overlay_close = true;
                return true;
            }
        } catch (e) { }
        return false;
    }
    if (enableOverlayClose()) return;
    setTimeout(function poll() {
        if (!enableOverlayClose()) setTimeout(poll, 200);
    }, 200);
})();

/* ====================================================================
 * FONDO DE PARTÍCULAS DORADAS — cola desvanecida (fundedherofutures.com)
 * --------------------------------------------------------------------
 * Replica exacta del sistema inline `.golden-particles-bg` del sitio real
 * (mismos sprites de brillo #edc940, densidad, tamaños, velocidades,
 * twinkle, constelación a 110 px y repulsión/links al cursor) pero con
 * una diferencia: el lienzo se extiende ~2.5x la altura del héroe hacia
 * abajo, de modo que las partículas NO se cortan al terminar el bloque
 * del hero sino que se desvanecen de forma natural en la sección negra
 * siguiente (la máscara CSS de #pf-golden-ext se encarga del fade).
 *
 * El juego no pisa nada: detiene el sistema inline (vía _destroyParticles)
 * y arriba con la misma visual pero con el desvanecimiento inferior.
 * ================================================================== */
(function () {
    'use strict';

    var reduced = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isSmall = window.matchMedia('(max-width: 640px)').matches;

    var EXTEND = 2.5;                 // lienzo = héroe x EXTEND (cola abajo)
    var EXTEND_MOBILE = 2.5;

    var KEY = 'pfGoldenExtBoot';

    function makeSprite(radius, stops) {
        var c = document.createElement('canvas');
        c.width = radius * 2;
        c.height = radius * 2;
        var g = c.getContext('2d');
        var grad = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
        for (var i = 0; i < stops.length; i++) grad.addColorStop(stops[i][0], stops[i][1]);
        g.fillStyle = grad;
        g.fillRect(0, 0, radius * 2, radius * 2);
        return c;
    }

    var sprites = {
        normal: makeSprite(20, [[0, 'rgba(255,217,122,1)'], [0.35, 'rgba(237,201,64,0.55)'], [1, 'rgba(237,201,64,0)']]),
        bokeh: makeSprite(30, [[0, 'rgba(237,201,64,0.8)'], [0.4, 'rgba(237,201,64,0.30)'], [1, 'rgba(237,201,64,0)']]),
        spark: makeSprite(14, [[0, 'rgba(255,243,207,1)'], [0.5, 'rgba(255,243,207,0.5)'], [1, 'rgba(255,243,207,0)']])
    };

    var MAX_LINK_DIST = reduced ? 0 : 110;
    var GRID_SIZE = 110;

    function computeCount(cw, ch) {
        var area = cw * ch;
        var density = reduced ? 0.00004 : (isSmall ? 0.00008 : 0.00012);
        var count = Math.round(area * density);
        var minC = reduced ? 12 : (isSmall ? 24 : 36);
        var maxC = reduced ? 50 : (isSmall ? 90 : 360);
        return Math.max(minC, Math.min(maxC, count));
    }

    function boot(container) {
        if (!container || container[KEY]) return;
        if (container._destroyParticles) {
            try { container._destroyParticles(); } catch (e) { }
        }
        var legacy = container.querySelector('canvas:not(#pf-golden-ext)');
        if (legacy) { try { legacy.remove(); } catch (e) { } }
        container[KEY] = true;

        var heroW = container.clientWidth || 1;
        var heroH = container.clientHeight || 1;
        var cw = Math.max(1, heroW);
        var ch = Math.max(1, Math.round(heroH * (isSmall ? EXTEND_MOBILE : EXTEND)));

        var rawDpr = window.devicePixelRatio || 1;
        var dpr = Math.min(rawDpr, isSmall ? 1.5 : 2);

        var canvas = document.createElement('canvas');
        canvas.id = 'pf-golden-ext';
        canvas.setAttribute('aria-hidden', 'true');
        container.appendChild(canvas);
        var ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
        canvas.width = Math.max(1, Math.floor(cw * dpr));
        canvas.height = Math.max(1, Math.floor(ch * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var particles = [];
        var rafId = null;
        var running = false;
        var lastTime = 0;
        var pointer = { x: -1e4, y: -1e4, active: false };

        // Desvanecimiento natural de la cola: las partículas siguen visibles
        // hasta `fadeStart` px por debajo del borde inferior del héroe y luego
        // se funden progresivamente hasta desaparecer al final del lienzo.
        var fadeStart = heroH + 240;
        var fadeSpan = Math.max(1, ch - fadeStart);
        function fadeAt(y) {
            if (y <= fadeStart) return 1;
            var t = Math.min(1, (y - fadeStart) / fadeSpan);
            return Math.max(0, 1 - t * t);
        }

        function resetP(p, randomY) {
            p.x = Math.random() * cw;
            p.y = randomY ? Math.random() * ch : -10;
            var mobile = isSmall ? 0.8 : 1;
            if (p.kind === 1) {
                p.size = (isSmall ? 2.5 : 4) + Math.random() * (isSmall ? 2.5 : 4);
                p.speedX = (Math.random() * 0.4 - 0.2) * 0.6 * mobile;
                p.speedY = (Math.random() * 0.5 + 0.25) * mobile;
                p.opacity = Math.random() * 0.18 + 0.1;
            } else if (p.kind === 2) {
                p.size = Math.random() * 0.9 + 0.6;
                p.speedX = (Math.random() * 0.6 - 0.3) * mobile;
                p.speedY = (Math.random() * 1.2 + 2) * mobile;
                p.opacity = Math.random() * 0.2 + 0.75;
            } else {
                p.size = Math.random() * (isSmall ? 2.2 : 3) + 0.8;
                p.speedX = (Math.random() * 0.5 - 0.25) * mobile;
                p.speedY = (Math.random() * 1 + 0.5) * mobile;
                p.opacity = Math.random() * 0.5 + 0.3;
            }
            p.sway = 0.12 + Math.random() * 0.3;
        }

        function initParticles() {
            var n = computeCount(cw, ch);
            particles = new Array(n);
            for (var i = 0; i < n; i++) {
                var r = Math.random();
                var kind = r < 0.75 ? 0 : (r < 0.90 ? 1 : 2);
                particles[i] = { kind: kind, phase: Math.random() * Math.PI * 2, twinkle: 0.4 + Math.random() * 1.6 };
                resetP(particles[i], true);
            }
        }

        function updateP(p, dt) {
            var dx = p.speedX * dt * 60 + Math.sin(p.y * 0.006 + p.phase) * p.sway * dt * 60;
            var dy = p.speedY * dt * 60;
            if (pointer.active) {
                var dxp = p.x - pointer.x;
                var dyp = p.y - pointer.y;
                var d2 = dxp * dxp + dyp * dyp;
                if (d2 < 25600 && d2 > 0.01) {
                    var d = Math.sqrt(d2);
                    var f = (1 - d / 160) * 90 * dt;
                    dx += (dxp / d) * f;
                    dy += (dyp / d) * f;
                }
            }
            p.x += dx;
            p.y += dy;
            if (p.y > ch + 14) resetP(p, false);
            if (p.x < -14 || p.x > cw + 14) p.x = Math.random() * cw;
        }

        function buildGrid() {
            var cols = Math.max(1, Math.ceil(cw / GRID_SIZE));
            var rows = Math.max(1, Math.ceil(ch / GRID_SIZE));
            var grid = new Map();
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                var c = Math.floor(p.x / GRID_SIZE);
                var r = Math.floor(p.y / GRID_SIZE);
                var key = c + ',' + r;
                if (!grid.has(key)) grid.set(key, []);
                grid.get(key).push(i);
            }
            return { grid: grid, cols: cols, rows: rows };
        }

        function drawLinks() {
            var grid = buildGrid().grid;
            ctx.lineWidth = 0.6;
            for (var key of grid.keys()) {
                var parts = key.split(',');
                var c = parseInt(parts[0], 10);
                var r = parseInt(parts[1], 10);
                var arr = grid.get(key);
                var neighbors = [];
                for (var dc = 0; dc <= 1; dc++) {
                    for (var dr = -1; dr <= 1; dr++) {
                        var nk = (c + dc) + ',' + (r + dr);
                        if (grid.has(nk)) neighbors.push(grid.get(nk));
                    }
                }
                for (var i = 0; i < arr.length; i++) {
                    var pi = particles[arr[i]];
                    for (var nl = 0; nl < neighbors.length; nl++) {
                        var list = neighbors[nl];
                        for (var k = 0; k < list.length; k++) {
                            var j = list[k];
                            if (j <= arr[i]) continue;
                            var pj = particles[j];
                            var dx = pi.x - pj.x;
                            var dy = pi.y - pj.y;
                            var dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < MAX_LINK_DIST) {
                                var alpha = 0.15 * (1 - dist / MAX_LINK_DIST);
                                ctx.strokeStyle = 'rgba(237,201,64,' + (alpha * Math.min(fadeAt(pi.y), fadeAt(pj.y))).toFixed(3) + ')';
                                ctx.beginPath();
                                ctx.moveTo(pi.x, pi.y);
                                ctx.lineTo(pj.x, pj.y);
                                ctx.stroke();
                            }
                        }
                    }
                }
            }
        }

        function drawPointerLinks() {
            if (!pointer.active) return;
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                var dx = p.x - pointer.x;
                var dy = p.y - pointer.y;
                var d2 = dx * dx + dy * dy;
                if (d2 < 12100) {
                    var d = Math.sqrt(d2);
                    var a = 0.35 * (1 - d / 110) * fadeAt(p.y);
                    ctx.strokeStyle = 'rgba(237,201,64,' + a.toFixed(3) + ')';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(pointer.x, pointer.y);
                    ctx.stroke();
                }
            }
        }

        function tick(now) {
            if (!running) return;
            var dt = Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;
            var t = now / 1000;

            ctx.clearRect(0, 0, cw, ch);

            ctx.globalCompositeOperation = 'lighter';
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                updateP(p, dt);
                var tw = 0.72 + 0.28 * Math.sin(now * p.twinkle + p.phase);
                ctx.globalAlpha = Math.max(0.04, p.opacity * tw) * fadeAt(p.y);
                var sprite = p.kind === 1 ? sprites.bokeh : (p.kind === 2 ? sprites.spark : sprites.normal);
                var r = p.size * (p.kind === 1 ? 2.6 : 2.2);
                ctx.drawImage(sprite, p.x - r, p.y - r, r * 2, r * 2);
            }
            ctx.globalCompositeOperation = 'source-over';

            if (!reduced) {
                drawLinks();
                drawPointerLinks();
            }
            rafId = requestAnimationFrame(tick);
        }

        function start() {
            if (running) return;
            running = true;
            lastTime = performance.now();
            rafId = requestAnimationFrame(tick);
        }

        function stop() {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        }

        function onPointerMove(e) {
            var rect = canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            if (x < 0 || y < 0 || x > cw || y > ch) { pointer.active = false; return; }
            pointer.x = x;
            pointer.y = y;
            pointer.active = true;
        }
        document.addEventListener('pointermove', onPointerMove, { passive: true });
        document.addEventListener('pointerleave', function () { pointer.active = false; }, { passive: true });
        document.addEventListener('pointercancel', function () { pointer.active = false; }, { passive: true });
        document.addEventListener('touchstart', function () {
            if (window.TouchEvent) pointer.active = false;
        }, { passive: true });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop();
            else start();
        });

        var io = new IntersectionObserver(function (entries) {
            for (var e = 0; e < entries.length; e++) {
                if (entries[e].target === canvas) {
                    if (entries[e].isIntersecting) start();
                    else stop();
                }
            }
        }, { root: null, threshold: 0 });
        io.observe(canvas);

        var ro = new ResizeObserver(function () {
            heroW = container.clientWidth || 1;
            heroH = container.clientHeight || 1;
            cw = Math.max(1, heroW);
            ch = Math.max(1, Math.round(heroH * (isSmall ? EXTEND_MOBILE : EXTEND)));
            fadeStart = heroH + 240;
            fadeSpan = Math.max(1, ch - fadeStart);
            canvas.style.width = cw + 'px';
            canvas.style.height = ch + 'px';
            canvas.width = Math.max(1, Math.floor(cw * dpr));
            canvas.height = Math.max(1, Math.floor(ch * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            initParticles();
        });
        ro.observe(container);

        container._pfDestroy = function () {
            stop();
            io.disconnect();
            ro.disconnect();
            document.removeEventListener('pointermove', onPointerMove);
            if (canvas && canvas.parentNode) canvas.remove();
            container[KEY] = false;
        };

        initParticles();
        if (container.getBoundingClientRect().top < window.innerHeight &&
            container.getBoundingClientRect().bottom > 0) start();
    }

    function bootWhenReady() {
        function run() {
            bootAll();
            stripLegacy();
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                run();
                setTimeout(run, 60);
                setTimeout(run, 400);
            });
        } else {
            run();
            setTimeout(run, 60);
            setTimeout(run, 400);
        }
        if (!window.__pfGoldenBootFallback) {
            window.__pfGoldenBootFallback = true;
            var tries = 0;
            var t = setInterval(function () {
                tries++;
                bootAll();
                stripLegacy();
                if (tries > 40) clearInterval(t);
            }, 250);
        }
    }
    bootWhenReady();

    // Quita cualquier lienzo del sistema inline que pudiera quedar vivo
    // (el script original crea el suyo en DOMContentLoaded; si corre después
    // del nuestro, este barrido lo elimina y detiene en cuanto aparece).
    function stripLegacy() {
        var list = document.querySelectorAll('.golden-particles-bg');
        for (var i = 0; i < list.length; i++) {
            var c = list[i];
            if (c._destroyParticles) {
                try { c._destroyParticles(); } catch (e) { }
            }
            var cv = c.querySelector('canvas:not(#pf-golden-ext)');
            if (cv) { try { cv.remove(); } catch (e) { } }
        }
    }

    function bootAll() {
        var list = document.querySelectorAll('.golden-particles-bg');
        for (var i = 0; i < list.length; i++) boot(list[i]);
    }
})();
