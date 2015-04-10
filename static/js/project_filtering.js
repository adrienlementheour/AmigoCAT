    $(document).ready(function() {

        var filter_table_source = $('table.sortable').html(),

            filter_submit = $('#filter_submit'),
            filter_reset  = $('#filter_reset'),
            filter_table  = $('table.sortable'),
            filter_choice = $('#project_filtering_choice'),

            filter_by_name   = $('#filter_name'),
            filter_by_source = $('#id_form-0-source_language'),
            filter_by_status = $('#filter_status');



        filter_reset.click(function() {
            filter_table.html(filter_table_source);
        });

        var hide_all_children = function(element) {
            $(element).children().each(function(i, e) {
                $(e).hide();
            });
        }

        var filter_operation = function(sortby, value) {
            hide_all_children(filter_table.find('tbody'));
            filter_table.find('thead').hide();
            
            switch(sortby) {
                case "name":
                    found = filter_table.find("tr:contains('" + value +"')");
                    found.show();
                    break;

                case "status":
                    found = $('input[value="'+value+'"]');
                    console.log(found)
                    found.each(function (i, e) {
                        $($(e).parents().get(1)).show();
                    });
                    break;

                case "source":
                    found = filter_table.find("option:selected:contains('" + value + "')");
                    found.each(function (i, e) {
                        $($(e).parents().get(2)).show();
                    });
                    break;
            }
        }

        filter_choice.on('change', function (e) {
            filter_submit.show();
            
            switch(this.value) {
                case "name":
                    hide_all_children('.project-filtering > div');
                    filter_by_name.show();

                    filter_submit.click(function() {
                        filter_operation("name", filter_by_name.val());
                    });

                    break;

                case "source":
                    hide_all_children('.project-filtering > div');

                    // clone list of languages to filter
                    langlist = filter_by_source
                                    .clone()
                                    .appendTo($('.project-filtering > div'));
                    $(langlist)
                        .removeAttr('id')         
                        .removeAttr('name');

                    filter_submit.click(function() {
                        filter_operation("source", $(langlist)
                                                    .find('option:selected')
                                                    .text()
                                        );                    
                    });

                    break;

                case "status":
                    hide_all_children('.project-filtering > div');
                    filter_by_status.show();

                    filter_submit.click(function() {
                        filter_operation("status", filter_by_status
                                                    .find('option:selected')
                                                    .text()
                                        );
                    });

                    break;

                case "none":
                    filter_submit.hide();
                    hide_all_children('.project-filtering > div');
                    break;
            }
        });

    });