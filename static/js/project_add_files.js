$( document ).ready(function() {

    file_count = 0;


    // Display added file in row
    $('#upload-file').change(function() {

        function display_languages() {
            content = $('#hidden-target-values').clone();
            content.attr('id', '');
            //content.attr('id', 'target-language-'+file_count);
            inner = content.find('select');
            inner.attr('name', 'target_language_'+file_count);
            return content;
        }
        var $filelist = $('#file-list');

        var fullname = $(this)[0].files[0]['name'];
        filename = fullname.substr(0, fullname.lastIndexOf('.'));
        var ext = fullname.substr(fullname.lastIndexOf('.'), fullname.lenght);
        source_language = $('#project-source-language').text();
        var row = '' +
        '<tr class="file-meta newfile">' +
        '    <td>'+filename+'</td>' +
        '    <td>'+ext+'</td>' +
        '    <td class="custom-select">' + source_language + '</td>' +
        '    <td class="arrow">&rarr;</td>' +
        '    <td class="custom-select" id="target-language-'+file_count+'"></td>' +
        '    <td class="is-suggestion">' +
        '       <input type="checkbox" name="is_suggestion_'+file_count+'">'+
        '    </td>' +
        '    <td class="actions">' +
        '       <div class="action-button remove"><a href="">Remove&nbsp;&nbsp;&times;</a></div>' +
        '    </td>' +
        '</tr>';

        first_row = $('.file-meta')[0];
        if (first_row.textContent.indexOf('There are no files') >= 0) {
            //remove empty content
            first_row.remove();
        }
        $filelist.append(row);
        row = $filelist.find('.file-meta.newfile').last();

        // now we clone input because ff does not allow populting file inputs from js
        $('#upload-file').clone().appendTo(row.find('td.actions'));
        var new_file_input = row.find('#upload-file')
        var new_input_name = 'add_file_'+file_count
        new_file_input.removeAttr('id').attr('name', new_input_name).addClass('hidden-element');

        try { // fix for chrome and safari
            //new_file_input.val($(this).val());
            new_file_input[0].files = this.files;
        } catch (e) {
            console.log(e);
        }

        // Place Languages to content
        $('#target-language-'+file_count).html(display_languages());
        file_count = file_count + 1;
    });


    // Add upload file
    $('#add-files').click(function(){
        $('#upload-file').click();
        return false;
    });


    // Remove/Restore Files
    $(document).on('click', '.action-button.remove a', function() {
        trr = $(this).closest('tr');
        // Remove row if file was just added
        if (trr.hasClass('newfile')) {
            trr.remove();
            if ($('#file-list tr').length === 1) {
                content = '<tr class="file-meta">' +
                '   <td colspan="7" class="empty-list">There are no files yet.</td>' +
                '</tr>';
                $('#file-list').append(content);
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


    /* Submit Form */
    $('.submit-form.js-add-again').click(function(){
        $("#file-list-form").submit();
        return false;
    });
    $('.submit-form.js-finish').click(function(){
        $('input[name=is_finish]').val(1)
        $("#file-list-form").submit();
        return false;
    });

});