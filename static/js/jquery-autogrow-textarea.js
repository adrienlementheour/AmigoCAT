(function ($) {
    'use strict';

    // Plugin interface
    $.fn.autoGrowTextarea = autoGrowTextArea;
    $.fn.autoGrowTextArea = autoGrowTextArea;

    // Shorthand alias
    if (!('autoGrow' in $.fn)) {
        $.fn.autoGrow = autoGrowTextArea;
    }

    /**
     * Initialization on each element
     */
    function autoGrowTextArea() {
        return this.each(init);
    }

    /**
     * Actual initialization
     */
    function init() {
        var $textarea, $origin, origin, hasOffset, innerHeight, height, offset = 0;

        $textarea = $(this).css({overflow: 'hidden', resize: 'none'});

        if ($textarea.data('autogrow-origin')) {
            return;
        }

        $origin = $textarea.clone().val('').appendTo($textarea.parent());
        origin = $origin.get(0);

        height = $origin.height();
        origin.scrollHeight; // necessary for IE6-8. @see http://bit.ly/LRl3gf
        hasOffset = (origin.scrollHeight !== height);

        // `hasOffset` detects whether `.scrollHeight` includes padding.
        // This behavior differs between browsers.
        if (hasOffset) {
            innerHeight = $origin.innerHeight();
            offset = innerHeight - height;
        }

        $origin.hide();

        $textarea
            .data('autogrow-origin', $origin)
            .on('keyup change input paste autogrow', function () {
                grow($textarea, $origin, origin, height, offset);
            });

        grow($textarea, $origin, origin, height, offset);
    }

    /**
     * grow textarea height if its value changed
     */
    function grow($textarea, $origin, origin, initialHeight, offset) {
        var current, prev, scrollHeight, height;

        current = $textarea.val();
        prev = grow.prev;
        if (current === prev) return;

        grow.prev = current;

        $origin.val(current).show();
        origin.scrollHeight; // necessary for IE6-8. @see http://bit.ly/LRl3gf
        scrollHeight = origin.scrollHeight;
        height = scrollHeight - offset;
        $origin.hide();


        if (height == offset/2) {
            $textarea.css('height', initialHeight);
        } else if (height == offset) {
            $textarea.height(height);
        }   else {
            $textarea.height(height > initialHeight ? height : initialHeight);
        }

        /* Adapt the size of the table for searchTm */
        if($('.popOverflow').length){
            $('.popOverflow').height($('.popTm').find('.mfp-content').height() - $('.popTm').find('.mfp-content').find('h2').innerHeight() - $('.popTm').find('.mfp-content').find('.form-popTm').innerHeight());
        }
    }
}(jQuery));
