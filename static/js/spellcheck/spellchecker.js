/* global PTL */
(function ($) {
  $.fn.spellchecker = function (options) {
    var settings = $.extend({
      spellcheck_url: '/spellcheck/en/',
      timeout: 2000
    }, options);

    function spellchek(editor, text, area, callback) {
      $.post(settings.spellcheck_url, {text: text}, function (data) {
          //var checked_text = data.text;
          //var extra = 0;
          var preprefix = '<span class="highlight"';
          var suffix = '</span>';
          var new_content = editor.html();
          //var new_content_area = '';

          if (data.check) {
            $.each(data.check, function(i, el){
              //var spellchecker = $('.spellchecker')[0];
              //var caret_position = PTL.editor.getCaretPosition(spellchecker);
              var regex = new RegExp('\\b' + el.word + '\\b(?!</span>)', 'g');
              var prefix = preprefix + 'suggestions="' + el.suggest + '">';
              new_content = new_content.replace(regex, prefix + el.word + suffix);
            });
          }
        if (data.status === 0){
          editor.html(new_content);
          editor.find('span.highlight').tooltip({
            title: function(){
              return $(this).attr('suggestions');
            }
          });
        }
        $('.spellchecker-copy').html(new_content);
        PTL.editor.reverseTags();
        area.val($('.spellchecker-copy').text());
        PTL.editor.placeCaretAtEnd($('.spellchecker')[0]);
        if ($('.tag-error').text!='Error: tags misssing'){
          PTL.editor.autosubmitTimeout = setTimeout(PTL.editor.submitNonEmpty, 200);
        }
        if (callback) {
          callback();
        }
      }, 'json');
    }

    this.each(function () {
      var textarea = $(this);
      var timeout_handler = null;
      var editor = $('<div contenteditable="true" class="spellchecker"></div>');
      var editor_copy = $('<div class="spellchecker-copy" style="display: none;"></div>');
      editor.css({
        'max-width': textarea.width() + 'px'
      });
      textarea.after(editor_copy);
      textarea.after(editor).hide();
      // init editor with textarea value
      editor.text(textarea.val());
      // sync editor and textarea
      editor.keyup(function () {
        var text = editor.text();
        if (text != textarea.val()) {
          clearTimeout(timeout_handler);
          timeout_handler = setTimeout(function () {
            spellchek(editor, text, textarea);
          }, settings.timeout);
        }
      });
      $(document).unbind('spellcheck');
      $(document).bind('spellcheck', function(event, callback){
        var text = editor.text();
        if (text != textarea.val()) {
          spellchek(editor, text, textarea, callback);
        } else if (callback) {
          callback();
        }
      });
    });
    return this;
  };
}(jQuery));
