$( document ).ready(function() {

    var fileCount = 0,
        $emptyRow = $('.file-meta-empty');


    // Display added file in row
    $('#upload-file').change(function() {
        var inputFiles = $(this)[0].files;

        for (var i = 0; i < inputFiles.length; ++i) {

            function display_languages() {
                content = $('#hidden-target-values').clone();
                content.attr('id', '');
                inner = content.find('select');
                inner.attr('name', 'target_language_' + fileCount);
                return content;
            }

            var $filelist = $('#file-list');

            var fullname = inputFiles[i].name;
            var size = Math.ceil(inputFiles[i].size / 1024) + ' KB';
            filename = fullname.substr(0, fullname.lastIndexOf('.'));
            var ext = fullname.substr(fullname.lastIndexOf('.'), fullname.lenght);
            source_language = $('#project-source-language').text();
            var row = '' +
                '<tr class="file-meta newfile">' +
                '    <td>' + filename + '</td>' +
                '    <td>' + ext + '</td>' +
                '    <td class="custom-select" id="source-language-' + fileCount + '"><div id="" class="custom-select-wrapper">' +
                '    <select class="source-language" ><option value="0">' + source_language + '</option> </select></div></td>' +
                '    <td class="arrow">&rarr;</td>' +
                '    <td class="custom-select" id="target-language-' + fileCount + '"></td>' +
                '    <td>' + size + '</td>' +
                '    <td class="actions">' +
                '       <input type="button" name="remove_language" value="&times;&nbsp;Remove" class="btn remove">' +
                '    </td>' +
                '</tr>';

            first_row = $('.file-meta')[0];

            $emptyRow.hide();
            $filelist.append(row);
            row = $filelist.find('.file-meta.newfile').last();

            // now we clone input because ff does not allow populting file inputs from js
            $('#upload-file').clone().appendTo(row.find('td.actions'));
            var new_file_input = row.find('#upload-file')
            var new_input_name = 'add_file_' + fileCount;
            new_file_input.removeAttr('id').attr('name', new_input_name).addClass('hidden-element');

            try { // fix for chrome and safari
                //new_file_input.val($(this).val());
                $(new_file_input[0]).data('file', inputFiles[i]);
            } catch (e) {
                console.log(e);
            }

            // Place Languages to content
            $('#target-language-' + fileCount).html(display_languages());
            fileCount++;
        }
    });


    // Add upload file
    $('#add-files').click(function(){
        $('#upload-file').click();
        return false;
    });


    // Remove/Restore Files
    $(document).on('click', '.remove', function() {
        trr = $(this).closest('tr');
        // Remove row if file was just added
        if (trr.hasClass('newfile')) {
            trr.remove();
            if ($('#file-list tr').length === 2) {
                $emptyRow.show();
            }
            return false;
        }
        // Check to remove later already existen file
        if (trr.prop('disabled')) {
            is_disabled = false;
            old_style = 'deactivated';
            new_style = 'activated';
        } else {
            is_disabled = true;
            old_style = 'activated';
            new_style = 'deactivated';
        }
        trr.prop('disabled', is_disabled);
        // inputs
        /*
         trr.find('input').each( function() {
         $(this).prop('disabled', is_disabled);
         });
         */
        // selects
        trr.find('select').each( function() {
            $(this).prop('disabled', is_disabled);
        });
        // texts
        trr.find('td').each( function() {
            $(this).removeClass(old_style).addClass(new_style);
        });
        trr.find('input[name^=is_file_removed_]').each( function(i, obj) {
            obj.value = is_disabled;
            obj.disabled = false;
        });

        return false;
    });


    function filesList() {
        var formData = new FormData();
        $('tr.newfile').each(function (index, element) {
            var file = $(element).find('input:file')[0];
            var language = $(element).find('select.target-language')[0];
            formData.append($(file).attr('name'), $(file).data('file'));
            formData.append($(language).attr('name'), $(language).val());
        });
        $('td.actions.deactivated').each(function(i, obj) {
            if ($(obj).children('div.action-button.remove').length) {
                formData.append($(obj).children('input[name^=is_file_removed_]').attr('name'), 'remove');
            }
        });
        return formData;
    }


    function submit() {
        window.showLoader();

        var formData = filesList();
        var href = window.location.href;
        var xhr = new XMLHttpRequest();
        var token = $('input[name=csrfmiddlewaretoken]').val();

        formData.append('csrfmiddlewaretoken', token);

        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                if (JSON.parse(this.responseText)['goTo']) {
                  window.location.href = JSON.parse(this.responseText)['goTo'];
                }
            }
        };
        xhr.open('POST', href, true);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.send(formData);
    }


    /* Submit Form */
    $('#form-submit').click(function(){
        submit();
        return false;
    });

});