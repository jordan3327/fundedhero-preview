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

    var TARGETS = document.querySelectorAll('.gtranslate_wrapper');

    function flagRoot() {
        var el = document.querySelector('script[src*="variation-cards.js"]');
        if (el && el.src) {
            return el.src.replace(/js\/variation-cards\.js.*$/, '') + 'images/gtranslate-flags/';
        }
        return 'images/gtranslate-flags/';
    }

    function fixFlags() {
        if (!TARGETS.length) return true;
        var root = flagRoot();
        var total = 0;
        var pending = 0;

        TARGETS.forEach(function (TARGET) {
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
            pending += TARGET.querySelectorAll('.gt_options img').length;
        });

        return pending > 0;
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
 * PARTICLE DRIFT — ASCII particle drift effect (gold palette)
 * --------------------------------------------------------------------
 * Replaces the old golden-dots system. ASCII characters drift downward,
 * beams move upward, proximity connections link nearby nodes, and the
 * mouse creates bright gold connection lines. Canvas extends 2.5x below
 * the hero for a natural fade into the next section.
 *
 * Orchestrates the same boot/stripLegacy lifecycle as before: destroys
 * the inline canvas and re-creates with the extended tail.
 * ================================================================== */
(function () {
    'use strict';

    var reduced = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isSmall = window.matchMedia('(max-width: 640px)').matches;

    var EXTEND = 2.5;
    var EXTEND_MOBILE = 2.5;

    var KEY = 'pfParticleDriftBoot';

    var CHARS = ['F', 'H'];
    var PROXIMITY_DIST = 120;
    var MOUSE_DIST = 180;

    var GOLD = [228, 184, 51];
    var GOLD_BRIGHT = [248, 223, 81];

    function nodeCount(cw, ch) {
        var area = cw * ch;
        var density = reduced ? 0.00003 : (isSmall ? 0.00006 : 0.00008);
        var count = Math.round(area * density);
        var minC = reduced ? 10 : (isSmall ? 18 : 30);
        var maxC = reduced ? 35 : (isSmall ? 55 : 100);
        return Math.max(minC, Math.min(maxC, count));
    }

    function beamCount() {
        if (reduced) return 0;
        return isSmall ? 15 : 25;
    }

    function boot(container) {
        if (!container || container[KEY]) return;
        if (container._destroyParticles) {
            try { container._destroyParticles(); } catch (e) { }
        }
        var legacy = container.querySelector('canvas:not(#pf-golden-ext):not(#fh-hero-canvas)');
        if (legacy) { try { legacy.remove(); } catch (e) { } }
        container[KEY] = true;

        var heroW = container.clientWidth || 1;
        var heroH = container.clientHeight || 1;
        var cw = Math.max(1, heroW);
        var ch = Math.max(1, Math.round(heroH * (isSmall ? EXTEND_MOBILE : EXTEND)));

        var rawDpr = window.devicePixelRatio || 1;
        var dpr = Math.min(rawDpr, isSmall ? 1.5 : 2);

        // El lienzo se inserta dentro del stacking context del hero (.gb-element-d2b7680a,
        // z-index:9). Con z-index:-1 en la raíz quedaba detrás de toda la capa del hero y
        // nunca era visible. Aquí vive bajo el texto (in-flow) pero sobre el fondo del hero.
        var host = container.querySelector('.gb-element-d2b7680a') || container;

        var canvas = document.createElement('canvas');
        canvas.id = 'pf-golden-ext';
        canvas.setAttribute('aria-hidden', 'true');
        host.appendChild(canvas);
        var ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        canvas.style.position = 'absolute';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';

        function positionCanvas() {
            if (host === container) {
                canvas.style.top = '0px';
                canvas.style.left = '0px';
                return;
            }
            var cr = container.getBoundingClientRect();
            var hr = host.getBoundingClientRect();
            canvas.style.top = Math.round(cr.top - hr.top) + 'px';
            canvas.style.left = Math.round(cr.left - hr.left) + 'px';
        }
        positionCanvas();

        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
        canvas.width = Math.max(1, Math.floor(cw * dpr));
        canvas.height = Math.max(1, Math.floor(ch * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var nodes = [];
        var beams = [];
        var rafId = null;
        var running = false;
        var lastTime = 0;
        var pointer = { x: -1e4, y: -1e4, active: false };

        var fadeStart = heroH + 240;
        var fadeSpan = Math.max(1, ch - fadeStart);
        function fadeAt(y) {
            if (y <= fadeStart) return 1;
            var t = Math.min(1, (y - fadeStart) / fadeSpan);
            return Math.max(0, 1 - t * t);
        }

        function initNodes() {
            var n = nodeCount(cw, ch);
            nodes = new Array(n);
            for (var i = 0; i < n; i++) {
                nodes[i] = {
                    x: Math.random() * cw,
                    y: Math.random() * ch,
                    vy: 0.1 + Math.random() * 0.4,
                    char: CHARS[Math.floor(Math.random() * CHARS.length)]
                };
            }
        }

        function initBeams() {
            var n = beamCount();
            beams = new Array(n);
            for (var i = 0; i < n; i++) {
                beams[i] = {
                    x: Math.random() * cw,
                    y: Math.random() * ch,
                    length: 50 + Math.random() * 100,
                    speed: 3 + Math.random() * 6,
                    opacity: 0.3 + Math.random() * 0.5
                };
            }
        }

        function initParticles() {
            initNodes();
            initBeams();
        }

        function tick(now) {
            if (!running) return;
            var dt = Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;

            ctx.clearRect(0, 0, cw, ch);

            // 1. Upward Beams
            for (var i = 0; i < beams.length; i++) {
                var b = beams[i];
                b.y -= b.speed * dt * 60;
                if (b.y + b.length < 0) {
                    b.y = ch + 100;
                    b.x = Math.random() * cw;
                }
                var fa_b = fadeAt(b.y + b.length * 0.5);
                if (fa_b <= 0.01) continue;
                var g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.length);
                g.addColorStop(0, 'rgba(' + GOLD_BRIGHT.join(',') + ',' + (b.opacity * fa_b).toFixed(3) + ')');
                g.addColorStop(1, 'rgba(' + GOLD_BRIGHT.join(',') + ',0)');
                ctx.strokeStyle = g;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(b.x, b.y);
                ctx.lineTo(b.x, b.y + b.length);
                ctx.stroke();
            }

            // 2. Proximity Lines
            if (!reduced) {
                ctx.lineWidth = 0.5;
                for (var i = 0; i < nodes.length; i++) {
                    var ni = nodes[i];
                    var fi = fadeAt(ni.y);
                    if (fi <= 0.01) continue;
                    for (var j = i + 1; j < nodes.length; j++) {
                        var nj = nodes[j];
                        var fj = fadeAt(nj.y);
                        if (fj <= 0.01) continue;
                        var d = Math.hypot(ni.x - nj.x, ni.y - nj.y);
                        if (d < PROXIMITY_DIST) {
                            var alpha = 0.15 * (1 - d / PROXIMITY_DIST) * Math.min(fi, fj);
                            ctx.strokeStyle = 'rgba(' + GOLD.join(',') + ',' + alpha.toFixed(3) + ')';
                            ctx.beginPath();
                            ctx.moveTo(ni.x, ni.y);
                            ctx.lineTo(nj.x, nj.y);
                            ctx.stroke();
                        }
                    }
                }
            }

            // 3. ASCII Nodes
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                n.y += n.vy * dt * 60;
                if (n.y > ch + 20) {
                    n.y = -20;
                    n.x = Math.random() * cw;
                }

                var dist = Math.hypot(pointer.x - n.x, pointer.y - n.y);

                if (dist < MOUSE_DIST || Math.random() > 0.98) {
                    n.char = CHARS[Math.floor(Math.random() * CHARS.length)];
                }

                if (!reduced && pointer.active && dist < MOUSE_DIST) {
                    var ma = 0.5 * (1 - dist / MOUSE_DIST) * fadeAt(n.y);
                    ctx.strokeStyle = 'rgba(' + GOLD_BRIGHT.join(',') + ',' + ma.toFixed(3) + ')';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(pointer.x, pointer.y);
                    ctx.stroke();
                }

                var fa = fadeAt(n.y);
                if (fa <= 0.01) continue;
                if (pointer.active && dist < MOUSE_DIST) {
                    ctx.fillStyle = 'rgba(' + GOLD_BRIGHT.join(',') + ',' + (0.9 * fa).toFixed(3) + ')';
                } else {
                    ctx.fillStyle = 'rgba(' + GOLD.join(',') + ',' + (0.45 * fa).toFixed(3) + ')';
                }
                ctx.fillText(n.char, n.x, n.y);
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
            positionCanvas();
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
        if (!window.__pfParticleDriftFallback) {
            window.__pfParticleDriftFallback = true;
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

    function stripLegacy() {
        var list = document.querySelectorAll('.golden-particles-bg');
        for (var i = 0; i < list.length; i++) {
            var c = list[i];
            if (c._destroyParticles) {
                try { c._destroyParticles(); } catch (e) { }
            }
            var cv = c.querySelector('canvas:not(#pf-golden-ext):not(#fh-hero-canvas)');
            if (cv) { try { cv.remove(); } catch (e) { } }
        }
    }

    function bootAll() {
        var list = document.querySelectorAll('.golden-particles-bg');
        for (var i = 0; i < list.length; i++) boot(list[i]);
    }
})();
