<?php
/**
 * FundedHero Futures Child — solo diseño/estética, cero cambios de texto.
 *
 * Encola UNICAMENTE los assets custom que viven en este child theme:
 *  - assets/css/custom/*.css (pricing, popups, tickers)
 *  - assets/js/custom/*.js  (pricing, popups, tickers, tracking propio)
 *
 * Los assets vendor (Kadence, WooCommerce, GeneratePress, FluentForms,
 * jQuery, React, AOS, intlTelInput...) los proveen sus plugins/temas
 * y NO se duplican aqui. Las imagenes/fuentes van a la Media Library.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'FH_CHILD_VERSION', '1.0.0' );
define( 'FH_CHILD_DIR', get_stylesheet_directory() );
define( 'FH_CHILD_URI', get_stylesheet_directory_uri() );

function fh_child_asset_version( $relative_path ) {
    $file = FH_CHILD_DIR . '/' . ltrim( $relative_path, '/' );
    if ( file_exists( $file ) ) {
        return FH_CHILD_VERSION . '.' . filemtime( $file );
    }
    return FH_CHILD_VERSION;
}

add_action( 'wp_enqueue_scripts', 'fh_child_enqueue_assets', 20 );
function fh_child_enqueue_assets() {
    // Estilo del padre (GeneratePress) + style.css del hijo.
    wp_enqueue_style(
        'fh-parent-style',
        get_template_directory_uri() . '/style.css',
        array(),
        fh_child_asset_version( '../generatepress/style.css' ) // fallback a version fija si el padre no esta
    );
    wp_enqueue_style(
        'fh-child-style',
        get_stylesheet_uri(),
        array( 'fh-parent-style' ),
        FH_CHILD_VERSION
    );

    // CSS custom — mismo orden visual que la demo estatica.
    $css = array(
        'fh-tabs'              => 'assets/css/custom/tabs.css',
        'fh-variation-block'   => 'assets/css/custom/variation-block.css',
        'fh-variation-cards'   => 'assets/css/custom/variation-cards.css',
        'fh-glass-nav'         => 'assets/css/custom/fh-glass-nav.css',
        'fh-serene'            => 'assets/css/custom/fh-serene.css',
        'fh-giveaway-popup'    => 'assets/css/custom/giveaway-popup.css',
        'fh-purchase-notifier' => 'assets/css/custom/purchase-notifier.css',
        'fh-news-ticker'       => 'assets/css/custom/news-ticker.css',
    );
    foreach ( $css as $handle => $rel ) {
        wp_enqueue_style(
            $handle,
            FH_CHILD_URI . '/' . $rel,
            array( 'fh-child-style' ),
            fh_child_asset_version( $rel ),
            'all'
        );
    }

    // JS custom en footer. jquery como dependencia donde aplica.
    $js_with_jquery = array(
        'fh-variation-block'   => 'assets/js/custom/variation-block.js',
        'fh-variation-cards'   => 'assets/js/custom/variation-cards.js',
        'fh-giveaway-popup'    => 'assets/js/custom/giveaway-popup.js',
        'fh-purchase-notifier' => 'assets/js/custom/purchase-notifier.js',
        'fh-news-ticker'       => 'assets/js/custom/news-ticker.js',
        'fh-tabs'              => 'assets/js/custom/tabs.js',
        'fh-float'             => 'assets/js/custom/float.js',
        'fh-disable-submit'    => 'assets/js/custom/disable-submit.js',
    );
    foreach ( $js_with_jquery as $handle => $rel ) {
        wp_enqueue_script(
            $handle,
            FH_CHILD_URI . '/' . $rel,
            array( 'jquery' ),
            fh_child_asset_version( $rel ),
            true
        );
    }

    // Tracking propio sin dependencia jQuery.
    $js_plain = array(
        'fh-init'            => 'assets/js/custom/init.js',
        'fh-glass-nav'       => 'assets/js/custom/fh-glass-nav.js',
        'fh-hero-sequence'   => 'assets/js/custom/fh-hero-sequence.js',
        'fh-es-dictionary'   => 'assets/js/custom/fh-es-dictionary.js',
        'fh-script-trk'      => 'assets/js/custom/script-trk.js',
        'fh-facebook-signal' => 'assets/js/custom/facebook_signal.js',
    );
    foreach ( $js_plain as $handle => $rel ) {
        wp_enqueue_script(
            $handle,
            FH_CHILD_URI . '/' . $rel,
            array(),
            fh_child_asset_version( $rel ),
            true
        );
    }
}
