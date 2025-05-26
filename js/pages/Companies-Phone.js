var CompaniesPhone =
{
    SearchTextCookieName: 'CompaniesPhone-Text',

    Load: function ()
    {
        // Load last search criteria and submit search
        var sText = TriSysAPI.Cookies.getCookie(CompaniesPhone.SearchTextCookieName);
        if (sText)
        {
            $('#companies-form-lookup').val(sText);
            CompaniesPhone.LookupButtonClick();
        }

        // Add event handlers to text box and button
        // Capture enter key on text field
        $('#companies-form-lookup').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                CompaniesPhone.LookupButtonClick();
            }
        });

        $('#companies-form-lookup-button').click(CompaniesPhone.LookupButtonClick);
    },

    LookupButtonClick: function ()
    {
        var sText = $('#companies-form-lookup').val();

        // Store in cookies for next load
        TriSysAPI.Cookies.setCookie(CompaniesPhone.SearchTextCookieName, sText);

        // Clear existing display
        $('#companies-form-paged-list-container').empty();
        CompaniesPhone.ShowFigures();

        // Get from Web API
        CompaniesPhone._CurrentPageNumber = 1;
        CompaniesPhone.WebAPISearch(sText, CompaniesPhone._CurrentPageNumber);
    },

    WebAPISearch: function (sWildcard, iPageNumber)
    {
        var spinnerWait = { Div: 'companies-form-paged-list-container' };

        var CCompanySearchCriteria = {
            Wildcard: sWildcard,
            PageNumber: iPageNumber,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            SortColumnName: 'Company_Name',
            IncludeCompanyLogoURL: true
        };

        var payloadObject = {};

        payloadObject.URL = "Companies/Search";

        payloadObject.OutboundDataPacket = CCompanySearchCriteria;

        payloadObject.InboundDataFunction = function (CCompanySearchResults)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);

            if (CCompanySearchResults)
            {
                CompaniesPhone.ShowFigures(CCompanySearchResults);

                if (CCompanySearchResults.Success)
                    CompaniesPhone.AppendRecordsToDOM(CCompanySearchResults);
                else
                {
                    // No data to display!
                }

                return;
            }

            TriSysApex.UI.ShowError('CompaniesPhone.WebAPISearch Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);
            TriSysApex.UI.errorAlert('CompaniesPhone.WebAPISearch: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, true);
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ShowFigures: function (CCompanySearchResults)
    {
        var figures = $('#companies-form-lookup-figures');
        figures.html(CCompanySearchResults ? 'No records found' : 'Searching...');
        $('#companies-form-first-page-button').hide();
        $('#companies-form-next-page-button').hide();

        if (CCompanySearchResults && CCompanySearchResults.Success)
        {
            figures.html('Showing rows 1 to ' + CCompanySearchResults.LastRowNumber +
                            ' of ' + CCompanySearchResults.TotalRecordCount + ' records');

            if (CCompanySearchResults.LastRowNumber > 8)
                $('#companies-form-first-page-button').show();

            CompaniesPhone._CurrentPageNumber = CCompanySearchResults.PageNumber;
            if (CCompanySearchResults.PageNumber < CCompanySearchResults.TotalPageCount)
            {
                $('#companies-form-next-page-button').show();
                var iNextPage = parseInt(CCompanySearchResults.PageNumber) + 1;
                $('#companies-form-next-page-button-text').html('Next Page ' + iNextPage + ' of ' + CCompanySearchResults.TotalPageCount);
            }
        }
    },

    AppendRecordsToDOM: function (CCompanySearchResults)
    {
        if (CCompanySearchResults.TotalRecordCount > 0 && CCompanySearchResults.Companies)
        {
            for (var i = 0; i < CCompanySearchResults.Companies.length; i++)
            {
                var company = CCompanySearchResults.Companies[i];
                var sHTML = CompaniesPhone.BuildRecordFromTemplate(company);

                $('#companies-form-paged-list-container').append(sHTML);
            }

            // Fix display
            TriSysApex.Device.FixTextEllipsesHack('.truncated-companies-text');

            // Go to bottom if we are 'paging'
            if (CompaniesPhone._CurrentPageNumber > 1)
                setTimeout(CompaniesPhone.ScrollToBottom, 10);
        }
    },

    BuildRecordFromTemplate: function (CCompany)
    {
        var sHTML = $("#companies-form-template").html();

        sHTML = sHTML.replace("#:CompanyId#", CCompany.CompanyId);
        sHTML = sHTML.replace("#:CompanyName#", CCompany.CompanyName);
        sHTML = sHTML.replace("#:Industry#", CCompany.Industry);
        sHTML = sHTML.replace("#:MainTelNo#", (CCompany.MainTelNo ? CCompany.MainTelNo : ''));
        sHTML = sHTML.replace("#:WebPage#", (CCompany.WebPage ? CCompany.WebPage : ''));

        if (!CCompany.CompanyLogoURL)
            CCompany.CompanyLogoURL = TriSysApex.Constants.DefaultCompanyImage;

        sHTML = sHTML.replace("#:CompanyLogoURL#", CCompany.CompanyLogoURL);

        return sHTML;
    },

    RowClick: function (thisRow)
    {
        var lCompanyId = thisRow; 
        TriSysApex.FormsManager.OpenForm("Company", lCompanyId, true);
    },

    New: function ()
    {
        TriSysApex.Pages.CompanyForm.NewRecord(0);
    },

    ScrollToTop: function ()
    {
        //$.scrollTo('#companies-form-top');
        $(document.body).scrollTop($('#companies-form-top').offset().top - 120);
    },

    ScrollToBottom: function ()
    {
        $(document.body).scrollTop($('#companies-form-first-page-button').offset().top);
    },

    _CurrentPageNumber: 0,
    NextPage: function ()
    {
        var sText = $('#companies-form-lookup').val();
        CompaniesPhone.WebAPISearch(sText, CompaniesPhone._CurrentPageNumber + 1);
    }
};

$(document).ready(function ()
{
    CompaniesPhone.Load();
});
