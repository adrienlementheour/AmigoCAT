$( document ).ready(function() {

	$('.js-delete-client').click(function (e) {
		e.preventDefault();
		var data = {};
		var delete_url = $(this).attr("href");
		var link = $(this);
		data['action'] = 'delete';
	    $.ajax({
	        type: "POST",
	        url: delete_url,
	        data: data,
	        dataType: "json"
	    }).done(function (data) {
	            if (data['result'] == 'success') {
					link.parents('li').hide('slow');
	            } else {
	                link.parents('li').find('.js-error')
						.text('Error while trying to delete this client.');
	            }
	    })
	});

});
