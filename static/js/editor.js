(function ($) {
  // case-insensitive :contains()
  $.expr[':'].Contains = $.expr.createPseudo(function(arg) {
      return function(elem) {
          return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
      };
  });

  window.PTL = window.PTL || {};

  PTL.editor = {

  /* Initializes the editor */
  init: function (options) {

    /* Default settings */
    this.settings = {
      mt: []
    };

    if (options)
      $.extend(this.settings, options);

    /* Initialize variables */
    this.units = new PTL.collections.UnitCollection();

    this.pager = {current: 1};
    this.pagesGot = {};

    this.filter = 'all';
    this.checks = [];
    this.order = 'original_order';
    this.goal = null;
    this.user = null;
    this.ctxGap = 0;
    this.ctxQty = parseInt($.cookie('ctxQty'), 10) || 1;
    this.ctxStep= 1;
    this.keepState = false;
    this.preventNavigation = false;
    this.wordSearchTimeout = null;
    this.triggers = {};
    this.mt = {};

    this.isLoading = true;
    this.showActivity();

    this.isRunningAutoTranslate = false;
    this.lastUnitIndexAutoTranslate = undefined;

    /* Currently active search fields */
    this.searchFields = [];
    this.searchOptions = [];

    /* Regular expressions */
    this.cpRE = /^(<[^>]+>|\[n\|t]|\W$^\n)*(\b|$)/gm;
    this.tagsRE = /<[^<]*?>/gm;

    /* Timeline requests handler */
    this.timelineReq = null;

    /* lockUnit settimeout id */
    this.lockUnitTimer = null;

    /* TM requests handler */
    this.tmReq = null;

    /* Differencer */
    this.differencer = new diff_match_patch();

    /* Compile templates */
    this.tmpl = {vUnit: _.template($('#view_unit').html()),
                 tm: _.template($('#tm_suggestions').html()),
                 editCtx: _.template($('#editCtx').html())};

    /* Initialize search */
    // TODO: pass the environment option to the init
    PTL.search.init({
      onSubmit: this.search
    });

    /*
     * Bind event handlers
     */

    /* Captcha */
    $(document).on('submit', '#captcha', function (e) {
      e.preventDefault();
      var fn = $(this).data('js-action');
      PTL.editor[fn](e);
      $.magnificPopup.close();
    });

    /* Update focus when appropriate */
    $(document).on('focus', '.focusthis', function (e) {
      PTL.editor.focused = e.target;
    });

    $(document).on('click', '#translate', function (e) {
      $('.spellchecker').focus();
    });

    /* Write TM results, special chars... into the currently focused element */
    // $(document).on('click', '.js-editor-copytext', this.copyText);

    /* Copy original translation */
    $(document).on('click', '.js-copyoriginal', function () {
      var sources = $('.tt-row-block.active').find('.is-original')
          .find('.translation-text');
      PTL.editor.copyOriginal(sources);
    });

    /* Copy suggestion */
    $(document).on('click', 'div.suggestion', function () {
      // Don't copy if text has been selected
      if (PTL.editor.getSelectedText()) {
        return;
      }
      if ($('#id_target_f_0').attr('disabled')) {
        return;
      }
      PTL.editor.copyOriginal($('.suggestion-translation', this));
    });

    /* Editor navigation/submission */
    $(document).on('editor_ready', 'div.table-trad', this.ready);
    $(document).on('noResults', 'div.table-trad', this.noResults);
    $(document).on('mouseup', 'div.tt-row-block', this.gotoUnit);
    $(document).on('mouseup', '#editor', this.getSelectedText);
    $(document).on('click', 'input.submit', this.submit);
    $(document).on('click', '.js-suggestion-accept', this.acceptSuggestion);
    $(document).on('click', '.js-editor-copytext', this.copyTerminology);
    $(document).on('click', '#bt-close', function(e) {
      e.stopPropagation();
      e.preventDefault();
      $(this).parent().fadeOut();
    });

    /* Filtering */
    $(document).on('change', '#filter-status select', this.filterStatus);

    /* Ordering */
    $(document).on('change', '#order-items select', this.orderItems);

    /* Misc */
    $(document).on('click', '.js-editor-msg-hide', this.hideMsg);

    /* Search */
    $(document).on('submit', '#search-form', function (e) {
      e.preventDefault();
      PTL.editor.search();
    });
    $(document).on('keypress', '#id_search', function (e) {
      if (e.which === 13) {
        e.preventDefault();
        PTL.editor.search();
      }
    });

    /* Tags group */
    if (window.GROUP_TAGS) {
        $(document).on('click', '.spellchecker .tag-group', function(e) {
            e.preventDefault();
            PTL.editor.groupTags();
            PTL.editor.removeTagsGroup( $(this) );

            return false;
        });
        $(document).on('click', '.spellchecker', function(e) {
            //e.preventDefault();
            PTL.editor.groupTags();
        });
    }

    /* Automatic Translation */
    $(document).on('click', 'li.cat-g a', function(e) {
        e.preventDefault();
        PTL.editor.translateAllWithBackend('google');
    });
    $(document).on('click', 'li.cat-bing a', function(e) {
        e.preventDefault();
        PTL.editor.translateAllWithBackend('bing');
    });
    $(document).on('click', '#stop-auto-translate', function(e) {
        e.preventDefault();
        PTL.editor.stopAutomaticTranslation();
    });

    /* Bind hotkeys */
    var last, diff;
    $(document).on('keydown', '.spellchecker', function(e) {
      if (e.keyCode == 17 || e.metaKey) {
        if (last) {
            diff = e.timeStamp - last;
            if(diff <= 400){
              PTL.editor.showPreTraslationPopup();
              $('#pre_translate_search').focus();
              e.preventDefault();
            }
          }
        last = e.timeStamp;
      }
    });


    $(document).on('focusout', '#pre_translate_search', function(e) {
      $('.pre-translate-popup').focus();
      $('#pre_translate_search').focus();
      e.preventDefault();
      return false;
    });

    function scrollToElement(selector, time, verticalOffset) {
      time = typeof(time) != 'undefined' ? time : 0;
      verticalOffset = typeof(verticalOffset) != 'undefined' ? verticalOffset : 0;
      element = $(selector);
      offset = element.offset();
      offsetTop = (offset.top + verticalOffset)/1.5;
      $('html, body').animate({
          scrollTop: offsetTop
      }, time);
    }

    $('#pre_translate_search').bind('change paste keyup', function(e) {
      if (!$('.pre-translate-popup').is(':visible'))
        return;

      if (e.which != 39 && e.which != 37 && e.which != 13 && e.which != 27) {
        clearTimeout(PTL.editor.wordSearchTimeout);
        var search_val = $('#pre_translate_search').val().toLowerCase();
        PTL.editor.wordSearchTimeout = setTimeout(function(){
          if (!PTL.editor.wordSearchTimeout)
            return;

          $('.pre-translate-word').removeClass('pre-translate-word');
          $('.pre-translate-word-main').removeClass('pre-translate-word-main');

          $('.translation-text:Contains("' + search_val + '")').each(function(item, e) {
            var words_array = $(e).text().split(' ');
            for (var i = 0; i < words_array.length; i++) {
              if (words_array[i].toLowerCase().indexOf(search_val) != -1) {
                  var word = words_array[i].substring(0, search_val.length);
                  $(e).html($(e).html().replace(word, '<span class="pre-translate-word">' + word + '</span>'));
              }
            }
          });
          $('.pre-translate-word')
            .first()
            .removeClass('pre-translate-word')
            .addClass('pre-translate-word-main');
          scrollToElement('.pre-translate-word-main');
        }, 700);
      }
    });

    function closePreTranslatePopup() {
      clearTimeout(PTL.editor.wordSearchTimeout);
      PTL.editor.wordSearchTimeout = null;

      $('.terminology-results-popup').hide();
      $('.terminology-results-popup').find('tr[class^="amigo"]').remove();
      $('.pre-translate-popup').hide();
      $('.pre-translate-word')
        .removeClass('pre-translate-word');
      $('.pre-translate-word-main')
        .removeClass('pre-translate-word-main');

      $('.spellchecker').focus();
    }

    $('.results-popup-close').click(function() {
        closePreTranslatePopup();
    });

    $(document).on('click', 'div.result-variations', function() {
        var translated_text = $(this).text();
        if (translated_text === '-- Nothing was found --')
          return false;
        var translationarea = $('.tt-row-block.active');
        var spellchecker = translationarea.find('.spellchecker');
        $('.tt-row-block.active').find('.translation-area').text(translated_text);
        spellchecker.html(translated_text);
        PTL.editor.autosubmitTimeout = setTimeout(PTL.editor.submitNonEmpty, 200);
        $('.terminology-results-popup').hide();
        $('.pre-translate-popup').hide();
    });

    function nextTranslation(e) {
        $(document).trigger('spellcheck', function () {
          if (PTL.editor.isAllTags()) {
            $('.tag-error').text('');
            $('.tag-error').css('display', 'none');
            if ($('.tt-row-block.active').find('.spellchecker').text().trim() !== '') {
              $('input.submit').trigger('click');
            }
            PTL.editor.gotoNext();
            return;
          }
          if (!PTL.editor.isAllTags()) {
            if (e.which === 9) {
              PTL.editor.addTranslationTag();
            } else {
              $('.tag-error').css('display', 'block');
              $('.tag-error').text('Error: tags misssing');
              PTL.editor.addTranslationTag();
            }
            return;
          }
          $('.tag-error').text('');
          $('.tag-error').css('display', 'none');
        });
        return;
    };
    this.nextTranslation = nextTranslation;
    shortcut.add('ctrl+return', nextTranslation);
    shortcut.add('tab', nextTranslation);
    shortcut.add('esc', function(){$('.results-popup-close').click();});
    shortcut.add('alt+t', PTL.editor.addTranslationTag);

    shortcut.add('meta+shift+up', function () {
      PTL.editor.gotoEmptyTranslation('prev');
    });
    shortcut.add('meta+shift+down', function () {
      PTL.editor.gotoEmptyTranslation('next');
      $('.spellchecker').trigger('click');
    });
    shortcut.add('meta+up', function () {
      $('#js-nav-prev').trigger('click');
    });

    shortcut.add('ctrl+up', function () {
      $('#js-nav-prev').trigger('click');
    });

    shortcut.add('ctrl+,', function () {
      $('#js-nav-prev').trigger('click');
    });

    shortcut.add('ctrl+.', function () {
      $('#js-nav-next').trigger('click');
    });

    /* XHR activity indicator */
    $(document).ajaxStart(function () {
      clearTimeout(PTL.editor.delayedActivityTimer);
      PTL.editor.delayedActivityTimer = setTimeout(function () {
        PTL.editor.showActivity();
      }, 3000);
    });
    $(document).ajaxStop(function () {
      clearTimeout(PTL.editor.delayedActivityTimer);
      if (!PTL.editor.isLoading) {
        PTL.editor.hideActivity();
      }
    });

    /* Load MT backends */
    PTL.editor.MTIsLoading = false;

    $(document).on('click', '.js-translate', function(){
      var bn = $(this).data('mt');
      PTL.editor.mt[bn].translate(bn);
    });

    $.each(this.settings.mt, function () {
      var backend = this.name, key = this.key;

      $.ajax({
        url: s(['js/mt/', backend, '.js'].join('')),
        async: false,
        dataType: 'script',
        success: function () {
          setTimeout(function () {
            PTL.editor.mt[backend].init(key);
          }, 0);
          $(document).on('mt_ready', 'div.table-trad', function () {
            PTL.editor.triggers.mt_ready = false;
            PTL.editor.mt[backend].ready();
          });
          if (PTL.editor.triggers.mt_ready) {
            $('div.table-trad').trigger('mt_ready');
          }
          if (PTL.editor.triggers.segment_ready) {
            $(document).trigger('segment_ready');
          }
          PTL.editor.MTIsLoading=true;
          setTimeout(function () {
            PTL.editor.mt[backend].translate(backend);
          }, 300);
        }
      });
    });

    /* Load lookup backends */
    $.each(this.settings.lookup, function () {
      var backend = this;

      $.ajax({
        url: s(['js/lookup/', backend, '.js'].join('')),
        async: false,
        dataType: 'script',
        success: function () {
          setTimeout(function () {
            PTL.editor.lookup[backend].init();
          }, 0);

          $(document).on('click', '.js-wiki-lookup', function(e) {
            e.stopPropagation();
            PTL.editor.lookup[backend].lookup(e);
          });
          $(document).on('lookup_ready', 'div.table-trad',function(e) {
            PTL.editor.triggers.lookup_ready = false;
            PTL.editor.lookup[backend].ready();
          });
          if (PTL.editor.triggers.lookup_ready) {
            $('div.table-trad').trigger('lookup_ready');
          }
        }
      });
    });

    function errorHandler(request, status, error) {
      PTL.editor.displayError('Could not connect to server');
    }

    function convertText(back, data_text) {
      var text = '';
      if (data_text === undefined) {
        text = '-- Nothing was found --';
      }
      if (back === 'taas') {
        text = '';
        try {
          if (data_text) {
            text = data_text[0];
          }
        } catch(err) {
          console.log(err.message);
        }
      } else if (back == 'google') {
        text = '';
        try {
          if (data_text && data_text.data && data_text.data.translations) {
            text = data_text.data.translations[0].translatedText;
          }
        } catch(err) {
          console.log(err.message);
        }
      }
      if (text == '') {
        text = '-- Nothing was found --';
      }
      return text;
    }

    var search_count = 0;
    function makeSuccessHandler(back, search) {
      var $popup = $('.terminology-results-popup');

      return function(data, status) {
        var text = data.data || data.text || data.error,
            iconclass = '';
        $('.results-popup-term').text('"'+search+'"');

        text = convertText(back, text);
        if (text != '-- Nothing was found --'){
          search_count++;
        }
        switch (back) {
          case 'google':
            iconclass = 'icon-google';
            $popup.find('tbody').append('<tr class="amigo-google"><td class="'+iconclass+'"></td><td class="bold">'+search+'</td><td class="result-variations">'+
              text+'</td><td class="arrow"></td></tr>');
            break;
          case 'bing':
            iconclass = 'cat-bing';
            $popup.find('tbody').append('<tr class="amigo-bing"><td class="'+iconclass+'"></td><td class="bold">'+search+'</td><td class="result-variations">'+
              text+'</td><td class="arrow"></td></tr>');
            break;
          case 'taas':
            iconclass = 'cat-MT';
            $popup.find('tbody').append('<tr class="amigo-taas"><td class="'+iconclass+'"></td><td class="bold">'+search+'</td><td class="result-variations">'+
              text+'</td><td class="arrow"></td></tr>');
            break;
        }
        if (search_count == 1){
          $popup.find('.it').text(search_count+' result');
        } else{
          $popup.find('.it').text(search_count+' results');
        }

        if (data.captcha) {
          PTL.editor.displayError('Login required');
        }
        if (data.error) {
          PTL.editor.displayError(data.error);
        }
        window.tunePositions();
        $popup.show();
      };
    }
    var PRE_TRAN_CNT = 1;
    $(document).on('keyup', '#pre_translate_search', function(e) {
      var unit = PTL.editor.units.getCurrent(),
          store = unit.get('store');

      switch (e.which) {
        case 39:
          $('.pre-translate-word-main')
            .removeClass('pre-translate-word-main')
            .addClass('pre-translate-word');
          $('.pre-translate-word:eq(' + PRE_TRAN_CNT + ')')
            .removeClass('pre-translate-word')
            .addClass('pre-translate-word-main');
          scrollToElement('.pre-translate-word-main');
          PRE_TRAN_CNT = (PRE_TRAN_CNT + 1 < $('.pre-translate-word').length ? PRE_TRAN_CNT + 1 : $('.pre-translate-word').length);

          break;

        case 37:
          PRE_TRAN_CNT = (PRE_TRAN_CNT - 1 > 0 ? PRE_TRAN_CNT - 1 : 0);
          $('.pre-translate-word-main')
            .removeClass('pre-translate-word-main')
            .addClass('pre-translate-word');
          $('.pre-translate-word:eq(' + PRE_TRAN_CNT + ')')
            .removeClass('pre-translate-word')
            .addClass('pre-translate-word-main');
          scrollToElement('.pre-translate-word-main');

          break;

        case 27:
          closePreTranslatePopup();

          return false;

        case 13:
          $('.pre-translate-popup').hide();
          PRE_TRAN_CNT = 1;
          e.preventDefault();
          if ($('#pre_translate_search').val()) {

            var backends = [];
            if (!PTL.editor.settings.review) {
              backends.push('taas');
              $(PTL.editor.settings.mt).each(function (index, element) {
                backends.push(element.name)
              });
            }
            if (PTL.editor.is_unit_locked) {
              backends = [];
              $('.trad-list').css('display', 'none');
            }

            $('.terminology-results-popup').find('li').remove();

            var search = $('.pre-translate-word-main').text().toLowerCase();
            for (var i = 0; i < backends.length; i++) {
              var back = backends[i];
              if (search === "") {
                search = $('#pre_translate_search').val().toLowerCase();
              }

              $.ajax({
                type: 'POST',
                url: '/mt/',
                data: {
                  from: store.get('source_lang'),
                  to: store.get('target_lang'),
                  text: search,
                  backend: back,
                  dataType: 'json'
                },
                async: false,
                success: makeSuccessHandler(back, search),
                error: errorHandler
              });
            }
          }
          break;
      }
    });

    /* History support */
    setTimeout(function () {
      $.history.init(function (hash) {
        var params = PTL.utils.getParsedHash(hash),
            withUid = 0,
            tmpParamValue;

        // Walk through known filtering criterias and apply them to the editor object

        if (params['unit']) {
          tmpParamValue = parseInt(params['unit'], 10);

          if (tmpParamValue && !isNaN(tmpParamValue)) {
            var current = PTL.editor.units.getCurrent(),
                newUnit = PTL.editor.units.get(tmpParamValue);
            if (newUnit && newUnit !== current) {
              PTL.editor.units.setCurrent(newUnit);
              PTL.editor.displayEditUnit();
              return;
            } else {
              withUid = tmpParamValue;
            }
          }
        }

        PTL.editor.pager.current = 1;
        PTL.editor.filter = 'all';

        if ('filter' in params) {
          var filterName = params['filter'];

          // Set current state
          PTL.editor.filter = filterName;

          if (filterName === 'checks' && 'checks' in params) {
            PTL.editor.checks = params['checks'].split(',');
          } else {
            PTL.editor.checks = [];
          }
        }

        if ('order' in params) {
          var o = params['order'];
          // Set current state
          if (o) {
            PTL.editor.order = o;
          }
        }

        PTL.editor.goal = null;
        if ('goal' in params) {
          PTL.editor.goal = params['goal'];
        }

        // Only accept the user parameter for 'user-*' filters
        if ('user' in params && PTL.editor.filter.indexOf('user-') === 0) {
          var user;
          PTL.editor.user = user = params['user'];

          var newOpts = [],
              values = {
            'user-suggestions':
              // Translators: '%s' is a username
              interpolate(gettext("%s's pending suggestions"), [user]),
            'user-suggestions-accepted':
              // Translators: '%s' is a username
              interpolate(gettext("%s's accepted suggestions"), [user]),
            'user-suggestions-rejected':
              // Translators: '%s' is a username
              interpolate(gettext("%s's rejected suggestions"), [user]),
            'user-submissions':
              // Translators: '%s' is a username
              interpolate(gettext("%s's submissions"), [user]),
            'user-submissions-overwritten':
              // Translators: '%s' is a username, meaning "submissions by %s, that were overwritten"
              interpolate(gettext("%s's overwritten submissions"), [user])
          };
          for (var key in values) {
            newOpts.push([
              '<option value="', key, '" data-user="', user, '" class="',
              'js-user-filter' ,'">', values[key], '</option>'
            ].join(''));
          }
          $(".js-user-filter").remove();
          $('#filter-status select').append(newOpts.join(''));
        }

        if ('search' in params) {
          // Note that currently the search, if provided along with the other
          // filters, would override them
          PTL.editor.filter = "search";
          PTL.editor.searchText = params['search'];
          if ('sfields' in params) {
            PTL.editor.searchFields = params['sfields'].split(',');
          }
          PTL.editor.searchOptions = [];
          if ('soptions' in params) {
             PTL.editor.searchOptions = params['soptions'].split(',');
          }
        }

        // Update the filter UI to match the current filter

        // disable navigation on UI toolbar events to prevent data reload
        PTL.editor.preventNavigation = true;

        $('#filter-status select [value="' + PTL.editor.filter + '"]').attr('selected', 'selected');
        $('#order-items select [value="' + PTL.editor.order + '"]').attr('selected', 'selected');
        if (PTL.editor.filter == "checks") {
          // if the checks selector is empty (i.e. the 'change' event was not fired
          // because the selection did not change), force the update to populate the selector
          if (!$("#filter-checks").length) {
            PTL.editor.filterStatus();
          }
          $('#filter-checks select').select2('val', PTL.editor.checks[0]);
        }

        if (PTL.editor.filter == "search") {
          $("#id_search").val(PTL.editor.searchText);
          $("#id_search").trigger('focus');

          // Set defaults if no fields have been specified
          if (!PTL.editor.searchFields.length) {
            PTL.editor.searchFields = ["source", "target"];
          }

          $(".js-search-fields input").each(function () {
            if ($.inArray($(this).val(), PTL.editor.searchFields) >= 0) {
              $(this).attr("checked", "checked");
            } else {
              $(this).removeAttr("checked");
            }
          });

          $(".js-search-options input").each(function () {
            if ($.inArray($(this).val(), PTL.editor.searchOptions) >= 0) {
              $(this).attr("checked", "checked");
            } else {
              $(this).removeAttr("checked");
            }
          });

          // Remove any possible applied checks
          $('#filter-checks').remove();
        }

        // re-enable normal event handling
        PTL.editor.preventNavigation = false;

        // Load the units that match the given criterias
        PTL.editor.getViewUnits({pager: true, withUid: withUid});

        if (PTL.editor.hasResults) {
          // ensure all the data is preloaded before rendering the table
          // otherwise, when the page is reloaded, some pages will not yet be there
          PTL.editor.fetchPages({async: false});

          if (PTL.editor.units.getCurrent() === undefined) {
            PTL.editor.units.setFirstAsCurrent();
          }
          PTL.editor.displayEditUnit();
        }

      }, {'unescape': true});
    }, 1); // not sure why we had a 1000ms timeout here
  },

  submitNonEmpty : function() {
    if ($('.tt-row-block.active').find('.spellchecker').text() !== ''){
        $('input.submit').trigger('click');
    }
  },

  gotoEmptyTranslation: function (direction) {
    // Goto empty segment
    current = $('.tt-row-block.active');
    next = $('.tt-row-block.active')[direction]();
    while(true) {
      if (!next.length) {
        // this is the End
        if (direction == 'prev') {
          msg = 'before';
        } else {
          msg = 'after';
        }
        PTL.editor.displayMsg(gettext('There are no empty translations in the list '+msg+' this segment'));
        break;
      }
      if (!next.find('.translation-area').html().trim()) {
        // stop search if textarea has value
        next.find('span.translation-text').trigger('mouseup');
        break;
      }
      next = next[direction]();
    }
    return false;
  },

  /* Stuff to be done when the editor is ready  */
  ready: function () {
    // Pop up //
    if($('.popConnect').length){
        $('.popConnect').magnificPopup({
          type:'inline',
          midClick: true,
          mainClass: 'popConnect',
          callbacks: {
              open: function() {
                shortcut.remove('tab');
              },
              close: function() {
                shortcut.add('tab', PTL.editor.nextTranslation);
              }
          }
        });
    }
    // Set textarea's initial height as well as the max-height
    PTL.editor.selectMemory = '';
    var maxheight = $(window).height() * 0.3;
    $('textarea.expanding').TextAreaExpander('10', maxheight);

    // set direction of the suggestion body
    $('.suggestion-translation-body').filter(':not([dir])').bidi();

    // Highlight stuff
    PTL.editor.hlSearch();
    PTL.editor.hlTerms();

    $('#filter-status select [value="' + PTL.editor.filter + '"]').attr('selected', 'selected');
    $('#order-items select [value="' + PTL.editor.order + '"]').attr('selected', 'selected');

    if (PTL.editor.settings.tmUrl !== '' && !PTL.editor.is_unit_locked) {
      // Start retrieving TM units from amaGama
      PTL.editor.getTMUnits();
    }
    if (!PTL.editor.settings.review) {
      TauSData();
    }

    // All is ready, let's call the ready functions of the MT backends
    //$("table.translate-table").trigger("mt_ready");
    //$("table.translate-table").trigger("lookup_ready");
    PTL.editor.triggers.mt_ready = true;
    PTL.editor.triggers.lookup_ready = true;
    $('div.table-trad').trigger('mt_ready');
    $('div.table-trad').trigger('lookup_ready');

    PTL.editor.isLoading = false;
    PTL.editor.MTIsLoading = false;
    PTL.editor.hideActivity();
    PTL.editor.updateExportLink();
    PTL.common.updateRelativeDates();

    // clear any pending 'Loading...' indicator timer
    // as ajaxStop() is not fired in IE properly
    // at initial page load (?!)
    clearTimeout(PTL.editor.delayedActivityTimer);

    $(document).on('click', '.js-amagama-lookup', function () {
      sText = PTL.editor.getSelectedText();
      if (!sText.length) {
        sText = PTL.editor.selectMemory;
      }
      PTL.editor.getTMUnits(sText);
      return false;
    });
    PTL.editor.triggers['ptl-ready'] = true;
    $(document).trigger('ptl-ready');

    if (PTL.editor.MTIsLoading === false) {
        PTL.editor.MTTranslates();
    }
    PTL.editor.MTIsLoading = false;
    setTimeout(function () { tuneSizes(); }, 300);
  },

  /* Things to do when no results are returned */
  noResults: function () {
    PTL.editor.displayMsg(gettext("No results."));
    PTL.editor.reDraw(false);
  },


  /*
   * Text utils
   */

  /* Escape unsafe regular expression symbols:
   * ! $ & ( ) * + - . : < = > ? [ \ ] ^ { | }
   *
   * Special characters can be written as
   * Regular Expression class:
   * [!$&(-+\-.:<-?\[-^{-}]
   */
  escapeUnsafeRegexSymbols: function (s) {
    // Replace doesn't modify original variable and it recreates a
    // new string with special characters escaped.
    return s.replace(/[!$&(-+\-.:<-?\[-^{-}]/g, '\\$&');
  },

  /* Make regular expression using every word
   * in input string
   */
  makeRegexForMultipleWords: function (s) {
    // This function has these steps:
    // 1) escape unsafe regular expression symbols;
    // 2) trim ' ' (whitespaces) to avoid multiple
    //    '|' at the beginning and at the end;
    // 3) replace ' ' (one or more whitespaces) with '|'. In this
    //    way every word can be searched by regular expression;
    // 4) add brackets.
    return ['(', PTL.editor.escapeUnsafeRegexSymbols(s).trim().replace(/ +/g,
      '|'), ')'].join('');
  },

  /* Highlights search results */
  hlSearch: function () {
    var hl = PTL.editor.filter == "search" ? PTL.editor.searchText : "",
        sel = [],
        selMap = {
          source: 'div.is-original',
          target: 'div.translate-translation'
        },
        hlRegex;

    // Build highlighting selector based on chosen search fields
    $.each(PTL.editor.searchFields, function (i, field) {
      sel.push("div.tt-row-block.active " + selMap[field]);
      sel.push("div.tt-row-block " + selMap[field]);
    });

    if (PTL.editor.searchOptions.indexOf('exact') >= 0 ) {
      hlRegex = new RegExp([
          '(', PTL.editor.escapeUnsafeRegexSymbols(hl), ')'
        ].join(''));
    } else {
      hlRegex = new RegExp(PTL.editor.makeRegexForMultipleWords(hl), "i");
    }
    $(sel.join(", ")).highlightRegex(hlRegex);
  },

  /* Highlights matching terms in the source text */
  hlTerms: function () {
    var term;

    $('.tm-original').each(function () {
      term = $(this).text();
      $('div.is-original .translation-text').highlightRegex(
        new RegExp(PTL.editor.escapeUnsafeRegexSymbols(term), 'g'));
    });
  },

  /* Copies text into the focused textarea */
  copyText: function (e) {
    var selector, text, element, start,
        action = $(this).data('action');

    // Determine which text we need
    selector = $(".tm-translation", this).ifExists() ||
               $(".suggestion-translation", this).ifExists() || $(this);
    text = selector.data('entity') || selector.text();

    element = $(PTL.editor.focused);
    var checker = element.siblings('.spellchecker');

    if (action === "overwrite") {
      element.val(text);
      checker.html(translation);
      checker.keyup();
      start = text.length;
    } else {
      start = element.caret().start + text.length;
      element.val(element.caret().replace(text));
      checker.val(checker.caret().replace(text));
    }

    element.caret(start, start);
    checker.caret(start, start);
  },

  /* Sets :area:'s content to :translation: and focuses it */
  setTranslation: function (area, translation, focus) {
    var spellchecker = area.siblings('.spellchecker');
    translation = translation.trim();

    spellchecker.html(translation);
    spellchecker.keyup();
    area.val(translation);
    area.keyup();
    if (focus){
      area.focus();
      spellchecker.focus();
    }
  },

  /* Copies source text(s) into the target textarea(s)*/
  copyOriginal: function (sources) {
    var cleanSources = [];
    $.each(sources, function (i) {
      cleanSources[i] = $(this).text();
    });

    var targets = $('.tt-row-block.active').find('.translation-area');
    if (targets.length) {
      var i, active,
          max = cleanSources.length - 1;

      for (i=0; i < targets.length; i++) {
        var newval = cleanSources[i] || cleanSources[max];
        PTL.editor.setTranslation($(targets.get(i)), newval);
      }

      // Focus on the first textarea
      active = $(targets).get(0);
      active.focus();
      // Make this fuzzy
      PTL.editor.goFuzzy();
      // Place cursor at start of target text
      PTL.editor.cpRE.exec($(active).val());
      i = PTL.editor.cpRE.lastIndex;
      $(active).caret(i, i);
      PTL.editor.cpRE.lastIndex = 0;
    }
  },


  /* Gets selected text */
  getSelectedText: function () {
    var t = '';

    if (window.getSelection) {
      t = window.getSelection();
    } else if (document.getSelection) {
      t = document.getSelection();
    } else if (document.selection) {
      t = document.selection.createRange().text;
    }

    if (t.toString().length) {
      PTL.editor.selectMemory = t.toString();
    }

    return t.toString();
  },

  bindDraggables: function(selector) {
    selector.attr('contenteditable', false);
    selector.off('dragstart').on('dragstart', function(e) {
        if (!e.target.id)
            e.target.id = (new Date()).getTime();
        e.originalEvent.dataTransfer.setDragImage(this, 5, 10);
        e.originalEvent.dataTransfer.setData('text/html', e.target.outerHTML);
        $(e.target).addClass('dragged');
        $('.tipsy').remove();
    });
  },

  bindDropOnTagGroup: function($selector) {
      $selector.off('drop').on('drop', function(e) {
          e.preventDefault();
          e = e.originalEvent;

          var $this = $(this),
              $content = $( e.dataTransfer.getData('text/html') );

          if ($content.hasClass('tag-number')) {
              $content = $content.hide();
          } else if ($content.hasClass('tag-group')) {
              $content = $content.children().hide();
          } else {
              return false;
          }

          $this.append($content);
          PTL.editor.bindDraggables($content);
          PTL.editor.setTagGroupText($this);

          $('.dragged').remove();
          $('.tipsy').remove();

          return false;
      });
  },

  bindDragAndDropForTagGroups: function() {
      var $groups = $('.spellchecker .tag-group');
      PTL.editor.bindDraggables($groups);
      PTL.editor.bindDropOnTagGroup($groups);
  },

  /* Does the actual diffing */
  doDiff: function (a, b) {
    var d, op, text,
        textDiff = "",
        removed = "",
        diff = this.differencer.diff_main(a, b);

    this.differencer.diff_cleanupSemantic(diff);

    $.each(diff, function (k, v) {
      op = v[0];
      text = v[1];

      if (op === 0) {
          if (removed) {
            textDiff += '<span class="diff-delete">' + PTL.utils.fancyEscape(removed) + '</span>';
            removed = "";
          }
          textDiff += PTL.utils.fancyEscape(text);
      } else if (op === 1) {
        if (removed) {
          // This is part of a substitution, not a plain insertion. We
          // will format this differently.
          textDiff += '<span class="diff-replace">' + PTL.utils.fancyEscape(text) + '</span>';
          removed = "";
        } else {
          textDiff += '<span class="diff-insert">' + PTL.utils.fancyEscape(text) + '</span>';
        }
      } else if (op === -1) {
        removed = text;
      }
    });

    if (removed) {
      textDiff += '<span class="diff-delete">' + PTL.utils.fancyEscape(removed) + '</span>';
    }

    return textDiff;
  },


  /*
   * Fuzzying / unfuzzying functions
   */

  /* Sets the current unit's styling as fuzzy */
  doFuzzyArea: function () {
    $("div.tt-row-block.active").addClass("fuzzy-unit");
  },


  /* Unsets the current unit's styling as fuzzy */
  undoFuzzyArea: function () {
    $("div.tt-row-block.active").removeClass("fuzzy-unit");
  },


  /* Checks the current unit's fuzzy checkbox */
  doFuzzyBox: function () {
    $("input.fuzzycheck").attr("checked", "checked");
  },


  /* Unchecks the current unit's fuzzy checkbox */
  undoFuzzyBox: function () {
    $("input.fuzzycheck").removeAttr("checked");
  },


  /* Sets the current unit status as fuzzy (both styling and checkbox) */
  goFuzzy: function () {
    if (!this.isFuzzy()) {
      this.keepState = true;
      this.doFuzzyArea();
      this.doFuzzyBox();
    }
  },


  /* Unsets the current unit status as fuzzy (both styling and checkbox) */
  ungoFuzzy: function () {
    if (this.isFuzzy()) {
      this.keepState = true;
      this.undoFuzzyArea();
      this.undoFuzzyBox();
    }
  },


  /* Returns whether the current unit is fuzzy or not */
  isFuzzy: function () {
    return $("input.fuzzycheck").attr("checked");
  },


  /*
   * Suggest / submit mode functions
   */

  /* Changes the editor into suggest mode */
  doSuggestMode: function () {
    $("div.table-trad").addClass("suggest-mode");
  },


  /* Changes the editor into submit mode */
  undoSuggestMode: function () {
    $("div.table-trad").removeClass("suggest-mode");
  },


  /* Returns true if the editor is in suggest mode */
  isSuggestMode: function () {
    return $("div.table-trad").hasClass("suggest-mode");
  },


  /* Toggles suggest/submit modes */
  toggleSuggestMode: function () {
    if (this.isSuggestMode()) {
      this.undoSuggestMode();
    } else {
      this.doSuggestMode();
    }
  },

  updateExportLink: function () {
    var unit = this.units.getCurrent(),
        store = unit.get('store'),
        urlStr = [
          '', store.get('target_lang'), store.get('project_code'),
          'export-view', this.resourcePath
        ].join('/');

    urlStr = [urlStr, $.param(this.getReqData())].join('?');
    var exportLink = [
          '<a href="', l(urlStr), '">', gettext('Export View'), '</a>'
        ].join('');

    // $("#js-editor-export").html(exportLink);
  },

  /*
   * Indicators, messages, error handling
   */

  showActivity: function (force) {
    this.hideMsg();
    $("#js-editor-act").spin().fadeIn(300);
  },

  hideActivity: function () {
    $("#js-editor-act").spin(false).fadeOut(300);
  },

  /* Displays an informative message */
  displayMsg: function (msg) {
    this.hideActivity();
    $("#js-editor-msg").show().find("span").html(msg).fadeIn(300);
  },

  hideMsg: function (msg) {
    if ($("#js-editor-msg").is(":visible")) {
      $("#js-editor-msg").fadeOut(300);
    }
  },

  /* Displays error messages on top of the toolbar */
  displayError: function (msg) {
    if (msg) {
      this.hideActivity();
      $("#js-editor-error span").text(msg).parent().parent().stop(true, true)
                                .fadeIn(300).delay(2000).fadeOut(3500);
    }
    var spellchecker = $('.spellchecker');
    if (spellchecker.length) {
      $(spellchecker).caret(0, 0);
    }
  },


  /* Handles XHR errors */
  error: function (xhr, s) {
    var msg = "";

    if (s == "abort") {
        return;
    }

    if (xhr.status === 0) {
      msg = gettext("Error while connecting to the server");
    } else if (xhr.status === 500) {
      msg = gettext("Server error");
    } else if (s == "timeout") {
      msg = gettext("The server seems down. Try again later.");
    } else {
      // Since we use jquery-jsonp, we must differentiate between
      // the passed arguments
      if (xhr.hasOwnProperty('responseText')) {
        msg = $.parseJSON(xhr.responseText).msg;
      } else {
        msg = gettext("Unknown error");
      }
    }

    PTL.editor.stopAutomaticTranslation();

    PTL.editor.displayError(msg);
  },


  /*
   * Misc functions
   */

  /* Gets common request data */
  getReqData: function () {
    var reqData = {};

    switch (this.filter) {

      case "checks":
        reqData.filter = this.filter;
        if (this.checks.length) {
          reqData.checks = this.checks.join(",");
        }
        break;

      case "search":
        reqData.search = this.searchText;
        reqData.sfields = this.searchFields;
        reqData.soptions = this.searchOptions;
        break;

      case "all":
        break;

      default:
        reqData.filter = this.filter;
        break;
    }

    switch (this.order) {
      default:
        reqData.order = this.order;
        break;
    }

    if (this.user) {
      reqData.user = this.user;
    }

    if (this.goal) {
      reqData.goal = this.goal;
    }

    return reqData;
  },


  /*
   * Unit navigation, display, submission
   */

  /* Gets the view units that refer to the current page */
  getViewUnits: function (opts) {
    var extraData, reqData,
        defaults = {async: false, page: this.pager.current,
                    pager: false, withUid: 0},
        viewUrl = l('/xhr/units/');
    // Merge passed arguments with defaults
    opts = $.extend({}, defaults, opts);

    extraData = {
      page: opts.page,
      path: this.settings.pootlePath
    };
    if (opts.pager) {
      extraData.pager = opts.pager;
    }
    if (opts.withUid > 0) {
      extraData.uid = opts.withUid;
      // We don't know the page number beforehand —
      // delete the parameter as it's useless
      delete extraData.page;
    }
    reqData = $.extend(extraData, this.getReqData());

    $.ajax({
      url: viewUrl,
      data: reqData,
      dataType: 'json',
      async: opts.async,
      success: function (data) {
        // Receive pager in case we have asked for it
        if (opts.pager && data.pager) {
          // FIXME: can we get rid of this, please?
          PTL.editor.hasResults = true;

          // Clear old data and add new results
          PTL.editor.pagesGot = {};
          PTL.editor.units.reset();
          PTL.editor.pager = data.pager;
        }

        // Store view units in the client
        if (data.unit_groups.length) {
          // Determine in which page we want to save units, as we may not
          // have specified it in the GET parameters — in that case, the
          // page number is specified within the response pager
          var page;
          if (data.pager) {
            page = data.pager.current;
          } else {
            page = opts.page;
          }

          PTL.editor.pagesGot[page] = [];

          // Calculate where to insert the new set of units
          var pages = $.map(PTL.editor.pagesGot, function (value, key) {
                return parseInt(key, 10);
              }).sort(PTL.utils.numberCmp),
              pageIndex = pages.indexOf(page),
              at = PTL.editor.pager.perPage * pageIndex;

          // FIXME: can we avoid this?
          var urlStr = [
            PTL.editor.settings.ctxPath, 'translate/',
            PTL.editor.settings.resourcePath, '#unit='
          ].join('');

          var i, j, unit, unitGroup;
          for (i = 0; i < data.unit_groups.length; i++) {
            unitGroup = data.unit_groups[i];
            $.each(unitGroup, function (pootlePath, group) {
              var storeData = $.extend({pootlePath: pootlePath}, group.meta),
                  units = _.map(group.units, function (unit) {
                    return $.extend(unit, {store: storeData});
                  });
              PTL.editor.units.set(units, {at: at, remove: false});
              at += group.units.length;

              // FIXME: can we avoid this?
              for (j=0; j<group.units.length; j++) {
                unit = PTL.editor.units.get(group.units[j].id);
                unit.set('url', l(urlStr + unit.id));

                PTL.editor.pagesGot[page].push(unit.id);
              }
            });
          }

          if (opts.withUid) {
            PTL.editor.units.setCurrent(opts.withUid);
          } else if (data.pager) {
            var firstInPage = PTL.editor.pagesGot[data.pager.current][0];
            PTL.editor.units.setCurrent(firstInPage);
          }

          PTL.editor.hasResults = true;
        } else {
          PTL.editor.hasResults = false;
          $("div.table-trad").trigger("noResults");
        }
      },
      error: PTL.editor.error
    });
  },


  /* Builds a single row */
  buildRow: function (unit, cls, editor_widget) {
    var unit_obj = unit.toJSON();
    var current_unit = this.units.getCurrent();
    var active = '';

    if (current_unit === unit)
      active = ' active';

    function getSpanStatus() {
      if (unit_obj.target[0] && unit_obj.target[0].length > 0){
        return "is-ok";
      } else {
        return "not-ok";
      }
    }
    var status = $('#row'+unit.id).find('.is-status')
    status.find('.status').remove();
    status.append('<span class="status ' +getSpanStatus() +'"></span>')

    return [
      '<div class="tt-row-block', active, '" id="row', unit.id, '">',
      '<div class="ttr-cel is-notif"><span class="notifs is-two">N</span>',
      '</div><div class="ttr-cel is-id"><span>', unit_obj.relative_id, '</span></div>',
      editor_widget(unit),
      '</div>'
    ].join('');
  },

  /* Builds the editor rows */
  buildRows: function () {
    var unitGroups = this.getUnitGroups(),
        groupSize = _.size(unitGroups),
        currentUnit = this.units.getCurrent(),
        cls = "even",
        even = true,
        rows = [],
        vm = this,
        i, unit;


    function renderer(unit) {
      return vm.tmpl.vUnit({ unit: unit.toJSON() });
    }

    _.each(unitGroups, function (unitGroup) {
      for (i=0; i<unitGroup.length; i++) {
        unit = unitGroup[i];

        if (unit.id === currentUnit.id && !PTL.editor.settings.review) {
          rows.push(this.getEditUnit());
        } else {
          rows.push(this.buildRow(unit, cls, renderer));
        }

        cls = even ? "odd" : "even";
        even = !even;
      }
    }, this);
    return rows.join('');
  },


  /* Builds context rows for units passed as 'units' */
  buildCtxRows: function (units, extraCls) {
    var i, unit,
        currentUnit = this.units.getCurrent(),
        cls = "even",
        even = true,
        rows = "",
        urlStr = [
          PTL.editor.settings.ctxPath, 'translate/',
          PTL.editor.settings.resourcePath, '#unit='
        ].join('');

    for (i=0; i<units.length; i++) {
      // FIXME: Please let's use proper models for context units
      unit = units[i];
      unit['url'] = l(urlStr + unit.id);
      unit = $.extend({}, currentUnit.toJSON(), unit);

      rows += '<tr id="ctx' + unit.id + '" class="ctx-row ' + extraCls +
              ' ' + cls + '">';
      rows += this.tmpl.vUnit({unit: unit});
      rows += '</tr>';

      cls = even ? "odd" : "even";
      even = !even;
    }

    return rows;
  },


  /* Returns the unit groups for the current editor state */
  getUnitGroups: function () {
    var limit = parseInt(((this.pager.perPage - 1) / 2), 10),
        unitCount = this.units.length,
        currentUnit = this.units.getCurrent(),
        curIndex = this.units.indexOf(currentUnit),
        begin = curIndex - limit,
        end = curIndex + 1 + limit;

    if (begin < 0) {
      end = end + -begin;
      begin = 0;
    } else if (end > unitCount) {
      if (begin > end - unitCount) {
        begin = begin + -(end - unitCount);
      } else {
        begin = 0;
      }
      end = unitCount;
    }

    return _.groupBy(this.units.slice(begin, end), function (unit) {
      return unit.get('store').get('pootlePath');
    }, this);
  },

  /*
    Tags
  */

  tagCode: function(tag_number) {
    return PTL.editor.tagElementCode(tag_number).outerHTML;
  },

  // this function converts tags in spellcheckers text and remembers theirs positions
  hlTags: function(text, indexed_tags) {
    if (!indexed_tags.length) {
      return text;
    }

    var highlighted_text = '';
    var remaining_text = text;

    for (i = 0; i < indexed_tags.length; ++i) {
      var replacement_text = PTL.editor.tagCode(i+1);
      var tag = indexed_tags[i];
      var start = remaining_text.indexOf(tag);

      if (start < 0) {
        break;
      }
      var end = start + tag.length;

      highlighted_text = highlighted_text + remaining_text.slice(0, start) + replacement_text;
      remaining_text = remaining_text.substr(end);
    }
    return highlighted_text + remaining_text;
  },

  // replaces tags back to normal view
  reverseTags: function() {
    submap = {
      '<': '&lt;',
      '>': '&gt;',
      '&amp;': '&'
    };

    var original_tags = $('.active .translation-text .tag-number');
    var original_tags_codes = [];
    original_tags.each(function(index, unit) {
      tag_number = PTL.editor.tagNumber($(unit));
      var tag_code = $(unit).attr('title');
      if (!tag_code) {
        tag_code = $(unit).attr('original-title');
      }
      for (var key in submap){
        tag_code = tag_code.replace(submap[key], key);
      }
      original_tags_codes[tag_number] = tag_code;
    });

    PTL.editor.removeAllTagsGroup( $('.spellchecker-copy') );

    var html = $('.spellchecker-copy').text();
    $('.spellchecker-copy .tag-number').each(function(index, unit) {
      tag_number = PTL.editor.tagNumber($(unit));
      tag_origin_code = original_tags_codes[tag_number];
      $(unit).text(tag_origin_code);
    });
  },

  getCaretPosition: function(element) {
      var caretOffset = 0;
      if (typeof window.getSelection != 'undefined') {
          var range = window.getSelection().getRangeAt(0);
          var preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(element);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          caretOffset = preCaretRange.toString().length;
      } else if (typeof document.selection != 'undefined' && document.selection.type != 'Control') {
          var textRange = document.selection.createRange();
          var preCaretTextRange = document.body.createTextRange();
          preCaretTextRange.moveToElementText(element);
          preCaretTextRange.setEndPoint('EndToEnd', textRange);
          caretOffset = preCaretTextRange.text.length;
      }
      return caretOffset;
  },

  placeCaretAtEnd: function(el) {
    el.focus();
    if (typeof window.getSelection != 'undefined' &&
          typeof document.createRange != 'undefined') {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != 'undefined') {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
  },

  tagNumber: function(tag) {
    return parseInt(tag.text(), 10);
  },

  nextTranslationTag: function() {
    var original_tags_count = $('.active .translation-text .tag-number').length;
    var translation_tags = $('.spellchecker .tag-number');
    if (PTL.editor.isAllTags()) {
      return null;
    }
    var translation_numbers = [];
    translation_tags.each(function (index, unit) {
      translation_numbers.push(PTL.editor.tagNumber($(unit)));
    });
    for (var i = 1; i < original_tags_count + 1; ++i) {
      if (translation_numbers.indexOf(i) == -1) {
        return i;
      }
    }
    return null;
  },

  tagElementCode: function(tag_number) {
    var t = document.createElement('span');
    t.innerHTML = tag_number;
    t.setAttribute('class', 'tag_number_'+tag_number+' highlight-html tag-number');
    t.setAttribute('bounce', 'south');
    //t.setAttribute('style', 'display: inline !important;');
    t.setAttribute('draggable', 'true');
    t.setAttribute('contenteditable', 'false');
    return t;
  },

  getTagGroupElement: function() {
      return $('<span>', {
          'class': 'highlight-html tag-group',
          'bounce': 'south',
          'contenteditable': false
      })
          .attr('draggable', true);
  },

  addTranslationTag: function() {
    var translationarea = $('textarea.translation-area');
    var spellchecker = $('.spellchecker');

    function setCaretCharIndex(containerEl, index) {
        /* Some cases
        1. Searching in Type node 3
        qwe|[1]rty
        qwe|[1]=rty
        qwe|[1]=Vrty

        2. The first charachter. Finishing in NodeType == 1 SPAN
        |qwerty

        3. After [tag]
        */
        var charIndex = 0, stop = {};
        var finish = false;
        var finished = false;
        var traversed_node = null;

        function insertWS(node) {

          var range = rangy.createRange();
          range.selectNodeContents(node);
          var sel = rangy.getSelection();
          sel.setSingleRange(range);

          //w = document.createTextNode('');
          //var sel = rangy.getSelection();
          //var range = sel.getRangeAt(0);
          range.collapseAfter(node);
          //range.insertNode(w);
          //range.collapseAfter(w);
          //range.collapseAfter(node);
          sel.setSingleRange(range);
        }

        function traverseNodes(node) {
            if (node.nodeType == 3) {
                var nextCharIndex = charIndex + node.length;
                if (index >= charIndex && index <= nextCharIndex) {
                    //rangy.getSelection().collapse(node, index - charIndex);
                    finish = true;
                    traversed_node = node;
                }
                charIndex = nextCharIndex;
            }
            // Count an empty element as a single character. The list below may not be exhaustive.
            else if (node.nodeType == 1 && /^(span)$/i.test(node.nodeName)) {
                charIndex += 1;
                if (finish || (charIndex >= index)) {
                  insertWS(node);
                  finished = true;
                  throw stop;
                }
            } else {
                var child = node.firstChild;
                while (child) {
                    traverseNodes(child);
                    child = child.nextSibling;
                }
            }
        }

        try {
            traverseNodes(containerEl);
        } catch (ex) {
            if (ex != stop) {
                throw ex;
            }
        }
    }

    function getCaretCharacterOffsetWithin(element) {
      var caretOffset = 0;
      var sel = rangy.getSelection();
      if (sel.rangeCount) {
          var range = sel.getRangeAt(0);
          var preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(element);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          caretOffset = preCaretRange.toString().length;
      }
      return caretOffset;
    }

    tag_number = PTL.editor.nextTranslationTag();
    if (tag_number) {
      pos = getCaretCharacterOffsetWithin(spellchecker[0]);
      var sel = rangy.getSelection();
      var range = sel.getRangeAt(0);
      range.insertNode(PTL.editor.tagElementCode(tag_number));
      setCaretCharIndex(spellchecker[0], pos+1);

      PTL.editor.bindDraggables($('.spellchecker .tag-number'));
      PTL.editor.groupTags();

      if (PTL.editor.isAllTags()) {
        $('.tag-error')
            .text('')
            .css('display', 'none');
      }
      return true;
    }
    return false;
  },

  isAllTags: function() {
    var original_tags_count = $('.active .translation-text .tag-number').length;
    var translation_tag_count = $('.spellchecker .tag-number').length;
    return (translation_tag_count == original_tags_count);
  },

  groupTags: function() {
      var isCurrentIsTag,
          isNextIsTag,
          isCurrentIsGroup,
          isNextIsGroup,
          $current,
          $next,
          group = [],
          spellcheckerContent = $('.spellchecker').contents(),
          contentLength = spellcheckerContent.length;

      for (var i = 0; i < contentLength - 1; i++) {
          $current = $(spellcheckerContent[i]);
          $next = $(spellcheckerContent[i + 1]);

          isCurrentIsTag = $current.is('.tag-number');
          isNextIsTag = $next.is('.tag-number');

          isCurrentIsGroup = $current.is('.tag-group');
          isNextIsGroup = $next.is('.tag-group');

          if (isCurrentIsTag && isNextIsTag) {
              group.push($current[0]);
              group.push($next[0]);
          } else if (isCurrentIsGroup && isNextIsTag) {
              group.push.apply( group, PTL.editor.removeTagsGroup($current).toArray() );
              group.push($next[0]);
          } else if (isCurrentIsTag && isNextIsGroup) {
              group.push($current[0]);
              group.push.apply( group, PTL.editor.removeTagsGroup($next).toArray() );
          } else if (isCurrentIsGroup && isNextIsGroup) {
              group.push.apply( group, PTL.editor.removeTagsGroup($current).toArray() );
              group.push.apply( group, PTL.editor.removeTagsGroup($next).toArray() );
          } else if (group.length) {
              processGroup(group);
              group = [];
          }

      }

      // Process last elements in spellcheckerContent,
      // as it won't be called on last turn in loop
      if (group.length) {
          processGroup(group);
      }

      function processGroup(group) {
          var $wrapper,
              $groupElems;

          $wrapper = $(PTL.editor.getTagGroupElement());
          $groupElems = $(group);

          $groupElems
              .wrapAll($wrapper)
              .hide();

          $wrapper = $groupElems.parent();
          PTL.editor.setTagGroupText($wrapper);
          PTL.editor.bindDragAndDropForTagGroups();

          $('.tipsy').remove();
      }

  },

  setTagGroupText: function($group) {
      var tagNumber,
          prevTagNumber,
          maxTagNumber,
          minTagNumber,
          groupName,
          $children = $group.children(),
          isTagsOrdered = true,
          groupNumbers = [],
          groupPopup = [],
          groupNameNode = $group.contents()[0];

      $.each($children, function(i, v) {
          tagNumber = parseInt($(this).text(), 10);

          if (isTagsOrdered) {
              isTagsOrdered = i === 0 || tagNumber >= prevTagNumber;
              prevTagNumber = tagNumber;
          }

          groupNumbers.push(tagNumber);
          groupPopup.push('[' + tagNumber + ']');
      });

      maxTagNumber = Math.max.apply(null, groupNumbers)
      minTagNumber = Math.min.apply(null, groupNumbers)

      if (isTagsOrdered) {
          groupName = minTagNumber + '-' + maxTagNumber;
      } else {
          groupName = minTagNumber + '..' + maxTagNumber;
      }

      if (groupNameNode.nodeType === 3) {
          groupNameNode.textContent = groupName;
      } else {
          $group.prepend( document.createTextNode(groupName) );
      }

      $group.attr('original-title', groupPopup.join(' '));
  },

  removeTagsGroup: function($group) {
      var groupNameNode = $group.contents()[0];

      $('.tipsy').remove();

      if (groupNameNode.nodeType === 3) {
          $(groupNameNode).remove();
      }

      $group.children().show()
      return $group.contents().unwrap();
  },

  removeAllTagsGroup: function($wrapper) {
      $.each( $wrapper.find('.tag-group'), function() {
          PTL.editor.removeTagsGroup( $(this) );
      });
  },

  MTTranslates: function(){
    var backends = [];
    if (!PTL.editor.settings.review) {
      $(PTL.editor.settings.mt).each(function (index, element) {
        backends.push(element.name)
      });
    }
    for (var i=0; i<backends.length; i++) {
      var back = backends[i];
      if (PTL.editor.mt[back]) {
        PTL.editor.mt[back].translate(back);
        tuneSizes();
      }
    }
  },

  /* Sets the edit view for the current active unit */
  displayEditUnit: function () {
    if (PTL.editor.hasResults) {
      // Fetch pages asynchronously — we already have the needed pages
      // so this will return units whenever it can
      this.fetchPages();

      // Hide any visible message
      this.hideMsg();

      this.reDraw(this.buildRows());

      // Unescape titles
      $('.translation-text').each(function() {
        var $el = $(this);
        var title = $el.attr('title');
        if (title) {
          $el.attr('title', PTL.utils.escapeHtml(title));
        }
      });

      // Don't disable buttons so user see he reached first/last page.
      // Buttons may be disabled when design shows how disabled button should look like.
      // this.updateNavButtons(uids.before.length, uids.after.length);
      // add spellchecker
      var unit = this.units.getCurrent(),
          store = unit.get('store');

      var translationarea = $('textarea.translation-area');
      translationarea.spellchecker({
        spellcheck_url: '/spellcheck/' + store.get('target_lang') + '/'
      });
      var spellchecker = translationarea.siblings('.spellchecker');
      spellchecker.wrap($('<div class="spellchecker-wrapper"></div>'));
      spellchecker.html(translationarea.val());

      if (window.GROUP_TAGS) {
          PTL.editor.groupTags();
      }

      var $api_disable = $('a.api-disable');
        $api_disable.on('click', function(e) {
          $.ajax({
            type: 'POST',
            url: $(this).attr('href'),
            async: false,
            data: {'api': $(this).attr('api')}
          });
          location.reload(true);
          return false;
        });

      spellchecker.on('dragover', function (e) {
        e.preventDefault();
        return false;
      });

      if (PTL.editor.settings.review) {
        $('.active').removeClass('active');
        $('.is-amagama, .is-search').hide();
      }

      spellchecker.on('drop', function(e) {
        e.preventDefault();
        e = e.originalEvent;
        var content = e.dataTransfer.getData('text/html');
        var range = null;
        if (document.caretRangeFromPoint) { // Chrome
            range = document.caretRangeFromPoint(e.clientX, e.clientY);
        }
        else if (e.rangeParent) { // Firefox
            range = document.createRange();
            range.setStart(e.rangeParent, e.rangeOffset);
        }
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);

        spellchecker.get(0).focus(); // essential
        document.execCommand('insertHTML',false, content);

        sel.removeAllRanges();
        PTL.editor.bindDraggables($('.spellchecker .tag-number'));
        PTL.editor.bindDragAndDropForTagGroups();

        $('.tipsy').remove();
        $('.dragged').remove();
      });

      PTL.editor.bindDraggables($('.spellchecker .tag-number'));
      PTL.editor.bindDragAndDropForTagGroups();

      translationarea.focus(function(){$(this).siblings('spellcheck').focus();});
      PTL.editor.triggers.segment_ready = true;
      $(document).trigger('segment_ready');
      $('.is-original').css({'max-width': $(window).width()*0.4+'px'});
      PTL.editor.scrollToSegment();
    }
  },

  scrollToSegment: function() {
    var spellChecker = $('.spellchecker');
    if (spellChecker.length) {
      $(spellChecker).caret(0, 0);
    }
    var top = 0;
    var offset_obj = $('.is-workspace .tl-item');
    if (offset_obj.length) {
      top = $(offset_obj).first().offset().top;
    }
    $('body').animate({scrollTop: top-100}, 200,
      function() { $('body').scrollTop(0); });
  },

  /* reDraws the translate table rows */
  reDraw: function (newTbody) {
    var tTable = $('.table-trad'),
        oldRows = $('div.tt-row-block', tTable);

    $(tTable).removeClass('first-active').removeClass('second-active').css('padding-top', '');
    $('span.first-step').remove();
    $('div.last-step').remove();
    oldRows.remove();

    // This fixes the issue with tipsy popups staying on the screen
    // if their owner elements have been removed
    $('.tipsy').remove(); // kill all open tipsy popups

    if (newTbody !== false) {
      tTable.append(newTbody);
      $('.is-amagama').css('display', 'none');

      // We are ready, call the ready handlers
      $(tTable).trigger("editor_ready");
    }
    var newRows = $('div.tt-row-block', tTable);
    if ($(newRows[0]).hasClass('active')) {
      $(tTable).addClass('first-active');
      $(tTable).append('<span class="first-step">Press ⇥ TAB to validate segment</span>');
    } else if ($(newRows[newRows.length - 1]).hasClass('active')) {
       $(tTable).addClass('last-active');
       $(tTable).append(
           "<div class='last-step edit'>That's all folks !<br>" +
             "<div class='some-button'><a href=''>Download file</a></div>" +
           "</div>"
       );
       $(tTable).css('padding-top', '18px');
    } else if ($(newRows[1]).hasClass('active')) {
        if ($(newRows[0]).height() < 54){
          $(tTable).addClass('second-active');
        } else {
          var top = $('.is-search').height();
          top = (top > $(newRows[0]).height()) ? (top - $(newRows[0]).height()) : 0;
          $(tTable).css('padding-top', top + 'px');
        }
    } else {
      var active = this.activeRow(newRows);
      if (active) {
        var sum_height = this.upperRowsHeight(active, newRows);
        if ($('.is-search').height() > sum_height) {
          $(tTable).css('padding-top', $('.is-search').height() - sum_height + 'px');
        }
      }
    }
  },

  activeRow: function(newRows) {
    return $(newRows).index($('.active'));
  } ,

  upperRowsHeight: function(index, newRows) {
    var height = 0;
    for (i = 0; i < index; i++) {
      height += $(newRows[i]).height();
    }
    return height;
  },

  /* Updates a button in `selector` to the `disable` state */
// updateNavButton: function (selector, disable) {
//     return; // this is not used for the time being
//
//     var $el = $(selector);
//
//     // Avoid unnecessary actions
//     if ($el.is(':disabled') && disable || $el.is(':enabled') && !disable) {
//       return;
//     }
//
//     if (disable) {
//       $el.data('title', $el.attr('title'));
//       $el.removeAttr('title');
//     } else {
//       $el.attr('title', $el.data('title'));
//     }
//     $el.prop('disabled', disable);
//   },


  /* Updates previous/next navigation button states */
  // updateNavButtons: function () {
  //   this.updateNavButton('#js-nav-prev', !this.units.hasPrev());
  //   this.updateNavButton('#js-nav-next', !this.units.hasNext());
  // },


  /* Fetches more view unit pages in case they're needed */
  fetchPages: function (opts) {
    var defaults = {
          async: true,
          page: this.pager.current
        };

    opts = $.extend({}, defaults, opts);

    var current = opts.page,
        candidates = [current, current + 1, current - 1],
        pages = [],
        i;

    // We will only fetch valid pages and pages that haven't
    // already been fetched
    for (i=0; i<candidates.length; i++) {
      if (candidates[i] <= this.pager.numPages &&
          candidates[i] > 0 &&
          !(candidates[i] in this.pagesGot)) {
        pages.push(candidates[i]);
      }
    }

    // Do the actual fetching
    for (i=0; i<pages.length; i++) {
      this.getViewUnits({async: opts.async, page: pages[i]});
    }
  },

  /* Updates the pager */
  updatePager: function () {
    return; // Not used TODO: Clean this out

    /*var pager = this.pager;

    $("#items-count").text(pager.count);

    var currentUnit = PTL.editor.units.getCurrent();
    if (currentUnit !== undefined) {
      // Calculate the global index number for the current unit.
      // Note that we can't just use `indexOf(currentUnit)` in the
      // collection because we don't load the entire collection at once
      var uId = currentUnit.id,
          uIndexInPage = PTL.editor.pagesGot[pager.current].indexOf(uId) + 1,
          uIndex = (pager.current - 1) * pager.perPage + uIndexInPage;
      $("#item-number").val(uIndex);
    }*/
  },

  /* Creates a pager based on the current client data and the given uid */
  createPager: function (uid) {
    var newPager = this.pager;
    // In case the given uid is not within the current page,
    // calculate in which page it is
    if ($.inArray(uid, this.pagesGot[this.pager.current]) == -1) {
      var newPageNumber,
          i = this.pager.current,
          j = this.pager.current + 1,
          found = false;
      // Search uid within the pages the client knows of
      while (!found && (i > 0 || j <= this.pager.numPages)) {
        if (i > 0 && $.inArray(uid, this.pagesGot[i]) != -1) {
          newPageNumber = i;
          found = true;
        } else if ($.inArray(uid, this.pagesGot[j]) != -1) {
          newPageNumber = j;
          found = true;
        }

        i--;
        j++;
      }

      if (found) {
        newPager.current = newPageNumber;
      }
    }

    return newPager;
  },

  getTagsIndexes: function(text) {
     var text_tags = text.match(PTL.editor.tagsRE);
     if (text_tags === null)
         text_tags = [];
    return text_tags;
  },

  getMissedTags: function(orig_text, translated_text) {
     // build array with tags
     // mark all of them as 'missed'
     var missed_tags = PTL.editor.getTagsIndexes(orig_text);

     // iterate over translated text and remove one by one tags from
     // missed tags
     var translated_text_tags = translated_text.match(this.tagsRE);
     if (!translated_text_tags)
       translated_text_tags = [];

     translated_text_tags.forEach(function (tag_name) {
         var tag_index = missed_tags.indexOf(tag_name);
         if (tag_index >= 0) {
             missed_tags[tag_index] = null;
         }
     });

     var missed_tags_indexes = [];
     for (var i=0; i < missed_tags.length; ++i) {
         if (missed_tags[i]) {
             missed_tags_indexes.push(i + 1);
         }
     }
     return missed_tags_indexes;
  },

  is_unit_locked: false,

  /* Loads the edit unit for the current active unit */
  getEditUnit: function () {
    var editUnit, editCtxRowBefore, editCtxRowAfter, editCtxWidgets, hasData,
        eClass = "edit-row",
        currentUnit = this.units.getCurrent(),
        uid = currentUnit.id,
        editUrl = l(['/xhr/units/', uid, '/edit/'].join('')),
        reqData = this.getReqData(),
        widget = '',
        ctx = {before: [], after: []},
        unitIsLocked = false,
        lock_message = "";

    $.ajax({
      url: editUrl,
      async: false,
      data: reqData,
      dataType: 'json',
      success: function (data) {
        var widget_obj = $(data['editor']); // rendered edit.html
        var translation_text = currentUnit.get('source').toString();
        var translation = widget_obj.find('.translation-text');
        var translated_text = currentUnit.get('target').toString();
        var translated = widget_obj.find('.translation-area');
        var missed_tags = PTL.editor.getMissedTags(
          translation_text, translated_text);
        var tags_indexes = PTL.editor.getTagsIndexes(translation_text);

        translation.html(PTL.utils.fancyHl(translation_text));

        // highlight tags in the translated text
        var hl_text = PTL.editor.hlTags(translated_text, tags_indexes).trim();
        translated.text(hl_text);

        widget = widget_obj.html();

        unitIsLocked = data['is_locked'];
        PTL.editor.is_unit_locked = unitIsLocked;
        lock_message = data['message'];

        // Update pager in case it's needed
        PTL.editor.pager = PTL.editor.createPager(uid);
        PTL.editor.updatePager();

        if (data.ctx) {
          // Initialize context gap to the maximum context rows available
          PTL.editor.ctxGap = Math.max(data.ctx.before.length,
              data.ctx.after.length);
          ctx.before = data.ctx.before;
          ctx.after = data.ctx.after;
        }
      },
      error: PTL.editor.error
    });

    if (this.lockUnitTimer) {
      clearTimeout(this.lockUnitTimer);
    }

    if (unitIsLocked) {
      this.checkUnitLockState(uid);
      this.styleLockedUnit(lock_message);
    } else {
      this.lockUnit(uid);
    }

    eClass += currentUnit.get('isfuzzy') ? " fuzzy-unit" : "";

    hasData = ctx.before.length || ctx.after.length;
    editCtxWidgets = this.editCtxUI({hasData: hasData});
    editCtxRowBefore = editCtxWidgets[0];
    editCtxRowAfter = editCtxWidgets[1];

    PTL.editor.selectMemory = '';
    setTimeout(function () { tuneSizes(); }, 300);

    return this.buildRow(currentUnit, 'current', function(unit) {
      return widget;
    });
  },

  /* autolock unit for some period */
  lockUnit: function (uid) {
    var lockUnitUrl = l(['/xhr/units/', uid, '/lock/'].join(''));
    $.ajax({
      url: lockUnitUrl,
      async: true,
      dataType: 'json'
    });
    PTL.editor.lockUnitTimer = setTimeout(function () {
      PTL.editor.lockUnit(uid);
    }, 16000);
  },

  // adds style and message to translation area when unit is locked
  styleLockedUnit: function (message) {
    $(".tr-form-table").css('display', 'none');
    if (!message) {
      message = 'Other user is translating this unit';
    }
    $(".locked-unit").css('display', 'block').text(message);
  },

  /* checks if unit is locked or unlocked */
  checkUnitLockState: function (uid) {
    var lockUnitUrl = l(['/xhr/units/', uid, '/lock/'].join(''));
    $.ajax({
      url: lockUnitUrl,
      async: true,
      dataType: 'json',
      success: function (data) {
        PTL.editor.is_unit_locked = data.is_locked;
        if (data.is_locked) {
          PTL.editor.lockUnitTimer = setTimeout(function () {
            PTL.editor.checkUnitLockState(uid);
          }, 5000);
          PTL.editor.styleLockedUnit(data['message']);
        } else {
          PTL.editor.displayEditUnit(uid);
        }
      }
    });
  },

  /* Pushes translation submissions and moves to the next unit */
  submit: function (e) {
    e.preventDefault();

    $('.tag-error').text('');
    $('.tag-error').css('display', 'none');

    var reqData, submitUrl, translations,
        unit = PTL.editor.units.getCurrent(),
        form = $("#captcha").ifExists() || $("#translate");

    submitUrl = l(['/xhr/units/', unit.id].join(''));

    // Serialize data to be sent and get required attributes for the request
    reqData = form.serializeObject();
    $.extend(reqData, PTL.editor.getReqData());

    // Clear lockUnit Timer
    clearTimeout(this.lockUnitTimer);
    clearTimeout(PTL.editor.autosubmitTimeout);

    $.ajax({
      url: submitUrl,
      type: 'POST',
      data: reqData,
      dataType: 'json',
      async: false,
      success: function (data) {
        if (data.captcha) {
          $.magnificPopup.open({
            items: {
              src: data.captcha,
              type: 'inline'
            },
            focus: '#id_captcha_answer'
          });
        } else {
          if (data.untranslated && data.percent) {
            $('#progressbar').css('width', data.percent+'%');
            $('#percent').text(data.percent+'%');
            $('#words').text(data.untranslated);
          }
          // remove old quality check messages

          $activeUnit = $('.tt-row-block.active');
          // add new quality check messages
          if (data.quality_messages) {
              var $errorAlert = $activeUnit.find('.error-alert'),
                  $trFormTable = $activeUnit.find('.tr-form-table'),
                  errorsText = data.quality_messages.join('. ') + '.';

              $activeUnit.find('span.status span.error-alert span.error-line').remove();
              $activeUnit.find('span.status span.error-alert span.error-alert').remove();
              $trFormTable.find('div.is-status').remove();


              if ($errorAlert.length) {
                  $errorAlert.text(errorsText);
              } else {
                  $trFormTable
                      .append('<span class="error-alert">' + errorsText + '</span>' +
                      '<div class="is-status">' +
                      '<span class="error-line"></span>' +
                      '<span class="status is-error"></span></div>'
                  );
              }
          }

          // FIXME: handle this via events
          translations = $('textarea[name^=target_f_]').map(function (i, el) {
            var val = $(el).val();
            return val;
          }).get();
          unit.setTranslation(translations);
          unit.set('isfuzzy', PTL.editor.isFuzzy());

          return false;
        }
      },
      error: PTL.editor.error
    });
  },

  /* Pushes translation suggestions and moves to the next unit */
  suggest: function (e) {
    e.preventDefault();

    var reqData, suggestUrl,
        uid = PTL.editor.units.getCurrent().id,
        form = $("#captcha").ifExists() || $("#translate");

    suggestUrl = l(['/xhr/units/', uid, '/suggestions/'].join(''));

    // Serialize data to be sent and get required attributes for the request
    reqData = form.serializeObject();
    $.extend(reqData, PTL.editor.getReqData());

    $.ajax({
      url: suggestUrl,
      type: 'POST',
      data: reqData,
      dataType: 'json',
      success: function (data) {
        if (data.captcha) {
          $.magnificPopup.open({
            items: {
              src: data.captcha,
              type: 'inline'
            },
            focus: '#id_captcha_answer'
          });
        } else {
          PTL.editor.gotoNext();
        }
      },
      error: PTL.editor.error
    });
  },


  /* Hide backdrop and stop automatic tranlation */
  stopAutomaticTranslation: function() {
      var unitIndex = PTL.editor.lastUnitIndexAutoTranslate;

      PTL.editor.isRunningAutoTranslate = false;
      $('body').css('overflow', '');
      $('.modal-backdrop').hide();

      if (unitIndex === undefined) {
          return;
      }

      // If it's not last segment then open segment right after translated
      if (unitIndex < PTL.editor.pager.count) {
          unitIndex++;
      }

      PTL.editor.gotoIndex(unitIndex);

      // Reset units, os it will load translations
      PTL.editor.units.reset();

      PTL.editor.lastUnitIndexAutoTranslate = undefined;
  },


  /* Translate all untranslated segments from opened file with provided backend */
  translateAllWithBackend: function(back) {
      var units,
          unitsLen,
          unitToTranslate,
          unitToTranslateID,
          store = PTL.editor.units.getCurrent().get('store'),
          langFrom = store.get('source_lang'),
          langTo = store.get('target_lang'),

          $backdropDiv = $('.modal-backdrop'),
          $progressbarSpan = $('#progressbar'),
          $percentSpan = $('#percent'),
          $wordsSpan = $('#words'),
          $progressbarBackSpan = $('#progressbar-backdrop'),
          $percentBackSpan = $('#percent-backdrop'),
          $wordsBackSpan = $('#words-backdrop');


      $('body').css('overflow', 'hidden');
      $backdropDiv.show();

      if (back === 'google') {
          $backdropDiv.find('h2').text('Translating all with Google ...');
      } else if (back === 'bing') {
          $backdropDiv.find('h2').text('Translating all with Bing ...');
      } else {
          return;
      }

      PTL.editor.isRunningAutoTranslate = true;

      $progressbarBackSpan.css('width', $progressbarSpan.css('width'));
      $percentBackSpan.text($percentSpan.text());
      $wordsBackSpan.text($wordsSpan.text());

      // Get data (like form data) for all untranslated units
      $.get('/xhr/units/get_all_units_data/', {'path': PTL.editor.settings.pootlePath})
          .done(function(data) {
              if (data.units_data) {
                  units = data.units_data;
                  unitsLen = data.units_data.length;

                  if (unitsLen) {
                      translateNextUnit();
                  } else {
                      PTL.editor.displayMsg('All segments have been translated.');
                      PTL.editor.stopAutomaticTranslation();
                  }

              }
          })
          .fail(PTL.editor.error);

      // Pick unit for translation and call backend translate
      function translateNextUnit() {
          if (!PTL.editor.isRunningAutoTranslate) {
              PTL.editor.stopAutomaticTranslation();
              return;
          }

          if (unitToTranslateID === unitsLen - 1) {
              PTL.editor.displayMsg('All segments have been translated.');
              PTL.editor.stopAutomaticTranslation();
              return;
          } else if (unitToTranslateID === undefined) {
              unitToTranslateID = 0;
          } else {
              unitToTranslateID++;
          }

          unitToTranslate = units[unitToTranslateID];

          if (PTL.editor.mt[back]) {
              PTL.editor.mt[back].translate(translateOneUnit);
          } else {
              PTL.editor.stopAutomaticTranslation();
          }
      }

      // Called by backend translate function. Get translation and call submit.
      function translateOneUnit(resultCallback) {
          var text = unitToTranslate.source_f_0,
              sourceText = PTL.editor.cleanSourceText(text);

          resultCallback(sourceText, langFrom, langTo, function(translation, message) {
              if (translation === false) {
                  PTL.editor.displayError(message);
                  return;
              }

              unitToTranslate.target_f_0 = PTL.editor.cleanTranslatedText(sourceText, translation);

              submitUnitData();
          })
      }

      function submitUnitData() {
          var url = l(['/xhr/units/', unitToTranslate.id].join(''));

          $.post(url, unitToTranslate)
              .done(function(data) {
                  if (data.captcha) {
                      PTL.editor.stopAutomaticTranslation();

                  } else if (data.untranslated && data.percent) {
                      $progressbarSpan.css('width', data.percent);
                      $percentSpan.text(data.percent + '%');
                      $wordsSpan.text(data.untranslated);

                      $progressbarBackSpan.css('width', data.percent);
                      $percentBackSpan.text(data.percent + '%');
                      $wordsBackSpan.text(data.untranslated);

                      PTL.editor.lastUnitIndexAutoTranslate = unitToTranslate.relative_id;
                      translateNextUnit();
                  }
              })
              .fail(PTL.editor.error);
      }

  },


  /* Loads the next unit */
  gotoNext: function () {
    // Buttons might be disabled so we need to fake an event
    PTL.editor.gotoPrevNext($.Event('click', {target: '#js-nav-next'}));
  },


  /* Loads the editor with the next unit */
  gotoPrevNext: function (e) {
    e.preventDefault();
    var prevNextMap = {'js-nav-prev': 'prev',
                       'js-nav-next': 'next'},
        elementId = e.target.id || $(e.target)[0].id,
        newUnit = PTL.editor.units[prevNextMap[elementId]]();

    // Try loading the prev/next unit
    if (newUnit) {
      if (SKIP_SEGMENT == 'True'){
        var new_collections = PTL.editor.units.toJSON();
        var unit_obj;

        for (i = 0; i < new_collections.length; i++) {
            if (new_collections[i].id >= newUnit.id){
              unit_obj = new_collections[i];
              var newHash = PTL.utils.updateHashPart("unit", new_collections[i].id);
              if (unit_obj.target[0] && unit_obj.target[0].length > 0) {
                $.history.load(newHash);
              } else {
                $.history.load(newHash);
                PTL.editor.scrollToSegment();
                return false;
              }
            }
        }
      } else{
        var newHash = PTL.utils.updateHashPart("unit", newUnit.id);
        $.history.load(newHash);
        PTL.editor.scrollToSegment();
      }
    } else {
      if (elementId === 'js-nav-prev') {
        PTL.editor.displayMsg(gettext("You reached the beginning of the list"));
      } else {
        PTL.editor.displayMsg(gettext("You reached the end of the list."));
      }
    }
  },


  /* Loads the editor with a specific unit */
  gotoUnit: function (e) {
    e.preventDefault();

    // Ctrl + click / Alt + click / Cmd + click / Middle click opens a new tab
    if (e.ctrlKey || e.altKey || e.metaKey || e.which === 2) {
      var $el = e.target.nodeName !== 'div' ?
                  $(e.target).parents('div') :
                  $(e.target);
      window.open($el.data('target'), '_blank');
      return;
    }

    // Don't load anything if we're just selecting text
    if (PTL.editor.getSelectedText() !== "") {
      return;
    }

    // Get clicked unit's uid from the row's id information and
    // try to load it
    var $this = $(this);
    if ($this.find('.is-workspace').length >= 1){
      //current unit is clicked
      return;
    }

    var m = this.id.match(/(row|ctx)([0-9]+)/);
    if (m) {
      var newHash,
          type = m[1],
          uid = parseInt(m[2], 10);
      if (type === 'row') {
        newHash = PTL.utils.updateHashPart("unit", uid);
      } else {
        newHash = ['unit=', encodeURIComponent(uid)].join('');
      }
      $.history.load(newHash);
    }
  },

  /* Loads the editor on a index */
  // FIXME: we probably want to retrieve sorted list of all the UIDs
  // affecting the current query, so we wouldn't need to do ugly things
  // to figure out the mapping between indexes and unit IDs
  gotoIndex: function (index) {
    if (index && !isNaN(index) && index > 0 &&
        index <= PTL.editor.pager.count) {
      var preceding = index - 1,
          page = parseInt(preceding / PTL.editor.pager.perPage + 1, 10) || 1,
          uIndexInPage = preceding % PTL.editor.pager.perPage,
          uId;

      if (!(page in PTL.editor.pagesGot)) {
        PTL.editor.fetchPages({async: false, page: page});
      }

      uId = PTL.editor.pagesGot[page][uIndexInPage];

      var newHash = PTL.utils.updateHashPart("unit", uId);
      $.history.load(newHash);
    }
  },

  /*
   * Units filtering
   */

  /* Gets the failing check options for the current query */
  getCheckOptions: function () {
    var checksUrl = l('/xhr/checks/'),
        reqData = {
          path: this.settings.pootlePath,
          goal: this.goal
        },
        opts;

    $.ajax({
      url: checksUrl,
      async: false,
      data: reqData,
      dataType: 'json',
      success: function (data) {
        opts = data;
      },
      error: PTL.editor.error
    });

    return opts;
  },

  /* Loads units based on checks filtering */
  filterChecks: function () {
    if (PTL.editor.preventNavigation) {
      return;
    }
    var filterBy = $("option:selected", this).val();

    if (filterBy != "none") {
      var newHash = "filter=checks&checks=" + encodeURIComponent(filterBy);
      if (PTL.editor.goal) {
        newHash += '&goal=' + PTL.editor.goal;
      }
      $.history.load(newHash);
    }
  },

  /* Loads units based on filtering */
  filterStatus: function () {
    // this function can be executed in different contexts,
    // so using the full selector here
    var $selected = $("#filter-status option:selected"),
        filterBy = $selected.val(),
        isUserFilter = $selected.data('user');

    // Filtering by failing checks
    if (filterBy == "checks") {
      // Get actual failing checks
      var optGroups = PTL.editor.getCheckOptions();

      // If there are any failing checks, add them in a dropdown
      if (optGroups.length) {
        var dropdown = [
        '<div id="filter-checks">',
          '<select id="js-select2-filter-checks" ',
          'class="select2-filter-checks" name="filter-checks">',
          '<option selected="selected" value="none">------</option>'
        ];

        $.each(optGroups, function () {
          dropdown.push([
            '<optgroup label="', this.display_name, '">'
          ].join(''));
          $.each(this.checks, function () {
            dropdown.push([
              '<option value="', this.name, '">', this.display_name,
              ' (', this.count, ')</option>'
            ].join(''));
          });
          dropdown.push('</optgroup>');
        });

        dropdown.push('</select></div>');

        $("#filter-status").first().after(dropdown.join(''));
        $("#js-select2-filter-checks").select2({
          width: "resolve"
        });
      } else { // No results
        PTL.editor.displayMsg(gettext("No results."));
        $('#filter-status select').select2('val', PTL.editor.filter);
      }
    } else { // Normal filtering options (untranslated, fuzzy...)
      $("#filter-checks").remove();
      if (!PTL.editor.preventNavigation) {
        var newHash = "filter=" + filterBy;
        if (PTL.editor.user && isUserFilter) {
          newHash += '&user=' + PTL.editor.user;
        } else {
          PTL.editor.user = null;
          $(".js-user-filter").remove();
        }
        if (PTL.editor.goal) {
          newHash += '&goal=' + PTL.editor.goal;
        }
        $.history.load(newHash);
      }
    }
  },

  orderItems: function() {
    window.showLoader();

    var orderBy = $('#order-items option:selected').val();
    var newHash = PTL.utils.updateHashPart('order', orderBy);
    $.history.load(newHash);
  },

  /* Generates the edit context rows' UI */
  editCtxUI: function (opts) {
    var defaults = {hasData: false, replace: false};
    opts = $.extend({}, defaults, opts);

    editCtxRowBefore = PTL.editor.tmpl.editCtx({hasData: opts.hasData,
                                                extraCls: 'before'});
    editCtxRowAfter = PTL.editor.tmpl.editCtx({hasData: opts.hasData,
                                               extraCls: 'after'});

    if (opts.replace) {
      $("tr.edit-ctx.before").replaceWith(editCtxRowBefore);
      $("tr.edit-ctx.after").replaceWith(editCtxRowAfter);
    }

    return [editCtxRowBefore, editCtxRowAfter];
  },

  /* Gets more context units */
  moreContext: function (initial) {
    var ctxUrl = l(['/xhr/units/', PTL.editor.units.getCurrent().id, '/context/'].join('')),
        reqData = {gap: PTL.editor.ctxGap};

    reqData.qty = initial ? PTL.editor.ctxQty : PTL.editor.ctxStep;

    // Don't waste a request if nothing is expected initially
    if (initial && reqData.qty === 0) {
      return;
    }

    $.ajax({
      url: ctxUrl,
      async: false,
      dataType: 'json',
      data: reqData,
      success: function (data) {
        if (data.ctx.before.length || data.ctx.after.length) {
          // As we now have got more context rows, increase its gap
          if (initial) {
            PTL.editor.ctxGap = Math.max(data.ctx.before.length,
                                         data.ctx.after.length);
          } else {
            PTL.editor.ctxGap += Math.max(data.ctx.before.length,
                                          data.ctx.after.length);
          }
          $.cookie('ctxQty', PTL.editor.ctxGap, {path: '/'});

          // Create context rows HTML
          var before = PTL.editor.buildCtxRows(data.ctx.before, "before"),
              after = PTL.editor.buildCtxRows(data.ctx.after, "after");

          // Append context rows to their respective places
          var editCtxRows = $("tr.edit-ctx");
          editCtxRows.first().after(before);
          editCtxRows.last().before(after);
        }
      },
      error: PTL.editor.error
    });
  },

  /* Shrinks context lines */
  lessContext: function () {

    var before = $(".ctx-row.before"),
        after = $(".ctx-row.after");

    // Make sure there are context rows before decreasing the gap and
    // removing any context rows
    if (before.length || after.length) {
      if (before.length === PTL.editor.ctxGap) {
        before.slice(0, PTL.editor.ctxStep).remove();
      }

      if (after.length === PTL.editor.ctxGap) {
        after.slice(-PTL.editor.ctxStep).remove();
      }

      PTL.editor.ctxGap -= PTL.editor.ctxStep;

      if (PTL.editor.ctxGap >= 0) {
        if (PTL.editor.ctxGap === 0) {
          PTL.editor.editCtxUI({hasData: false, replace: true});
          $.cookie('ctxShow', false, {path: '/'});
        }

        $.cookie('ctxQty', PTL.editor.ctxGap, {path: '/'});
      }
    }
  },

  /* Shows context rows */
  showContext: function () {

    var editCtxRowBefore, editCtxRowAfter,
        before = $(".ctx-row.before"),
        after = $(".ctx-row.after");

    if (before.length || after.length) {
      before.show();
      after.show();
    } else {
      PTL.editor.moreContext(true);
    }

    PTL.editor.editCtxUI({hasData: true, replace: true});
    $.cookie('ctxShow', true, {path: '/'});
  },

  /* Hides context rows */
  hideContext: function () {

    var editCtxRowBefore, editCtxRowAfter,
        before = $(".ctx-row.before"),
        after = $(".ctx-row.after");

    before.hide();
    after.hide();

    PTL.editor.editCtxUI({hasData: false, replace: true});
    $.cookie('ctxShow', false, {path: '/'});
  },


  /* Loads the search view */
  search: function (e) {
    e.preventDefault();

    window.showLoader();

    var newHash,
        text = $("#id_search").val();

    if (text) {
      var remember = true,
          queryString = PTL.search.buildSearchQuery(text, remember);
      newHash = "search=" + queryString;
    } else {
      newHash = PTL.utils.updateHashPart("filter", "all", ["search", "sfields","soptions"]);
    }
    if (PTL.editor.goal) {
      newHash += '&goal=' + PTL.editor.goal;
    }
    $.history.load(newHash);
  },


  /*
   * Comments
   */
  comment: function (e) {
    e.preventDefault();

    var url = $(this).attr('action'),
        reqData = $(this).serializeObject();

    $.ajax({
      url: url,
      type: 'POST',
      data: reqData,
      success: function (data) {
        $("#editor-comment").fadeOut(200);

        if ($("#translator-comment").length) {
          $(data.comment).hide().prependTo("#translator-comment").delay(200)
                         .animate({height: 'show'}, 1000, 'easeOutQuad');
        } else {
          var commentHtml = '<div id="translator-comment">' +
                            data.comment + '</div>';
          $(commentHtml).prependTo("#extras-container").delay(200)
                        .hide().animate({height: 'show'}, 1000, 'easeOutQuad');
        }

        PTL.common.updateRelativeDates();
      },
      error: PTL.editor.error
    });

    return false;
  },


  /*
   * Unit timeline
   */

  /* Get the timeline data */
  showTimeline: function (e) {
    e.preventDefault();

    // The results might already be there from earlier:
    if ($("#timeline-results").length) {
      $("#js-hide-timeline").show();
      $("#timeline-results").slideDown(1000, 'easeOutQuad');
      $("#js-show-timeline").hide();
      return;
    }

    var uid = PTL.editor.units.getCurrent().id,
        node = $("#extras-container"),
        timelineUrl = l(['/xhr/units/', uid, '/timeline/'].join(''));

    // Always abort previous requests so we only get results for the
    // current unit
    if (PTL.editor.timelineReq !== null) {
      PTL.editor.timelineReq.abort();
    }

    PTL.editor.timelineReq = $.ajax({
      url: timelineUrl,
      dataType: 'json',
      success: function (data) {
        var uid = data.uid;

        if (data.timeline && uid === PTL.editor.units.getCurrent().id) {
          if ($("#translator-comment").length) {
            $(data.timeline).hide().insertAfter("#translator-comment")
                            .slideDown(1000, 'easeOutQuad');
          } else {
            $(data.timeline).hide().prependTo("#extras-container")
                            .slideDown(1000, 'easeOutQuad');
          }

          PTL.common.updateRelativeDates();

          $('.timeline-field-body').filter(':not([dir])').bidi();
          $("#js-show-timeline").hide();
          $("#js-hide-timeline").show();
        }
      },
      beforeSend: function () {
        node.spin();
      },
      complete: function () {
        node.spin(false);
      },
      error: PTL.editor.error
    });
  },

 /* Hide the timeline panel */
  hideTimeline: function (e) {
    $("#js-hide-timeline").hide();
    $("#timeline-results").slideUp(1000, 'easeOutQuad');
    $("#js-show-timeline").show();
  },


  /*
   * User and TM suggestions
   */

  /* Filters TM results and does some processing (add diffs, extra texts...) */
  filterTMResults: function (results) {
    // FIXME: this just retrieves the first four results
    // we could limit based on a threshold too.
    var source = $("[id^=id_source_f_]").first().val(),
        filtered = [],
        quality;

    for (var i=0; i<results.length && i<3; i++) {
      results[i].source = this.doDiff(source, results[i].source);
      results[i].target = PTL.utils.fancyHl(results[i].target);
      quality = Math.round(results[i].quality);
      // Translators: This is the quality match percentage of a TM result.
      // '%s' will be replaced by a number, and you should keep the extra
      // '%' symbol to denote a percentage is being used.
      results[i].qTitle = interpolate(gettext('%s% match'), [quality]);
      filtered.push(results[i]);
    }

    return filtered;
  },


  /* Gets TM suggestions from amaGama */
  getTMUnits: function (sText) {
    if (PTL.editor.settings.review) {
      return;
    }
    var unit = this.units.getCurrent(),
        store = unit.get('store'),
        src = store.get('source_lang'),
        tgt = store.get('target_lang'),
        pStyle = store.get('project_style'),
        $el = $('.tt-row-block.active').find('.is-original').find('.translation-text');

    if (!sText) {
      sText = unit.get('source')[0];
    }
    sText = PTL.utils.cleanWhitespace(sText).trim();

    var tmUrl = this.settings.tmUrl + src + "/" + tgt +
          "/unit/?source=" + encodeURIComponent(sText) + "&jsoncallback=?";

    if (!sText.length) {
        // No use in looking up an empty string
        return;
    }

    if (pStyle.length && pStyle != "standard") {
        tmUrl += '&style=' + pStyle;
    }

    // Always abort previous requests so we only get results for the
    // current unit
    if (this.tmReq !== null) {
      this.tmReq.abort();
    }

    this.tmReq = $.jsonp({
      url: tmUrl,
      callback: '_jsonp' + PTL.editor.units.getCurrent().id,
      dataType: 'jsonp',
      cache: true,
      success: function (data) {
        if (data.length) {
          var $container = $('.is-amagama');
          $container.prepend('<div class="amagama-results"></div>');
          var $results_cont = $container.find('.amagama-results');
          $results_cont.empty();
          var count = Math.min(data.length, 3);
          for (var i = 0; i < count; i++) {
            var part = data[i];
            var $icon = $('<div/>');
            var $el = $('<div/>').addClass('bt-row js-editor-copytext amagama-unit');
            var $score = $('<div/>').addClass('btr-cell amagama-score')
              .html(parseInt(part['quality'], 10) + '%');
            var $text = $('<div/>').addClass('btr-cell btr-cell-unit').html(part['target']);
            $text.attr('title', 'Insert the translated term into the editor');
            $el.append($icon, $score, $text);
            $results_cont.append($el);
          }
        $container.fadeIn();
        tuneSizes();
        } else {
          PTL.editor.displayError('No suggestions found');
        }
      }
    });
  },


  /* Rejects a suggestion */
  rejectSuggestion: function (e) {
    e.stopPropagation(); //we don't want to trigger a click on the text below
    var suggId = $(this).data("sugg-id"),
        element = $("#suggestion-" + suggId);
        uid = $(this).data('uid');

    var url = l(['/xhr/units/', uid, '/suggestions/', suggId, '/reject/'].join(''));

    $.post(url, {'reject': 1},
      function (data) {
        element.fadeOut(200, function () {
          $(this).remove();

          // Go to the next unit if there are no more suggestions left
          if (!$("#suggestions div[id^=suggestion]").length) {
            PTL.editor.gotoNext();
          }
        });
      }, "json");
  },

  copyTerminology: function() {
    var text;
    if ($(this).hasClass('amagama-unit')) {
      text = $(this).find('.btr-cell').not('.amagama-score').text();
    } else {
      text = $(this).text();
    }
    var $textarea = $('.tt-row-block.active').find('.translation-area');
    var $scheck = $('.tt-row-block.active').find('.spellchecker');
    $textarea.val(text).focus();
    $scheck.html(text);
    PTL.editor.autosubmitTimeout = setTimeout(PTL.editor.submitNonEmpty, 200);
  },

  /* Accepts a suggestion */
  acceptSuggestion: function (e) {
    e.stopPropagation(); //we don't want to trigger a click on the text below
    var suggId = $(this).data("sugg-id"),
        unit = PTL.editor.units.getCurrent(),
        url = l(['/xhr/units/', unit.id,
                 '/suggestions/', suggId, '/accept/'].join('')),
        translations;

    $.post(url, {'accept': 1},
      function (data) {
        // Update target textareas
        $.each(data.newtargets, function (i, target) {
          $("#id_target_f_" + i).val(target).focus();
        });

        unit.set('isfuzzy', false);
        PTL.editor.gotoNext();
      }, "json");
  },

  /* Clears the vote for a specific suggestion */
  clearVote: function (e) {
    e.stopPropagation(); //we don't want to trigger a click on the text below
    var element = $(this),
        voteId = element.data("vote-id"),
        url = l(['/xhr/votes/', voteId, '/clear/'].join(''));

    element.fadeTo(200, 0.01); //instead of fadeOut that will cause layout changes
    $.ajax({
      url: url,
      type: 'POST',
      data: {'clear': 1},
      dataType: 'json',
      success: function (data) {
        element.hide();
        element.siblings(".js-vote-up").fadeTo(200, 1);
      },
      error: function (xhr, s) {
        PTL.editor.error(xhr, s);
        //Let's wait a while before showing the voting widget again
        element.delay(3000).fadeTo(2000, 1);
      }
    });
  },

  /* Votes for a specific suggestion */
  voteUp: function (e) {
    e.stopPropagation();
    var element = $(this),
        suggId = element.siblings("[data-sugg-id]").data("sugg-id"),
        url = l(['/xhr/units/', PTL.editor.units.getCurrent().id,
                 '/suggestions/', suggId, '/votes/'].join(''));

    element.fadeTo(200, 0.01); //instead of fadeOut that will cause layout changes
    $.ajax({
      url: url,
      type: 'POST',
      data: {'up': 1},
      dataType: 'json',
      success: function (data) {
        element.siblings("[data-vote-id]").data("vote-id", data.voteid);
        element.hide();
        element.siblings(".js-vote-clear").fadeTo(200, 1);
      },
      error: function (xhr, s) {
        PTL.editor.error(xhr, s);
        //Let's wait a while before showing the voting widget again
        element.delay(3000).fadeTo(2000, 1);
      }
    });
  },

  /* Rejects a quality check marking it as false positive */
  rejectCheck: function () {
    var element = $(this).parent(),
        checkId = $(this).data("check-id"),
        uid = $('.translate-container #id_id').val(),
        url = l(['/xhr/units/', uid, '/checks/', checkId, '/reject/'].join(''));

    $.post(url, {'reject': 1},
      function (data) {
        if (element.siblings().size() === 0) {
          element = $('#translate-checks-block');
        }
        element.fadeOut(200, function () {
          $(this).remove();
          $('.tipsy').remove();
        });
      }, "json");
  },


  /*
   * Machine Translation
   */

  /* Checks whether the provided source is supported */
  isSupportedSource: function (pairs, source) {
    for (var i in pairs) {
      if (source == pairs[i].source) {
        return true;
      }
    }
    return false;
  },


  /* Checks whether the provided target is supported */
  isSupportedTarget: function (pairs, target) {
    for (var i in pairs) {
      if (target == pairs[i].target) {
        return true;
      }
    }
    return false;
  },


  /* Checks whether the provided source-target pair is supported */
  isSupportedPair: function (pairs, source, target) {
    for (var i in pairs) {
      if (source == pairs[i].source &&
          target == pairs[i].target) {
        return true;
      }
    }
    return false;
  },


  /* Adds a new MT service button in the editor toolbar */
  addMTButton: function (container, aClass, tooltip) {
    return; // Not used
    /*  var btn = '<a class="translate-mt ' + aClass + '">';
      btn += '<i class="icon-' + aClass+ '" title="' + tooltip + '"><i/></a>';
      $(container).first().prepend(btn); */
  },

  /* Goes through all source languages and adds a new MT service button
   * in the editor toolbar if the language is supported
   */
  addMTButtons: function (provider) {
    return; // Not used
    /*if (this.isSupportedTarget(provider.pairs, provider.targetLang)) {
      var _this = this;
      var sources = $(".translate-toolbar");
      $(sources).each(function () {
        var source = _this.normalizeCode($(this).parent().parent().find('.translation-text').attr("lang"));

        var ok;
        if (provider.validatePairs) {
          ok = _this.isSupportedPair(provider.pairs, source, provider.targetLang);
        } else {
          ok = _this.isSupportedSource(provider.pairs, source);
        }

        if (ok) {
          _this.addMTButton(this,
            provider.buttonClassName,
            provider.hint + ' (' + source.toUpperCase() + '&rarr;' + provider.targetLang.toUpperCase() + ')');
        }
      });
    }*/
  },

  /* Normalizes language codes in order to use them in MT services */
  normalizeCode: function (locale) {
    if (locale) {
      var clean = locale.replace('_', '-');
      var atIndex = locale.indexOf('@');
      if (atIndex !== -1) {
        clean = clean.slice(0, atIndex);
      }
      return clean;
    }
    return locale;
  },

  collectArguments: function (s) {
    this.argSubs[this.argPos] = s;
    return "[" + (this.argPos++) + "]";
  },

  translate: function (mt_name, providerCallback) {
    mt_name = mt_name ? mt_name : '';

    var unit = this.units.getCurrent(),
        store = unit.get('store'),
        langFrom = store.get('source_lang'),
        langTo = store.get('target_lang'),
        sources = $('.tt-row-block.active').find('.translation-text'),
        _this = this;

    if (PTL.editor.is_unit_locked) {
      $(".trad-list").css("display", 'none');
    } else {
      $(sources).each(function (j) {
        var selectedText  = PTL.editor.getSelectedText();
        var sourceText = $(this).text();

        if (selectedText && selectedText.length) {
          sourceText = selectedText;
        } else if (PTL.editor.selectMemory) {
          sourceText = PTL.editor.selectMemory;
        }

        sourceText = _this.cleanSourceText(sourceText);

        var result = providerCallback(sourceText, langFrom, langTo, function(translation, message) {
          if (translation === false) {
            PTL.editor.displayError(message);
            return;
          }

          $('.tt-row-block.active').find('.tl-item.is-' + mt_name.backend).show();
          tuneSizes();

          var tTable = $('.table-trad');
          var upperRows = $('.tt-row-block');
          var current = $('.tt-row-block.active');
          upperRows = upperRows.slice(0, upperRows.index(current));
          if (upperRows.length) {
            var sum_height = 0;
            upperRows.each(function () {
              sum_height += $(this).height();
            });
            if ($('.is-search').height() > sum_height) {
              $(tTable).css('padding-top', $('.is-search').height() - sum_height + 'px');
            }
          }

          translation = _this.cleanTranslatedText(sourceText, translation);

          var $el = $('.tt-row-block.active').find('.' + mt_name.backend + '-translation-result');
          $el.html(translation);
        });
      });
    }

    PTL.editor.goFuzzy();
    return false;
  },

  cleanSourceText: function(sourceText) {
      var _this = PTL.editor,
          htmlPat = /<[\/]?\w+.*?>/g,
          // The printf regex based on http://phpjs.org/functions/sprintf:522
          cPrintfPat = /%%|%(\d+\$)?([-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuidfegEG])/g,
          csharpStrPat = /{\d+(,\d+)?(:[a-zA-Z ]+)?}/g,
          percentNumberPat = /%\d+/g;

      // Reset collected arguments array and counter
      _this.argSubs = [];
      _this.argPos = 0;

      // Walk through known patterns and replace them with [N] placeholders
      sourceText = sourceText.replace(htmlPat, function(s) { return _this.collectArguments(s); });
      sourceText = sourceText.replace(cPrintfPat, function(s) { return _this.collectArguments(s); });
      sourceText = sourceText.replace(csharpStrPat, function(s) { return _this.collectArguments(s); });
      sourceText = sourceText.replace(percentNumberPat, function(s) { return _this.collectArguments(s); });
      return sourceText;
  },

  cleanTranslatedText: function(sourceText, translation) {
      var _this = PTL.editor;

      // Fix whitespace which may have been added around [N] blocks
      for (var i = 0; i < _this.argSubs.length; i++) {
          if (sourceText.match(new RegExp("\\[" + i + "\\][^\\s]"))) {
              translation = translation.replace(new RegExp("\\[" + i + "\\]\\s+"), "[" + i + "]");
          }
          if (sourceText.match(new RegExp("[^\\s]\\[" + i + "\\]"))) {
              translation = translation.replace(new RegExp("\\s+\\[" + i + "\\]"), "[" + i + "]");
          }
      }

      // Replace temporary [N] placeholders back to their real values
      for (i = 0; i < _this.argSubs.length; i++) {
          var value = _this.argSubs[i].replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/\\>/g, "&gt;");
          translation = translation.replace("[" + i + "]", value);
      }

      return translation;
  },

  /*
   * Lookup
   */

  /* Adds a new Lookup button in the editor toolbar */
  addLookupButton: function (container, aClass, tooltip) {
    return; // Not used
    /*$(container).first().prepend(['<a class="translate-lookup iframe ',
      aClass, '"><i class="icon-', aClass, '" title="', tooltip,
      '"></i></a>'].join(''));*/
  },

  /* Goes through all source languages and adds a new lookup service button
   * in the editor toolbar if the language is supported
   */
  addLookupButtons: function (provider) {
    return; // Not used
    /*var _this = this;
    var sources = $(".translate-toolbar");
    $(sources).each(function () {
      var source = _this.normalizeCode($(this).parent().parent().find('.translation-text').attr("lang"));

    _this.addLookupButton(this,
      provider.buttonClassName,
      [provider.hint, ' (', source.toUpperCase(), ')'].join(''));
    });*/
  },

  getLookupText: function (selection, segmentClassName) {
    if (selection.rangeCount) {
      var container = document.createElement('div');
      for (var i = 0, len = selection.rangeCount; i < len; ++i) {
        container.appendChild(selection.getRangeAt(i).cloneContents());
      }
      if (container.getElementsByClassName(segmentClassName).item(0)) {
        return container.getElementsByClassName(segmentClassName).item(0).innerHTML;
      } else {
        return container.innerHTML;
      }
    }
  },

  lookup: function (linkObject, providerCallback) {
    var unit = this.units.getCurrent(),
        store = unit.get('store'),
        langFrom = store.get('source_lang'),
        langTo = store.get('target_lang'),
        sources = $('.tt-row-block.active').find('.translation-text');

    var selectedText = this.getSelectedText();
    var lookupText = null;
    if (selectedText.toString()) {
      lookupText = this.getLookupText(selectedText, 'translation-text');
    } else if (PTL.editor.selectMemory) {
      lookupText = this.getLookupText(PTL.editor.selectMemory, 'translation-text');
    }

    if (!lookupText)
      lookupText = PTL.editor.selectMemory;

    if (!lookupText)
      lookupText = sources.eq(0).text();

    lookupText = PTL.utils.cleanWhitespace(lookupText).trim();

    var url = providerCallback(lookupText, langFrom, langTo);
    $.magnificPopup.open({
      items: {
        src: url,
        type: 'iframe'
      }
    });
    // linkObject.href = url;
    return false;
  }

  }; // PTL.editor

  var trans_text = '';

  $(document).on('mouseup','.tt-row-block.active > .is-original > .translation-text',function (e){
    trans_text = PTL.editor.getSelectedText();
  });

  $(document).on('click', '.js-translate-taas', function() {
    var unit = PTL.editor.units.getCurrent(),
        store = unit.get('store'),
        langFrom = store.get('source_lang'),
        langTo = store.get('target_lang'),
        sourceText = $('.tt-row-block.active > .is-original > .translation-text').text().trim();

    if (trans_text != '') {
      sourceText = trans_text;
    }

    var backend = 'taas';

    $.ajax({
      type: 'POST',
      url: '/mt/',
      data: {
        from: langFrom,
        to: langTo,
        text: sourceText,
        backend: backend,
        render: true
      },
      success: function(data, status) {
        if (data.data) {
          trans_text = '';
          $('.bt-row.js-service-' + backend).remove();
          $('.bt-row.is-head').after(data.data);
          PTL.editor.hlTerms();
          $('.is-terminology').fadeIn('fast');
        }
        if (data.captcha) {
          PTL.editor.displayError('Login required');
        }
        if (data.error) {
          PTL.editor.displayError(data.error);
        }
      },
      error: function(request, status, error) {
        PTL.editor.displayError('Could not connect to server');
      }
    });
    return false;
  });

  var PRE_AMAGAMA_UNIT = 0;

  function goUpTerminology() {
    if ($('.amigo-google').hasClass('actif') === false &&
        $('.amigo-taas').hasClass('actif') === false &&
        $('.amigo-bing').hasClass('actif') === false) {
      $('.amigo-bing').addClass('actif');
      $('.amigo-bing').find('.arrow').text('↵')
    } else if ($('.amigo-bing').hasClass('actif')) {
      $('.amigo-bing').removeClass('actif');
      $('.amigo-bing').find('.arrow').text('');
      $('.amigo-google').addClass('actif');
      $('.amigo-google').find('.arrow').text('↵');
    } else if ($('.amigo-google').hasClass('actif')) {
      $('.amigo-google').removeClass('actif');
      $('.amigo-google').find('.arrow').text('');
      $('.amigo-taas').addClass('actif');
      $('.amigo-taas').find('.arrow').text('↵');
    } else if ($('.amigo-taas').hasClass('actif')) {
      $('.amigo-taas').removeClass('actif');
      $('.amigo-taas').find('.arrow').text('');
      $('.amigo-bing').addClass('actif');
      $('.amigo-bing').find('.arrow').text('↵');
    }
  }

  function goDownTerminology() {
    if ($('.amigo-google').hasClass('actif')) {
      $('.amigo-google').removeClass('actif');
      $('.amigo-google').find('.arrow').text('');
      $('.amigo-bing').addClass('actif');
      $('.amigo-bing').find('.arrow').text('↵');
    } else if ($('.amigo-bing').hasClass('actif')) {
      $('.amigo-bing').removeClass('actif');
      $('.amigo-bing').find('.arrow').text('');
      $('.amigo-taas').addClass('actif');
      $('.amigo-taas').find('.arrow').text('↵');
    } else if ($('.amigo-taas').hasClass('actif')) {
      $('.amigo-taas').removeClass('actif');
      $('.amigo-taas').find('.arrow').text('');
      $('.amigo-google').addClass('actif');
      $('.amigo-google').find('.arrow').text('↵');
    } else if ($('.amigo-taas').hasClass('actif') === false &&
               $('.amigo-google').hasClass('actif') === false &&
               $('.amigo-bing').hasClass('actif') === false) {
      $('.amigo-taas').addClass('actif');
      $('.amigo-taas').find('.arrow').text('↵');
    }
  }

  function selectTerminology() {
    if ($('.actif .result-variations').text() !== '-- Nothing was found --') {
      var text = $('.actif .result-variations').text();
      $('.tt-row-block.active').find('.spellchecker').text(text);
      $('.tt-row-block.active').find('.translation-area').text(text);

      setTimeout(function() {
        $('.amigo-google').removeClass('actif');
        $('.amigo-bing').removeClass('actif');
        $('.amigo-taas').removeClass('actif');
        $('.amigo-google').find('.arrow').text('');
        $('.amigo-bing').find('.arrow').text('');
        $('.amigo-taas').find('.arrow').text('');
        $('.terminology-results-popup').hide();
      }, 200);
      PTL.editor.placeCaretAtEnd($('.spellchecker')[0]);
    }

    return false;
  }

  var mtHighlight = function() {
    var nav = $('.trad-list.is-search .tl-item.is-bing, ' +
                '.trad-list.is-search .tl-item.is-google, ' +
                '.block-tradmore .bt-row.js-editor-copytext');

    var upper_nav_blocks = $('.trad-list.is-search .tl-item.is-bing, ' +
                             '.trad-list.is-search .tl-item.is-google').length;

    return {
      goUp: goUp,
      goDown: goDown,
      selectCurrent: selectCurrent
    };

    function getHighlightIndex() {
      for (var index = 0; index < nav.length; index++) {
        if ($(nav[index]).hasClass('highlight'))
          return index;
      }
      return -1;
    }

    function highlight(highlightIndex) {
      for (var index = 0; index < nav.length; index++) {
        if (highlightIndex === index) {
          $(nav[index]).addClass('highlight');
        } else {
          $(nav[index]).removeClass('highlight');
        }
      }
    }

    function goUp() {
      var highlightIndex = getHighlightIndex();
      if (highlightIndex < 0) {
        var index = upper_nav_blocks - 1;
        if (index == -1) {
          index = nav.length - 1;
        }
        highlight(index);
      } else if (highlightIndex === 0) {
        highlight(nav.length - 1);
      } else {
        highlight(highlightIndex - 1);
      }

      return false;
    }

    function goDown() {
      var highlightIndex = getHighlightIndex();
      if (highlightIndex < 0) {
        var index = upper_nav_blocks;
        if (nav.length == upper_nav_blocks) {
          index = 0;
        }
        highlight(0);
      } else if (highlightIndex === nav.length - 1) {
        highlight(0);
      } else {
        highlight(highlightIndex + 1);
      }

      return false;
    }

    function selectCurrent() {
      var currentIndex = getHighlightIndex();
      if (currentIndex < 0)
        return;

      var text = $(nav[currentIndex]).find('.btr-cell.btr-cell-unit').text();
      if (!text.length) {
        text = $(nav[currentIndex]).find('.translate-overflow').text();
      }

      $('.tt-row-block.active').find('.spellchecker').text(text);
      $('.tt-row-block.active').find('.translation-area').text(text);
      PTL.editor.placeCaretAtEnd($('.spellchecker')[0]);

      clearTimeout(PTL.editor.wordSearchTimeout);
      clearTimeout(PTL.editor.autosubmitTimeout);
      PTL.editor.wordSearchTimeout = setTimeout(function() {
        $('.btr-cell-unit:eq(' + (PRE_AMAGAMA_UNIT - 1) + ')').removeClass('highlight');
        $('.google-high').removeClass('highlight');
        $('.bing-high').removeClass('highlight');
        if ($('.tt-row-block.active').find('.spellchecker').text() != '') {
          $('input.submit').trigger('click');
        }
      }, 200);

      return false;
    }
  };

  $(document).on('keydown', '.spellchecker', function(e) {
    if (e.which == 38) { // up
      e.stopImmediatePropagation();
      if ($('.terminology-results-popup').css('display') === "block") {
        return goUpTerminology();
      } else if ($('.spellchecker').text().trim() === '') {
        return mtHighlight().goUp();
      }
    }

    if (e.which == 40) {
      e.stopImmediatePropagation();
      if ($('.terminology-results-popup').css('display') === "block") {
        goDownTerminology();
      } else if ($('.spellchecker').text().trim() === '') {
        return mtHighlight().goDown();
      }
    }
  });

  $(document).on('keypress', '.spellchecker', function(e) {
    if (e.which == 13) {
      if ($('.terminology-results-popup').css('display') === "block") {
        return selectTerminology();
      } else {
        return mtHighlight().selectCurrent();
      }
    }
  });

  $(document).on('click', '.google-high', function() {
    var text = $('.google-high').text();
    $('.tt-row-block.active').find('.spellchecker').text(text);
    $('.tt-row-block.active').find('.translation-area').text(text);
    PTL.editor.placeCaretAtEnd($('.spellchecker')[0]);
    PTL.editor.autosubmitTimeout = setTimeout(PTL.editor.submitNonEmpty, 200);
  });

  $(document).on('click', '.bing-high', function() {
    var text = $('.bing-high').text();
    $('.tt-row-block.active').find('.spellchecker').text(text);
    $('.tt-row-block.active').find('.translation-area').text(text);
    PTL.editor.placeCaretAtEnd($('.spellchecker')[0]);
    PTL.editor.autosubmitTimeout = setTimeout(PTL.editor.submitNonEmpty, 200);
  });

  $(document).on('bing_translate_error google_translate_error', function() {
      PTL.editor.stopAutomaticTranslation();
  });

  var TauSData = function() {
    if (!PTL.editor.is_unit_locked) {
      var unit = PTL.editor.units.getCurrent(),
          store = unit.get('store'),
          langFrom = store.get('source_lang'),
          langTo = store.get('target_lang'),
          sourceText = $('.tt-row-block.active > .is-original > .translation-text').text().trim();

      $.ajax({
        type: 'GET',
        url: '/taus/',
        data: {
          from: langFrom,
          to: langTo,
          text: sourceText
        },
        cache: true,
        success: function(data) {
          if (data.length) {
            var $container = $('.is-amagama');
            $container.append('<div class="taus-results"></div>');
            var $results_cont = $container.find('.taus-results');
            $results_cont.empty();
            for (var i = 0; i < data.length; i++) {
              var part = data[i];
              var $icon = $('<div/>').addClass('icon-taus-small');
              var $el = $('<div/>').addClass('bt-row js-editor-copytext amagama-unit');
              var $score = $('<div/>').addClass('btr-cell amagama-score')
                .html(parseInt(part[1], 10) + '%');
              var $text = $('<div/>').addClass('btr-cell btr-cell-unit').html(part[0]);
              $text.attr('title', 'Insert the translated term into the editor');
              $el.append($icon, $score, $text);
              $results_cont.append($el);
            }
            $container.fadeIn();
            tuneSizes();
          } else {
            PTL.editor.displayError('No TAUS suggestions found');
          }
        }
      });
    }
  };

  var getTMUnitsSerch = function() {
    var store = PTL.editor.units.getCurrent().get('store'),
        src = store.get('source_lang'),
        tgt = store.get('target_lang'),
        sourceText = $('.amagama-results-popup .amagama-results-text').val().trim();

    var tmUrl = '/tmserver/'+store['attributes']['project_code']+ '/' + src + "/" + tgt +
          "/unit/?source=" + sourceText + "&jsoncallback=?";
    window.showLoader();

    this.tmReq = $.jsonp({
      url: tmUrl,
      dataType: 'jsonp',
      cache: true,
      success: function (data) {
        if (data.length) {
          for (var i = 0; i < data.length; i++) {
              var part = data[i];
              var $container = $('.amagama-results-popup tbody');
              $container.append('<tr class="mt-amagama-results-popup"><td class="cat-TM"></td><td>'+part['target']+'</td></tr>');
          }
        } else {
          PTL.editor.displayError('Not suggestions found');
          var $container = $('.amagama-results-popup tbody');
          $container.find('.mt-amagama-results-popup').remove();
        }
      }
    });
  }

  $(document).on('click', '.config-dropdown .icon-search', function() {
      if (!PTL.editor.settings.review) {
        PTL.editor.showPreTraslationPopup();
        $('#pre_translate_search').focus();
      }
    })

  var TauSDataSerch = function() {
    if (!PTL.editor.is_unit_locked) {
      var unit = PTL.editor.units.getCurrent(),
          store = unit.get('store'),
          langFrom = store.get('source_lang'),
          langTo = store.get('target_lang'),
          sourceText = $('.amagama-results-popup .amagama-results-text').val().trim();

       window.showLoader();

      $.ajax({
        type: 'GET',
        url: '/taus/',
        data: {
          from: langFrom,
          to: langTo,
          text: sourceText
        },
        cache: true,
        success: function(data) {
          if (data.length) {
            for (var i = 0; i < data.length; i++) {
              var part = data[i];
              var $container = $('.amagama-results-popup tbody');
              $container.append('<tr class="taus-amagama-results-popup"><td class="cat-TAUS"></td><td>'+part[0]+'</td></tr>');
            }
          } else {
            PTL.editor.displayError('No TAUS suggestions found');
            var $container = $('.amagama-results-popup tbody');
            $container.find('.taus-amagama-results-popup').remove();
          }
        }
      });
    }
  };

  $(document).on('click', '.config-dropdown .cat-TM', function(e) {
    e.preventDefault();
    $('#tptranslate .mfp-wrap').css('overflow-y', 'auto');
    $('#tptranslate .mfp-wrap').css('overflow-x', 'hidden');
    $('#tptranslate .mfp-wrap').css('position','fixed');
    $('.amagama-results-popup').show();
    $('.amagama-results-popup .amagama-results-text').eq(1).hide();
  })

  $(document).on('click', '.amagama-results-popup .amagama-results-popup-close', function() {
    $('#tptranslate .mfp-wrap').css('position','static');
    $('.amagama-results-popup').hide();
    var $container = $('.amagama-results-popup tbody');
    $container.find('.taus-amagama-results-popup').remove();
    $container.find('.mt-amagama-results-popup').remove();
    $('.amagama-results-popup .amagama-results-text').val('');
    $('.amagama-results-popup .amagama-results-text').eq(0).css('height','53');
  })

  $(document).off('click.results-submint');
  $(document).on('click.results-submint', '.amagama-results-popup .amagama-results-submint', function(e) {
    var text = $('.amagama-results-popup .amagama-results-text').val().trim();
    if (text != '') {
      var $container = $('.amagama-results-popup tbody');
      $container.find('.mt-amagama-results-popup').remove();
      $container.find('.taus-amagama-results-popup').remove();
      TauSDataSerch();
      getTMUnitsSerch();
    }
  })

  $(document).off('keydown.results-submint');
  $(document).on('keydown.results-submint', '.amagama-results-popup', function(e) {
    var text = $('.amagama-results-popup .amagama-results-text').val().trim();
    if (text != '' && e.keyCode == 13) {
      $('.amagama-results-popup .amagama-results-submint').trigger( "click" );
      return false;
    }
  })

  $('.amagama-results-popup .popOverflow').bind('mousewheel DOMMouseScroll', function(e) {
    var scrollTo = null;

    if (e.type == 'mousewheel') {
        scrollTo = (e.originalEvent.wheelDelta * -1);
    }
    else if (e.type == 'DOMMouseScroll') {
        scrollTo = 40 * e.originalEvent.detail;
    }

    if (scrollTo) {
        e.preventDefault();
        $(this).scrollTop(scrollTo + $(this).scrollTop());
    }
  })
}(jQuery));
