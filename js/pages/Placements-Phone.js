var PlacementsPhone =
{
    SearchTextCookieName: 'PlacementsPhone-Text',

    Load: function (sText)
    {
        if (!sText)
        {
            // Load last search criteria and submit search
            sText = TriSysAPI.Cookies.getCookie(PlacementsPhone.SearchTextCookieName);
        }

        if (sText)
        {
            $('#placements-form-lookup').val(sText);
            PlacementsPhone.LookupButtonClick();
        }

        // Add event handlers to text box and button
        // Capture enter key on text field
        $('#placements-form-lookup').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                PlacementsPhone.LookupButtonClick();
            }
        });

        $('#placements-form-lookup-button').click(PlacementsPhone.LookupButtonClick);
    },

    LookupButtonClick: function ()
    {
        var sText = $('#placements-form-lookup').val();

        // Store in cookies for next load
        TriSysAPI.Cookies.setCookie(PlacementsPhone.SearchTextCookieName, sText);

        // Clear existing display
        $('#placements-form-paged-list-container').empty();
        PlacementsPhone.ShowFigures();

        // Get from Web API
        PlacementsPhone._CurrentPageNumber = 1;
        PlacementsPhone.WebAPISearch(sText, PlacementsPhone._CurrentPageNumber);
    },

    WebAPISearch: function (sWildcard, iPageNumber)
    {
        var spinnerWait = { Div: 'placements-form-paged-list-container' };

        var CPlacementsSearchRequest = {
            Wildcard: sWildcard,
            PageNumber: iPageNumber,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            SortColumnName: 'StartDate',
            SortAscending: false
        };

        // Intelligent searching to allow forms to automate other forms
        TriSysPhoneGap.ParseEntityIdInSearchExpression(sWildcard, CPlacementsSearchRequest);

        var payloadObject = {};

        payloadObject.URL = "Placements/Search";

        payloadObject.OutboundDataPacket = CPlacementsSearchRequest;

        payloadObject.InboundDataFunction = function (CPlacementsSearchResponse)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);

            if (CPlacementsSearchResponse)
            {
                PlacementsPhone.ShowFigures(CPlacementsSearchResponse.Results);

                if (CPlacementsSearchResponse.Success)
                    PlacementsPhone.AppendRecordsToDOM(CPlacementsSearchResponse.Results);
                else
                {
                    // No data to display!
                }

                return;
            }

            TriSysApex.UI.ShowError('PlacementsPhone.WebAPISearch Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);
            TriSysApex.UI.errorAlert('PlacementsPhone.WebAPISearch: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, true);
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ShowFigures: function (CPlacementsSearchResults)
    {
        var figures = $('#placements-form-lookup-figures');
        figures.html(CPlacementsSearchResults ? 'No records found' : 'Searching...');
        $('#placements-form-first-page-button').hide();
        $('#placements-form-next-page-button').hide();

        if (CPlacementsSearchResults)
        {
            figures.html('Showing rows 1 to ' + CPlacementsSearchResults.LastRowNumber +
                            ' of ' + CPlacementsSearchResults.TotalRecordCount + ' records');

            if (CPlacementsSearchResults.LastRowNumber > 8)
                $('#placements-form-first-page-button').show();

            PlacementsPhone._CurrentPageNumber = CPlacementsSearchResults.PageNumber;
            if (CPlacementsSearchResults.PageNumber < CPlacementsSearchResults.TotalPageCount)
            {
                $('#placements-form-next-page-button').show();
                var iNextPage = parseInt(CPlacementsSearchResults.PageNumber) + 1;
                $('#placements-form-next-page-button-text').html('Next Page ' + iNextPage + ' of ' + CPlacementsSearchResults.TotalPageCount);
            }
        }
    },

    AppendRecordsToDOM: function (CPlacementsSearchResults)
    {
        if (CPlacementsSearchResults.TotalRecordCount > 0 && CPlacementsSearchResults.Placements)
        {
            for (var i = 0; i < CPlacementsSearchResults.Placements.length; i++)
            {
                var placement = CPlacementsSearchResults.Placements[i];
                var sHTML = PlacementsPhone.BuildRecordFromTemplate(placement);

                $('#placements-form-paged-list-container').append(sHTML);
            }

            // Fix display
            TriSysApex.Device.FixTextEllipsesHack('.truncated-placements-text');

            // Go to bottom if we are 'paging'
            if (PlacementsPhone._CurrentPageNumber > 1)
                setTimeout(PlacementsPhone.ScrollToBottom, 10);
        }
    },

    BuildRecordFromTemplate: function (CPlacementSummarySuperset)
    {
        var sHTML = $("#placements-form-template").html();

        sHTML = sHTML.replace("#:PlacementId#", CPlacementSummarySuperset.PlacementId);
        sHTML = sHTML.replace("#:Reference#", CPlacementSummarySuperset.Reference);
        sHTML = sHTML.replace("#:Consultant#", CPlacementSummarySuperset.UserName);
        sHTML = sHTML.replace("#:JobTitle#", CPlacementSummarySuperset.JobTitle);
        sHTML = sHTML.replace("#:Status#", CPlacementSummarySuperset.Status);
        sHTML = sHTML.replace("#:CompanyName#", CPlacementSummarySuperset.CompanyName);
        sHTML = sHTML.replace("#:City#", CPlacementSummarySuperset.City);
        var sStart = moment(CPlacementSummarySuperset.StartDate).format("ddd DD MMM YYYY")
        sHTML = sHTML.replace("#:ClientContact#", CPlacementSummarySuperset.ClientName);
        sHTML = sHTML.replace("#:CandidateContact#", CPlacementSummarySuperset.CandidateName);
        sHTML = sHTML.replace("#:StartDate#", sStart);

        if (!CPlacementSummarySuperset.CompanyLogoURL)
            CPlacementSummarySuperset.CompanyLogoURL = TriSysApex.Constants.DefaultCompanyImage;

        sHTML = sHTML.replace("#:CompanyLogoURL#", CPlacementSummarySuperset.CompanyLogoURL);

        return sHTML;
    },

    RowClick: function (thisRow)
    {
        var lPlacementId = thisRow;
        TriSysApex.FormsManager.OpenForm("Placement", lPlacementId, true);
    },

    New: function ()
    {
        TriSysApex.Pages.PlacementForm.NewRecord(0);
    },

    ScrollToTop: function ()
    {
        //$.scrollTo('#placements-form-top');
        $(document.body).scrollTop($('#placements-form-top').offset().top - 120);
    },

    ScrollToBottom: function ()
    {
        $(document.body).scrollTop($('#placements-form-first-page-button').offset().top);
    },

    _CurrentPageNumber: 0,
    NextPage: function ()
    {
        var sText = $('#placements-form-lookup').val();
        PlacementsPhone.WebAPISearch(sText, PlacementsPhone._CurrentPageNumber + 1);
    }
};

