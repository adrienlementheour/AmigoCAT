function set_user_info(value, destination) {
    $('#'+destination).val(value);
}

jQuery(function($) {

    $('.js-profile-form-data').on('click', '.js-delete', function(e) {
        e.preventDefault();
        var $clicked = $(this);
        var $form = $clicked.parents('form').first();
        $.ajax({
            url: PAIRS_DELETE_URL,
            type: "POST",
            data: $form.serializeObject(),
            dataType: "json",
            success: function(data) {
                if (data['success']) {
                    $clicked.parent().parent().parent().parent().slideUp();
                    }
                }
            });
    });

     $('.js-profile-form-data').on('click', '.js-edit', function(e) {
        e.preventDefault();
        var $clicked = $(this);
        var $form = $clicked.parents('form').first();
        $.ajax({
            url: PAIRS_EDIT_URL,
            type: "POST",
            data: $form.serializeObject(),
            dataType: "json",
            success: function(data) {
                if (data['success'] === false) {
                    if(data['errors']['__all__']){
                        $form.find(".error").text(data['errors']['__all__'][0]);
                    }
                    if(data['errors']['target_languages']){
                        $form.find(".error").text(data['errors']['target_languages'][0]);
                    }
                    if(data['errors']['source_languages']){
                        $form.find(".rror-source").text(data['errors']['source_languages'][0]);
                    }
                }
                else {
                    $form.find(".error").text("");
                    $form.find(".error-source").text("");
                    $form.find('.js-p').addClass( "hidden" );
                }
            }
        });
    });


     $('.js-profile-lang-form').on('click', '.js-save-added', function(e) {
        e.preventDefault();
        var $clicked = $(this);
        var $form = $clicked.parents('form').first();
        $.ajax({
            url: PAIRS_ADD_URL,
            type: "POST",
            data: $form.serializeObject(),
            dataType: "json",
            success: function(data) {
                if (data['success'] === false) {
                    console.log(data['errors']);
                    if(data['errors']['__all__']){
                        $form.find(".error").text(data['errors']['__all__'][0]);
                    }
                    if(data['errors']['target_languages']){
                        $form.find(".error").text(data['errors']['target_languages'][0]);
                    }
                    if(data['errors']['source_languages']){
                        $form.find(".error-source").text(data['errors']['source_languages'][0]);
                    }
                } else {
                    $("#error").text("");
                    $("#error-source").text("");
                    $('.js-p').addClass("hidden");
                    location.reload();
                }
                }
            });
    });

    $('.js-add').click(function() {
        $('.js-profile-lang-form').removeClass( "hidden" );
        return false;
    });

    $('.js-profile-form-data > form select').change(function() {
        var $clicked = $(this);
        var $form = $clicked.parents('form').first();
        $form.find('.profile-lang-but').removeClass( "hidden" );
      });

});