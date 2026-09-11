/*
 * PropFirm Tools — Popup del sorteo
 *
 * Se abre tras un retraso configurable y se recuerda por visitante con
 * localStorage, para no volver a molestar a quien ya cerró o participó.
 */
jQuery(function ($) {
    'use strict';

    var $popup = $('#pf-giveaway');
    if (!$popup.length || typeof propfirm_gw_params === 'undefined') return;

    var params = propfirm_gw_params;
    var $modal = $popup.find('.pf-giveaway__modal');
    var $form = $popup.find('.pf-giveaway__form');
    var $error = $popup.find('.pf-giveaway__error');
    var lastFocused = null;

    /* ----------------------------------------------------------------
     * Memoria por visitante
     *
     * localStorage puede lanzar (modo privado, cookies bloqueadas). Si falla,
     * el popup simplemente se comporta como si fuera la primera visita.
     * -------------------------------------------------------------- */

    function wasDismissed() {
        try {
            var until = parseInt(window.localStorage.getItem(params.storage_key), 10);
            return !!until && Date.now() < until;
        } catch (e) {
            return false;
        }
    }

    function remember() {
        if (!params.repeat_days) return;
        try {
            var until = Date.now() + params.repeat_days * 86400000;
            window.localStorage.setItem(params.storage_key, String(until));
        } catch (e) { /* sin almacenamiento, se acepta volver a mostrarlo */ }
    }

    /* ----------------------------------------------------------------
     * Abrir y cerrar
     * -------------------------------------------------------------- */

    function open() {
        if ($popup.is(':visible')) return;
        lastFocused = document.activeElement;
        $popup.prop('hidden', false);
        $popup.find('input[name="email"]').trigger('focus');
        $(document).on('keydown.pfGiveaway', onKeydown);
    }

    function close() {
        $popup.prop('hidden', true);
        $(document).off('keydown.pfGiveaway');
        remember();
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function onKeydown(e) {
        if (e.key === 'Escape') {
            close();
            return;
        }
        if (e.key !== 'Tab') return;

        // Mantiene el foco dentro del modal mientras está abierto.
        var focusables = $modal.find('button, input, a[href]').filter(':visible:not([disabled])');
        if (!focusables.length) return;

        var first = focusables[0];
        var last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    $popup.on('click', '[data-gw-close]', close);

    /* ----------------------------------------------------------------
     * Envío
     * -------------------------------------------------------------- */

    $form.on('submit', function (e) {
        e.preventDefault();

        var $submit = $form.find('.pf-giveaway__submit');
        var originalLabel = $submit.text();

        $error.prop('hidden', true);
        $submit.prop('disabled', true).text('...');

        $.post(params.ajax_url, {
            action: 'propfirm_giveaway_entry',
            security: params.nonce,
            email: $form.find('input[name="email"]').val(),
            phone: $form.find('input[name="phone"]').val(),
            consent: $form.find('input[name="consent"]').is(':checked') ? 1 : '',
            company: $form.find('input[name="company"]').val(),
            source: window.location.href
        }).done(function (response) {
            if (response && response.success) {
                $form.prop('hidden', true);
                $popup.find('.pf-giveaway__success').prop('hidden', false);
                remember();
                return;
            }

            var message = (response && response.data && response.data.message)
                ? response.data.message
                : 'Something went wrong. Please try again.';
            $error.text(message).prop('hidden', false);
            $submit.prop('disabled', false).text(originalLabel);
        }).fail(function () {
            $error.text('Connection error. Please try again.').prop('hidden', false);
            $submit.prop('disabled', false).text(originalLabel);
        });
    });

    /* ----------------------------------------------------------------
     * Arranque
     * -------------------------------------------------------------- */

    if (wasDismissed()) return;

    // ?pf_giveaway=1 lo abre al instante, para poder revisarlo sin esperar.
    if (window.location.search.indexOf('pf_giveaway=1') !== -1) {
        open();
        return;
    }

    window.setTimeout(open, params.delay);
});
