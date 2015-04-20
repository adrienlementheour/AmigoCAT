var navigate_interval_id = 0;

$(function () {
    navigate();
    navigate_interval_id = window.setInterval(navigate, 3000);
    $('li.sss-item a').click(function () {
        $('li.sss-item').removeClass('active');
        $(this).parent().addClass('active');
    });

    $(window).blur(function() {
        if (navigate_interval_id) {
            window.clearInterval(navigate_interval_id);
            navigate_interval_id = 0;
        }
    });
    $(window).focus(function() {
        if (!navigate_interval_id) {
            navigate_interval_id = window.setInterval(navigate, 3000);
        }
    });
});

var order_by = function () {
    var text = $('li.active-orderby').text().toLowerCase();
    if (text == 'date') {
        return '-creation_date';
    } else if (text == 'collaborators') {
        return 'profile';
    }
    return 'project';
};

var navigate = function () {
    var storedHash = window.location.hash;
    var data = {'order_by': order_by()};
    if (/^(#\d+)$/.test(storedHash)) {
        data['project_id'] = storedHash.slice(1);
    }
    $.ajax({
        url: '/notifications/',
        data: data,
        success: function (data) {
            var tbody = $('.page-notifs').children()[0];
            $(tbody).html('');
            $.each(data, function (index, notification) {
                $(tbody).append('<tr' + (notification.new ? ' class="new" ' : '') + '>'
                + '<td class="' + notification.priority + '-notif"></td>'
                + '<td class="proj-notif"><a href="/projects/' + notification.project_code + '/">'
                + notification.project + '</a></td>'
                + '<td class="img">'
                + '<div class="worker-img default"></div>'
                + '</td>'
                + '<td class="desc-notif">' + notification.user + ' '
                + PTL.common.details(notification.action, notification.details) + '</td>'
                + '<td class="date-notif"><span class="day-notif">'
                + notification.date.split(';')[0] + ' </span>'
                + notification.date.split(';')[1] + '</td>'
                + '</tr>');
            });
        }
    });
};