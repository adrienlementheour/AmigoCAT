$(document).ready(function() {
    $( "#dialog-message" ).hide();

  $('#user_messages').on('submit', function(e){
    e.preventDefault();
    $.post('private_messages_ajax', $(this).serializeArray(), function(data){
        $("#count").remove();
        $("#message_container").empty();
        $('#message_container').append(data);
    });
  });

  $(document).on( 'click', '.answer_button', function () {
    $('html, body').animate({scrollTop: $("#send_message").offset().top}, 'fast');
    var user = $(this).parent().find("input[name='from']").attr('value');

    $('#id_to_text').val(user);
    var autocomplete = $('#id_to_text').yourlabsAutocomplete();
    autocomplete.show('<span class="div" data-value="'+user+'">'+user+'</span>');
    $('#id_to_text').trigger('selectChoice', [autocomplete.box.find(':first-child'), autocomplete]);
//    $("#users :contains('" +user+ "')").attr("selected", "selected");

  });

  $('#send_message').on('submit', function(e){
    e.preventDefault();
    $.post('private_messages', $(this).serializeArray(), function(data){

        $('.error').remove();

        add_error = function(error, selector){
                $('#send_message').find(selector).after('<div class="error">' + error + '</div>');
        };

        if (data.success){
            $('.remove').trigger('click');
            $('#id_body').val('');
            $( "#dialog-message" ).dialog({
                modal: true,
                buttons: {
                    Ok: function() {
                        $( this ).dialog( "close" );
                    }
                }
             });
        } else{
            if (data.response.to){

                add_error(data.response.to, '#id_to_text')
            }

            if (data.response.body){
                add_error(data.response.body, '#id_body')
            }
        }

    });
  });

});
