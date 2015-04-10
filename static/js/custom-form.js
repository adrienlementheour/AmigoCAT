$( document ).ready(function() {

    /* Submit Form */
    $('.js-submit-form').click(function() {
        $(this).parents('form').submit();
        return false;
    });

    /* Keypress enter form event */
    $(".custom-form form > *").keypress(function(e) {
        if(e.which == 13) {
            $(".custom-form form").submit();
        }
    });

});