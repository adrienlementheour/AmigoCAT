$( document ).ready(function() {
    document.projectCreation = {};
    document.projectCreation.doSubmit = false;

    $(function() {
        $( ".datetimeinput:not([readonly])" ).datepicker({'dateFormat': 'dd-mm-yy', 'changeYear':true});
        console.log($( ".datetimeinput").length);
    });

    /* Redirect to client */
    $('#button-id-create_client').click(function(){
        window.location = '/clients/client/add/edit?return=create_project';
    });

    /* Submit Form */
    $('#submit-form').click(function(){
        if (!$(this).hasClass('disabled') && !$(this).parent().hasClass('disabled')) {
            $("#create-project > form").submit();
        }
        return false;
    });

    // Change fields
    $('.controls :input').change(function () {
        $.ajax({
            url: $('#create-project form').attr('action'),
            type: "POST",
            data: {'value': this.value, 'name': this.name},
            success: function(data) {
            },
            error: function(data) {
            }
        });
    });

    // Remove Language
    $(document).on('click', '.action-button.remove a', function() {
        $(this).closest('tr').remove();
        if ($('#languages tr:first').length === 0) {
            content = "<tr><td></td<td class='content light'>There are no "+
                "languages have been added yet</td><td></td></tr>";
            $('#languages tbody').append(content);
        }

        $.ajax({
            url: $('#create-project form').attr('action'),
            type: "POST",
            data: {
                'value': '',
                'name': $(this).closest('tr').find('input')[0].name
            },
            success: function(data) {
            },
            error: function(data) {
            }
        });
        return false;
    });

    // Add Language
    function languageAdd (async) {
        async = typeof async !== 'undefined' ? async : true;
        select = $('#id_target_languages')[0];
        title = select.options[select.selectedIndex].text;
        value = select.options[select.selectedIndex].value;

        if (value === '') {
            // return if selected the first empty element in languages
            return false;
        }

        inputs = $('#languages input');
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].value == value) {
                return false;
            }
        }

        $.ajax({
            url: $('#create-project form').attr('action'),
            type: "POST",
            async: async,
            data: {'value': value, 'name': 'language_'+value},
            success: function(data) {
                first_row = $('#languages tr:first')[0];
                if (first_row.textContent.indexOf('There are no languages') >= 0) {
                    //remove empty content
                    first_row.remove();
                }
                content = "<tr>" +
                            "        <td>" +
                            "            <input type='hidden' name='language_"+value+"' value='"+value+"' />" +
                            "        </td>" +
                            "        <td class='content js-content'>"+title+"</td>" +
                            "        <td class=actions'>" +
                            "            <div class='action-button remove'><a href=''>Remove&nbsp;&nbsp;&times;</a></div>" +
                            "        </td>" +
                            "    </tr>";
                $('#languages tbody').append(content);
/*                if (document.projectCreation.doSubmit) {
                    $('#submit-form').click();
                }*/
            },
            error: function(data) {
            }
        });
        return false;
    }
    $(document).on('click', '#button-id-add_language', languageAdd);
    $('#submit-form').click(function(e){
        if ($('#languages tr td.js-content').length === 0) {
            document.projectCreation.doSubmit = true;
            languageAdd(false);
            e.preventDefault()
            return false;
        }
    });
});
