$( document ).ready(function() {
    document.projectCreation = {};
    document.projectCreation.doSubmit = false;

    var $removeButton = $('<input type="button" name="remove_language2" value="× Remove" class="btn btn-remove-language" id="button-id-remove_language">'),
        $divTargetLanguages = $('#div_id_target_languages'),
        $divControls = $divTargetLanguages.children('.controls').first(),
        $selectOptions = $divControls.find('option'),
        languagesCount = $selectOptions.filter('[value!=""]').length,
        clientIDInput = $('#id_client'),
        clientNameInput = $('#id_client_name'),
        $modal = $('.mfp-wrap'),
        $chooseClientDiv = $('#chooseClient'),
        $clientsBox = $chooseClientDiv.find('.box-list'),
        $clientsList = $clientsBox.children('li').not('.add'),
        $searchClientInput = $chooseClientDiv.find('#search-client'),
        $createClientForm = $('#create-client-form'),
        createCletnURL = $createClientForm.attr('action'),
        $createClientInput = $('#create-client-input');


    // Event listeners
    $(document).on('click', '#button-id-add_language', addLanguage);
    $(document).on('click', '.btn-remove-language', removeLanguage);
    $(document).on('click', '#chooseClient a.client', selectClient);
    $(document).on('input', '#chooseClient #search-client', searchClient);
    $(document).on('submit', '#chooseClient .search-block form', searchSubmit);
    $(document).on('click', '#popup-client', showClientPopup);
    $(document).on('submit', '#create-client-form', createNewClient);


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

    function addLanguage() {
        var $this = $(this),
            $divClear = $('<div class="clear"></div>'),
            $newDivControls = $divControls.clone().addClass('control-language'),
            selectsCount = $divTargetLanguages.children('.controls').length;

        $newDivControls.find('option').prop('selected', false);

        if (selectsCount >= languagesCount) {
            return;
        }

        $this.before($removeButton.clone());
        $this.before($divClear.clone());
        $this.before($newDivControls);

        if (selectsCount === languagesCount - 1) {
            $this.before($removeButton.clone());
            $this.hide();
        }
    }

    function removeLanguage() {
        var $this = $(this),
            $addButton = $('#button-id-add_language'),
            $divTargetLanguages = $('#div_id_target_languages'),
            selectsCount = $divTargetLanguages.children('.controls').length;

        $this.prevAll('.controls').first().remove();
        $this.nextAll('.clear').first().remove();
        $this.remove();

        $divTargetLanguages.find('.controls').first().removeClass('control-language');

        if (selectsCount === languagesCount) {
            $addButton.prevAll('.btn-remove-language').first().remove();
            $addButton.prev('.clear').remove();
            $addButton.show();
        }
    }

    function selectClient(e) {
        var $this = $(this),
            clientID = $this.data('client-id'),
            clientName = $this.children('.nom').text();

        clientIDInput.val(clientID);
        clientNameInput.val(clientName);
        $modal.magnificPopup('close');

        e.preventDefault();
    }

    function searchClient() {
        var clientName,
            $filteredElements,
            text = $(this).val().toLowerCase(),
            searchRegEx = new RegExp(text);

        $filteredElements = $clientsList.filter(function(i, el) {
            clientName = $(el).find('.nom').text().toLowerCase();
            return (searchRegEx.test(clientName));
        });

        $clientsList.not($filteredElements).hide();
        $filteredElements.show();
    }

    function searchSubmit(e) {
        e.preventDefault();
    }

    function showClientPopup() {
        $searchClientInput
            .val('')
            .trigger('input');
    }

    function insertFormErrors($form, errors) {
        var $errorLabel,
            fieldID,
            $field;

        $.each(errors, function(field, field_errors) {
            fieldID = 'id_' + field;
            $field = $form.find('#' + fieldID).addClass('error');

            $.each(field_errors, function(i, error_text) {
                $errorLabel = $('<label>', {
                    'class': 'error',
                    'for': fieldID,
                    'text': error_text
                });
                $field.after($errorLabel);
            });
        });
    }

    function clearFormErrors($form) {
        $form.find('label.error').remove();
        $form.find('select.error').removeClass('error');
        $form.find('input.error').removeClass('error');
    }

    function clearForm($form) {
        $form[0].reset();
        clearFormErrors($form);
    }

    function createNewClient(e) {
        var response;

        $createClientInput.prop('disabled', true);

        $.post(createCletnURL, $createClientForm.serializeArray())
            .done(function(data) {
                clientIDInput.val(data.id);
                clientNameInput.val(data.name);
                $modal.magnificPopup('close');

                $clientsBox.children('li.add').before(data.html);

                clearForm($createClientForm);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                response = $.parseJSON(jqXHR.responseText);

                clearFormErrors($createClientForm);
                insertFormErrors($createClientForm, response.company_form_errors);
                insertFormErrors($createClientForm, response.contact_form_errors);
            })
            .always(function() {
                $createClientInput.prop('disabled', false);
            });


        e.preventDefault();
    }

});
