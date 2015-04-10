$( document ).ready(function() {

	if ( frozen_days_left ) {
		$(".js-address-form :input").attr("disabled", true);
	}

	$('.js-decline-changes').click(function () {
	    $.ajax({
	        type: "POST",
	        url: decline_changes_url,
	        data: '',
	        dataType: "json"
	    }).done(function (data) {
	            if (data['result'] == 'success') {
					$('.js-status-message').text('Changes declined and will not be applied.');
	            } else {
	                $('.js-status-message').text('Error occured while trying to decline changes!');
	            }
	    })
	});

});
