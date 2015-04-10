$(document).ready(function() {
    var closeButton = $('.dashboar-close-project');
    var project_code = closeButton.data('code');
    var closeWindow = $('.project-close-verify');

    closeButton.on('click', function(event) {
        event.preventDefault();
        closeWindow.show();

        $('button#cancel_close').click(function(event) {
            event.preventDefault();
            closeWindow.hide();
            });
        $('button#confirm_close').click(function(event) {
            event.preventDefault();
            $.post('/project/close_delete/', {'project_code': project_code, 'action':'close'}, function(data) {});
            closeWindow.hide();
        });
        return false;
    });

});