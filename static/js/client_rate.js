$(document).ready(function() {
    // jquery star rating plugin config
    $("div[id$='rate_0']").hide();
    ratingCancelButtons = $('.rating-cancel');
    ratingCancelButtons.on('click', function() {
        zeroStar = $(this).siblings("div[id$='rate_0']");
        zeroStar.rating('select');
    });

    // report nonpayment processing
    confirmationWindow = $(".nonreport-verify");
    nonpaymentCheckbox = $("#nonpayment");
    nonpaymentCheckbox.removeAttr('checked');
    
    $(".report").on('click', function() {
        confirmationWindow.show();
    });
    $("#not_sure").on('click', function() {
        confirmationWindow.hide();
    });
    $("#sure").on('click', function() {
        reportButton = $(".report")
        $(".report-span").show();
        $("#nonpayment").attr('checked', 'checked');
        confirmationWindow.hide();
        reportButton.hide();
    });
})