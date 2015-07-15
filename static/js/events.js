/* global Mousetrap */
var $j = jQuery.noConflict(),
    bacPos = 0,
    projects,
    initialPosProjects,
    sidebar, heightLi, headerHeight,
    projectsHeight,
    fixedLinks,
    projectsSidebarHeight, nbLiVisible,
    roundProjectsSidebarHeight, actualTop, newTop;

$j.fn.exists = function () {
    return this.length !== 0;
}

$j(function() {
	var $orderBy;
    // Hide / show sidebar

    $j('#open-usermenu').on('click', function() {
        $j('body').toggleClass('usermenu-open');
    });

    $j('#open-config').on('click', function() {
        $j('.config-dropdown').slideToggle('fast');
        $j(this).parent('.menu-config').toggleClass('open');
    });

    $j(document).on('click', '.cat-close', function() {
        if (!PTL.editor.settings.review) {
            var parent = $(this).parents().find('.fix-wrapper');
            $(this).parent().parent().find('.spellchecker').text('');
            parent.find('.is-amagama').hide();
            parent.find('.bing-translation-result').text('');
            parent.find('.google-translation-result').text('');
        }
    });

    $j('#open-menu').on('click', function(e) {
        e.stopPropagation();
        $j('body').toggleClass('sidebar-open').toggleClass('sidebar-disable');
        setTimeout(function(){ $j(window).trigger('resize'); }, 300);
    });

    if($j('body').hasClass('rating-method')){
        ratingMethodForm();
    }

    function ratingMethodForm(){
        $j(".bloc-inside-radio", $j(".has-content-hide:checked").parent()).css("display", "inline-block");
        $j(".hide-when-content", $j(".has-content-hide:checked").parent()).css("display", "none");
        $j(".bloc-inside-radio", $j(".has-content-hide:not(:checked)").parent()).css("display", "none");
        $j(".hide-when-content", $j(".has-content-hide:not(:checked)").parent()).css("display", "inline-block");
        $j('.erp-form input[type="radio"]').click(function(){
            majRadios();
        });   
    }

    function majRadios(){
        $j(".bloc-inside-radio", $j(".has-content-hide:checked").parent()).css("display", "inline-block");
        $j(".hide-when-content", $j(".has-content-hide:checked").parent()).css("display", "none");
        $j(".bloc-inside-radio", $j(".has-content-hide:not(:checked)").parent()).css("display", "none");
        $j(".hide-when-content", $j(".has-content-hide:not(:checked)").parent()).css("display", "inline-block");
    }

    function tuneSizes(){
        
        if($j('.sidebar').is(':visible')){
            $j('.hs-inner').css('max-width', ($j('#header').width()-399)+'px');
        }else{
            $j('.hs-inner').css('max-width', ($j('#header').width())+'px');
        }
        //$j('.btr-cell').css('max-width',($j('.bt-row.js-editor-copytext').width()-$j('.amagama-score').width()-46)+'px');

        var transBox = $j('.translate-translation'),
            newWidth = transBox.width() - (transBox.find('.erase-btn').outerWidth(true)-1 + transBox.find('.is-status').outerWidth(true)) - 50,
            newWidthSpell = newWidth;
        if(transBox.find('.error-alert').length){
            newWidthSpell = newWidth - 100;
        }
        $j('.spellchecker').css('max-width', newWidthSpell);
        $j('.btr-cell').css('max-width', newWidth);

        $j.each($j('.is-search .tl-item'), function (i, container) {
            var $container = $j(container);
            $container.find('.translate-overflow').css('max-width', newWidth);
        });

        var isSearch = $j('.is-search');
        isSearch.css('top', - isSearch.height() - 1);

        var tradMore = $j('.block-tradmore');
        tradMore.css('bottom', - tradMore.height() - 2);
    }
    window.tuneSizes = tuneSizes;

    function slideProjects(nextProjects, prev, next){
            actualTop = parseInt(projects.css('top'), 10);
            newTop = nextProjects ? actualTop - roundProjectsSidebarHeight : actualTop + roundProjectsSidebarHeight;

        projects.stop().animate({top: newTop}, {queue: false});
        
        if(nextProjects && actualTop == initialPosProjects){
            prev.fadeIn();
        }

        if(!nextProjects && newTop == initialPosProjects){
            prev.fadeOut();
        }

        nextProjects && newTop + projectsHeight < next.offset().top - headerHeight ? next.fadeOut() : next.fadeIn();
    }

    function setMenuNavigation(next){
        projectsSidebarHeight = sidebar.innerHeight() - initialPosProjects - fixedLinks; 
        nbLiVisible = Math.floor(projectsSidebarHeight/heightLi);
        roundProjectsSidebarHeight = nbLiVisible * heightLi;

        projectsHeight > (roundProjectsSidebarHeight+heightLi) ? next.fadeIn() : next.fadeOut();
    }

    $j(window).load(function(){
        tuneSizes();

        if($j('body').hasClass('sidebar-open') && $j('.projets').length){
            projects = $j('.projets');
            initialPosProjects = parseInt(projects.css('top'), 10);
            sidebar = $j('.sidebar'); 
            heightLi = projects.find('li').outerHeight(); 
            headerHeight = $j('header').innerHeight();
            projectsHeight = projects.innerHeight();
            fixedLinks = 2*heightLi + sidebar.find('li.s-menu').innerHeight();
            setMenuNavigation($j('#nextProjects'));

            $j('#nextProjects').on('click', function(){
                slideProjects(true, $j('#prevProjects'), $j('#nextProjects'));
                return false;
            });

            $j('#prevProjects').on('click', function(){
                slideProjects(false, $j('#prevProjects'), $j('#nextProjects'));
                return false;
            });
        }

        if($j('body').hasClass('sidebar-open') && $j('.sub-projets').length){
            projects = $j('.sub-projets');
            initialPosProjects = parseInt(projects.css('top'), 10);
            sidebar = $j('.is-submenu'); 
            heightLi = projects.find('li').outerHeight(); 
            headerHeight = $j('header').innerHeight();
            projectsHeight = projects.innerHeight();
            fixedLinks = heightLi + 20;
            setMenuNavigation($j('#sub-nextProjects'));

            $j('#sub-nextProjects').on('click', function(){
                slideProjects(true, $j('#sub-prevProjects'), $j('#sub-nextProjects'));
                return false;
            });

            $j('#sub-prevProjects').on('click', function(){
                slideProjects(false, $j('#sub-prevProjects'), $j('#sub-nextProjects'));
                return false;
            });
        }
    });

    window.tunePositions = function () {
        var $workspace = $j('.is-workspace');
        if ($workspace.length) {
            var position = $workspace.position();
            $j('.results-popup').css({
            //    right: position.left+25+19,
                top: position.top+$workspace.outerHeight(false)+19});
        }
    };
    window.tunePositions();


    // Calendar //

    if($('#calendar').length){
        $('#calendar').fullCalendar({
            header: {
                left: 'title',
                right: 'prev,next'
            },
            buttonIcons: false,
            buttonText: {
                prev: '← Previous',
                next: 'Next →'
            },
            titleFormat: 'MMMM',
            height: 700,
            allDaySlot: false,
            columnFormat: {
                month: 'dddd'
            },
            firstDay: 1,
            editable: true,
            events: [
                {
                    title: 'Project 1',
                    start: '2015-03-05',
                    end: '2015-03-14',
                    backgroundColor: '#d0e7cc'
                },
                {
                    title: 'Project 2',
                    start: '2015-03-15',
                    end: '2015-03-21',
                    backgroundColor: '#d7ebef'
                },
                {
                    title: 'Project 3',
                    start: '2015-03-09',
                    end: '2015-03-24',
                    backgroundColor: '#FFD897'
                },
                {
                    title: 'Paiment received',
                    start: '2015-03-09'
                }
            ],
            dayRender: function( date, cell ){ 
                if(!cell.hasClass('fc-past')){
                    var sisterCell = cell.parents('.fc-bg').siblings('.fc-content-skeleton').find('thead tr').find('td').eq(cell.index()),
                        hours = (cell.hasClass('fc-sat') || cell.hasClass('fc-sun')) ? 0 : 8;

                    sisterCell.append('<div class="availabilityBtn"><button>-</button><span>'+ hours +'h</span><button class="plus">+</button></div>');
                }
            }
        });
    }

    if($('#calendar-erp').length){
        $('#calendar-erp').fullCalendar({
        header: {
            left: '',
            right: 'prev,next',
            center: 'title'
        },
        buttonIcons: false,
        buttonText: {
            prev: '← Previous',
            next: 'Next →'
        },
        titleFormat: 'MMMM',
        height: 700,
        allDaySlot: false,
        columnFormat: {
            month: 'dddd'
        },
        firstDay: 1,
        editable: true,
        events: [
            {
                title: 'PROJECT COBRA (PREVIEW)',
                start: '2015-04-08',
                end: '2015-04-14',
                backgroundColor: '#9cced8',
                textColor: '#ffffff'
            },
            {
                title: 'Projet 3',
                start: '2015-04-09',
                end: '2015-04-21',
                backgroundColor: '#e7e7e7',
                textColor: '#4a4a4a'
            }
        ]
        });
    }

    if($('#calendar-erp-2').length){
        $('#calendar-erp-2').fullCalendar({
            header: {
                left: 'title',
                right: 'prev,next'
            },
            buttonIcons: false,
            buttonText: {
                prev: '← Previous',
                next: 'Next →'
            },
            //titleFormat: 'MMMM',
            titleFormat: 'MMMM[\'s overview]',
            height: 700,
            allDaySlot: false,
            columnFormat: {
                month: 'dddd'
            },
            firstDay: 1,
            editable: true,
            events: [
            {
                title: 'Projet 1',
                start: '2015-04-05',
                end: '2015-04-13',
                backgroundColor: '#ffd897',
                textColor: '#4a4a4a'
            },
            {
                title: 'Projet 3',
                start: '2015-04-09',
                end: '2015-04-23',
                backgroundColor: '#d0e7cc',
                textColor: '#4a4a4a'
            },
            {
                title: 'Projet 2',
                start: '2015-04-15',
                end: '2015-04-21',
                backgroundColor: '#d7ebef',
                textColor: '#4a4a4a'
            },
            {
                title: 'Payment received',
                start: '2015-04-09',
                end: '2015-04-10',
                /*backgroundColor: '#d0e7cc',*/
                textColor: '#4a4a4a'
            },
            ],
            //eventColor: '#d0e7cc',
            dayRender: function( date, cell ){ 
                if(!cell.hasClass('fc-past')){
                    var sisterCell = cell.parents('.fc-bg').siblings('.fc-content-skeleton').find('thead tr').find('td').eq(cell.index()),
                    hours = (cell.hasClass('fc-sat') || cell.hasClass('fc-sun')) ? 0 : 8;

                    sisterCell.append('<div class="availabilityBtn"><button>-</button><span>'+ hours +'h</span><button class="plus">+</button></div>');
                }
            }
        });
    }
    
    // Pop up //
    if($('.popup').length){
        $('.popup').magnificPopup({
          type:'inline',
          midClick: true
        });
    }

    if($('.popAddContact').length) {
        $('.popAddContact').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'popAddContact'
        });
    }

    if($('.popExistingClient').length) {
        $('.popExistingClient').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'existing-client'
        });
    }
    if($('.popClaimUser').length) {
        $('.popClaimUser').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'claim-user'
        });
    }

    if($('.popConnect').length) {
        $('.popConnect').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'popConnect'
        });
    }

    if($('.openingPopupLink').length){
        $('.openingPopupLink').magnificPopup({
            type:'inline',
            midClick: true,
            mainClass : 'openingPopup'
        });
    }
    if($('.teamingPopupLink').length){
        $('.teamingPopupLink').magnificPopup({
            type:'inline',
            midClick: true,
            mainClass : 'teamingPopup'
        });
    }
    if($('.translatingPopupLink').length){
        $('.translatingPopupLink').magnificPopup({
            type:'inline',
            midClick: true,
            mainClass : 'translatingPopup'
        });
    }
    if($('.reviewingPopupLink').length) {
        $('.reviewingPopupLink').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'reviewingPopup'
        });
    }
    if($('.deliveringPopupLink').length) {
        $('.deliveringPopupLink').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'deliveringPopup'
        });
    }
    if($('.paymentPopupLink').length) {
        $('.paymentPopupLink').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'paymentPopup'
        });
    }
    if($('.ratingPopupLink').length) {
        $('.ratingPopupLink').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'ratingPopup'
        });
    }
    if($('.pm-popup-link').length) {
        $('.pm-popup-link').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'pmPopup'
        });
    }
    if($('.contactPopup-link').length) {
        $('.contactPopup-link').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'contactPopup'
        });
    }
    if($('.selectClientPopup-link').length) {
        $('.selectClientPopup-link').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'selectClientPopup'
        });
    }
    if($('.remindMePop-link').length) {
        $('.remindMePop-link').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'remindMePop'
        });
    }
    if($('.addWorkerPopup-link').length) {
        $('.addWorkerPopup-link').magnificPopup({
            type: 'inline',
            midClick: true,
            mainClass: 'addWorkerPopup',
            callbacks: {
                open: function () {
                    var parentPopup = $(this);
                    if($('#go-back-workers').length) {
                        $('#go-back-workers').click(function(){
                            $('.mfp-bg').removeClass('viewWorkerPopup').addClass('addWorkerPopup');
                        });
                    }
                    if($('.viewWorkerPopup-link').length) {
                        $('.viewWorkerPopup-link').click(function(){
                            $('.mfp-bg').removeClass('addWorkerPopup').addClass('viewWorkerPopup');
                            
                        });
                        $('.viewWorkerPopup-link').magnificPopup({
                            type: 'inline',
                            midClick: true
                        });
                    }
                    if($('.warningPopup-link').length) {
                        $('.warningPopup-link').click(function(){
                            $('.mfp-bg').removeClass('addWorkerPopup').addClass('warningPopup');
                        });
                        $('.warningPopup-link').magnificPopup({
                            type: 'inline',
                            midClick: true
                        });
                    }
                }
            }
        });
    }

    /**
     * Created by onysko on 08.04.2015.
     */
    $(document).ready(function() {
        $('.switch-item').each(function() {
            $(this).click(function() {
                $('.switch-item').removeClass('active');
                $(this).addClass('active');
            });
        });
    });

    // Function to show file info on progress page
    $(document).ready(function(){
        $('#project-progress .expand a').click(function(){
            
            if($(this).hasClass('open')){
                $(this).css({
                    '-webkit-transform': 'rotate(0deg)',
                    '-moz-transform': 'rotate(0deg)',
                    '-ms-transform': 'rotate(0deg)',
                    '-o-transform': 'rotate(0deg)',
                    'transform': 'rotate(0deg)',
                    'zoom': 1
                }, 100);
            }else{
                $(this).css({
                    '-webkit-transform': 'rotate(90deg)',
                    '-moz-transform': 'rotate(90deg)',
                    '-ms-transform': 'rotate(90deg)',
                    '-o-transform': 'rotate(90deg)',
                    'transform': 'rotate(90deg)',
                    'zoom': 1
                }, 100);
            }
            $(this).toggleClass('open');
            var parent = $(this).parents('.progress-item');
            $('.progress-item-info', parent).slideToggle({
                duration: 1000
            });
            return false;
        });
    });

    // Loader animation //

    // TODO: use CSS 'animation' instead
    window.animateLoader = function(loader, y) {
        bacPos ++;
        y ? loader.css('background-position', '0px '+ (-bacPos) +'px') : loader.css('background-position', bacPos +'px');
        setTimeout(function(){ animateLoader(loader, y); }, 10);
    };

    window.showLoader = function() {
        if ( !$j('#loader').length ) {
            $j('<div>', {id: 'loader'}).appendTo('body');
        }
    };

    window.hideLoader = function() {
        $j('#loader').remove();
    };

    if($('#smallLoader').length) {
        // TODO: use CSS 'animation' instead
        window.animateLoader($j('#smallLoader'), true);
    }


    // Reviewer - Editor //

    $j('#view-read').on('click', function(){
        $j(this).addClass('actif').siblings().removeClass('actif');
        $j('.table-trad').addClass('reviewer');
        tuneSizes();
        return false;
    });

    $j('#view-edit').on('click', function(){
        $j(this).addClass('actif').siblings().removeClass('actif');
        $j('.table-trad').removeClass('reviewer');
        tuneSizes();
        return false;
    });

    $(document).ajaxSend(function(event, jqXHR, settings) {
        var skipURLs = ['/notifications/'],
            isSkipURL = $.inArray(settings.url, skipURLs) !== -1,
            isAsyncGET = settings.async && settings.type === 'GET';

        if ( isAsyncGET || isSkipURL ) { return; }

        window.showLoader();
    });
    $(document).ajaxStop(window.hideLoader);

    $(document).on('submit', 'form', window.showLoader);


    // Reviewer - Editor //
    $('#view-read').on('click', function(){
        $(this).addClass('actif').siblings().removeClass('actif');
        $('.table-trad').addClass('reviewer');
        PTL.editor.settings.review = true;
        PTL.editor.displayEditUnit();
        tuneSizes();
        return false;
    });

    $('#view-edit').on('click', function(){
        $(this).addClass('actif').siblings().removeClass('actif');
        $('.table-trad').removeClass('reviewer');
        PTL.editor.settings.review = false;
        PTL.editor.displayEditUnit();
        tuneSizes();
        return false;
    });


    // Stats //
    $('#open-stats').on('click', function(event){
    	var store;
    	event.preventDefault();
        $('.table-trad').slideToggle();
        $('#stats').slideToggle();
        $(this).toggleClass('actif');
        $('#tptranslate').toggleClass('white');
        $('.mfp-wrap').toggle();
        if ($(this).hasClass("actif")) {
        	store = $("#show-stats-for li.active-orderby a").data('store');
        	Stats.showStats(store);
        };
        return false;
    });

    $('.stats-link').on('click', function() {
    	Stats.showStats($(this).data("store"));
    });
    
    // Sticky footer //
    function setFooter(){
        var footer = $j('#footer'), header = $j('#header'),
            docHeight = $j('#main-container').outerHeight(true) + footer.outerHeight(true) + header.outerHeight(true) + 30,
            windowHeight = $j(window).height();
        if(footer.hasClass('bottom')){
            if (docHeight >= windowHeight) footer.removeClass('bottom');
        }
        if (docHeight < windowHeight){
            footer.addClass('bottom');
            padding_bottom = parseInt($j('#main-container').css('padding-bottom').slice(0, -2));
            $j('#main-container').css('padding-bottom', padding_bottom + footer.outerHeight(true));
        };
    }
    setFooter();

    $j(window).resize(function() {
        setFooter();
        tuneSizes();
        window.tunePositions();
        if($j('body').hasClass('sidebar-open') && $j('.projets').length){
            setMenuNavigation($j('#nextProjects'));
        }
        if($j('body').hasClass('sidebar-open') && $j('.sub-projets').length){
            setMenuNavigation($j('#sub-nextProjects'));
        }
    });

    // Orderby notifications !!! WARNING -- not only notifications
    /*$orderBy = $j('.orderby-notifs'); 
    $j('.orderby-notifs').each(function() {
    	if (!$j(this).find(".orderby-current").exists()) {    		
    		$('<span class="orderby-current"></span><i class="caret"></i>')
    			.insertBefore($j(this).find("ul"));
    	}
		var current = $j(this).find(".active-orderby").html();
		$j(this).find(".orderby-current").html(current);
    })
    $orderBy.on('click', function(){
    	var $this = $(this); 
        $this.find('ul').toggleClass('open');
        $this.find('.caret').toggleClass('dropup');
    }).find('li').on('click', function(){
        var $li = $j(this),
        	$parent = $li.parent().closest("ul"),
        	thisHtml = $li.html();
    	
        if (!$parent.parent().closest(".orderby-notifs").hasClass('prevent-loader')) {
        	window.showLoader();
        }

        $parent.find('.active-orderby').removeClass('active-orderby')
        $parent.siblings('.orderby-current').html(thisHtml);
        $li.addClass('active-orderby')
    });*/

    /* PROBLEM IN NOTIFICATIONS: duplicate active <li> with your code */
    $('.orderby-notifs').on('click', function(){
        $(this).find('ul').toggleClass('open');
    }).find('li').on('click', function(){
        var thisLi = $(this).html();
        var oldLi = $('.active-orderby').html();
        $('.active-orderby').html(thisLi);
        $(this).html(oldLi);
    });

    $('.content-dropdown').on('click', function(){
        $(this).toggleClass('open');
    }).find('li').on('click', function(){
        var thisLi = $(this).html();
        var parentAze = $(this).parent();
        var oldLi = $('.active-content-dropdown',parentAze).html();
        $('.active-content-dropdown',parentAze).html(thisLi);
        $(this).html(oldLi);
    });

    // Notifications sidebar
    $('.sidebar-notifs').on('click', '.sss-item > a', window.showLoader);

    // Close ctrlF //
    $('#closeCtrlF').on('click', function(){
        $(this).parent('.hs-inner').slideUp();
        return false;
    });

     if($("#autogrow").length){
        $("#autogrow").autoGrowTextArea();
    }

    // Close ctrlF //
    $j('#closeCtrlF').on('click', function(){
        console.log('yolo');
        $j(this).parent('.hs-inner').slideUp();
        return false;
    });

    // Accordeon sub-sidebar
    $j('.sidebar.is-submenu').find('.s-item').on('click', function(){
        $j(this).toggleClass('is-open').parent().siblings().find('.s-item').removeClass('is-open');

        return false;
    });

    $j('.table-trad').on('click', function() {
        if (!$j(this).hasClass('has-lineactive')) {
            $j(this).addClass('has-lineactive').find('.tt-row-block:first-child').addClass('active');
        }
    });
    if (!$j('.table-trad').hasClass('has-lineactive')) {
        $j('.table-trad').addClass('has-lineactive').find('.tt-row-block:first-child').addClass('active');
    }

    /* Se déplacer d'une ligne à l'autre */

    Mousetrap.bind(['command+up', 'command+down'], function (e, element) {
        if ((element == 'command+up') && $j('.tt-row-block.active').prev().length) {
            $j('.tt-row-block.active')
                .removeClass('active')
                // .parent()
                .prev()
                // .find('.tt-row-block')
                .addClass('active');
        }
        else if ((element == 'command+down') && $j('.tt-row-block.active').next().length) {
            $j('.tt-row-block.active')
                .removeClass('active')
                // .parent()
                .next()
                // .find('.tt-row-block')
                .addClass('active');
        }
        return false;
    });

    /* Afficher popup de trad */

    Mousetrap.bind('command+l', function() {
        if ($j('.tt-row-block.active').length) {
            $j('.tt-row-block.active').find('.block-tradmore').addClass('is-visible');
        }
        return false;
    });

    /* Cacher popup de trad */

    Mousetrap.bind('escape', function() {
        var blockTradmore = $j('.tt-row-block.active .block-tradmore');
        if ($j(blockTradmore).hasClass('is-visible')) {
            $j(blockTradmore).removeClass('is-visible');
            return false;
        }
    });

    /* Naviguer dans la popup de trad */

    Mousetrap.bind(['up', 'down'], function (e, element) {
        var blockTradmore = $j('.tt-row-block.active .block-tradmore'),
            currentLine = $j(blockTradmore).find('.bt-row.active');
        if (element == 'down') {
            if ($j(currentLine).next().length) {
                $j(currentLine).removeClass('active').next().addClass('active');
            }
        }
        else if (element == 'up') {
            if (!$j(currentLine).prev().hasClass('is-head')) {
                $j(currentLine).removeClass('active').prev().addClass('active');
            }
        }
        return false;
    });

    /* Selectionner le mo0t dans la popup de trad */

    Mousetrap.bind('enter', function() {
        var blockTradmoreActiveWord = $j('.tt-row-block.active .block-tradmore.is-visible .bt-row.active .btr-cell + .btr-cell').text();
        $j('.tt-row-block.active b').text(blockTradmoreActiveWord);
        $j('.block-tradmore.is-visible').removeClass('is-visible');

    });

    /* Aller à une section vide */

    Mousetrap.bind(['command+shift+up', 'command+shift+down'], function (){
        if ($j('b:empty').length) {
            $j('b:empty').eq(0).parent().parent().parent().addClass('active');
        }
    });

    $j(document).on('click', '.submit-icon', function() {
        var uid = $j(this).data('uid');
        $j('input[data-uid="' + uid + '"]').click();
    });

    $j('.progres-h2-color').css('color', $j('.progresivline-dash div:first-child').css('background-color'));

    // Click settings //
    $j('.settings').on('click', function(){
        $j(this).toggleClass('open');
        $j('.settings-block').toggleClass('open');
    });

    $('#translator-notation').find('.note').on('mousemove', function(e){
        var oneStarWidth = $(this).width() / 5, starsOffset = $(this).offset(), posMouse = e.pageX - starsOffset.left, note;

        if(posMouse <= oneStarWidth/2){
            $(this).removeClass().addClass('note note0');
            note = 0;
        }

        if(posMouse > oneStarWidth/2 && posMouse <= (oneStarWidth + oneStarWidth/2)){
            $(this).removeClass().addClass('note note1');
            note = 1;
        }

        if(posMouse > (oneStarWidth + oneStarWidth/2) && posMouse <= (2*oneStarWidth + oneStarWidth/2)){
            $(this).removeClass().addClass('note note2');
            note = 2;
        }

        if(posMouse > (2*oneStarWidth + oneStarWidth/2) && posMouse <= (3*oneStarWidth + oneStarWidth/2)){
            $(this).removeClass().addClass('note note3');
            note = 3;
        }

        if(posMouse > (3*oneStarWidth + oneStarWidth/2) && posMouse <= (4*oneStarWidth + oneStarWidth/2)){
            $(this).removeClass().addClass('note note4');
            note = 4;
        }

        if(posMouse > (4*oneStarWidth + oneStarWidth/2)){
            $(this).removeClass().addClass('note note5');
            note = 5;
        }

        $(this).on('click', function(){
            $(this).off('mousemove').removeClass().addClass('note note-blue note'+note);
        });
    });

    $('#editBillDesc').on('click', function(e){
        $(this).parents('#editedBillDescZone').fadeOut().siblings('#form-footer-invoice').fadeIn().find('textarea').focus();
        e.preventDefault();
    });
    $('#form-footer-invoice').find('a').on('click', function(e){
        $(this).parents('#form-footer-invoice').fadeOut().siblings('#editedBillDescZone').fadeIn();
        e.preventDefault();
    });

    $('#addDiscount').on('click', function(e){
        $('#newDiscount').fadeIn().find('input').eq(0).focus();
        $(this).fadeOut().siblings('.zone-btn').fadeIn();
        e.preventDefault();
    });
    $('#addDiscount').siblings('.zone-btn').find('a').on('click', function(e){
        $('#newDiscount').fadeOut();
        $(this).parents('.zone-btn').siblings('#addDiscount').fadeIn().siblings('.zone-btn').fadeOut();
        e.preventDefault();
    });

    $('#editNotes').on('click', function(e){
        $(this).fadeOut().siblings('.zone-btn').fadeIn();
        $(this).parents('.blocContact').find('p').fadeOut();
        $(this).parents('.blocContact').find('#textareaNotes').fadeIn();
        e.preventDefault();
    });
    $('#clientsNotes').find('.zone-btn').find('a').on('click', function(e){
        $(this).parents('.zone-btn').fadeOut().siblings('#editNotes').fadeIn();
        $(this).parents('.blocContact').find('p').fadeIn();
        $(this).parents('.blocContact').find('#textareaNotes').fadeOut();
        e.preventDefault();
    });
});
