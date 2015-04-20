$(document).ready(function() {
    var closeButton = $('.dashboar-close-project');
    var project_code = closeButton.data('code');
    var closeWindow = $('.project-close-verify');
    var upload_process;

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

    // File upload state periodical check:
    // if any tr have class dashboard-uploading we start check upload status every 2 sec.
    // after all files uploaded we remove periodic checks
    if($('div.tr').hasClass('dashboard-uploading')) {
        upload_process = setInterval(function() {
            window.showLoader();
            var ids = [];
            $('div.tr.dashboard-uploading').each(function(index, el) {
                ids.push($(el).data('id'));
            });

            $.ajax({
                url: '/project/project_check_store_state/',
                data: {'project_code': $('a.dashboar-close-project').data('code')},
                success: function(data) {
                    $(ids).each(function(index, el) {
                        if($.inArray(el, data) == -1) {
                            $('div.tr.dashboard-uploading[data-id='+el+'] a.invisible').removeClass('invisible');
                            $('div.tr.dashboard-uploading[data-id='+el+'] span.hidden').removeClass('hidden');
                            $('div.tr.dashboard-uploading[data-id='+el+'] .upload_status').addClass('hidden');
                            $('div.tr.dashboard-uploading[data-id='+el+']').removeClass('dashboard-uploading'); // remove class indicates uploading
                        }
                    });
                },
                global: false // disable hide loader after each request
            });

            // hide loader and stop checking
            if(!$('div.tr').hasClass('dashboard-uploading')) {
                window.hideLoader();
                clearInterval(upload_process);
            }
        }, 2000);
    }
});
