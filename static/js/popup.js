$( document ).bind('ptl-ready', function() {
    // tutorial notification
    $('.js-close-button').click(function(){
        if($('.js-no-longer-display').is(':checked')){
            var mark_as_read_url = $('.js-notification').attr('data-url');
            mark_as_read_url += '?next='+window.location.pathname;
            $.get(mark_as_read_url);
        }
        $('.form.message.success').hide();
    });

    PTL.editor.showPreTraslationPopup = function () {
        $('.pre-translate-popup').css('display', 'block');
    };

    PTL.editor.showTranslationPopup = function () {
        $('.translate-popup').css('display', 'block');
    };
});
