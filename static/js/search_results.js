$( document ).ready(function() {

    var $navItems = $('.is-submenu').find('.sss-item'),
        $results = $('.search-results-container');


    // Event listeners
    $(document).on('click', '.sss-item a', filterSearch);


    function filterSearch(e) {
        var $currentResult,
            $this = $(this).parent(),
            resultName = $this.data('show-results');

        if (resultName === 'all' || resultName === '') {
            $results.show();
        } else {
            $currentResult = $results.filter('[data-result=' + resultName + ']');
            $currentResult.show();
            $results.not($currentResult).hide();
        }

        // Activate current sidebar nav link
        $this
            .text( $this.text() )
            .removeClass('passed')
            .addClass('active');

        // Deactivate all others sidebar nav links
        $navItems
            .not($this)
            .removeClass('active')
            .addClass('passed')
            .each(function(i, el) {
                $(el).html( $('<a>', {'href': '#', 'text': $(el).text()}) );
            });

        e.preventDefault();
    }

});
