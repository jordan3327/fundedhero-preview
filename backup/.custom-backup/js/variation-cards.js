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
