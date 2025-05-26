var JobSeekers =
{
    SearchTextCookieName: 'JobSeekers-Text',

    Load: function()
    {
        // Menus? Buttons?
        // Add event handlers to text box and button

        // Capture enter key on text field
        $('#vacancies-form-lookup').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                JobSeekers.LookupButtonClick();
            }
        });

        $('#vacancies-form-lookup-button').click(JobSeekers.LookupButtonClick);
    },
    
    LoadRecord: function()
    {
        // TriSys Web Jobs initialises its own data services key request every time
        // This will be called before an actual candidate login

        WebJobsConnectivity.Connect(JobSeekers.LoadSearchFromCookie);
    },
    
    LoadSearchFromCookie: function()
    {
        // Load last search criteria and submit search
        var sText = TriSysAPI.Cookies.getCookie(JobSeekers.SearchTextCookieName);

        if (sText)
        {
            $('#vacancies-form-lookup').val(sText);            
        }

        // Search even if no criteria
        JobSeekers.LookupButtonClick();
    },

    LookupButtonClick: function()
    {
        var sText = $('#vacancies-form-lookup').val();

        // Store in cookies for next load
        TriSysAPI.Cookies.setCookie(JobSeekers.SearchTextCookieName, sText);

        // Clear existing display
        $('#vacancies-form-paged-list-container').empty();
        JobSeekers.ShowFigures();

        // Get from Web API
        JobSeekers._CurrentPageNumber = 1;
        JobSeekers.WebAPISearch(sText, JobSeekers._CurrentPageNumber);
    },

    WebAPISearch: function (sWildcard, iPageNumber)
    {
        var spinnerWait = { Div: 'vacancies-form-paged-list-container' };

        var CVacancySearchCriteria = {
            FreeText: sWildcard,
            PageNumber: iPageNumber,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            SortColumnName: 'StartDate',
            SortAscending: false
        };


        var payloadObject = {};

        payloadObject.URL = "Vacancies/Search";

        payloadObject.OutboundDataPacket = CVacancySearchCriteria;

        payloadObject.InboundDataFunction = function (CVacancySearchResponse)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);

            if (CVacancySearchResponse)
            {
                JobSeekers.ShowFigures(CVacancySearchResponse);

                if (CVacancySearchResponse.Success)
                    JobSeekers.AppendRecordsToDOM(CVacancySearchResponse);
                else
                {
                    // No data to display! or the API is not permissioned!
                }

                return;
            }

            TriSysApex.UI.ShowError('JobSeekers.WebAPISearch Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);
            TriSysApex.UI.errorAlert('JobSeekers.WebAPISearch: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, true);
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ShowFigures: function (CVacancySearchResponse)
    {
        var figures = $('#vacancies-form-lookup-figures');
        figures.html(CVacancySearchResponse ? 'No records found' : 'Searching...');
        $('#vacancies-form-first-page-button').hide();
        $('#vacancies-form-next-page-button').hide();

        if (CVacancySearchResponse)
        {
            figures.html('Showing rows 1 to ' + CVacancySearchResponse.LastRowNumber +
                            ' of ' + CVacancySearchResponse.TotalRecordCount + ' records');

            if (CVacancySearchResponse.LastRowNumber > 8)
                $('#vacancies-form-first-page-button').show();

            JobSeekers._CurrentPageNumber = CVacancySearchResponse.PageNumber;
            if (CVacancySearchResponse.PageNumber < CVacancySearchResponse.TotalPageCount)
            {
                $('#vacancies-form-next-page-button').show();
                var iNextPage = parseInt(CVacancySearchResponse.PageNumber) + 1;
                $('#vacancies-form-next-page-button-text').html('Next Page ' + iNextPage + ' of ' + CVacancySearchResponse.TotalPageCount);
            }
        }
    },

    AppendRecordsToDOM: function (CVacancySearchResponse)
    {
        if (CVacancySearchResponse.TotalRecordCount > 0 && CVacancySearchResponse.Vacancies)
        {
            for (var i = 0; i < CVacancySearchResponse.Vacancies.length; i++)
            {
                var vacancy = CVacancySearchResponse.Vacancies[i];
                var sHTML = JobSeekers.BuildRecordFromTemplate(vacancy);

                $('#vacancies-form-paged-list-container').append(sHTML);
            }

            // Fix display
            TriSysApex.Device.FixTextEllipsesHack('.truncated-requirements-text');

            // Go to bottom if we are 'paging'
            if (JobSeekers._CurrentPageNumber > 1)
                setTimeout(JobSeekers.ScrollToBottom, 10);
        }
    },

    BuildRecordFromTemplate: function (CVacancySearchResultSummary)
    {
        var sHTML = $("#vacancies-form-template").html();

        sHTML = sHTML.replace(/#:RequirementId#/g, CVacancySearchResultSummary.RequirementId);
        sHTML = sHTML.replace(/#:Reference#/g, CVacancySearchResultSummary.Reference);
        sHTML = sHTML.replace(/#:Consultant#/g, CVacancySearchResultSummary.UserName);
        sHTML = sHTML.replace(/#:JobTitle#/g, CVacancySearchResultSummary.JobTitle);
        sHTML = sHTML.replace(/#:Status/g, CVacancySearchResultSummary.Status);
        sHTML = sHTML.replace(/#:Type#/g, CVacancySearchResultSummary.Type);
        sHTML = sHTML.replace(/#:Salary#/g, CVacancySearchResultSummary.Salary);
        sHTML = sHTML.replace(/#:Location#/g, CVacancySearchResultSummary.Location);

        var sWebText = CVacancySearchResultSummary.WebText;
        if (sWebText)
        {
            var iMaxLen = 500;
            if (sWebText.length > iMaxLen)
                sWebText = sWebText.substring(0, iMaxLen) + ' (more...)';
        }
        else
            sWebText = '';
        sHTML = sHTML.replace("#:WebText#", sWebText);

		var sStart = moment(CVacancySearchResultSummary.StartDate).format("ddd DD MMM YYYY");
        sHTML = sHTML.replace("#:StartDate#", sStart);

        return sHTML;
    },

    RowClick: function (thisRow)
    {
        var lRequirementId = thisRow;
        TriSysApex.FormsManager.OpenForm("Vacancy", lRequirementId, true);
    },

    ScrollToTop: function ()
    {
        //$.scrollTo('#vacancies-form-top');
        $(document.body).scrollTop($('#vacancies-form-top').offset().top - 120);
    },

    ScrollToBottom: function ()
    {
        $(document.body).scrollTop($('#vacancies-form-first-page-button').offset().top);
    },

    _CurrentPageNumber: 0,
    NextPage: function ()
    {
        var sText = $('#vacancies-form-lookup').val();
        JobSeekers.WebAPISearch(sText, JobSeekers._CurrentPageNumber + 1);
    }
};

$(document).ready(function ()
{
    debugger;
    JobSeekers.Load();
});