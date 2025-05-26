/*
 *  Document   : app.js
 *  Author     : pixelcave
 *  Description: Custom scripts and plugin initializations (available to all pages)
 *
 *  Feel free to remove the plugin initilizations from uiInit() if you would like to
 *  use them only in specific pages. Also, if you remove a js plugin you won't use, make
 *  sure to remove its initialization from uiInit().
 */

var App = function ()
{
    /* Helper variables - set in uiInit() */
    var page, pageContent, header, footer, sidebar, sScroll;

    /* Initialization UI Code */
    var uiInit = function ()
    {
        //$.noConflict();     // Allow both $ and JQuery moniker

        // Set variables - Cache some often used Jquery objects in variables */
        page = $('#page-container');
        pageContent = $('#divFormContentRow');
        header = $('header');
        footer = $('#divFormContentRow + footer');

        sidebar = $('#sidebar');
        sScroll = $('#sidebar-scroll');

        // Scroll to top functionality
        scrollToTop();

        // Template Options, change features
        templateOptions();

        // Resize #divFormContentRow to fill empty space if exists (also add it to resize and orientationchange events)
        TriSysProUI.resizePageContent();
        $(window).resize(function () { TriSysProUI.resizePageContent(); });
        $(window).bind('orientationchange', TriSysProUI.resizePageContent);

        // Add the correct copyright year at the footer
        var yearCopy = $('#year-copy'), d = new Date();
        yearCopy.html('1994-' + d.getFullYear().toString());
    };

    /* Sidebar Functionality */
    var handleSidebar = function (mode, extra)
    {
        if (mode === 'init')
        {
            // Init sidebars scrolling functionality
            handleSidebar('sidebar-scroll');

        } else
        {
            var windowW = TriSysProUI.getWindowWidth();

            if (mode === 'toggle-sidebar')
            {
                // GL Enhancement
                // If any part of the sidebar is open (class="sidebar-nav-menu open") with a ul of style="display: block;", then
                // the sidebar does not show correctly. This code forces all to be non-open and not blocked.
                // a. Enumerate through id="scrollNavBar" and find all <li> tags
                // b. For each <li> tag, find the <a> tag and replace class="sidebar-nav-menu open" with class="sidebar-nav-menu"
                // c. For each <li> tag, find all <ul> tags and replace style="display: block;" with style="display: none;"
                $('#scrollNavBar').find('li').each(function ()
                {
                    $(this).find('a').each(function ()
                    {
                        if ($(this).hasClass('sidebar-nav-menu open'))
                            $(this).toggleClass('sidebar-nav-menu');

                        if ($(this).hasClass('open'))
                        {
                            $(this).removeClass('open');

                            // Bug fix 07 Nov 2022
                            if (!$(this).hasClass('sidebar-nav-menu'))
                                $(this).addClass('sidebar-nav-menu');
                        }
                    });

                    $(this).find('ul').each(function ()
                    {
                        $(this).hide();
                    });
                });
                // End of GL Enhancement


                if (windowW > 991)
                { // Toggle main sidebar in large screens (> 991px)
                    page.toggleClass('sidebar-visible-lg');

                    if (page.hasClass('sidebar-mini'))
                    {
                        page.toggleClass('sidebar-visible-lg-mini');
                    }
                }
                else
                {
                    // Toggle main sidebar in small screens (< 992px)
                    page.toggleClass('sidebar-visible-xs');
                }

                // Handle main sidebar scrolling functionality
                handleSidebar('sidebar-scroll');

                // Show/Hide elements
                var bMinifiedNavBar = $("#page-container").hasClass("sidebar-visible-lg-mini");
                var elemActivities = $('#nav-bar-activities');
                var elemLanguage = $('#nav-bar-language');
                if (bMinifiedNavBar)
                {
                    elemActivities.hide();
                    elemLanguage.hide();
                }
                else
                {
                    if (TriSysApex.Constants.TriSysHostedCRM)
                        if (TriSysApex.LoginCredentials.areUserCredentialsValid())
                            elemActivities.show();

                    elemLanguage.show();
                }
            }

            else if (mode === 'open-sidebar')
            {
                if (windowW > 991)
                { // Open main sidebar in large screens (> 991px)
                    if (page.hasClass('sidebar-mini')) { page.removeClass('sidebar-visible-lg-mini'); }
                    page.addClass('sidebar-visible-lg');
                } else
                { // Open main sidebar in small screens (< 992px)
                    page.addClass('sidebar-visible-xs');
                }
            }
            else if (mode === 'close-sidebar')
            {
                if (windowW > 991)
                { // Close main sidebar in large screens (> 991px)
                    page.removeClass('sidebar-visible-lg');
                    if (page.hasClass('sidebar-mini')) { page.addClass('sidebar-visible-lg-mini'); }
                } else
                { // Close main sidebar in small screens (< 992px)
                    page.removeClass('sidebar-visible-xs');
                }
            }
            else if (mode == 'sidebar-scroll')
            { // Handle main sidebar scrolling
                if (page.hasClass('sidebar-mini') && page.hasClass('sidebar-visible-lg-mini') && (windowW > 991))
                { // Destroy main sidebar scrolling when in mini sidebar mode
                    if (sScroll.length && sScroll.parent('.slimScrollDiv').length)
                    {
                        sScroll
                            .slimScroll({ destroy: true });
                        sScroll
                            .attr('style', '');
                    }
                }
                else if ((page.hasClass('header-fixed-top') || page.hasClass('header-fixed-bottom')))
                {
                    var sHeight = $(window).height();

                    if (sScroll.length && (!sScroll.parent('.slimScrollDiv').length))
                    { // If scrolling does not exist init it..
                        sScroll
                            .slimScroll({
                                height: sHeight,
                                color: '#fff',
                                size: '3px',
                                touchScrollStep: 100
                            });

                        // Handle main sidebar's scrolling functionality on resize or orientation change
                        var sScrollTimeout;

                        $(window).on('resize orientationchange', function ()
                        {
                            clearTimeout(sScrollTimeout);

                            sScrollTimeout = setTimeout(function ()
                            {
                                handleSidebar('sidebar-scroll');
                            }, 150);
                        });
                    }
                    else
                    { // ..else resize scrolling height
                        sScroll
                            .add(sScroll.parent())
                            .css('height', sHeight);
                    }
                }
            }
        }

        return false;
    };

    /* Scroll to top functionality */
    var scrollToTop = function ()
    {
        // Get link
        var link = $('#to-top');

        $(window).scroll(function ()
        {
            // If the user scrolled a bit (150 pixels) show the link in large resolutions
            if (($(this).scrollTop() > 150) && (TriSysProUI.getWindowWidth() > 991))
            {
                link.fadeIn(100);
            } else
            {
                link.fadeOut(100);
            }
        });

        // On click get to top
        link.click(function ()
        {
            $('html, body').animate({ scrollTop: 0 }, 400);
            return false;
        });
    };

    
    /* Template Options, change features functionality */
    var templateOptions = function ()
    {
        /* Header options */
        header.removeClass('navbar-default').addClass('navbar-inverse');    // TriSys Apex Mod 12/02/15
    };

        return {
        init: function ()
        {
            uiInit(); // Initialize UI Code
        },
        sidebar: function (mode, extra)
        {
            handleSidebar(mode, extra); // Handle sidebars - access functionality from everywhere
        }
    };
}();

/* Initialize app when page loads */
//$(function () { App.init(); });       // TriSys Apex Mod 12/02/15

// Call these separately AFTER we have initialised TriSys menus from .json files
var TriSysProUI =
{
    CurrentThemeName: 'default',
    DisplayCurrentThemeName: function ()
    {
        try
        {
            $('#user-options-current-theme-name').html(TriSysProUI.CurrentThemeName);

        } catch (e)
        {

        }
    },

    // Used to deal with the anomaly that we get either the full CSS path or a capitalised name
    CurrentThemeNameLike: function(sTheme)
    {
        if (sTheme)
        {
            try
            {
                var sTheme = sTheme.toLowerCase();
                var sCurrentThemeName = TriSysProUI.CurrentThemeName.toLowerCase();
                var bMatch = (sTheme == sCurrentThemeName || sCurrentThemeName.indexOf(sTheme) > 0);
                return bMatch;

            } catch (e)
            {

            }
        }
    },

    /* Sidebar Navigation functionality */
    handleNav: function ()
    {

        // Animation Speed, change the values for different results
        var upSpeed = 250;
        var downSpeed = 250;

        // Get all vital links
        var menuLinks = $('.sidebar-nav-menu');
        var submenuLinks = $('.sidebar-nav-submenu');
        var page = $('#page-container');

        // Primary Accordion functionality
        menuLinks.click(function ()
        {
            var link = $(this);

            if (page.hasClass('sidebar-mini') && page.hasClass('sidebar-visible-lg-mini') && (TriSysProUI.getWindowWidth() > 991))
            {
                if (link.hasClass('open'))
                {
                    link.removeClass('open');
                }
                else
                {
                    $('.sidebar-nav-menu.open').removeClass('open');
                    link.addClass('open');
                }
            }
            else if (!link.parent().hasClass('active'))
            {
                if (link.hasClass('open'))
                {
                    link.removeClass('open').next().slideUp(upSpeed, function ()
                    {
                        TriSysProUI.handlePageScroll(link, 200, 300);
                    });

                    // Resize #divFormContentRow to fill empty space if exists
                    setTimeout(TriSysProUI.resizePageContent, upSpeed);
                }
                else
                {
                    $('.sidebar-nav-menu.open').removeClass('open').next().slideUp(upSpeed);
                    link.addClass('open').next().slideDown(downSpeed, function ()
                    {
                        TriSysProUI.handlePageScroll(link, 150, 600);
                    });

                    // Resize #divFormContentRow to fill empty space if exists
                    setTimeout(TriSysProUI.resizePageContent, ((upSpeed > downSpeed) ? upSpeed : downSpeed));
                }
            }

            return false;
        });

        // Submenu Accordion functionality
        submenuLinks.click(function ()
        {
            var link = $(this);

            if (link.parent().hasClass('active') !== true)
            {
                if (link.hasClass('open'))
                {
                    link.removeClass('open').next().slideUp(upSpeed, function ()
                    {
                        TriSysProUI.handlePageScroll(link, 200, 300);
                    });

                    // Resize #divFormContentRow to fill empty space if exists
                    setTimeout(TriSysProUI.resizePageContent, upSpeed);
                }
                else
                {
                    link.closest('ul').find('.sidebar-nav-submenu.open').removeClass('open').next().slideUp(upSpeed);
                    link.addClass('open').next().slideDown(downSpeed, function ()
                    {
                        TriSysProUI.handlePageScroll(link, 150, 600);
                    });

                    // Resize #divFormContentRow to fill empty space if exists
                    setTimeout(TriSysProUI.resizePageContent, ((upSpeed > downSpeed) ? upSpeed : downSpeed));
                }
            }

            return false;
        });
    },

    /* Gets window width cross browser */
    getWindowWidth: function ()
    {
        return window.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth;
    },

    /* Scrolls the page (static layout) or the sidebar scroll element (fixed header/sidebars layout) to a specific position - Used when a submenu opens */
    handlePageScroll: function (sElem, sHeightDiff, sSpeed)
    {
        var page = $('#page-container');
        var header = $('header');

        if (!page.hasClass('disable-menu-autoscroll'))
        {
            var elemScrollToHeight;

            // If we have a static layout scroll the page
            if (!header.hasClass('navbar-fixed-top') && !header.hasClass('navbar-fixed-bottom'))
            {
                var elemOffsetTop = sElem.offset().top;

                elemScrollToHeight = (((elemOffsetTop - sHeightDiff) > 0) ? (elemOffsetTop - sHeightDiff) : 0);

                $('html, body').animate({ scrollTop: elemScrollToHeight }, sSpeed);
            } else
            { // If we have a fixed header/sidebars layout scroll the sidebar scroll element
                var sContainer = sElem.parents('#sidebar-scroll');
                var elemOffsetCon = sElem.offset().top + Math.abs($('div:first', sContainer).offset().top);

                elemScrollToHeight = (((elemOffsetCon - sHeightDiff) > 0) ? (elemOffsetCon - sHeightDiff) : 0);
                sContainer.animate({ scrollTop: elemScrollToHeight }, sSpeed);
            }
        }
    },

    /* Resize #divFormContentRow to fill empty space if exists */
    resizePageContent: function ()
    {
        var page = $('#page-container');
        var pageContent = $('#divFormContentRow');

        var header = $('header');
        var footer = $('#divFormContentRow + footer');
        var sidebar = $('#sidebar');
        var sScroll = $('#sidebar-scroll');

        var windowH = $(window).height();
        var sidebarH = sidebar.outerHeight();
        var headerH = header.outerHeight();
        var footerH = footer.outerHeight();

        // If we have a fixed sidebar/header layout or each sidebars’ height < window height
        if (header.hasClass('navbar-fixed-top') || header.hasClass('navbar-fixed-bottom') || ((sidebarH < windowH)))
        {
            if (page.hasClass('footer-fixed'))
            { // if footer is fixed don't remove its height
                pageContent.css('min-height', windowH - headerH + 'px');
            } else
            { // else if footer is static, remove its height
                pageContent.css('min-height', windowH - (headerH + footerH) + 'px');
            }
        } else
        { // In any other case set #divFormContentRow height the same as biggest sidebar's height
            if (page.hasClass('footer-fixed'))
            { // if footer is fixed don't remove its height
                pageContent.css('min-height', sidebarH - headerH + 'px');
            } else
            { // else if footer is static, remove its height
                pageContent.css('min-height', sidebarH - (headerH + footerH) + 'px');
            }
        }
    },

    // GL/AC Feb 2015: Change KendoUI to use this newly selected theme.
    kendoUI_Overrides: function ()
    {
        var lNavBarInverseColour = TriSysProUI.NavBarInverseColour();
        var lBackColour = TriSysProUI.BackColour();
        var lGroupBackColour = TriSysProUI.GroupBackColour();
        var rBackColour = TriSysProUI.RowBackColour();
        var hoverBackColour = TriSysProUI.AlternativeBlockTitleBackColour();
        var lNavBarFixedTopInverseColour = TriSysProUI.NavBarFixedTopInverseColour();
        var lColour = TriSysProUI.NavBarInverseBackColour();

        var taskColour = TriSysProUI.ThemedSidebarBackgroundLight(0.65);
        var lColorCar = TriSysProUI.BackColour(0.2);        // See perm chart
        var lGridHeaderBackColor = lGroupBackColour;        // Looks more professional

        if (!hoverBackColour)
            hoverBackColour = rBackColour;

        //$('.k-state-selected').css("background-color", lNavBarInverseColour);

        //append new style to the head of index to leave a lasting css change.
        //appending css to a div will only change that element. On load of a new div, the element doesn't "remember" the css setting, as it is a new element.
        //creating a whole new inline style will effect every div with that CLASS or ID.

        // 10 Apr 2024: Upgraded to latest JQuery and KendoUI
        var sThemedColour = TriSysProUI.ThemedColour();
        var sLightThemedColour = TriSysProUI.ThemedColour(0.2);

        // FFS SVG!
        // stroke='%23ff6358'
        var sThemedStrokeColour = sThemedColour.replace('#', '');

		// 26 Nov 2024: Finally set the global colour as a variable we can use in CSS
        document.documentElement.style.setProperty('--trisys-theme', TriSysProUI.rgbToHex(sThemedColour));
        document.documentElement.style.setProperty('--trisys-thin-grey-line', TriSysProUI.rgbToHex(lBackColour));

        // 16 Jan 2021: Latest KendoUI - do we need these old styles?
        var bOverrideKendoUIStyles = true;

        if (bOverrideKendoUIStyles)
        {

            //if the inline style already exists, replace its content
            //Alex
            var sKendoUIHTML = ''
                                + '.k-alt {'
                                + 'background-color:' + lGroupBackColour + '; '
                                + '}'
                                + '.k-state-selected {'
                                + 'background-color:' + lNavBarInverseColour + '; '
                                + 'border-color:' + lNavBarInverseColour + ';'
                                + '}'
                                + '.k-state-selected:link {'
                                + 'background-color:' + lNavBarInverseColour + '; '
                                + 'border-color:' + lNavBarInverseColour + ';'
                                + '}'
                                + '.k-state-selected:visited {'
                                + 'background-color:' + lNavBarInverseColour + '; '
                                + 'border-color:' + lNavBarInverseColour + ';'
                                + '}'
                                + '.k-state-highlighted {'
                                + 'background-color:' + lNavBarInverseColour + '; '
                                + 'border-color:' + lNavBarInverseColour + ';'
                                + '}'
                                + '.k-button {'
                                + 'background-color: #FFFFFF; '
                                + 'color:' + lBackColour + ';'
                                + 'border-color:' + lBackColour + ';'
                                + '}'
                                // This used to cause grid contact preview buttons to highlight badly
                                // However now this works for the grid "Open" button
                                + '.k-button:hover,.k-button.k-state-hover {'
                                + 'background-color:' + lBackColour + '!important; '
                                + 'background-image: none;'
                                + 'border-color:' + lBackColour + '!important;'
                                + 'color:' + '#FFF' + ';'
                                + '}'
                                // This causes grid filter buttons to act like fuckwits!
                                + '.k-select:hover, .k-state-hover{'
                                + 'background-color:' + lBackColour + '; '
                                + 'background-image: none;'
                                + 'border-color:' + lBackColour + ';'
                                + 'color:' + '#FFF' + ';'
                                + '}'
                                + '' //'.k-item:hover, .k-state-hover{'     TREE VIEW .k-item:hover renders all items highlighted
                                // This may causes grid contact preview buttons to highlight badly
                                //+ '.k-state-hover{'
                                //+ 'background-color:' + lBackColour + '; !important'
                                //+ 'background-image: none; !important'
                                //+ 'border-color:' + lBackColour + '; !important'
                                //+ 'color:' + '#FFF' + '; !important'
                                //+ '}'
                                //+ '.k-list>.k-state-selected.k-state-focused  {'
                                //+ 'background-color:' + lBackColour + '; '
                                //+ 'background-image: none;'
                                //+ 'border-color:' + lBackColour + ';'
                                //+ 'color:' + '#FFF' + ';'
                                //+ '}'
                                //+ '.k-autocomplete.k-state-hover, .k-picker-wrap.k-state-hover, .k-numeric-wrap.k-state-hover, .k-dropdown-wrap.k-state-hover  {'
                                //+ 'background-color:' + lBackColour + '; '
                                //+ 'background-image: none;'
                                //+ 'border-color:' + lBackColour + ';'
                                //+ 'color:' + '#FFF' + ';'
                                //+ '}'
                                + '.k-state-hover, .k-state-hover:hover, .k-splitbar-horizontal-hover:hover, .k-splitbar-vertical-hover:hover, .k-list>.k-state-hover,'
                                + ' .k-schedulerX .k-scheduler-toolbar ul li.k-state-hover, .k-pager-wrap .k-link:hover, .k-dropdown .k-state-focused, .k-filebrowser-dropzone,'
                                + ' .k-mobile-list .k-item>.k-link:active, .k-mobile-list .k-item>.k-label:active, .k-mobile-list .k-edit-label.k-check:active, .k-mobile-list .k-recur-view .k-check:active {'
                                + 'background-color:' + lBackColour + '; '
                                + 'background-image: none;'
                                + 'border-color:' + lBackColour + ';'
                                + 'color:' + '#FFF' + ';'
                                + 'color:' + 'red' + ';'
                                + '}'
                                //+ '.k-autocomplete.k-state-focused,.k-picker-wrap.k-state-focused,.k-numeric-wrap.k-state-focused,.k-dropdown-wrap.k-state-focused,.k-multiselect.k-header.k-state-focused  {'
                                //+ 'background-color:' + lBackColour + '; '
                                //+ 'background-image: none;'
                                //+ 'border-color:' + lBackColour + ';'
                                //+ '}'
                                //+ '.k-textbox:hover, .k-tiles li.k-state-hover  {'
                                //+ 'border-color:' + lBackColour + ';'
                                //+ '}'
                                //+ '.k-state-focused, .k-list>.k-state-focused, .k-listview>.k-state-focused, .k-grid-header th.k-state-focused, td.k-state-focused, .k-button.k-state-focused  {'
                                //+ 'box-shadow: inset 0 0 0 1px ' + lBackColour + ';'
                                //+ '}'
                                + '.k-popup .k-list .k-item, .k-fieldselector .k-list .k-item  {'
                                + 'border-color:' + lBackColour + ';'
                                + 'box-shadow: none;'
                                + '}'
                                //+ '.k-state-hover {'
                                //+ 'background-color:' + lNavBarInverseColour + '!important; '
                                //+ '}'
                                //+ '.k-grid table tr:hover {'
                                //+ 'background: ' + hoverBackColour + ';'
                                //+ 'color:#787878;'
                                //+ '}'
                                + '.k-state-selected tr {'
                                + 'background-color:' + lNavBarInverseColour + '; '
                                + 'border-color:' + lNavBarInverseColour + ';'
                                + '}'
                                //+ '.k-primary {'
                                //+ 'background-color:' + lBackColour + '; '
                                //+ 'border-color:' + lBackColour + ';'
                                //+ 'color: #FFF;'
                                //+ '}'
                                //+ '.k-grid tbody .k-button, .k-grid tbody button.k-button {'
                                //+ 'background-color:' + rBackColour + '!important; '
                                //+ 'border-color:' + lBackColour + '!important;'
                                //+ 'height: 25px;'
                                //+ '}'
                                //+ '.k-pager-wrap>.k-link {'
                                //+ 'padding: 0px !important; '
                                //+ 'padding: 0px !important; '
                                //+ '}'
                                //+ '.k-pager-numbers .k-link, .k-treeview .k-in {'
                                //+ 'padding: 0px !important; '
                                //+ '}'
                                //+ 'td a.k-button:visited {'
                                //+ 'background-color:' + lBackColour + '!important;'
                                //+ 'color: #FFF;'
                                //+ '}'

                                // Grid Row Selection. First group below was same as first!
                                + '.k-state-selected, .k-state-selected:link, .k-state-selected:visited, .k-list > .k-state-selected'
                                + ', .k-list > .k-state-highlight, .k-panel > .k-state-selected'
                                + ', .k-ghost-splitbar-vertical, .k-ghost-splitbar-horizontal, .k-draghandle.k-state-selected:hover'
                                + ', .k-schedulerX .k-scheduler-toolbar .k-state-selected, .k-schedulerX .k-today.k-state-selected, .k-marquee-color {'
                                + ' color: #fff;'
                                //+ ' background-color: ' + TriSysProUI.LightenColour(lBackColour, 0.25) + '!important;'
                                //+ ' border-color: ' + TriSysProUI.LightenColour(lBackColour, 0, 25) + '!important;'
                                + ' background-color: ' + lBackColour + '!important;'
                                + ' border-color: ' + lBackColour + '!important;'
                                + '}'
                                + '.k-state-hover, .k-state-hover:hover, .k-splitbar-horizontal-hover:hover, .k-splitbar-vertical-hover:hover, .k-list > .k-state-hover, .k-schedulerX .k-scheduler-toolbar ul li.k-state-hover, .k-pager-wrap .k-link:hover, .k-dropdown .k-state-focused, .k-filebrowser-dropzone, .k-mobile-list .k-item > .k-link:active, .k-mobile-list .k-item > .k-label:active, .k-mobile-list .k-edit-label.k-check:active, .k-mobile-list .k-recur-view .k-check:active {'
                                + ' color: #fff;'
                                + ' background-color: ' + lBackColour + '!important;'
                                + ' border-color: ' + lBackColour + '!important;'
                                + '}'
                                + '.k-state-focused.k-state-selected, .k-list > .k-state-focused.k-state-selected, .k-listview > .k-state-focused.k-state-selected, td.k-state-focused.k-state-selected {'
                                + '    -webkit-box-shadow: inset 0 0 3px 1px ' + lBackColour + '!important;'
                                + '    box-shadow: inset 0 0 3px 1px ' + lBackColour + '!important;'
                                + '}'

                                //+ 'td a.k-button:focus {'
                                //+ 'background-color:' + lBackColour + '!important;'
                                //+ 'box-shadow: inset 0 0 0 1px ' + lBackColour + ' !important;'
                                //+ 'color: #FFF;'
                                //+ '}'
                                //+ 'td a.k-button:hover {'
                                //+ 'background-color:' + lBackColour + '!important;'
                                //+ 'color: #FFF;'
                                //+ '}'
                                //+ 'td a.k-button:target {'
                                //+ 'background-color:' + lBackColour + '!important;'
                                //+ 'color: #FFF;'
                                //+ '}'
                                //+ '.k-button:focus:not(.k-state-disabled):not([disabled]) {'
                                //+ '-webkit-box-shadow: inset 0 0 0 1px ' + lBackColour + ' !important;'
                                //+ ' background-image: none;'
                                //+ ' color:' + '#FFF' + ';'
                                //+ ' box-shadow: inset 0 0 0 1px ' + lBackColour + ' !important;'
                                //+ 'background-color:' + lBackColour + '; '
                                //+ 'border-color:' + lBackColour + ';'
                                //+ '}'
                                + '.k-state-selected, .k-state-selected:link, .k-state-selected:visited, .k-list>.k-state-selected,'
                                + ' .k-list>.k-state-highlight, .k-panel>.k-state-selected, .k-ghost-splitbar-vertical, .k-ghost-splitbar-horizontal,'
                                + ' .k-draghandle.k-state-selected:hover, .k-schedulerX .k-scheduler-toolbar .k-state-selected, .k-schedulerX .k-today.k-state-selected, .k-marquee-color {'
                                + 'background-color:' + lBackColour + '; '
                                + 'border-color:' + lBackColour + ';'
                                + '}'
                                + '.k-state-hover>.k-link, .k-other-month.k-state-hover .k-link, div.k-filebrowser-dropzone em{'
                                + 'background-color:' + lBackColour + '; '
                                + ' background-image: none !important; '
                                + 'border-color:' + lBackColour + ';'
                                + '}'
                                + '.k-dropdown .k-state-focused .k-input {'
                                + 'color: #FFF;'
                                + '}'
                                + '.k-slider .k-draghandle {'
                                + 'background-color:' + lBackColour + '; '
                                + ' background-image: none !important; '
                                + 'border-color:' + lBackColour + ';'
                                + 'box-shadow:none;'
                                + '}'
                                + '.k-slider k-state-selected k-state-focused .k-draghandle {'
                                + 'background-color:' + lBackColour + '; '
                                + ' background-image: none !important; '
                                + 'border-color:' + lBackColour + ';'
                                + 'box-shadow:none;'
                                + '}'
                                + '.k-slider-horizontal .k-slider-selection {'
                                + 'background-color:' + lBackColour + '; '
                                + 'background-image: none !important; '
                                + 'border-color:' + lBackColour + ';'
                                + 'box-shadow:none;'
                                + '}'
                                + '.k-widget.k-tooltip.k-slider-tooltip {'
                                + 'background-color:' + lBackColour + '; '
                                + 'background-image: none !important; '
                                + 'border-color:' + lBackColour + ';'
                                + '}'
                                + '.k-callout-s{border-top-color: ' + lBackColour + '!important;'
                                + '}'
                                + 'div.jqi .jqibuttons button.jqidefaultbutton {'
                                + 'color:' + lBackColour + '!important;'
                                + '}'
                                + 'div.jqi .jqibuttons button {'
                                + 'color:' + lBackColour + '!important;'
                                + '}'
                                + 'div.jqi .jqibuttons button:hover, div.jqi .jqibuttons button:focus {'
                                + 'color:' + lNavBarInverseColour + '!important;'
                                + '}'
                                + '.k-event, .k-task-complete {'
                                + ' border-color: ' + lBackColour + '!important;'
                                + ' background: ' + taskColour + ' 0 -257px none repeat-x' + '!important;'
                                + ' color: gray;'
                                + '}'
                                + '.k-scheduler-timecolumn {'
                                + ' width: 8em;'
                                + '}'
                                + '.k-window'
                                + '{'
                                + ' z-index: 99999 !important;'
                                + '}'
                                + '.k-grid-header .k-header {'
                                + ' background-color: ' + lGridHeaderBackColor + ';'
                                + '}';

            // 16 Jan 2021: GL Tweaks
            var sBorderColour = '#DADADA';
            var sGridHeaderTextColour = '#787878';

            sKendoUIHTML += '.k-popup.k-calendar-container, .k-popup.k-list-container' +
                            '{' +
                            '   background-color: white;' +
                            '}' +
                            // This is the little fucker which breaks row selection!
                            //'.k-animation-container, .k-animation-container *, .k-animation-container :after, ' +
                            //'   .k-block .k-header, .k-list-container, .k-widget, .k-widget *, .k-widget :before' +
                            //'{' +
                            //'   background-color: white;' +
                            //'}' +
                            '.k-grid-header th.k-header, .k-header>.k-grid-filter, .k-header>.k-header-column-menu, .k-grid-header th.k-with-icon .k-link {' +
                            '   box-shadow: inset 0 0 0 1px ' + lGridHeaderBackColor + ';' +
                            '   background-color: ' + lGridHeaderBackColor + ';' +
                            '   color: ' + sGridHeaderTextColour + ';' +
                            '}' +
                            '.k-grid-header th.k-header>.k-link' +
                            '{' +
                            '   font-weight: bold;' +
                            '}' +
                            '.k-grid, .k-grid-toolbar, .k-grouping-header, div.k-grid-footer, div.k-grid-header, .k-pager-wrap, .k-grid td,' +
                            '   .k-filter-row th, .k-grid-header th.k-header, k-filter-row, .k-grid-footer-wrap, .k-grid-header-wrap, ' +
                            '   .k-widget, .k-textbox, .k-dropdown-wrap' +
                            '{' +
                            '   border-color: ' + sBorderColour + ';' +
                            '}' +
                            '.k-animation-container, .k-animation-container *, .k-animation-container :after, .k-block .k-header, .k-list-container, .k-widget, .k-widget *, .k-widget :before' +
                            '{' +
                            '   border-color: ' + sBorderColour + ';' +
                            '}' +
                            //'.k-icon, .k-tool-icon, span.k-icon.k-i-filter, span.k-icon.k-i-calendar, span.k-link.k-link-time, ' +
                            //'   .k-calendar .k-nav-next .k-icon, .k-calendar .k-nav-prev .k-icon, .k-reset' +
                            //'{' +
                            //'   color: ' + lBackColour + '!important;' +
                            //'}' +
                            // Causes date controls to fuck up
                            //'span.k-select' +
                            //'{' +
                            //'   line-height: 1em;' +
                            //'}' +
                            '.k-reset, .k-column-menu, .k-filter-menu, .k-column-menu.k-popup.k-group.k-reset, .k-filter-menu-container' +
                            '{' +
                            '   font-size: 12px;' +
                            '}' +
                            'textarea' +
                            '{' +
                            '   padding: 6px!important;' +
                            '}' +
                            'li.k-item' +
                            '{' +
                            '   color: black;' +
                            '}' +
                            '.k-i-more-vertical:before' +
                            '{' +
                            '   background-color: ' + lGridHeaderBackColor + ';' +
                            '}' +
                            'input[type="checkbox"]' +
                            '{' +
                            '   margin-right: 8px;' +
                            //'   color: ' + lBackColour + ';' +        // If enabled, this hides the grid check box when selected
                            '}' +
                            // Exception for grid check boxes
                            //'td.input[type="checkbox"]' +
                            //'{' +
                            //'   color: ' + lNavBarInverseColour + ';' +
                            //'}' +
                            'a.k-link > span > strong' +
                            '{' +
                            '   background-color: ' + lGridHeaderBackColor + ';' +
                            '}' +
                            'a.k-button.k-button-icontext.themed-background.k-grid-Open:hover ' +
                            '{' +
                            '   background-color: ' + lBackColour + ';' +
                            '   colour: white;' +
                            '}' +
                            '.k-dropdown-wrap .k-select:hover, .k-selectbox .k-select:hover' +      // latest - 1
                            '{' +
                            '   color: white;' +
                            '}' +

                            //  Grid pagers
                            'a.k-pager-refresh.k-link, a.k-link.k-pager-nav' +
                            // , span.k-dropdown-wrap.k-state-default' +                            // This would make the text and arrow coloured
                            '{' +
                            '   color: ' + lBackColour + ';' +
                            '}' +
                            'a.k-pager-refresh.k-link:hover, a.k-link.k-pager-nav:hover' +
                            '{' +
                            '   background-color: ' + lBackColour + ';' +
                            '   color: white;' +
                            '}' +
                            '.k-pager-sizes span.k-dropdown-wrap.k-state-default.k-state-hover' +
                            ', .k-pager-sizes span.k-dropdown-wrap.k-state-default.k-state-hover span.k-select' +
                            ', .k-pager-sizes span.k-dropdown-wrap.k-state-default.k-state-focused.k-state-active span.k-select' +
                            '{' +
                            '   color: white !important;' +
                            '}' +
                            //'a.k-link.k-pager-nav.k-pager-first:hover, a.k-link.k-pager-nav.k-pager-last:hover' +
                            //'{' +
                            //'   background-color: ' +lBackColour + ';' +
                            //'   color: white;' +
                            //'}' +
                        
                            // 21 Jan 2021: See TriSysSDK.js: Grid: pageable:
                            'span.k-pager-sizes.k-label, span.k-pager-info.k-label' +
                            '{' +
                            '   display: block;' +
                            '}' +
    
                            // 21 Jan 2021: Turn off vertical scrollbar on grid
                            '.k-grid-content.k-auto-scrollable' +
                            '{' +
                            '   overflow-y: hidden;' +
                            '}' +
                            'div.k-grid-header, div.k-grid-footer' +
                            '{' +
                            '   padding-right: 0px !important;' +
                            '}' +

                            // Grid row selection
                            'tr.k-master-row.k-state-selected' +
                            '{' +
                            '   background-color:' + lNavBarInverseColour + '; ' +      // FFS Garry!
                            '   border-color:' + lNavBarInverseColour + ';' +
                            '}' +
                            'tr.k-alt.k-master-row' +
                            '{' +
                            '   background-color:' + lGroupBackColour + ';' +
                            '}' +
                            //'ul.k-group.k-menu-group.k-popup.k-reset, .k-filterable.k-content, ' +
                            //'.k-column-menu>.k-menu' + //, .k-popup .k-animation-container .k-popup' + 
                            //'.k-column-menu.k-popup.k-group.k-reset.k-state-border-up' +
                            '.k-animation-container, .k-widget.k-window, .k-multiselect-wrap:hover' +
                            '{' +
                            '   background-color: white;' +
                            '}' +
                            'ul.k-group.k-menu-group.k-popup.k-reset' +
                            '{' +
                            '   border: 1px solid ' + lNavBarInverseColour + ';' +
                            '   min-width: 200px;' +
                            '   background-color: white;' +     // Latest Sun 19:51 to fix CV Manager
                            '}' +
                            'span.k-dropdown-wrap.k-state-default.k-state-hover, span.k-icon.k-i-calendar:hover' +
                            '{' +
                            '   color: white;' +
                            '}' +
                            'span.k-icon.k-i-more-vertical, span.k-icon.k-i-collapse, span.k-icon.k-i-expand' +
                            '{' +
                            '   color: ' + lBackColour + ';' +
                            '}' +
                            'span.k-widget.k-autocomplete.k-autocomplete-clearable.k-state-default.k-state-hover' +
                            ' , .k-combobox .k-input, .k-numeric-wrap .k-input, .k-picker-wrap .k-input' +
                            '{' +
                            '   color: black;' +
                            '}' +
                            '.k-multiselect-wrap li' +
                            '{' +
                            '   padding-right: 2em;' +
                            '}' +
                            'span.k-icon.k-i-close' +
                            '{' +
                            '   padding-top: 7px;' +
                            '}' +
                            'k-widget.k-multiselect.k-multiselect-clearable.k-state-hover' +
                            '{' +
                            '   background-color: white;' +
                            '}' +
                            'k-multiselect' +
                            '{' +
                            '   border: 1px solid ' + lNavBarInverseColour + ';' +
                            '}' +
                            '.k-multiselect-wrap>.k-i-close' +
                            '{' +
                            '   color: ' + lBackColour + ';' +
                            '}' +
                            // Highlight query builder - turned off as too much I think?
                            //'.query-builder .rule-container .rule-value-container:hover' +
                            //'{' +
                            //'   border: 1px solid ' + lBackColour + ';' +
                            //'   border-radius: 5px;' +
                            //'}' +
                            // For Action attachments
                            '.k-combobox-clearable .k-input, .k-dropdowntree-clearable .k-dropdown-wrap .k-input, ' +
                            ' .k-dropdowntree-clearable .k-multiselect-wrap, .k-multiselect-clearable .k-multiselect-wrap' +
                            '{' +
                            '   height: 28px;' +
                            '}' +
                            'li.k-button' +
                            '{' +
                            '   height: 26px;' +
                            '}' +
                            // Date/time picker
                            //'.k-picker-wrap .k-select' +
                            //'{' +
                            //'   line-height: 1em;' +
                            //'}' +
                            '.k-datetimepicker .k-picker-wrap .k-icon' +
                            '{' +
                            '   margin: 0 2px 8px!important;' +     // Example of overriding a stubborn base style
                            '}' +
                            // Attributes/Skill tree
                            '.k-treeview .k-in' +
                            '{' +
                            '   border: 0!important;' +
                            '   padding: 2px!important;' +
                            '   line-height: 1.5em!important' +
                            '}' +
                            // Diary manager
                            '.k-scheduler-toolbar, .k-scheduler-content' +
                            '{' +
                            '   background-color: white;' +
                            '}' +
                            '.k-scheduler-header' +
                            '{' +
                            '   background-color: ' + lGridHeaderBackColor + ';' +
                            '}' +
                            '.k-today' +
                            '{' +
                            '   background-color: ' + lGridHeaderBackColor + '!important;' +
                            '}' +
                            'a.k-nav-current' +
                            '{' +
                            '   padding-left: 10px;' +
                            '   padding-top: 4px;' +
                            '   padding-bottom: 4px;' +
                            '   padding-right: 8px;' +
                            '}' +
                            'a.k-nav-current:hover' +
                            '{' +
                            '   background-color: ' + lBackColour + '!important;' +
                            '   color: white!important;' +
                            '}' +
                            // The contact preview grid button has to deal with being the row being highlighted
                            //'a.k-grid-divContactGrid-previewButton.k-button, a.k-grid-divContactGrid-previewButton.k-button:hover' +
                            'a[class*="-previewButton"]' +
                            '{' +
                            '   color: ' + TriSysProUI.LightenColour(lNavBarInverseColour, 0.2) + ';' +
                            '}' +
                            'a[class*="-previewButton"]:hover' +
                            '{' +
                            '   color: ' + lNavBarInverseColour + ';' +
                            '}' +
                            // Grid row hover
                            '.k-grid table tr:hover td, .k-grid table tr:hover td a' +
                            '{' +
                            //'    background:' + TriSysProUI.LightenColour(lBackColour, 0.075) + ' !important;' +
                            '   background:' + TriSysProUI.LightenColour(lBackColour, 0.2) + ';' +
                            '   color: ' + lNavBarInverseColour + ';' +
                            '   font-weight: bold;' +
                            '   cursor: pointer !important;' +
                            '}' +
                            // Hide the image from the kendo.ui.progress
                            '.k-loading-image { background-image: none !important; }' +
                            // Tweak the progress colour to match the theme
                            //'.k-i-loading{ color: ' + lBackColour + ' !important; }' +
                            //'.k-i-loading::before, .k-i-loading::after, .k-loading-image::before, .k-loading-image::after' +
                            //'{' +
                            //'   border-color: ' + lBackColour + ' !important;' +
                            //'}' +

                            // Sticky column background color
                            'td.k-grid-content-sticky' +
                            '{' +
                            '   background-color: ' + lGridHeaderBackColor + ';' +      // Means selected rows are not highlighted
                            //'   color: black !important;' + 
                            '   color: #787E80 !important;' +                           // Doesn't show too well on highlighted
                            '   font-weight: bolder !important;' +
                            //'   background-color: ' + TriSysProUI.LightenColour(lBackColour, 0.2) + '!important;' +
                            //'   color: ' + lNavBarInverseColour + ' !important;' +
                            '}' +

                            // I have learned this trick: https://www.sitepoint.com/community/t/apply-css-rules-if-a-parent-has-a-specific-class/10980
                            // This allows me to set css for a class which has the previous class as it's parent
                            '.k-state-selected .k-grid-content-sticky' +
                            '{' +
                            '   background-color: ' + lBackColour + '!important;' +
                            '   border-color: ' + lBackColour + '!important;' +
                            '   color: white !important;' +                           
                            '   font-weight: bolder !important;' +
                            '}' +

                            // Our drill down grid buttons show a random dot on Edge caused by an ellipsis setting
                            // We however wish to retain ellispis on other columns, hence target only this one
                            '.k-grid td.k-command-cell' +
                            '{' +
                            '   text-overflow: clip;' +
                            '}' +

                            // When filter row is visible in the grid, we want themed color
                            '.k-grid span.k-dropdown-wrap.k-state-default' +
                            ', .k-grid span.k-select' +
                            '{' +
                            '   color: ' + lBackColour + ';' +
                            '}' +
                            '.k-grid span.k-select:hover' +
                            '{' +
                            '   color: white;' +
                            '}' +

                            // CV Manager buttons, drop down text, date picker 
                            'ul[id*="CVManager_Menu"], ul[id*="TextDropDown_Menu"], span[id*="_dateview"]' +
                            '{' +
                            '   border-color: ' + lBackColour + '!important;' +
                            '   color: ' + lBackColour + ' !important;' +           // This has no effect. Don't know why!
                            '}' +

                            // Timesheet data entry spinner on focus
                            'td#trisys-timesheet-hours-grid_active_cell span.k-select' +
                            '{' +
                            '   background-color: ' + lBackColour + '!important;' +
                            '   color: white;' +         
                            '}' +

                            // Give grid 'Open' button a border radius, and a hover white
                            '.trisys-grid-open-button' +
                            '{' +
                            '   border-radius: 5px;' +
                            '}' +
                            'a.k-button.k-button-icontext.themed-background.trisys-grid-open-button:hover' +
                            '{' +
                            '   color: white;' +
                            '}' +

                            // Need a separate style for this colour
                            '.linkedin-blue-color' +
                            '{' +
                            '   color: #0A66C2;' +
                            '}' +

                            // 01 Apr 2023: Finally a fix!
                            '.k-combobox {' +
                            '   border: 1px solid ' + lBackColour + '!important;' +
                            '}' +
                            '.k-list-container {' +
                            '   border: 1px solid ' + lBackColour + '!important;' +
                            '}' +

                            // Terminate the TriSys CSS
                            '';


            //+ '.k-dropdown .k-input, .k-dropdown .k-state-focused .k-input, .k-menu .k-popup {'
            //+ 'color: #FFF; !important;'
            //+ ' }';

            // 31 Mar 2023: Round corners
            var sRadiusHTML = "border-radius: 8px!important;";
            var sTopRadiusHTML = "border-top-left-radius: 8px;" +           
                             "    border-top-right-radius: 8px;";           
            var sBottomRadiusHTML = "border-bottom-left-radius: 8px;" +
                             "       border-bottom-right-radius: 8px;";
            var sRadiusBlockHTML = "{" + sTopRadiusHTML + sBottomRadiusHTML + "}";
            var sLeftRadiusHTML = "border-top-left-radius: 8px;" +
                                "  border-bottom-left-radius: 8px;";
            var sRightRadiusHTML = "border-top-right-radius: 8px;" +
                                "  border-bottom-right-radius: 8px;";

            sKendoUIHTML += ".header-section, .breadcrumb-top, .block, .block.full, .modal-body, #divFormContentRow + footer" +
                "{" +
                "    padding-left: 20px;" +
                "    padding-right: 20px;" +
                     sRadiusHTML +
                "}" +
                ".block-title, .navbar.navbar-default, .form-bordered .form-group.form-actions, .table tfoot > tr > th, .table tfoot > tr > td," +
                " a.list-group-item:hover, a.list-group-item:focus, .nav > li > a:hover, .nav > li > a:focus, li.dropdown-header, .style-alt .content-header + .breadcrumb-top," +
                " .style-alt .breadcrumb-top + .content-header, .style-alt footer, .dropzone, .dataTables_wrapper > div" +
                "{" + sTopRadiusHTML + "}" +
                ".form-horizontal.form-bordered .form-group, .modal-footer" +
                "{" + sBottomRadiusHTML +
                "}" +
                ".k-grid" +
                sRadiusBlockHTML +
                "div.k-grid-toolbar" +
                "{" + sTopRadiusHTML + "}" +
                "div.k-grid-header" +
                "{" + sTopRadiusHTML + "}" +
                "div.k-grid-footer" +
                sRadiusBlockHTML +
                "div.k-pager" +
                "{" + sBottomRadiusHTML + "}" +
                ".k-grid-footer-wrap, .k-grid-header-wrap" +
                sRadiusBlockHTML +
                ".themed-background-muted-light" +
                "{" + sRadiusHTML + "}" +
                ".k-scheduler" +
                sRadiusBlockHTML +
                ".k-scheduler-toolbar" +
                "{" + sTopRadiusHTML + "}" +
                ".k-scheduler-content" +
                "{" + sBottomRadiusHTML +
                "}" +
                ".k-scheduler-toolbar.k-toolbar" +
                "{" + sTopRadiusHTML + "}" +
                ".k-scheduler-layout" +
                "{" + sBottomRadiusHTML + "}" +
                ".content-header, .content-top, .block-top, .breadcrumb-top, .style-alt .block-title" +     // Chat
                "{" + sTopRadiusHTML + "}" +
                ".k-textbox {" + sRadiusHTML + "}" +        // 03 Apr 2023
                ".btn {" + sRadiusHTML + "}" +
                ".form-control" +
                "{" + sRadiusHTML + "}" +
                ".k-dropdown.k-widget *" +
                "{" + sRadiusHTML + "}" +
                ".k-widget :before" +                       // Combo down arrow colour
                "{ color: " + lNavBarInverseColour + "}" +
                ".k-animation-container *" +                // Combo drop down panel
                "{" +
                sRadiusHTML +
                "   margin-bottom: 1px;" +
                "   border-color: " + lBackColour +
                "}" +
                //".k-datepicker.k-widget *:first-child" +    // Date picker left edge
                //"{" + sLeftRadiusHTML + "}" +
                //".k-datepicker.k-widget *:last-child" +     // Date picker right edge
                //"{" + sRightRadiusHTML + "}" +

                // Grid column filter boxes
                ".k-autocomplete-clearable .k-input, .k-combobox-clearable .k-input, .k-dropdowntree-clearable .k-input, .k-multiselect-clearable .k-input * " +
                "{" + sRadiusHTML + "}" +
                ".k-autocomplete, .k-textbox * " +
                "{" + sRadiusHTML + "}" +
                "span.k-widget.k-datepicker:hover *" +
                "{" + sRadiusHTML + "}" +

                // Multi-select combo
                "li.k-button" +
                "{" + sRadiusHTML + "}" +
                ".k-widget.k-multiselect.k-multiselect-clearable *, .k-widget.k-multiselect.k-multiselect-clearable:hover" +
                "{" + sRadiusHTML + "}" +

                // Grid row selectors
                ".k-grid input.k-checkbox " +
                "{" +
                " height: 20px; width: 20px; margin-left: -2px; font-weight:bold; background-color: white; border-radius: 50%;" +
                // Fix for companies, requirements and task searches which show nasty overflow characters
                "overflow: hidden;white-space: nowrap;color: transparent;margin-right: -5px;" +
                "}" +

                // Date & Time pickers & numeric input boxes & action drop down menu buttons
                "span.k-widget.k-datetimepicker *, span.k-widget.k-datepicker *, span.k-widget.k-numerictextbox *, .btn-group.btn-group-sm.show-on-hover *" +
                "{" + sRadiusHTML + "}" +
                ".k-datetimepicker.k-widget *:nth-child(2), .k-datepicker.k-widget *:nth-child(2)" +
                "{ border-radius: 0px; }" +
                "span.k-icon.k-i-calendar" +
                "{ border-radius: 0px; }" +

                // Striped table odd rows to have a border
                ".table-striped > tbody > tr:nth-of-type(odd) > td" +
                "{" + sRadiusHTML + "}" +

                // Contact Edit comments button
                ".k-menu, .k-menu .k-menu-group, .k-menu-scroll-wrapper .k-menu-group, .k-popups-wrapper .k-menu-group" +
                "{" + sRadiusHTML + "}" +
                ".k-menu .k-animation-container, .k-menu-scroll-wrapper .k-animation-container, .k-popup .k-animation-container, .k-popups-wrapper .k-animation-container" +
                "{ background-color: transparent; }" +

                // CV Manager open buttons hover
                "span.k-link.k-menu-link:hover" +
                "{" + sRadiusHTML + "}" +
                ".k-menu .k-item, .k-menu-scroll-wrapper .k-item, .k-menu-scroll-wrapper.horizontal>.k-item" +
                " .k-popups-wrapper .k-item, .k-popups-wrapper.horizontal>.k-item, .k-widget.k-menu-horizontal>.k-item" +
                "{" + sRadiusHTML + "}" +

                // Froala editor as used in mail merge template editor
                ".gray-theme.fr-box.fr-basic.fr-top .fr-wrapper" +
                "{ border-bottom-left-radius: 8px; }" +

                // F1 help: Actually done in https://apex.trisys.co.uk/legacy/development/test/intro.js-master/themes/introjs-trisys.css
                //".introjs-tooltip.introjs-bottom-left-aligned, .introjs-tooltip.introjs-left, .introjs-tooltip.introjs-right," +
                //" .introjs-tooltip.introjs-floating, .introjs-tooltip.introjs-bottom-middle-aligned," +
                //" .introjs-tooltip.introjs-bottom-right-aligned," +
                //" a.introjs-button.introjs-skipbutton, a.introjs-button.introjs-prevbutton, a.introjs-button.introjs-nextbutton" +
                //"{" + sRadiusHTML + "}" +

                // Diary Manager
                "button.k-button.TriSysCalOptions, button.k-button.k-nav-today" +
                "{" + sLeftRadiusHTML + "}" +
                "button.k-button.k-view-agenda, button.k-button.k-button-icon.k-icon-button.k-nav-next" +
                "{" + sRightRadiusHTML + "}" +

                // Contact preview
                ".k-widget.k-window, div#ctrlContactPreview-splitter, .panel.panel-default, h4.panel-title, .panel-heading" +
                "{" + sRadiusHTML + "}" +

                // Drop down logged in profile menu
                "ul#LoggedInUserDropDownMenu-block, ul#history-drop-down-menu-block" +
                "{" + sRadiusHTML + "}" +

                // Navigation bar docked pop-out menu blocks
                "ul#navBar-ContactManagement, ul#navBar-Marketing, ul#navBar-Search, ul#navBar-OnlinePortals, ul#navBar-SystemAdministration, ul#navBar-Help, ul#navBar-Developer" +
                "{" + sRadiusHTML + "}" +

                // Chat 
                ".chat-talk-messages .chat-talk-msg" +
                "{" + sRadiusHTML + "}" +

                // 26 Apr 2023: Vertical and horizontal scrollbars are now styled
                "::-webkit-scrollbar" +
                "{ width: 10px; height: 10px; }" +
                "::-webkit-scrollbar-track" +
                "{ /*background: #F9F9F9; border: 1px solid #4E505F; border-radius: 6px;*/ }" +
                "::-webkit-scrollbar-thumb" +
                "{ background-color: " + lNavBarInverseColour + "; border-radius: 6px; border: 3px solid " + lNavBarInverseColour + ";}";

            sKendoUIHTML += '\n' + '/* 03 Apr 2024 New JQuery + KendoUI */' + '\n';
            sKendoUIHTML += `
                /* All text boxes */
                input {
                    padding-block: 4px;
                    padding-inline: 4px;
                    border-width: 1px;
                    border: #dadada 1px solid;
                }

                /* Combo closed font */
                .k-input-value-text {
                    font-size: 12px;
                }

                /* Combo open Drop Down */
                .k-list-ul {
                    font-size: 12px;
                    padding-block: 4px;
                    padding-inline: 4px;
                }

                /* 11 Apr 2024 */
                .k-list-item.k-selected,.k-selected.k-list-optionlabel {
                color: white!important;
                    background-color: ` + sThemedColour + `!important;
                 }

                .k-list-item.k-selected: hover,.k-selected.k-list-optionlabel: hover,.k-list-item.k-selected.k-hover,.k-selected.k-hover.k-list-optionlabel {
                color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                .k-picker-solid {
                    background-color: transparent!important;
                    background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.02));
                }

                .k-picker-solid:hover, .k-picker-solid.k-hover {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                .k-picker-solid: focus-within {
                    box-shadow: 0 0 0 1px ` + sThemedColour + `!important;
                }

                .k-picker.k-input-button {
                    color: ` + sThemedColour + `!important;
                }

                .k-button-icon {
                    color: ` + sThemedColour + `!important;
                }

                /* Spaces are fucking crucial! i.e. .k-picker: hover.k-button-icon{color: white!important; } does not work! */
                .k-button-icon:hover{color: white!important; }
                .k-picker:hover .k-button-icon{color: white!important; }

                /* I worked this out based upon hovering above another element! */
                .k-button:hover .k-button-icon{color: white!important; }
                .k-button:hover .k-button-text{color: white!important; }

                /* Date combos */
                .k-input,
                .k-picker {
                    border-radius: 8px;
                    font-size: 12px;
                }

                /* Default colour for buttons */
                .k-button-flat-primary {
                    color: ` + sThemedColour + `;
                }

                .k-menu: not(.k-context-menu) {
                    color: ` + sThemedColour + `;
                    border: 1px solid ` + sThemedColour + `;
                    background-color: lightgray;
                }

                .k-menu: not(.k-context-menu) >.k-item {
                    color: ` + sThemedColour + `;
                }

                /* .k-menu:not(.k-context-menu) > .k-item:hover, .k-menu:not(.k-context-menu) > .k-item.k-hover {
                    color: #d6534a;
                }

                .k-menu:not(.k-context-menu) > .k-item:active, .k-menu:not(.k-context-menu) > .k-item.k-active {
                    color: #424242;
                }

                .k-menu:not(.k-context-menu) > .k-item:focus, .k-menu:not(.k-context-menu) > .k-item.k-focus {
                    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.12);
                }*/

                .k-menu:not(.k-context-menu) > .k-item:hover, .k-menu:not(.k-context-menu) > .k-item.k-hover {
                    color: ` + sThemedColour + `;
                }

                .k-menu:not(.k-context-menu) > .k-item: active, .k-menu:not(.k-context-menu) > .k-item.k-active {
                    color: ` + sThemedColour + `;
                }


                .k-calendar .k-calendar-view .k-today {
                    /*color: white!important;
                    background-color: ` + sThemedColour + `!important;*/
                    color: ` + sThemedColour + `!important;
                    font-weight: bold;
            }

                .k-calendar .k-calendar-td.k-selected .k-calendar-cell-inner, .k-calendar .k-calendar-td.k-selected .k-link {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                .k-calendar .k-calendar-td.k-selected:hover .k-calendar-cell-inner, .k-calendar .k-calendar-td.k-selected:hover .k-link,
                .k-calendar .k-calendar-td.k-hover .k-calendar-cell-inner,
                .k-calendar .k-calendar-td.k-hover .k-link {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                .k-calendar .k-calendar-td:hover .k-calendar-cell-inner, .k-calendar .k-calendar-td:hover .k-link,
                .k-calendar .k-calendar-td.k-hover .k-calendar-cell-inner,
                .k-calendar .k-calendar-td.k-hover .k-link {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }


                /* Skills Tree */
                .k-treeview *,
                .k-treeview *::before,
                .k-treeview *::after {
                    font-size: 12px;
                            }

                /* Override your own styles in Apex */

                .k-grid input.k-checkbox {
                    /* background-color: white;         This fucks-up the row selectors */
                    border-color: ` + sThemedColour + `;
                }

                .k-checkbox {
                    border-color: ` + sThemedColour + `!important;
                }


                .k-checkbox:indeterminate,
                .k-checkbox.k-indeterminate {
                    border-color: rgba(0, 0, 0, 0.08);
                    color: ` + sThemedColour + `;
                    background-color: #ffffff;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23` + sThemedStrokeColour + `' stroke-linecap='square' stroke-linejoin='square' stroke-width='2' d='M4,8 h8'/%3e%3c/svg%3e");
                }

                .k-checkbox:checked,
                .k-checkbox.k-checked {
                    border-color: ` + sThemedColour + `;
                    color: #a91d0f;
                    background-color: ` + sThemedColour + `!important;	 /* Theme color IMPORTANT */
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='white' stroke-linecap='square' stroke-linejoin='square' stroke-width='2' d='M3,8 l3,3 l7-7'/%3e%3c/svg%3e");
                }

                .k-checkbox:checked:focus,
                .k-checkbox.k-checked.k-focus {
                    box-shadow: 0 0 0 2px ` + lNavBarInverseColour + `;
                }

                .k-checkbox.k-invalid {
                    border-color: ` + sThemedColour + `;
                }

                .k-checkbox.k-invalid +.k-checkbox-label {
                    color: ` + sThemedColour + `;
                }

                .k-checkbox-wrap.k-ripple-blob {
                    color: ` + sThemedColour + `;
                    opacity: 0.25;
                }

                .k-ripple-container.k-checkbox::after {
                    background: ` + sThemedColour + `;
                    opacity: 0.25;
                }

                .k-treeview-leaf.k-selected {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                .k-treeview-leaf:hover, .k-treeview-leaf.k-hover {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                .k-treeview.k-treeview-load-more-button {
                    color: ` + sThemedColour + `;
                }

                .k-treeview.k-treeview-load-more-button: hover,.k-treeview.k-treeview-load-more-button.k-hover {
                    color: ` + sThemedColour + `;
                }

                .k-treeview.k-treeview-load-more-button: focus,.k-treeview.k-treeview-load-more-button.k-focus {
                    color: ` + sThemedColour + `;
                }

                /* Grid Font */
                .k-grid.k-table-row {
                    font-size: 12px;
                }

                /* Grid Filtered Colour */
                .k-grid-header.k-grid-filter.k-active,
                .k-grid-header.k-header-column-menu.k-active,
                .k-grid-header.k-grid-header-menu.k-active,
                .k-grid-header.k-hierarchy-cell.k-icon.k-active {
                    background-color: ` + sThemedColour + `;
                }

                .k-grid-header .k-grid-filter:hover,
                .k-grid-header .k-header-column-menu:hover,
                .k-grid-header .k-grid-header-menu:hover,
                .k-grid-header .k-hierarchy-cell .k-icon:hover {
                    background-color: ` + sThemedColour + `!important;
                    color: white!important;
                    border-radius: 6px;
                }

                /* Grid Footer font */
                .k-grid-pager {
                    font-size: 12px;
                }

                /* Grid Row Selection */
                .k-grid td.k-selected,
                .k-grid.k-table-row.k-selected > td,
                .k-grid.k-table-td.k-selected,
                .k-grid.k-table-row.k-selected > .k-table-td {
                    background-color: ` + sLightThemedColour + `!important;
                }

                /* Bold black when row highlighted */
                .k-table-tbody .k-table-row.k-selected > .k-table-td,
                .k-table-tbody .k-table-row.k-selected > .k-table-td a,
                .k-table-list .k-table-row.k-selected a {
                    color: black;
                    font-weight: bold!important;
                }

                .k-master-row.k-table-alt-row.k-grid-content-sticky,
                .k-master-row.k-table-alt-row.k-grid-row-sticky {
                    background-color: ` + sLightThemedColour + `!important;
                }

                .k-master-row.k-table-row.k-selected td.k-grid-content-sticky,
                .k-master-row.k-table-row.k-selected.k-table-td.k-grid-row-sticky,
                .k-master-row.k-table-row td.k-grid-content-sticky.k-selected,
                .k-master-row.k-table-row.k-table-td.k-grid-content-sticky.k-selected {
                    background-color: ` + sLightThemedColour + `!important;
                }

                .k-master-row.k-selected.k-table-alt-row td.k-grid-content-sticky,
                .k-master-row.k-selected.k-table-alt-row.k-table-td.k-grid-row-sticky,
                .k-master-row.k-table-alt-row td.k-grid-content-sticky.k-selected,
                .k-master-row.k-table-alt-row.k-table-td.k-grid-content-sticky.k-selected {
                    background-color: ` + sLightThemedColour + `!important;
                }

                .k-master-row: hover.k-grid-content-sticky,
                .k-master-row: hover.k-grid-row-sticky,
                .k-master-row.k-hover.k-grid-content-sticky,
                .k-master-row.k-hover.k-grid-row-sticky {
                    background-color: ` + sLightThemedColour + `!important;
                }

                .k-master-row.k-selected: hover td.k-grid-content-sticky,
                .k-master-row.k-selected: hover.k-table-td.k-grid-row-sticky,
                .k-master-row.k-selected.k-hover td.k-grid-content-sticky,
                .k-master-row.k-selected.k-hover.k-table-td.k-grid-row-sticky,
                .k-master-row: hover td.k-grid-content-sticky.k-selected,
                .k-master-row.k-hover td.k-grid-content-sticky.k-selected,
                .k-master-row: hover.k-table-td.k-grid-content-sticky.k-selected,
                .k-master-row.k-hover.k-table-td.k-grid-content-sticky.k-selected {
                    background-color: ` + sLightThemedColour + `!important;
                }

                /* Grid header sort icon */
                .k-grid-header.k-sort-icon,
                .k-grid-header.k-sort-order {
                    color: ` + sThemedColour + `;
                }

                .k-grid.k-table-row.k-table-alt-row {
                    background-color: ` + sLightThemedColour + `!important;
                }

                .k-master-row.k-table-row.k-selected td.k-grid-content-sticky,
                .k-master-row.k-table-row.k-selected.k-table-td.k-grid-row-sticky,
                .k-master-row.k-table-row td.k-grid-content-sticky.k-selected,
                .k-master-row.k-table-row.k-table-td.k-grid-content-sticky.k-selected {
                    background-color: ` + sLightThemedColour + `;
                }

                /*
                .k-table-tbody .k-table-row.k-selected > .k-table-td,
                .k-table-list .k-table-row.k-selected {
                    /*background-color: rgba(255, 99, 88, 0.25);
                }
                */

                /* When we paste the above into this code, it fucks up the formatting! */
                .k-table-tbody .k-table-row.k-selected > .k-table-td,
                .k-table-list .k-table-row.k-selected {
                    background-color: ` + sLightThemedColour + `;
                }

                /* Button */
                .k-button-solid-base {
                    color: ` + sThemedColour + `;
                    font-size: 12px;
                    font-weight: bold;
                }

                .k-button-solid-primary {
                    border-color: ` + sThemedColour + `;
                    color: white;
                    background-color: ` + sThemedColour + `;
                    background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.02));
                }

                /* Image combo drop downs i.e. taks types */

                #taskForm-TaskType-list .k-list-item {
                    line-height: 0.1;       /* See task type drop down */
                }

                .k-list-item.k-selected, .k-selected.k-list-optionlabel {
                    background-color: ` + sThemedColour + `;
                }

                .k-list-item.k-selected:hover, .k-selected.k-list-optionlabel:hover, .k-list-item.k-selected.k-hover, .k-selected.k-hover.k-list-optionlabel {
                    background-color: ` + sThemedColour + `;
                }

                /* Fucks up combos!
                    .k-list-md {
                    font-size: 12px;
                    line-height: 11;
                }*/

                .k-chip {
                    font-size: 12px;
                }

                .k-chip-solid-base {
                    color: ` + sThemedColour + `;
                    background-color: white;
                }

                .k-chip-solid-base:hover, .k-chip-solid-base.k-hover {
                    background-color: ` + sThemedColour + `!important;
                    color: white!important;
                }

                .k-list-item:hover, .k-list-optionlabel:hover, .k-list-item.k-hover, .k-hover.k-list-optionlabel {
                    background-color: ` + sThemedColour + `!important;
                    color: white!important;
                }

                /* Popup Windows Font */
                .k-window {
                    font-size: 12px;
                }

                .k-splitter {
                    font-size: 12px;
                }

                /* 10 April 2024 */
                .k-input-md,
                .k-picker-md {
                    font-size: 12px;
                }

                .k-table-md {
                    font-size: 12px;
                }

                .k-grid-pager {
                    font-size: 12px;
                }

                .k-button-solid-base.k-selected {
                    border-color: ` + sThemedColour + `!important;
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                /* 12 Apr 2024: Nav bar changes */
                .sidebar-nav a:hover,
                .sidebar-nav a:focus,
                .sidebar-nav a.open,
                .sidebar-nav li.active > a {
                    text-decoration: none!important; /* 12 Apr 2024 */
                }

                .sidebar-nav a.active {
                    border: ` + sThemedColour + ` 1px solid;
                    border-right: 5px solid ` + sThemedColour + `!important;
                    border-radius: 8px;
                    margin-left: 2px;
                    margin-right: 2px;
                    padding-left: 8px!important;
                }

                /* 16 Apr 2024: Grid header column menu */
                .k-column-menu .k-menu:not(.k-context-menu) .k-item:hover,
                .k-column-menu .k-menu:not(.k-context-menu) .k-item.k-hover {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                .k-menu-group .k-item > .k-link:hover, .k-menu-group .k-item > .k-link.k-hover,
                .k-menu.k-context-menu .k-item > .k-link:hover,
                .k-menu.k-context-menu .k-item > .k-link.k-hover {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                .k-menu-group .k-item > .k-link:active, .k-menu-group .k-item > .k-link.k-active, .k-menu-group .k-item > .k-link.k-selected,
                .k-menu.k-context-menu .k-item > .k-link:active,
                .k-menu.k-context-menu .k-item > .k-link.k-active,
                .k-menu.k-context-menu .k-item > .k-link.k-selected {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                /* 02 May 2024: Grid Column Sort */
                .k-grid-header .k-sort-icon,
                .k-grid-header .k-sort-order {
                    color: ` + sThemedColour + `!important;
                }

                /* 02 May 2024: CV Manager Buttons */
                ul[id*="CVManager_Menu"], ul[id*="TextDropDown_Menu"], span[id*="_dateview"] {
                    border-color: ` + sThemedColour + `!important;
                    color: ` + sThemedColour + `!important;
                    border-width: 1px;
                }

                /* 03 May 2024: Grid hyperlinks */
                .k-grid a {
                    color: ` + lNavBarInverseColour + `!important;
                }

                /* 03 May 2024: Radio buttons e.g. ctrlSnooze.html */
                .k-radio:checked,
                .k-radio.k-checked {
                    border-color: ` + sThemedColour + `!important;
                    background-color: ` + sThemedColour + `!important;
                }

                .k-radio:checked:focus,
                .k-radio.k-checked.k-focus {
                    box-shadow: 0 0 0 2px ` + lBackColour + `!important;
                }

                .k-ripple-container .k-radio::after {
                    background: ` + sThemedColour + `!important;
                }

                /* 17 Jun 2024: Post-It Notes round border */
                .k-window {
                    border-radius: 4px!important;
                }

                .k-window-content, .k-prompt-container {
                    border-bottom-left-radius: 4px!important;
                    border-bottom-right-radius: 4px!important;
                }

                .k-window-titlebar {
                    border-bottom-left-radius: 4px!important;
                    border-bottom-right-radius: 4px!important;
                }

                /* 11 Oct 2024: KendoUI Tabs used in app studio data source configurator */
                .k-tabstrip-items-wrapper .k-item {
                    color: ` + sThemedColour + `!important;
                }

                .k-tabstrip-items-wrapper .k-item:hover, .k-tabstrip-items-wrapper .k-item.k-hover {
                    color: white!important;
                    background-color: ` + sThemedColour + `!important;
                }

                /* 02 Nov 2024: Fix modal header top radius visual discrepancy */
                .modal-header {
					border-top-left-radius: 5px!important;
					border-top-right-radius: 5px!important;
                    border-bottom-left-radius: 0px!important;
                    border-bottom-right-radius: 0px!important;
				}

                /* 05 Nov 2024: Bug in tables with curved border styles */
                .table-striped tbody tr:nth-of-type(odd) > td {
                    border-radius: 0 !important;
                }

                    .table-striped tbody tr:nth-of-type(odd) > td:first-child {
                        border-top-left-radius: 8px !important;
                        border-bottom-left-radius: 8px !important;
                    }

                    .table-striped tbody tr:nth-of-type(odd) > td:last-child {
                        border-top-right-radius: 8px !important;
                        border-bottom-right-radius: 8px !important;
                    }

            `;


            // Terminate the KendoUI CSS
            sKendoUIHTML += '';

            // Apply these dynamic styles now
            if ($('#header-k-styles').length)
            {
                $('#header-k-styles').html(sKendoUIHTML);
            }
            else
            {
                $('head').append('<style type="text/css" id="header-k-styles">'
                                    + sKendoUIHTML +
                                    + '</style>');
            }
            //$('.k-state-selected').css("border-color", lNavBarInverseColour);
            /**$('.k-state-selected:link').css("background-color", lNavBarInverseColour);
            $('.k-state-selected:link').css("border-color", lNavBarInverseColour);
            $('.k-state-selected:visited').css("background-color", lNavBarInverseColour);
            $('.k-state-selected:visited').css("border-color", lNavBarInverseColour);
            $('.k-state-highlight').css("background-color", lNavBarInverseColour);
            $('.k-state-highlight').css("border-color", lNavBarInverseColour);
            $('.k-button').css("background-color", lBackColour);
            $('.k-button').css("color", "#ffffff");
            $('.k-state-hover').css("background-color", lNavBarInverseColour);
            $('.k-state-hover').css("background-color", lNavBarInverseColour);
            $('.k-alt').css("background-color", lGroupBackColour);**/
        }

        // 20 Feb 2015 - not working!
        //$('.nav-horizontal li.active a').css("background-color", lNavBarFixedTopInverseColour);

        // See also kendo.metro.min.css for the hover styles.
        // Set these to the 'light colour' of the theme

        // This is for our form and grid toolbar button/menus - TODO: Why does btn-default keep resetting itself after each page loaded?
        $('.btn-default').css("color", lBackColour);

        // Our waiting spinner(s) gets the same treatment - why? Just because we can ;-)
        $('#waiting-spinner-image').css("color", lBackColour);
        $('#document-viewer-waiting-spinner-image').css("color", lBackColour);
        $('#cvautorecognition-viewer-waiting-spinner-image').css("color", lBackColour);

        // The thin scrollbars
        $('.mCS-dark-thin.mCSB_scrollTools .mCSB_dragger .mCSB_dragger_bar').css("background-color", lBackColour);

        // Company organigram
        try
        {
            TriSysSDK.CompanyOrganogram.SetCSSColours(lBackColour, lNavBarFixedTopInverseColour);

        } catch (e)
        {
        }

        // Modal dialogue draggable settings
        var sHeight = "2400px";
        $('.modal-backdrop').css("position", "fixed");
        $('.modal-backdrop').css("height", sHeight);
        $('.modal-backdrop.in').css("height", sHeight);
        $('modal-backdrop  in').css("height", sHeight);


        try
        {
            // Show actual colors
            ctrlUserOptions.DisplayThemeColours();
        }
        catch(err)
        {
            // User options form not loaded yet
        }

        // TriSys Web Jobs
        try
        {
            TriSysWebJobs.Frame.SetTransparencyInFramework();

        } catch (e)
        {

        }

        // Bootstrap modal dialogues will all have the current theme dark background colour
        $('.alert-info').css("background-color", lNavBarInverseColour);
        $('.alert-info').css("border-color", lNavBarInverseColour);
        $('.alert-info').css("color", "white");

        // 20 Nov 2024: Make the background white colour the same as the theme background colour
        $('body').css('background-color', $('#divFormContentRow').css('background-color'));

        // 21 Nov 2024: Some KendoUI grids still have broken curved bottom borders
        $('.k-grid-content').css('border-bottom-left-radius', '0').css('border-bottom-right-radius', '0');
    },

    // 26 Nov 2024: Claude.ai
    rgbToHex: function (rgb)
    {
        // Check if already hex
        if (rgb.startsWith('#')) return rgb;

        // Extract RGB values
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return rgb; // Return original if not RGB format

        // Convert to hex
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);

        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

    },

	// Nov 2018: for newer F1 Help using IntroJS library
	// This CSS shit took 2 hours to get right! - note the use of !important when overriding fixed styles                
	introJS_Overrides: function()			// TriSysProUI.introJS_Overrides
	{
		var lBackColour = TriSysProUI.BackColour();
        var lNavBarInverseColour = TriSysProUI.NavBarInverseColour();

        var sStyleId = 'f1-help-styles';
        var sStyles = '.introjs-button' +
                    '{' +
                    '   color: ' + lBackColour + ' !important;' +
                    '   background-color: "" !important;' +
                    '}' +
                    '.introjs-helperNumberLayer' +
                    '{' +
                    '   background-color: ' + lNavBarInverseColour + '!important;' +
                    '   border-color: ' + lNavBarInverseColour + '!important;' +
                    '   color: #fff !important;' +
                    '}' +
                    '.introjs-button:hover, .introjs-button:focus' +
                    '{' + 
                    ' background: ' + lBackColour + '!important;' +
                    ' color: #fff !important;' +
                    ' box-shadow: none;' +
                    ' border-color: ' + lBackColour + '!important;' +
                    ' text-decoration: none;' +
                    '}';
        if ($('#' + sStyleId).length)
        {
            $('#' + sStyleId).html(sStyles);
        }
        else
        {
            $('head').append('<style type="text/css" id="' + sStyleId + '">'
                    + sStyles +
                    + '</style>');
        }
        return;

        // Old - doomed to failure!
		// This was because the introJS library is dynamic, and the behaviour cannot/should not be changed!
//#region Doomed CSS Manipulation
        // Make the buttons match the current theme
        $('.introjs-button').css('color', lBackColour);
        $('.introjs-button').css('background-color', '');
        $('.introjs-helperNumberLayer').css('background-color', lNavBarInverseColour);
        $('.introjs-helperNumberLayer').css('border-color', lNavBarInverseColour);
        $('.introjs-helperNumberLayer').css('color', "#fff");

        var fnResetNextStyle = function()
        {
            $('.introjs-nextbutton').css('background', lBackColour);
            $('.introjs-nextbutton').css('background-color', lBackColour);
            $('.introjs-nextbutton').css('border-color', lBackColour);
            $('.introjs-nextbutton').css('color', '#fff');
        };

        $('.introjs-button').hover(
            function() {
                $(this).css("background-color", lBackColour);
                $(this).css("border-color", lBackColour);
                $(this).css("color", "#fff");
                fnResetNextStyle();
            }, 
            function() {
                $(this).css("background-color", ""); //to remove property set it to ''
                $(this).css("border-color", ""); 
                $(this).css("color", lBackColour); 
            }
        );

        $('.introjs-button').focus(
            function() {
                $(this).css("background-color", lBackColour);
                $(this).css("border-color", lBackColour);
                $(this).css("color", "#fff");
                fnResetNextStyle();
            });
        $('.introjs-button').blur(
            function() {
                $(this).css("background-color", lBackColour);
                $(this).css("border-color", lBackColour);
                $(this).css("color", "#fff");
                fnResetNextStyle();
            }
        );
//#endregion
	},

    // Was on navbar - now in useroptions form - see App.templateOptions()
    InitialiseThemesFromLocalCookie: function ()
    {
        var bWriteCookie = false;
        TriSysProUI.InitialiseThemesAfterLogin(bWriteCookie);   // Should pick up cookie!
    },

    InitialiseThemesAfterLogin: function (bWriteCookie)
    {
        try
        {
            var themeColorCke = TriSysApex.UserOptions.Theme();
            var sPageStyle = TriSysApex.UserOptions.PageStyle();

            TriSysProUI.InitialiseTheme(themeColorCke);
            TriSysProUI.InitialisePageStyle(sPageStyle);

            if (bWriteCookie)
            {
                // Save to server/cookies now
                TriSysApex.UserOptions.Theme(themeColorCke, false);
            }

        } catch (e)
        {

        }
    },

    InitialiseTheme: function (themeColorCke)
    {
        var page = $('#page-container');
        var header = $('header');

        /*
         * Color Themes
         */
        var colorList = $('.sidebar-themes');
        var themeLink = $('#theme-link');

        // Update color theme
        if (themeColorCke)
        {
            if (themeColorCke === 'default')
            {
                if (themeLink.length)
                {
                    themeLink.remove();
                    themeLink = $('#theme-link');
                }
            } else
            {
                if (themeLink.length)
                {
                    themeLink.attr('href', themeColorCke);
                } else
                {
                    $('link[href="css/themes.css"]')
                        .before('<link id="theme-link" rel="stylesheet" href="' + themeColorCke + '">');

                    themeLink = $('#theme-link');
                }
            }
        }

        TriSysProUI.CurrentThemeName = themeColorCke;
        TriSysProUI.DisplayCurrentThemeName();

        setTimeout(TriSysProUI.kendoUI_Overrides, 1000);     // Allow time for the theme to propagate
    },

    InitialisePageStyle: function (sPageStyle)
    {
        var page = $('#page-container');
        var optMainStyle = $('#options-main-style');
        var optMainStyleAlt = $('#options-main-style-alt');

        if (sPageStyle == "Alternative")
        {
            page.addClass('style-alt');
        } else
        {
            page.removeClass('style-alt');
        }
    },

    InitialiseThemesForUserEvents: function ()
    {
        var page = $('#page-container');
        var header = $('header');

        /*
         * Color Themes
         */
        var colorList = $('.sidebar-themes');
        var themeLink = $('#theme-link');

        var themeColor = themeLink.length ? themeLink.attr('href') : 'default';

        var themeColorCke = TriSysApex.UserOptions.Theme();

        themeColor = themeColorCke ? themeColorCke : themeColor;

        TriSysProUI.CurrentThemeName = themeColor;
        TriSysProUI.DisplayCurrentThemeName();

        // Set the active color theme link as active
        $('a[data-theme="' + themeColor + '"]', colorList)
            .parent('li')
            .addClass('active');

        // When a color theme link is clicked
        $('a', colorList).click(function (e)
        {
            // Get theme name
            themeColor = $(this).data('theme');
            var title = $(this).attr('title');

            TriSysProUI.ForceThemeChange(themeColor, title);
        });

        /* Page Style */
        var optMainStyle = $('#options-main-style');
        var optMainStyleAlt = $('#options-main-style-alt');

        var sPageStyle = TriSysApex.UserOptions.PageStyle();
        if (sPageStyle == "Alternative")
        {
            optMainStyle.removeClass('active');
            optMainStyleAlt.addClass('active');
        }
        else
        {
            optMainStyle.addClass('active');
            optMainStyleAlt.removeClass('active');
        }

        optMainStyle.click(function ()
        {
            page.removeClass('style-alt');
            $(this).addClass('active');
            optMainStyleAlt.removeClass('active');

            // Save to server/cookies now
            TriSysApex.UserOptions.PageStyle('Default');
        });

        optMainStyleAlt.click(function ()
        {
            page.addClass('style-alt');
            $(this).addClass('active');
            optMainStyle.removeClass('active');

            // Save to server/cookies now
            TriSysApex.UserOptions.PageStyle('Alternative');
        });

        /* Header options */
        var optHeaderDefault = $('#options-header-default');
        var optHeaderInverse = $('#options-header-inverse');

        if (header.hasClass('navbar-default'))
        {
            //optHeaderDefault.addClass('active');                              // TriSys Apex Mod 12/02/15
            optHeaderInverse.addClass('active');                                // TriSys Apex Mod 12/02/15
            optHeaderDefault.removeClass('active');                             // TriSys Apex Mod 12/02/15
            header.removeClass('navbar-default').addClass('navbar-inverse');    // TriSys Apex Mod 12/02/15
        } else
        {
            optHeaderInverse.addClass('active');                                // TriSys Apex Mod 12/02/15
            //optHeaderDefault.addClass('active');                              // TriSys Apex Mod 12/02/15
        }
    },

    ForceThemeChange: function (themeColor, sThemeName)
    {
        var colorList = $('.sidebar-themes');
        var themeLink = $('#theme-link');

        $('li', colorList).removeClass('active');
        $(this).parent('li').addClass('active');

        if (themeColor === 'default')
        {
            if (themeLink.length)
            {
                themeLink.remove();
                themeLink = $('#theme-link');
            }
        } else
        {
            if (themeLink.length)
            {
                themeLink.attr('href', themeColor);
            } else
            {
                $('link[href="css/themes.css"]').before('<link id="theme-link" rel="stylesheet" href="' + themeColor + '">');
                themeLink = $('#theme-link');
            }
        }

        // TriSys Apex Framework overrides
        setTimeout(TriSysProUI.kendoUI_Overrides, 200);     // Allow time for the theme to propagate
        TriSysProUI.CurrentThemeName = sThemeName;
        TriSysProUI.DisplayCurrentThemeName();

        // Save to server/cookies now
        TriSysApex.UserOptions.Theme(themeColor, true);
    },

    // Externalised colours to allow components like charts to look themed
    NavBarInverseColour: function()
    {
        var lNavBarInverseColour = $('.navbar.navbar-inverse').css("background-color");
        return lNavBarInverseColour;
    },

    BackColour: function (fLightenFactor)
    {
        var lColour = $('.themed-background').css("background-color");

        if (fLightenFactor)
        {
			try
			{
				var Color = net.brehaut.Color;
				lColour = Color(lColour).lightenByAmount(fLightenFactor).toCSS();
			}
			catch(ex)
			{
				// Just return original colour!
			}
        }

        return lColour;
    },

    GroupBackColour: function ()
    {
        var lGroupBackColour = $('.block-title, .navbar.navbar-default, .form-bordered .form-group.form-actions, .table tfoot > tr > th, .table tfoot > tr > td, a.list-group-item:hover, a.list-group-item:focus, .nav > li > a:hover, .nav > li > a:focus, li.dropdown-header, .style-alt .content-header + .breadcrumb-top, .style-alt .breadcrumb-top + .content-header, .style-alt footer, .dropzone, .dataTables_wrapper > div').css("background-color");
        return lGroupBackColour;
    },

    GroupBorderColour: function ()
    {
        var lGroupBorderColour = $('.block').css("border-color");		// border-bottom-color
        return lGroupBorderColour;
    },

    BlockTitleBottomColour: function ()
    {
        var lBlockTitleBottomColour = $('.block-title').css("border-bottom-color");		
        return lBlockTitleBottomColour;
    },

    RowBackColour: function ()
    {
        var rBackColour = $('#divFormContentRow, .table-hover > tbody > tr:hover > td, .table-hover > tbody > tr:hover > th, ul.wysihtml5-toolbar a.btn.wysihtml5-command-active, .slider-track, .nav-horizontal a').css("background-color");
        return rBackColour;
    },

    NavBarFixedTopInverseColour: function ()
    {
        var lNavBarFixedTopInverseColour = $("navbar navbar-fixed-top navbar-inverse").css("background-color");
        return lNavBarFixedTopInverseColour;
    },

    NavBarInverseBackColour: function ()
    {
        var lColour = $('.navbar.navbar-inverse').css("background-color");
        return lColour;
    },

    BlockTitleBackColour: function ()
    {
        var lColour = $('.block-title').css("background-color");
        return lColour;
    },

    AlternativeBlockTitleBackColour: function ()
    {
        var lColour = $('.style-alt .block-title').css("background-color");
        return lColour;
    },

    ThemedColour: function (fLightenFactor)
    {
        var lColour = $('.themed-color').css("color");

        if (fLightenFactor) {
            try {
                var Color = net.brehaut.Color;
                lColour = Color(lColour).lightenByAmount(fLightenFactor).toCSS();
            }
            catch (ex) {
                // Just return original colour!
            }
        }

        return lColour;
    },

    ThemedBorder: function ()
    {
        var lColour = $('.themed-color').css("border-color");
        return lColour;
    },

    // This does not work!
    ThemedBackground: function ()
    {
        //var sCss = '.themed-background-dark';
        var sCSS = '#page-container, #sidebar, #sidebar-alt, .table-pricing.table-featured td, .table-pricing td.table-featured, .themed-background-dark';
        var lColour = $(sCSS).css("background-color");
        return lColour;
    },

    ThemedAlternativeBackColor: function()
    {
        var lColour = $('.switch-default input:checked + span, .style-alt .block-title').css("background-color");
        return lColour;
    },

    ThemedSidebarBackgroundLight: function(fLightenFactor)      // Typically 0.25
    {
        // This does not work
        var sCSS = '.sidebar-user';
        var lColour = $(sCSS).css("background-color");

        // Instead, get the dark nav bar colour and lighten it
        lColour = TriSysProUI.NavBarInverseColour();
        lColour = TriSysProUI.LightenColour(lColour, fLightenFactor);
        return lColour;
    },

    LightenColour: function(lColour, fLightenFactor)
    {
        try
        {
            var Color = net.brehaut.Color;
            lColour = Color(lColour).lightenByAmount(fLightenFactor).toCSS();
            return lColour;

        } catch (e)
        {

        }
    },

    TurnOffApplicationLoadingAnimation: function ()      // TriSysProUI.TurnOffApplicationLoadingAnimation
    {
        var pageWrapper = $('#page-wrapper');

        if (pageWrapper.hasClass('page-loading'))
        {
            pageWrapper.removeClass('page-loading');
        }

        var preloader = $('#preloader-for-default-theme');
        preloader.removeClass().addClass('preloader themed-background');
    },

    DisplayApplicationLayoutAfterStartupAnimation: function()
    {
        TriSysProUI.TurnOffApplicationLoadingAnimation();
        $('#page-container').show();
    },

    DisplayAppNameInStartupAnimation: function (sApplicationName)
    {
        $('#preloader-app-name').html("<strong>" + sApplicationName + "</strong>");
    },

    TweakIconsToTheme: function (sRootID)
    {
        // Find all instances in the DOM 
        $('div[id^=' + sRootID + ']').filter(function ()
        {
            var sID = this.id;
            var elem = $('#' + sID);
            elem.find("i").css("color", TriSysProUI.BackColour());
        });

	},

	// Feb 2018: Add a little dash to startup animation
	// Decided to use CSS instead! See index.html
	// 1 hour of self-indulgent R&D ;-)
	//
	LoadingAnimationEffects: function ()
	{
		return;
		var background = $('.themed-background-night');
		//background.css('background-color', 'red');				// Not work!
		//background.css('background-color', 'red !important');	// Not work!

		// Hoorah! - this works!
		// https://stackoverflow.com/questions/2655925/how-to-apply-important-using-css
		var fnTransition = function(sColour, fnAfter, iMilliseconds)
		{
			// This keeps previous styles - good for some things I guess?
			//background.attr('style', function (i, s) { return s + 'background-color: ' + sColour + ' !important;' });

			background.attr('style', function (i, s) { return 'background-color: ' + sColour + ' !important;' });

			if (fnAfter)
				setTimeout(fnAfter, iMilliseconds);
		};

		var fnBlue = function () { fnTransition("blue") };		
		setTimeout(function ()
		{
			fnTransition("red", fnBlue, 1000);
		}, 1000);
	},

	Grid:       // TriSysProUI.Grid
    {
        // 28 Jan 2021

        HyperlinkedColumnCommandName: function (sColumnName)         // TriSysProUI.Grid.HyperlinkedColumnCommandName
        {
            var sName = sColumnName.replace(/ /g, '') + '_DrillDown';

            // Add the associated CSS
            TriSysProUI.Grid.AddHyperlinkedColumnCSS(sName);

            return sName;
        },

        // More rocket science CSS
        AddHyperlinkedColumnCSS: function (sName)                   // TriSysProUI.Grid.AddHyperlinkedColumnCSS
        {
            var lNavBarInverseColour = TriSysProUI.NavBarInverseColour();

            var sKendoUIHTML = "" +
                "a.k-button.k-button-icontext.k-grid-" + sName +
                "{" +
                "   border: 0px solid pink;" +
                "   font-weight: bold;" +
                "   background-color: transparent;" +
                "   border-radius: 5px;" +
                "   text-align: left;" +
                "   justify-content: left;" +
                "   padding-left: 4px;" +
                "   margin-left: 0px;" +
                "}" +
                "a." + sName + ":hover" +
                "{" +
                "   border: 3px solid " + lNavBarInverseColour + ";" +
                "   font-weight: bold;" +
                "   text-decoration: none;" +
                "   background: " + lNavBarInverseColour + " !important;" +
                "   color: white !important;" +
                "   border-radius: 5px;" +
                "   padding-left: 2px;" +
                "   padding-right: 2px;" +
                "   margin-left: -4px;" +
                "}" +
                ".k-state-selected a.k-button.k-button-icontext.k-grid-" + sName +
                ", .k-state-selected a." + sName +
                "{" +
                "   color: white;" +
                "}" +
                "";

            // Prevent adding twice
            var sNameStyle = "grid-column-style-" + sName
            if ($('#' + sNameStyle).length) {
                $('#' + sNameStyle).html(sKendoUIHTML);
            }
            else {
                $('head').append('<style type="text/css" id="' + sNameStyle + '">'
                                    + sKendoUIHTML +
                                    + '</style>');
            }
        }
    }

}   // End of TriSysProUI