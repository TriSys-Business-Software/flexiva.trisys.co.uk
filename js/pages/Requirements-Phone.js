var RequirementsPhone =
{
    SearchTextCookieName: 'RequirementsPhone-Text',

    Load: function (sText)
    {
debugger;
        if (!sText)
        {
            // Load last search criteria and submit search
            sText = TriSysAPI.Cookies.getCookie(RequirementsPhone.SearchTextCookieName);
        }

        if (sText)
        {
            $('#requirements-form-lookup').val(sText);
            RequirementsPhone.LookupButtonClick();
        }

        // Add event handlers to text box and button
        // Capture enter key on text field
        $('#requirements-form-lookup').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                RequirementsPhone.LookupButtonClick();
            }
        });

        $('#requirements-form-lookup-button').click(RequirementsPhone.LookupButtonClick);
    },

    LookupButtonClick: function ()
    {
        var sText = $('#requirements-form-lookup').val();

        // Store in cookies for next load
        TriSysAPI.Cookies.setCookie(RequirementsPhone.SearchTextCookieName, sText);

        // Clear existing display
        $('#requirements-form-paged-list-container').empty();
        RequirementsPhone.ShowFigures();

        // Get from Web API
        RequirementsPhone._CurrentPageNumber = 1;
        RequirementsPhone.WebAPISearch(sText, RequirementsPhone._CurrentPageNumber);
    },

    WebAPISearch: function (sWildcard, iPageNumber)
    {
        var spinnerWait = { Div: 'requirements-form-paged-list-container' };

        var CRequirementsSearchRequest = {
            Wildcard: sWildcard,
            PageNumber: iPageNumber,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            SortColumnName: 'DateInitiated',
            SortAscending: false
        };

        // Intelligent searching to allow forms to automate other forms
        TriSysPhoneGap.ParseEntityIdInSearchExpression(sWildcard, CRequirementsSearchRequest);


        var payloadObject = {};

        payloadObject.URL = "Requirements/Search";

        payloadObject.OutboundDataPacket = CRequirementsSearchRequest;

        payloadObject.InboundDataFunction = function (CRequirementsSearchResponse)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);

            if (CRequirementsSearchResponse)
            {
                RequirementsPhone.ShowFigures(CRequirementsSearchResponse.Results);

                if (CRequirementsSearchResponse.Success)
                    RequirementsPhone.AppendRecordsToDOM(CRequirementsSearchResponse.Results);
                else
                {
                    // No data to display!
                }

                return;
            }

            TriSysApex.UI.ShowError('RequirementsPhone.WebAPISearch Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);
            TriSysApex.UI.errorAlert('RequirementsPhone.WebAPISearch: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, true);
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ShowFigures: function (CRequirementsSearchResults)
    {
        var figures = $('#requirements-form-lookup-figures');
        figures.html(CRequirementsSearchResults ? 'No records found' : 'Searching...');
        $('#requirements-form-first-page-button').hide();
        $('#requirements-form-next-page-button').hide();

        if (CRequirementsSearchResults)
        {
            figures.html('Showing rows 1 to ' + CRequirementsSearchResults.LastRowNumber +
                            ' of ' + CRequirementsSearchResults.TotalRecordCount + ' records');

            if (CRequirementsSearchResults.LastRowNumber > 8)
                $('#requirements-form-first-page-button').show();

            RequirementsPhone._CurrentPageNumber = CRequirementsSearchResults.PageNumber;
            if (CRequirementsSearchResults.PageNumber < CRequirementsSearchResults.TotalPageCount)
            {
                $('#requirements-form-next-page-button').show();
                var iNextPage = parseInt(CRequirementsSearchResults.PageNumber) + 1;
                $('#requirements-form-next-page-button-text').html('Next Page ' + iNextPage + ' of ' + CRequirementsSearchResults.TotalPageCount);
            }
        }
    },

    AppendRecordsToDOM: function (CRequirementsSearchResults)
    {
        if (CRequirementsSearchResults.TotalRecordCount > 0 && CRequirementsSearchResults.Requirements)
        {
            for (var i = 0; i < CRequirementsSearchResults.Requirements.length; i++)
            {
                var requirement = CRequirementsSearchResults.Requirements[i];
                var sHTML = RequirementsPhone.BuildRecordFromTemplate(requirement);

                $('#requirements-form-paged-list-container').append(sHTML);
            }

            // Fix display
            TriSysApex.Device.FixTextEllipsesHack('.truncated-requirements-text');

            // Go to bottom if we are 'paging'
            if (RequirementsPhone._CurrentPageNumber > 1)
                setTimeout(RequirementsPhone.ScrollToBottom, 10);
        }
    },

    BuildRecordFromTemplate: function (CRequirementSummarySuperset)
    {
        var sHTML = $("#requirements-form-template").html();

        sHTML = sHTML.replace("#:RequirementId#", CRequirementSummarySuperset.RequirementId);
        sHTML = sHTML.replace("#:Reference#", CRequirementSummarySuperset.Reference);
        sHTML = sHTML.replace("#:Consultant#", CRequirementSummarySuperset.Consultant);
        sHTML = sHTML.replace("#:JobTitle#", CRequirementSummarySuperset.JobTitle);
        sHTML = sHTML.replace("#:Status#", CRequirementSummarySuperset.Status);
        sHTML = sHTML.replace("#:CompanyName#", CRequirementSummarySuperset.CompanyName);
        sHTML = sHTML.replace("#:Location#", CRequirementSummarySuperset.Location);
        sHTML = sHTML.replace("#:ClientContact#", CRequirementSummarySuperset.ClientName);

        var sStart = moment(CRequirementSummarySuperset.EarliestStartDate).format("ddd DD MMM YYYY");
        sHTML = sHTML.replace("#:StartDate#", sStart);

        if (!CRequirementSummarySuperset.CompanyLogoURL)
            CRequirementSummarySuperset.CompanyLogoURL = TriSysApex.Constants.DefaultCompanyImage;

        sHTML = sHTML.replace("#:CompanyLogoURL#", CRequirementSummarySuperset.CompanyLogoURL);

        return sHTML;
    },

    RowClick: function (thisRow)
    {
        var lRequirementId = thisRow;
        TriSysApex.FormsManager.OpenForm("Requirement", lRequirementId, true);
    },

    New: function ()
    {
        TriSysApex.Pages.RequirementForm.NewRecord(0);
    },

    ScrollToTop: function ()
    {
        //$.scrollTo('#requirements-form-top');
        $(document.body).scrollTop($('#requirements-form-top').offset().top - 120);
    },

    ScrollToBottom: function ()
    {
        $(document.body).scrollTop($('#requirements-form-first-page-button').offset().top);
    },

    _CurrentPageNumber: 0,
    NextPage: function ()
    {
        var sText = $('#requirements-form-lookup').val();
        RequirementsPhone.WebAPISearch(sText, RequirementsPhone._CurrentPageNumber + 1);
    }
};
