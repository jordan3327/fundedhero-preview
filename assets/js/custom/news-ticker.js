jQuery(document).ready(function($) {
    if ($('#propfirm-nt-bar').length) {
        $('body').addClass('has-propfirm-nt');
    }

    $(document).on('click', '.nt-coupon-btn', function() {
        const coupon = $(this).data('coupon');
        const $btn = $(this);
        const originalText = $btn.text();

        if (!coupon) return;

        // Copy to clipboard
        const tempInput = $('<input>');
        $('body').append(tempInput);
        tempInput.val(coupon).select();
        document.execCommand('copy');
        tempInput.remove();

        // Show feedback
        $btn.text(propfirm_nt_params.copied_text).addClass('copied');
        setTimeout(() => {
            $btn.text(originalText).removeClass('copied');
        }, 2000);
    });
});
