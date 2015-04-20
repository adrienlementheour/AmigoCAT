$(document).ready(function() {

    file_count = 0;
    var upload_process;

    function create_project_add_files(filename, ext, file_count, source_language) {
        var res = '' +
            '<tr class="file-meta newfile">' +
            '    <td class="filename">' + filename + '</td>' +
            '    <td>' + ext + '</td>' +
            '    <td class="custom-select" id="source-language-' + file_count + '"><div id="" class="custom-select-wrapper">' +
            '    <select class="source-language" ><option value="0">' + source_language + '</option> </select></div></td>' +
            '    <td class="arrow">&rarr;</td>' +
            '    <td class="custom-select" id="target-language-' + file_count + '"></td>' +
            '    <td class="actions">' +
            '       <div class="action-button remove"><a href="">× Remove</a></div>' +
            '    </td>' +
            '</tr>';

        return res;
    }
    function project_add_files(filename, ext, file_count, source_language) {
        var res = '' +
        '<tr class="file-meta newfile">' +
        '    <td class="filename">' + filename + '</td>' +
        '    <td>' + ext + '</td>' +
        '    <td class="custom-select" id="source-language-' + file_count + '"><div id="" class="custom-select-wrapper">' +
        '    <select class="source-language" ><option value="0">' + source_language + '</option> </select></div></td>' +
        '    <td class="arrow">&rarr;</td>' +
        '    <td class="custom-select" id="target-language-' + file_count + '"></td>' +
        '    <td class="smallTd"><button class="removeFile remove"></button></td>' +
        '    <td class="smallTd"><a href="#" target="_blank" class="cat-link"></a></td>'+
        '    <td class="actions">' +
        '       <button name="download_file" class="btn"><i class="cat-download"></i>Download</button>' +
        '    </td>' +
        '</tr>';

        return res;
    }

    // File upload state periodical check:
    // if any tr have class uploading we start check upload status every 2 sec.
    // after all files uploaded we remove periodic checks
    if($('#file-list tr').hasClass('uploading')) {
        window.showLoader();
        upload_process = setInterval(function() {
            var ids = [];
            $('#file-list tr.uploading').each(function(index, el) {
                ids.push($(el).data('id'));
            });

            $.ajax({
                url: '/project/project_check_store_state/',
                data: {'project_code': $('input[name="project_code"]').val()},
                success: function(data) {
                    $(ids).each(function(index, el) {
                        if($.inArray(el, data) == -1) {
                            $('#file-list tr[data-id='+el+']').removeAttr('disabled').removeClass('uploading'); // make tr enabled

                            if($('#file-list tr[data-id='+el+'] td.filename').hasClass('show-percents')) {
                                $('#file-list tr[data-id='+el+'] td.filename span').replaceWith('(0%)'); // replace [upload in progress] span with 0%
                            } else {
                                $('#file-list tr[data-id='+el+'] td.filename span').remove(); // remove [upload in progress] span
                            }

                            $('#file-list tr[data-id='+el+'] td.actions .remove').removeClass('hidden-element'); // show remove button
                            $('#file-list tr[data-id='+el+'] td.smallTd a.hidden-element').removeClass('hidden-element'); // show open in new
                            $('#file-list tr[data-id='+el+'] td.actions .btn').removeClass('hidden-element'); // show download button
                        }
                    });
                },
                global: false // disable hide loader after each request
            });

            // hide loader and stop checking
            if(!$('#file-list tr').hasClass('uploading')) {
                window.hideLoader();
                clearInterval(upload_process);
            }
        }, 2000);
    }

    // Display added file in row
    // NOTE: for use another template for new file row we need add
    //       condition and special class to file input field
    $('#upload-file').bind($.browser.msie ? 'propertychange' : 'change', function() {
        var inputFile = $(this)[0].files;
        var i;
        for (i = 0; i < inputFile.length; ++i) {
            function display_languages() {
                content = $('#hidden-target-values').clone();
                content.attr('id', '');
                //content.attr('id', 'target-language-'+file_count);
                inner = content.find('select');
                inner.attr('name', 'target_language_' + file_count);
                return content;
            }
            var $filelist = $('#file-list');

            var fullname = inputFile[i]['name'];
            filename = fullname.substr(0, fullname.lastIndexOf('.'));
            var ext = fullname.substr(fullname.lastIndexOf('.'), fullname.lenght);
            source_language = $('#project-source-language').text();

            if($(this).hasClass('create_project_add_files')) {
                var row = create_project_add_files(filename, ext, file_count, source_language);
            } else {
                var row = project_add_files(filename, ext, file_count, source_language);
            }

            first_row = $('.file-meta')[0];
            if (first_row.textContent.indexOf('There are no files') >= 0) {
                //remove empty content
                $(first_row).remove();
            }
            $filelist.append(row);
            row = $filelist.find('.file-meta.newfile').last();

            // now we clone input because ff does not allow populting file inputs from js

            $('#upload-file').clone().appendTo(row.find('td.actions'));
            var new_file_input = row.find('#upload-file');
            var new_input_name = 'add_file_' + file_count;
            new_file_input.removeAttr('id').attr('name', new_input_name).addClass('hidden-element');

            try { // fix for chrome and safari
                //new_file_input.val($(this).val());
                $(new_file_input[0]).data('file', inputFile[i]);
            } catch (e) {
                console.log(e);
            }

            // Place Languages to content
            $('#target-language-' + file_count).html(display_languages());
            file_count = file_count + 1;
        }
    });

    // Add upload file
    $('#add-files').click(function() {
        $('#upload-file').click();
        return false;
    });

    function mark_file_for_remove(el) {
        trr = $(el).closest('tr');
        // Remove row if file was just added
        if (trr.hasClass('newfile')) {
            trr.remove();
            $('#upload-file').val('');
            $('#upload-file-2').val('');
            if ($('#file-list tr').length === 1) {
                content = '<tr class="file-meta">' +
                    '   <td colspan="7" class="empty-list">There are no files yet.</td>' +
                    '</tr>';
                $('#file-list').append(content);
            }
            return false;
        }
        // Check to remove later already existing file
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
        trr.find('select').each(function() {
            $(this).prop('disabled', is_disabled);
        });
        // texts
        trr.find('td').each(function() {
            $(this).removeClass(old_style).addClass(new_style);
        });
        trr.find('input[name^=is_file_removed_]').each(function(i, obj) {
            obj.value = is_disabled;
            obj.disabled = false;
        });
    }

    // Remove/Restore Files on project add files page
    $(document).on('click', 'button.remove', function() {
        mark_file_for_remove(this);

        return false;
    });

    // Remove/Restore Files on create project add files page
    $(document).on('click', '.action-button.remove a', function() {
        mark_file_for_remove(this);

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
        // add files for remove in create project add files
        $('td.actions.deactivated').each(function(i, obj) {
            if ($(obj).children('div.action-button.remove').length) {
                formData.append($(obj).children('input[name^=is_file_removed_]').attr('name'), 'remove');
            }
        });
        // add files for remove in project add files
        $('td.smallTd.deactivated').each(function(i, obj) {
            if ($(obj).children('button.remove').length) {
                formData.append($(obj).children('input[name^=is_file_removed_]').attr('name'), 'remove');
            }
        });
        return formData;
    }

    function submit(finish) {
        window.showLoader();

        $('#file-list-form').find('.newfile').addClass('uploading');
        $('#file-list-form').find('.newfile').find('.remove').addClass('hidden');
        $('#file-list-form').find('.newfile').find('.filename').each( function(i, obj){
            $(obj).append(' <span>[upload in progress]</span>');
        })

        var formData = filesList();
        var href = window.location.href;
        if (href.slice(-1) !== '/') {
            href += '/';
        }
        var xhr = new XMLHttpRequest();
        var token = $('input[name=csrfmiddlewaretoken]').val();
        formData.append('csrfmiddlewaretoken', token);
        if (finish) {
            formData.append('is_finish', finish);
        }
        xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
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
    $('.submit-form.js-add-again').click(function(ev) {
        submit(false);
        return false;
    });
    $('.submit-form.js-finish').click(function(ev) {
        submit(true);
        return false;
    });
});
