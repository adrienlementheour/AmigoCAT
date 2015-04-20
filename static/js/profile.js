function set_user_info(value, destination) {
    $('#'+destination).val(value);
}

jQuery(function($) {
    $('.js-profile-form-data .saved-pair').on('click', '.js-delete', function(e) {
        e.preventDefault();
        var $clicked = $(this);
        var $form = $clicked.parents('.spoken-languages').first();
        $.ajax({
            url: PAIRS_DELETE_URL,
            type: "POST",
            data: {'object_id': $form.data('id') },
            dataType: "json",
            success: function(data) {
                if (data['success']) {
                    $form.remove();
                    }
                }
            });
    });

     $('.js-profile-form-data .saved-pair .target-language').change(function(e){
        e.preventDefault();
        var $clicked = $(this);
        var $form = $clicked.parents('.spoken-languages').first();
        $form.addClass('modified');
    })

    $('.js-profile-form-data .saved-pair .source-language').change(function(e){
        e.preventDefault();
        var $clicked = $(this);
        var $form = $clicked.parents('.spoken-languages').first();
        $form.addClass('modified');
    })

    function savePairs() {
        if ($('#file-list-form .modified').length == 0) {
        var $form = $('#file-list-form-new');
        $.ajax({
            url: PAIRS_ADD_URL,
            type: "POST",
            data: $form.serializeObject(),
            dataType: "json",
            success: function(data) {
                if (data['success'] === false) {
                    console.log(data['errors']);
                    $form.find('.add-pair').find(".errorlist").remove();
                    $('#js-editor-dialog-error').remove();
                    $('#js-editor-dialog').remove();
                    if(data['errors_all']){
                        $('#create-project').append('<div id="js-editor-dialog-error" class="alert alert-block alert-error fade in" style="display: none;">'+
                              '<button data-dismiss="alert" class="close js-editor-msg-hide" type="button">×</button>'+
                              '<span>'+data['errors_all']+'</span>'+
                                '</div>')
                        $( "#js-editor-dialog-error" ).dialog({
                            dialogClass: 'no-close',
                            minHeight: 'auto',
                            minWidth: 'auto',
                            modal: true,
                            draggable: false,
                            resizable: false,
                            show: true
                        });
                    }
                    if(data['errors']){
                        $('#create-project').append('<div id="js-editor-dialog-error" class="alert alert-block alert-error fade in" style="display: none;">'+
                              '<button data-dismiss="alert" class="close js-editor-msg-hide" type="button">×</button>'+
                              '<span>Please make sure you have filled all dropdown boxes with languages and there are no duplicate pairs</span>'+
                                '</div>')
                        $( "#js-editor-dialog-error" ).dialog({
                            dialogClass: 'no-close',
                            minHeight: 'auto',
                            minWidth: 'auto',
                            modal: true,
                            draggable: false,
                            resizable: false,
                            show: true
                        });
                    }
                } else {
                    $('#create-project').append('<div id="js-editor-dialog" class="alert alert-block alert-success fade in" style="display: none;">'+
                              '<button data-dismiss="alert" class="close js-editor-msg-hide" type="button">×</button>'+
                              '<span>Your changes have been saved</span>'+
                              '</div>')
                    $( "#js-editor-dialog" ).dialog({
                        dialogClass: 'no-close',
                        minHeight: 'auto',
                        minWidth: 'auto',
                        modal: true,
                        draggable: false,
                        resizable: false,
                        show: true
                    });
                    $('#id_form-TOTAL_FORMS').val(0);
                    location.reload();
                }
                }
            });
        }
    }

    function editPairs() {
        savePairs()
        var $pairs = $('#file-list-form .modified');
        $pairs.each(function(index, value) {
            var $pair = $pairs.eq(index)
            $pair.find(".errorlist").remove();
            $pair.find(".source-language").removeClass("erorr-select");
            $pair.find(".target-language").removeClass("erorr-select");
            $.ajax({
                url: PAIRS_EDIT_URL,
                type: "POST",
                data: {'object_id': $pair.data('id'),
                       'source-language': $pair.find('.source-language').val(),
                       'target-language': $pair.find('.target-language').val()},
                dataType: "json",
                success: function(data) {
                    if (data['success'] === false) {
                        console.log(data['errors']);
                        $pair.find('.add-pair').find(".errorlist").remove();
                        if(data['errors']){
                            $pair.find(".target-language").after('<ul class="errorlist"><li>'+data['errors']+'</li></ul>');
                            $pair.find(".source-language").addClass("erorr-select");
                            $pair.find(".target-language").addClass("erorr-select");
                        }
                        if(data['t_l_errors']){
                            $pair.find(".target-language").after('<ul class="errorlist"><li>'+data['t_l_errors']+'</li></ul>');
                            $pair.find(".target-language").addClass("erorr-select");
                        }
                        if(data['s_l_errors']){
                            $pair.find(".source-language").after('<ul class="errorlist"><li>'+data['s_l_errors']+'</li></ul>');
                            $pair.find(".source-language").addClass("erorr-select");
                        }
                    } else {
                        $pair.removeClass('modified');
                        savePairs()
                    }
                }
            });
        });
    }

    $(document).on('click', '.js-delete-clone', function(e) {
        e.preventDefault();
        var $clicked = $(this);
        var $form = $clicked.parents('.spoken-languages').first();
        $form.remove();
        var total = $('#id_form-TOTAL_FORMS').val();
        $('#id_form-TOTAL_FORMS').val(total-1);
        $form.find('#id_source_language').val('');
        $form.find('#id_target_language').val('');
        $form.find(".errorlist").remove();
        $form.find(".source-language").removeClass("erorr-select");
        $form.find(".target-language").removeClass("erorr-select");
        var $forms = $('#file-list-form-new .add-pair');
        for (var i = 0; i < $('#id_form-TOTAL_FORMS').val(); i++) {
            $forms.eq(i).find('.source-language').attr('name','form-'+i+'-source_language').attr('id','id_form-'+i+'-source_language');
            $forms.eq(i).find('.target-language').attr('name','form-'+i+'-target_language').attr('id','id_form-'+i+'-target_language');;
        }
    });

    $(document).on('click', '.js-save-added', function(e) {
        e.preventDefault();
        editPairs();
    });

    $('.js-add').click(function() {
        var total = $('#id_form-TOTAL_FORMS').val();
        var newElment = $('.div-form .hidden.add-pair-clone').clone().removeClass( "hidden" ).addClass("add-pair");
        $('#file-list-form-new tbody').append(newElment);
        total = $('#file-list-form-new #id_form-TOTAL_FORMS').val();

        var s_t = $('#id_source_language').attr('name')
        var name_s = $('#id_source_language').attr('name','form-'+total+'-'+s_t);;
        s_t = $('#id_source_language').attr('name');
        $('#id_source_language').attr('id','id_'+s_t);

        var n_t = $('#id_target_language').attr('name');
        $('#id_target_language').attr('name','form-'+total+'-'+n_t);
        n_t = $('#id_target_language').attr('name');
        $('#id_target_language').attr('id','id_'+n_t);
        total++
        $('#id_form-TOTAL_FORMS').val(total);
        return false;
    });

    $('.js-profile-form-data > form select').change(function() {
        var $clicked = $(this);
        var $form = $clicked.parents('form').first();
        $form.find('.profile-lang-but').removeClass( "hidden" );
      });

    $(document).on('click', '.removePic', function() {
        var parent = $(this).parent();
        console.log(parent)
        parent.find('.img').remove();
        parent.find('.removePic').remove();
        parent.prepend('<div class="img">+</div>');
        $('#id_avatar').val('');
        $('#id_remove_avatar').val('1');
    })
    $('#id_avatar').bind($.browser.msie ? 'propertychange' : 'change', function() {
        $('#id_remove_avatar').val('');
        var inputFile = $(this)[0].files;
        var parent = $(this).parent();
        parent.find('.img').remove();
        parent.find('.removePic').remove();
        parent.prepend('<div class="img"><img src="'+URL.createObjectURL(inputFile[0])+'" alt="User Avatar" width="130" height="130"></div><button class="removePic">×</button>')
    });

    $('#add-avatar').click(function() {
        $('#id_avatar').click();
        return false;
    });

    $(document).on('click', '.js-editor-msg-hide', function(e) {
        $('#js-editor-dialog-error').remove();
        $('#js-editor-dialog').remove();
    })

    $(document).ready(function() {
       $("ul.errorlist").each(function(i, e) {
           $(e).siblings("input").each(function (j, input) {
               $(input).addClass("error");
           });
       });
    });

    $('.availabilityBtn').on('click', '.minus, .plus', function(e) {
        var $this = $(this),
            url = '/accounts/update_avg_availability/',
            $hoursSpan = $this.siblings('.avail-hours'),
            hours = $hoursSpan.text(),
            weekday = $this.closest('.availabilityBtn').data('weekday'),
            $totalSpans = $('.js-total-avail');

        if ($this.hasClass('minus')) {
            hours--;
        } else if ($this.hasClass('plus')) {
            hours++;
        }

        $.post(url, {'hours': hours, 'weekday': weekday})
            .done(function(data) {
                $hoursSpan.text(hours);
                $totalSpans.text(data.total_hours + 'h');
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                var error = JSON.parse(jqXHR.responseText).msg;
                console.error(error);
            });
    });

});
