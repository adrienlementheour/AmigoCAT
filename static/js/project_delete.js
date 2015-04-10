$(document).ready(function() {
        $('th').find('input[type=checkbox]').hide();
        deleteWindow = $('.project-delete-verify');
        passwordForm = $('#password-form');
        headButton = $('thead').find('#id_form-0-is_deleted');
        deleteButtons = ($('tbody').find('.is_deleted').children('input:not([disabled])')).add(headButton);
        // Show or hide password entrance form on checkbox click
        deleteButtons.each(function() {
            $(this).on('click', function() {
                if ($(this).is(':checked')) {
                    $('[name=project_id]').attr('value', $(this).data('id'));
                    deleteButtons.attr('disabled', 'disabled');
                    deleteWindow.show();
                }
                else {
                    deleteWindow.hide();
                }
            });
        });
        /* Send ajax post to server on password form submission,
        if password incorrect - display error, else - 'delete' project and reload page
        */
        $('#password-form').submit(function(event) {
            event.preventDefault();
            project_id = passwordForm.find('input[type=hidden]').val();
            password = passwordForm.find('input[type=password]').val();
            $.post('/project/delete/', {'project_id': project_id, 'password':password}, function(data) {
                if (data['status']) {
                    $('.password-error').show();
                }
                else {
                    location.reload();
                }
            });
        });
        // Hide password form on cancel button
        $('button#cancel').click(function(event) {
            deleteButtons.removeAttr('disabled');
            event.preventDefault();
            $('.password-error').hide();
            $(this).closest('div').hide();
            deleteButtons.each(function() {
                $(this).attr('checked', false);
            });
        });

        // Show verification form on project-close checkbox click
        $('thead').find('#id_form-0-is_closed').remove();
        var closeWindow = $('.project-close-verify'),
            closeCheckboxes = ($('tbody').find('.is_closed').children('input:not([disabled])')),
            submitButton = $('.admin-buttons-block').children('[type=submit]');
        closeCheckboxes.each(function() {
            $(this).on('click', function() {
                if ($(this).is(':checked')) {
                    $this = $(this);
                    closeCheckboxes.attr('disabled', 'disabled');
                    submitButton.attr('disabled', 'disabled');
                    project_code = $this.closest('tr').find("input[name$='code']").val();
                    $.post('/project/close/', {'project_code': project_code}, function(data) {
                        if (!data['status']) {
                            closeWindow.show();
                        }
                        else {
                            submitButton.removeAttr('disabled');
                            closeCheckboxes.removeAttr('disabled');
                        }
                    });
                    $('button#cancel_close').click(function(event) {
                        event.preventDefault();
                        submitButton.removeAttr('disabled');
                        closeCheckboxes.removeAttr('disabled');
                        closeWindow.hide();
                        $this.attr('checked', false);
                    });
                    $('button#confirm_close').click(function(event) {
                        event.preventDefault();
                        submitButton.removeAttr('disabled');
                        closeCheckboxes.removeAttr('disabled');
                        closeWindow.hide();
                    });
                }
            });
        });

    });