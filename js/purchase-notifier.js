jQuery(document).ready(function($) {
    let recentPurchases = [];
    let currentIndex = 0;
    const $notification = $('#propfirm-pn-notification');
    const params = propfirm_pn_params;

    function fetchPurchases() {
        $.post(params.ajax_url, {
            action: 'propfirm_get_recent_purchases'
        }, function(response) {
            if (response.success && response.data.length > 0) {
                recentPurchases = response.data;
                startNotifier();
            }
        });
    }

    function showNotification() {
        if (recentPurchases.length === 0) return;

        const purchase = recentPurchases[currentIndex];
        
        $notification.find('.pn-buyer').text(purchase.buyer);
        $notification.find('.pn-city').text(purchase.city);
        $notification.find('.pn-product').text(purchase.product);
        $notification.find('.pn-time').text(purchase.time);
        $notification.find('.pn-image img').attr('src', purchase.image);

        $notification.removeClass('pn-hidden');

        setTimeout(function() {
            hideNotification();
        }, parseInt(params.duration));

        currentIndex = (currentIndex + 1) % recentPurchases.length;
    }

    function hideNotification() {
        $notification.addClass('pn-hidden');
        
        setTimeout(function() {
            showNotification();
        }, parseInt(params.interval));
    }

    function startNotifier() {
        setTimeout(function() {
            showNotification();
        }, 3000); // Wait 3 seconds after load before first notification
    }

    $notification.on('click', '.pn-close', function(e) {
        e.stopPropagation();
        $notification.addClass('pn-hidden');
    });

    fetchPurchases();
});
