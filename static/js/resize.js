$( document ).ready(function() {

  var resize_filenames = function(resized) {

    var get_children_width = function(p, min_width) {
      var w = 0;
      p.children().each(function () {
        if (!$(this).hasClass('hidden-filename')) {
          if (!(min_width && $(this).hasClass('filename'))) {
            w += $(this).outerWidth(true);
          }
        }
      });
      return w;
    };


    var delimiter = '&hellip;';

    $('.filename').each( function (index, obj) {
      var parent = $(this).parent();
      // reserve min width for filename
      var file_width = 10;
      var min_width = get_children_width(parent, true) + file_width;

      var text_obj = $(this).find('span');
      text_obj.text(parent.find('.hidden-filename').text());

      while((get_children_width(parent, false) + 10 - parent.outerWidth()) >= 0 &&
        get_children_width(parent, false) > min_width &&
        text_obj.text().length > 4)  {
          var text = text_obj.text();
          text = text.substr(0, text.length/2-1)+delimiter+text.substr(text.length/2+1, text.length);
          text_obj.html(text);
      }
    });
  };


  $(window).bind('load', function() {
    resize_filenames();
  });

  $( window ).resize(function() {
    resize_filenames();
  });
});