/* original file was project_delete */
$(document).ready(function() {
    var submitButton = $('#submit-form').closest('.some-button');
    var closeWindow = $('.project-close-verify');
    var deleteWindow = $('.project-delete-verify');
    var isClosedInput = $('[name="is_closed"]')
    var isDeleteInput = $('[name="is_deleted"]')
    var closeButton = $('#js-close-project');
    var closeClassButton = $('.close_button');
    var deleteClassButton = $('.delete_button');
    var deleteButton = $('#js-delete-project');
    closeButton.on('click', function(event) {
        event.preventDefault();
         if (closeClassButton.hasClass('disabled')){
            return false;
        }else{
            if (isClosedInput.val() == "True") {
                isClosedInput.val('False');
                closeButton.text('Close project');
                return false;
            }
            submitButton.addClass('disabled');
            deleteClassButton.addClass('disabled');
            project_code = closeButton.closest('form').find("input[name$='code']").val();
            $.post('/project/close_delete/', {'project_code': project_code}, function(data) {
            if (!data['status']) {
                closeWindow.show();
                }
            });

            $('button#cancel_close').click(function(event) {
                event.preventDefault();
                submitButton.removeClass('disabled');
                deleteClassButton.removeClass('disabled');
                closeWindow.hide();
            });
            $('button#confirm_close').click(function(event) {
                event.preventDefault();
                submitButton.removeClass('disabled');
                deleteClassButton.removeClass('disabled');
                isClosedInput.val('True')
                closeButton.text('Marked for close (cancel)');
                closeWindow.hide();
            });
            return false;
        }
    });
    deleteButton.on('click', function(event) {
        event.preventDefault();
        if (deleteClassButton.hasClass('disabled')){
            return false;
        } else{
            if (isDeleteInput.val() == "True") {
                isDeleteInput.val('False');
                deleteButton.text('Delete project');
                return false;
            }
            submitButton.addClass('disabled');
            closeClassButton.addClass('disabled');
            project_code = deleteButton.closest('form').find("input[name$='code']").val();
                $.post('/project/close_delete/', {'project_code': project_code}, function(data) {
                if (!data['status']) {
                    deleteWindow.show();
                }
            });

            $('button#cancel_delete').click(function(event) {
                event.preventDefault();
                submitButton.removeClass('disabled');
                closeClassButton.removeClass('disabled');
                deleteWindow.hide();
            });
            $('button#confirm_delete').click(function(event) {
                event.preventDefault();
                submitButton.removeClass('disabled');
                closeClassButton.removeClass('disabled');
                isDeleteInput.val('True')
                deleteButton.text('Marked for delete (cancel)');
                deleteWindow.hide();
            });
            return false;
        }
        });
    });