var ctrlIconPicker =
{
    Load: function(fnCallback)
    {
        const fnFocusOnFilter = function ()
        {
            $('#ctrlIconPicker-Glyphicons-search').focus();
        };

        // Initialize tabs
        $('[data-toggle="tabs"] a, .enable-tabs a').click(
            function (e)
            {
                e.preventDefault();
                $(this).tab('show');

                // Relocate the search box to the active tab so that it is always visible
                var sAnchorText = $(this).text().replace(" ", "");
                var sSearchBoxId = 'ctrlIconPicker-' + sAnchorText + '-block-title';
                $('#ctrlIconPicker-Glyphicons-Search-block-options').insertAfter('#' + sSearchBoxId + ' h2');
                fnFocusOnFilter();
            });

        // Setup event handlers to allow simple selection of each icon
        // When an icon button is clicked
        $('#ctrlIconPicker-Selection .btn').click(function ()
        {
            // Get the icon class from the button attribute (data-original-title is created by tooltip)
            //var titleAttr = $(this).attr('data-original-title');
            var titleAttr = $(this).attr('title');

            //Callback function
            fnCallback(titleAttr);

            // Now close this top-most popup
            TriSysApex.UI.CloseModalPopup();

            return false;
        });

        // Filters
        ctrlIconPicker.LoadObjectFilter('Glyphicons',
            ['glyphicons', 'halflings', 'social', 'web-application', 'brand', 'financial', 'miscellaneous']);

        fnFocusOnFilter();
    },

    LoadObjectFilter: function (sWhat, lstTab)
    {
        // Capture enter key on password field
        var txtFilter = $('#' + 'ctrlIconPicker-' + sWhat + '-search');
        txtFilter.off().keyup(function (e)
        {
            // In-Memory filter is every keystroke, not on enter
            if (e.keyCode != 13)
            {
                sFilter = txtFilter.val();

                lstTab.forEach(function (sSuffix)
                {
                    ctrlIconPicker.FilterObjects('icon-picker-tabs-' + sSuffix, sFilter);
                });
            }
        });
    },

    FilterObjects: function (sDOMRootId, sFilter)
    {
        if (sFilter)
            sFilter = sFilter.toLowerCase();
        var iShown = 0;

        var table = document.getElementById(sDOMRootId);

        // Select all <a> elements inside the div with id "xyz"
        $('#' + sDOMRootId + ' a').each(function ()
        {
            // Check if the <i> inside the <a> has the specified class
            var sClass = $(this).attr('title');
            if (sClass.indexOf(sFilter) !== -1)
            {
                // Show the matching <a> elements
                $(this).show();
            } else
            {
                // Hide the non-matching <a> elements
                $(this).hide();
            }
        });

        //ctrlPropertySheet.ShowingObjectCounters(sPrefix, iShown, tr.length);
    }

};  // ctrlIconPicker

