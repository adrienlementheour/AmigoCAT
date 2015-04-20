$(function () {
    $.mask.definitions['9'] = '';
    $.mask.definitions['d'] = '[0-9]';

    function set_country(country) {
        if (!country) {
            return;
        }

        $.ajax({
            url: '/clients/client/get_phone_format/',
            type: "POST",
            data: {country: country},
            success: function(data) {
                $('[jsHelpers="phone-mask"]').mask(data);
                window.phone_mask = data;
            },
            error: function(data) {
                alert('Error occured while loading phone format!\n' +
                'Please refresh page and try again.');
            }
        });
    }

    $('#id_country').change(function () {
        set_country($(this).val());
    });

    set_country($('#id_country').val());
});
