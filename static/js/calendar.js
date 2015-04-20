$( document ).ready(function() {
    $('#calendar').on('click', '.availabilityBtn .minus, .availabilityBtn .plus', function(e) {
        var $this = $(this),
            url = '/accounts/update_availability/',
            $hoursSpan = $this.siblings('.avail-hours'),
            hours = $hoursSpan.text(),
            date = $this.closest('.availabilityBtn').data('date')

        if ($this.hasClass('minus')) {
            hours--;
        } else if ($this.hasClass('plus')) {
            hours++;
        }

        $.post(url, {'hours': hours, 'date': date})
            .done(function(data) {
                $hoursSpan.text(hours);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                var error = JSON.parse(jqXHR.responseText).msg;
                console.error(error);
            });
    });

    $('#setAvailability .availabilityBtn').on('click', '.minus, .plus', function(e) {
        e.preventDefault();
        var $this = $(this),
            $hoursSpan = $this.siblings('.avail-hours'),
            $hoursInput = $('#id_hours'),
            hours = $hoursSpan.text();

        if ($this.hasClass('minus')) {
            hours--;
        } else if ($this.hasClass('plus')) {
            hours++;
        }
        console.log($hoursInput);

        if(hours >= 0 && hours <= 24){
          $hoursSpan.text(hours);
          $hoursInput.val(hours);
        };
    });

    $(function() {
        $( ".dateinput:not([readonly])" ).datepicker({
          'dateFormat': 'dd-mm-yy',
          'changeYear': true,
          'minDate': new Date()
        });
        console.log($( ".datetimeinput").length);
    });
});