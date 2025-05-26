var ContactsPhone =
{
    SearchTextCookieName: 'ContactsPhone-Text',

    Load: function(sText)
    {
debugger;
        if (!sText)
        {
            // Load last search criteria and submit search
			sText = TriSysAPI.Cookies.getCookie(ContactsPhone.SearchTextCookieName);
		}

        if (sText)
        {
            $('#contacts-form-lookup').val(sText);
            ContactsPhone.LookupButtonClick();
        }

        // Add event handlers to text box and button
        // Capture enter key on text field
        $('#contacts-form-lookup').keyup(function (e)
        {
            if (e.keyCode == 13)
            {
                ContactsPhone.LookupButtonClick();
            }
        });

        $('#contacts-form-lookup-button').click(ContactsPhone.LookupButtonClick);

        


        // Test, get row click for each data table to save having separate <a> tags
        //$("#contacts-form-table-12345 tr").click(function ()
        //{
        //    ContactsPhone.RowClick();
        //});

        // Get a callback when users scroll to the end of the list looking for more data
        // Do not use because we would need to turn this off when moving to other forms - messy!
        //$(window).unbind("scroll");
        //$(window).on("scroll", function ()
        //{
        //    var scrollHeight = $(document).height();
        //    var scrollPosition = $(window).height() + $(window).scrollTop();
        //    if ((scrollHeight - scrollPosition) / scrollHeight === 0)
        //    {
        //        // when scroll to bottom of the page
        //        TriSysApex.Toasters.Success("Scrolled to bottom?");
        //    }
        //});
    },

    LookupButtonClick: function()
    {
        var sText = $('#contacts-form-lookup').val();

        // Store in cookies for next load
        TriSysAPI.Cookies.setCookie(ContactsPhone.SearchTextCookieName, sText);

        // Clear existing display
        $('#contacts-form-paged-list-container').empty();
        ContactsPhone.ShowFigures();

        // Get from Web API
        ContactsPhone._CurrentPageNumber = 1;
        ContactsPhone.WebAPISearch(sText, ContactsPhone._CurrentPageNumber);        
    },

    WebAPISearch: function(sWildcard, iPageNumber)
    {
        var spinnerWait = { Div: 'contacts-form-paged-list-container' };

        var CContactSearchCriteria = {
            Wildcard: sWildcard,
            PageNumber: iPageNumber,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            SortColumnName: 'Surname',
            IncludeContactPhotoURL: true
        };

        var payloadObject = {};

        payloadObject.URL = "Contacts/Search";

        payloadObject.OutboundDataPacket = CContactSearchCriteria;

        payloadObject.InboundDataFunction = function (CContactSearchResults)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);

            if (CContactSearchResults)
            {
                ContactsPhone.ShowFigures(CContactSearchResults);

                if (CContactSearchResults.Success)
                    ContactsPhone.AppendRecordsToDOM(CContactSearchResults);
                else
                {
                    // No data to display!
                }

                return;
            }

            TriSysApex.UI.ShowError('ContactsPhone.WebAPISearch Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, false);
            TriSysApex.UI.errorAlert('ContactsPhone.WebAPISearch: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysSDK.Grid.WaitSpinnerMode(spinnerWait, true);
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    ShowFigures: function (CContactSearchResults)
    {
        //Public Property TotalRecordCount As Long
        //Public Property TotalPageCount As Long
        //Public Property FirstRowNumber As Long
        //Public Property LastRowNumber As Long
        // Public Property PageNumber As Long = 1

        var figures = $('#contacts-form-lookup-figures');
        figures.html( CContactSearchResults ? 'No records found' : 'Searching...');
        $('#contacts-form-first-page-button').hide();
        $('#contacts-form-next-page-button').hide();

        if (CContactSearchResults && CContactSearchResults.Success)
        {
            figures.html('Showing rows 1 to ' + CContactSearchResults.LastRowNumber +
                            ' of ' + CContactSearchResults.TotalRecordCount + ' records');

            if (CContactSearchResults.LastRowNumber > 8)
                $('#contacts-form-first-page-button').show();

            ContactsPhone._CurrentPageNumber = CContactSearchResults.PageNumber;
            if (CContactSearchResults.PageNumber < CContactSearchResults.TotalPageCount)
            {
                $('#contacts-form-next-page-button').show();
                var iNextPage = parseInt(CContactSearchResults.PageNumber) + 1;
                $('#contacts-form-next-page-button-text').html('Next Page ' + iNextPage + ' of ' + CContactSearchResults.TotalPageCount);
            }
        }
    },

    AppendRecordsToDOM: function (CContactSearchResults)
    {
        if (CContactSearchResults.TotalRecordCount > 0 && CContactSearchResults.Contacts)
        {
            for (var i = 0; i < CContactSearchResults.Contacts.length; i++)
            {
                var contact = CContactSearchResults.Contacts[i];
                var sHTML = ContactsPhone.BuildRecordFromTemplate(contact);

                $('#contacts-form-paged-list-container').append(sHTML);
            }

            // Fix display
            TriSysApex.Device.FixTextEllipsesHack('.truncated-contacts-text');

            // Go to bottom if we are 'paging'
            if (ContactsPhone._CurrentPageNumber > 1)
                setTimeout(ContactsPhone.ScrollToBottom, 10);
        }
    },

    BuildRecordFromTemplate: function (CContact)
    {
        var sHTML = $("#contacts-form-template").html();

        sHTML = sHTML.replace("#:ContactId#", CContact.ContactId);
        sHTML = sHTML.replace("#:FullName#", CContact.FullName);
        sHTML = sHTML.replace("#:JobTitle#", (CContact.JobTitle ? CContact.JobTitle : ''));
        sHTML = sHTML.replace("#:CompanyName#", (CContact.CompanyName ? CContact.CompanyName : ''));

        if (!CContact.ContactPhotoURL)
            CContact.ContactPhotoURL = TriSysApex.Constants.DefaultContactImage;

        sHTML = sHTML.replace("#:ContactPhotoURL#", CContact.ContactPhotoURL)

        return sHTML;
    },

    RowClick: function(thisRow)
    {
        var lContactId = thisRow;   //.cells[0].innerText;     //children("td").html();
        TriSysApex.FormsManager.OpenForm("Contact", lContactId, true);
    },

    New: function()
    {
        TriSysApex.Pages.ContactForm.NewRecord(0);
    },

    ScrollToTop: function()
    {
        //$.scrollTo('#contacts-form-top');
        $(document.body).scrollTop($('#contacts-form-top').offset().top - 120);
    },

    ScrollToBottom: function()
    {
        $(document.body).scrollTop($('#contacts-form-first-page-button').offset().top);
    },

    _CurrentPageNumber: 0,
    NextPage: function()
    {
        var sText = $('#contacts-form-lookup').val();
        ContactsPhone.WebAPISearch(sText, ContactsPhone._CurrentPageNumber + 1);
    }
};

