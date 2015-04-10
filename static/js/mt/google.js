(function ($) {
  window.PTL.editor.mt = window.PTL.editor.mt || {};

  PTL.editor.mt.google = {

    backend: 'google',
    buttonClassName: "google-translate",
    hint: "Google Translate",
    validatePair: false,
    pairs: [{"source":"af","target":"af"},
            {"source":"sq","target":"sq"},
            {"source":"ar","target":"ar"},
            {"source":"be","target":"be"},
            {"source":"bg","target":"bg"},
            {"source":"ca","target":"ca"},
            {"source":"zh","target":"zh"},
            {"source":"zh-CN","target":"zh-CN"},
            {"source":"zh-TW","target":"zh-TW"},
            {"source":"hr","target":"hr"},
            {"source":"cs","target":"cs"},
            {"source":"da","target":"da"},
            {"source":"nl","target":"nl"},
            {"source":"en","target":"en"},
            {"source":"et","target":"et"},
            {"source":"tl","target":"tl"},
            {"source":"fi","target":"fi"},
            {"source":"fr","target":"fr"},
            {"source":"gl","target":"gl"},
            {"source":"de","target":"de"},
            {"source":"el","target":"el"},
            {"source":"ht","target":"ht"},
            {"source":"iw","target":"iw"},
            {"source":"hi","target":"hi"},
            {"source":"hu","target":"hu"},
            {"source":"is","target":"is"},
            {"source":"id","target":"id"},
            {"source":"ga","target":"ga"},
            {"source":"it","target":"it"},
            {"source":"ja","target":"ja"},
            {"source":"ko","target":"ko"},
            {"source":"lv","target":"lv"},
            {"source":"lt","target":"lt"},
            {"source":"mk","target":"mk"},
            {"source":"ms","target":"ms"},
            {"source":"mt","target":"mt"},
            {"source":"no","target":"no"},
            {"source":"fa","target":"fa"},
            {"source":"pl","target":"pl"},
            {"source":"pt","target":"pt"},
            {"source":"pt-PT","target":"pt-PT"},
            {"source":"ro","target":"ro"},
            {"source":"ru","target":"ru"},
            {"source":"sr","target":"sr"},
            {"source":"sk","target":"sk"},
            {"source":"sl","target":"sl"},
            {"source":"es","target":"es"},
            {"source":"sw","target":"sw"},
            {"source":"sv","target":"sv"},
            {"source":"tl","target":"tl"},
            {"source":"th","target":"th"},
            {"source":"tr","target":"tr"},
            {"source":"uk","target":"uk"},
            {"source":"vi","target":"vi"},
            {"source":"cy","target":"cy"},
            {"source":"yi","target":"yi"}],


    init: function (apiKey) {
      /* Set target language */
      var targetLanguage = $("#editor").data("target-language");
      this.targetLang = PTL.editor.normalizeCode(targetLanguage);
      /* Bind event handler */
      $(".google-translate").live("click", this.translate);
    },

    ready: function () {
      PTL.editor.addMTButtons(PTL.editor.mt.google);
    },

    translate: function () {
      PTL.editor.translate(this, function(sourceText, langFrom, langTo, resultCallback) {

        $.ajax({
            type: 'POST',
            url: '/mt/',
            data: {
                from: langFrom,
                to: langTo,
                text: sourceText,
                backend: PTL.editor.mt.google.backend,
            },
            success: function(data, status) {
                if (data.text && data.text.data && data.text.data.translations) {
                    resultCallback(data.text.data.translations[0].translatedText);
                }
                if (data.captcha) {
                    PTL.editor.displayError("Login required");
                }
                if (data.error) {
                    console.log(data.error);
                    PTL.editor.displayError(data.error)
                }
            },
            error: function(request, status, error) {
                console.log('error: ', status, error);
            }
        });
      });
      return false;
    }
  };
})(jQuery);


