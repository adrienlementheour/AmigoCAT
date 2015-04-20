$( document ).ready(function() {

    var getWorkerRowURL = "/xhr/projects/get_worker_table_row",
        $addedWorkersTable = $('table#file-list'),
        $newWorkersForm = $('#file-list-form'),
        $listAvailableWorkers = $('#addWorker').find('a.worker'),
        $domainModalSelect = $('#domain'),
        $searchAddedWorkersInput = $('#search-added-workers'),
        $sourceLanguageSelect = $('#source-language'),
        $targetLanguageSelect = $('#target-language'),
        $searchAvailableWorkersInput = $('#search-available-workers'),
        $chooseWorkerModal = $('.mfp-wrap');


    // Event listeners
    $(document).on('click', '#addWorker a.worker', selectWorker);
    $(document).on('click', 'table#file-list .btn-remove-worker', removeWorker);
    $(document).on('click', '#submit-new-workers', submitNewWorkers);
    $(document).on('input', '#search-added-workers', searchAddedWorkers);
    $(document).on('input', '#search-available-workers', filterAvailableWorkers);
    $(document).on('change', '#target-language', filterAvailableWorkers);
    $(document).on('click', '#add-worker', filterAvailableWorkers);
    $(document).on('change', '#domain', filterAvailableWorkers);


    function selectWorker(e) {
        var $this = $(this),
            workerID = $this.data('user-id');

        $.get(getWorkerRowURL, {'user_id': workerID})
            .done(function(data) {
                $searchAddedWorkersInput.val('').trigger('input');
                $chooseWorkerModal.magnificPopup('close');
                $addedWorkersTable.children('tbody').append(data.html);
                $this.parent().hide();
            });

        e.preventDefault();
    }

    function removeWorker(e) {
        $(this).closest('tr').remove();

        e.preventDefault();
    }

    function submitNewWorkers(e) {
        $newWorkersForm.submit();

        e.preventDefault();
    }

    function searchAddedWorkers(e) {
        var workerName,
            $elementsToShow,
            $addedWorkersList = $addedWorkersTable.find('tr.file-meta'),
            text = $(this).val().toLowerCase(),
            searchRegEx = new RegExp(text);

        $elementsToShow = $addedWorkersList.filter(function(i, el) {
            workerName = $(el).find('.name').text().toLowerCase();
            return (searchRegEx.test(workerName));
        });

        $addedWorkersList.not($elementsToShow).hide();
        $elementsToShow.show();
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
            $addedWorkersList = $addedWorkersTable.find('tr.file-meta'),
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

});
