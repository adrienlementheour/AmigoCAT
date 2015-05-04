$( document ).ready(function() {

    var $addedWorkersTable = $('table#file-list'),
        $listAvailableWorkers = $('#addWorker').find('a.worker'),
        $searchAddedWorkersInput = $('#search-added-workers'),
        $sourceLanguageSelect = $('#source-language'),
        $targetLanguageSelect = $('#target-language'),
        $domainModalSelect = $('#domain'),
        $sourceLangTeamSelect = $('#team-source-language'),
        $targetLangTeamSelect = $('#team-target-language'),
        $domainTeamSelect = $('#team-domain'),
        $searchAvailableWorkersInput = $('#search-available-workers'),
        $searchTeamInput = $('#team-search'),
        $chooseWorkerModal = $('.mfp-wrap'),
        $addedWorkersDiv = $('#added-workers-list'),
        $addLi = $('.add');


    filterAddedWorkers();


    // Event listeners
    $(document).on('click', '#addWorker a.worker', addWorker);
    $(document).on('click', '#added-workers-list .close', deleteWorker);

    $(document).on('input', '#search-available-workers', filterAvailableWorkers);
    $(document).on('click', '#add-worker', filterAvailableWorkers);
    $(document).on('change', '#source-language', filterAvailableWorkers);
    $(document).on('change', '#target-language', filterAvailableWorkers);
    $(document).on('change', '#target-language', filterAvailableWorkers);
    $(document).on('change', '#domain', filterAvailableWorkers);

    $(document).on('input', '#team-search', filterAddedWorkers);
    $(document).on('change', '#team-source-language', filterAddedWorkers);
    $(document).on('change', '#team-target-language', filterAddedWorkers);
    $(document).on('change', '#team-domain', filterAddedWorkers);


    function addWorker(e) {
        e.preventDefault();
        
        var $this = $(this),
            workerID = $this.data('user-id');

        $.post(window.addWorkerURL, {'user_id': workerID})
            .done(function(data) {
                if (data.status === true) {
                    $searchAddedWorkersInput.val('').trigger('input');
                    $chooseWorkerModal.magnificPopup('close');
                    $this.parent()
                        .clone()
                        .insertBefore($addLi)
                        .find('.close')
                          .show();
                    $this.parent().hide();
                    $('.tipsy ').remove();
                } else {
                    console.error(data);
                }
            });
    }

    function deleteWorker(e) {
        e.preventDefault();
        
        var $this = $(this).attr('disabled', true),
            workerID = $this.siblings('a.worker').data('user-id');

        $.post(window.deleteWorkerURL, {'user_id': workerID})
            .done(
            function(data) {
                if (data.status === true) {
                    $this.parent().fadeOut(function() {
                        $(this).remove();
                        $('.tipsy ').remove();
                    });
                } else {
                    console.error(data);
                    $this.attr('disabled', false);
                }
            });
    }

    function filterAvailableWorkers() {
        var workerName,
            isNameMatch,
            isElementNotAdded,
            isSourceLangMatch,
            isTargetLangMatch,
            userSourceLangIDs,
            userTargetLangIDs,
            userDomainsIDs,
            isDomainMatch,
            $elementsToShow,
            sourceLangID = $sourceLanguageSelect.val(),
            targetLangID = $targetLanguageSelect.val(),
            domainID = $domainModalSelect.val(),
            $addedWorkersList = $addedWorkersDiv.find('a.worker'),
            idsOfAddedWorkers = $.map($addedWorkersList, function(el, i) {
                return $(el).data('user-id');
            }),
            text = $searchAvailableWorkersInput.val().toLowerCase(),
            searchRegEx = new RegExp(text);

        $elementsToShow = $listAvailableWorkers.filter(function(i, el) {
            workerName = $(el).find('.nom').text().toLowerCase();
            isNameMatch = searchRegEx.test(workerName);

            isElementNotAdded = $.inArray($(el).data('user-id'), idsOfAddedWorkers) === -1;

            userSourceLangIDs = $(el).data('source-langs-ids').toString().split(',');
            userTargetLangIDs = $(el).data('target-langs-ids').toString().split(',');
            isSourceLangMatch = $.inArray(sourceLangID, userSourceLangIDs) !== -1;
            isTargetLangMatch = $.inArray(targetLangID, userTargetLangIDs) !== -1;

            userDomainsIDs = $(el).data('domains-ids').toString().split(',');
            isDomainMatch = domainID === '' || $.inArray(domainID, userDomainsIDs) !== -1;

            return (isNameMatch && isElementNotAdded && isSourceLangMatch &&
            isTargetLangMatch && isDomainMatch);
        });

        $listAvailableWorkers.not($elementsToShow).parent().hide();
        $elementsToShow.parent().show();
    }

    function filterAddedWorkers() {
        var workerName,
            isNameMatch,
            isSourceLangMatch,
            isTargetLangMatch,
            userSourceLangIDs,
            userTargetLangIDs,
            userDomainsIDs,
            isDomainMatch,
            $elementsToShow,
            sourceLangID = $sourceLangTeamSelect.val(),
            targetLangID = $targetLangTeamSelect.val(),
            domainID = $domainTeamSelect.val(),
            $addedWorkersList = $addedWorkersDiv.find('a.worker'),
            text = $searchTeamInput.val().toLowerCase(),
            searchRegEx = new RegExp(text);

        $elementsToShow = $addedWorkersList.filter(function(i, el) {
            workerName = $(el).find('.nom').text().toLowerCase();
            isNameMatch = searchRegEx.test(workerName);

            userSourceLangIDs = $(el).data('source-langs-ids').toString().split(',');
            userTargetLangIDs = $(el).data('target-langs-ids').toString().split(',');
            isSourceLangMatch = $.inArray(sourceLangID, userSourceLangIDs) !== -1;
            isTargetLangMatch = $.inArray(targetLangID, userTargetLangIDs) !== -1;

            userDomainsIDs = $(el).data('domains-ids').toString().split(',');
            isDomainMatch = domainID === '' || $.inArray(domainID, userDomainsIDs) !== -1;

            return (isNameMatch && isSourceLangMatch && isTargetLangMatch && isDomainMatch);
        });

        $addedWorkersList.not($elementsToShow).parent().hide();
        $elementsToShow.parent().show();
    }

});
