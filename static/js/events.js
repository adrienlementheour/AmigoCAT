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

$j(function() {

    // Hide / show sidebar

    $j('#open-usermenu').on('click', function() {
        $j('body').toggleClass('usermenu-open');
    });

    $j('#open-config').on('click', function() {
        $j('.config-dropdown').slideToggle('fast');
        $j(this).parent('.menu-config').toggleClass('open');
    });

    $j('#open-menu').on('click', function(e) {
        e.stopPropagation();
        $j('body').toggleClass('sidebar-open').toggleClass('sidebar-disable');
        setTimeout(function(){ $j(window).trigger('resize'); }, 300);
    });

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

    function slideProjects(nextProjects){
            actualTop = parseInt(projects.css('top'), 10);
            newTop = nextProjects ? actualTop - roundProjectsSidebarHeight : actualTop + roundProjectsSidebarHeight;

        projects.stop().animate({top: newTop}, {queue: false});
        
        if(nextProjects && actualTop == initialPosProjects){
            $j('#prevProjects').fadeIn();
        }

        if(!nextProjects && newTop == initialPosProjects){
            $j('#prevProjects').fadeOut();
        }

        nextProjects && newTop + projectsHeight < $j('#nextProjects').offset().top - headerHeight ? $j('#nextProjects').fadeOut() : $j('#nextProjects').fadeIn();
    }

    function setMenuNavigation(){
        projectsSidebarHeight = sidebar.innerHeight() - initialPosProjects - fixedLinks; 
        nbLiVisible = Math.floor(projectsSidebarHeight/heightLi);
        roundProjectsSidebarHeight = nbLiVisible * heightLi;

        projectsHeight > (roundProjectsSidebarHeight+heightLi) ? $j('#nextProjects').fadeIn() : $j('#nextProjects').fadeOut();
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
            setMenuNavigation();

            $j('#nextProjects').on('click', function(){
                slideProjects(true);
                return false;
            });

            $j('#prevProjects').on('click', function(){
                slideProjects(false);
                return false;
            });
        }
    });

    window.tunePositions = function () {
        var $workspace = $j('.is-workspace');
        if ($workspace.length) {
            var position = $workspace.position();
            $j('.results-popup').css({
                right: position.left+25+19,
                top: position.top+104+$workspace.outerHeight(false)+19});
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
    
    // Pop up //
    if($('.popup').length){
        $('.popup').magnificPopup({
          type:'inline',
          midClick: true
        });
    }

    // Loader animation //

    function animateLoader(loader, y){
        bacPos ++;
        y ? loader.css('background-position', '0px '+ (-bacPos) +'px') : loader.css('background-position', bacPos +'px');
        setTimeout(function(){ animateLoader(loader, y); }, 10);
    }
    if($j('#loader').length) animateLoader($j('#loader'), false); 
    if($j('#smallLoader').length) animateLoader($j('#smallLoader'), true);


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


    // Stats //

    $j('#open-stats').on('click', function(){
        $j('.table-trad').slideToggle();
        $j('#stats').slideToggle();
        $j(this).toggleClass('actif');
        $j('#tptranslate').toggleClass('white');
    });


    // Sticky footer //
    function setFooter(){
        var footer = $j('#footer'), header = $j('#header'),
            docHeight = $j('#main-container').outerHeight(true) + footer.outerHeight(true) + header.outerHeight(true) + 30,
            windowHeight = $j(window).height();
        if(footer.hasClass('bottom')){
            if (docHeight >= windowHeight) footer.removeClass('bottom');
        }
        if (docHeight < windowHeight) footer.addClass('bottom');
    }
    setFooter();

    $j(window).resize(function() {
        setFooter();
        tuneSizes();
        window.tunePositions();
        if($j('body').hasClass('sidebar-open') && $j('.projets').length){
            setMenuNavigation();
        }
    });

    // Orderby notifications
    $j('.orderby-notifs').on('click', function(){
        $j(this).find('ul').toggleClass('open');
    }).find('li').on('click', function(){
        var thisLi = $j(this).html();
        var oldLi = $j('.active-orderby').html();
        $j('.active-orderby').html(thisLi);
        $j(this).html(oldLi);
    });


    // Textarea autogrows
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
});
