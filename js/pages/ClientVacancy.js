var ClientVacancy =
{
    // URL processing to allow correct order of custom app loading before execution
    LoadFromURL: function (sParameters)
    {
        TriSysWebJobs.Vacancies.RequirementId = TriSysApex.Pages.Controller.ParseLoadRecordURLParameter(sParameters, 0, true);

        ClientVacancy.Load(TriSysWebJobs.Vacancies.RequirementId);
    },

    Load: function (lRequirementId)
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        // Display the vacancy               
        ClientVacancy.ShowVacancySummary(lRequirementId);
    },

    ShowVacancySummary: function (lRequirementId)
    {
        $('#trisys-api-results').html('Authenticated.');

        var CVacancySummaryRequest =
        {
            RequirementId: lRequirementId
        };

        var payloadObject = {};

        payloadObject.URL = 'Vacancy/Summary';
        payloadObject.OutboundDataPacket = CVacancySummaryRequest;
        payloadObject.InboundDataFunction = function (CVacancySummaryResponse)
        {
            TriSysApex.UI.HideWait();

            if (CVacancySummaryResponse.Success)
            {
                var sDisplay = JSON.stringify(CVacancySummaryResponse);

                $('#trisys-api-results').html(sDisplay);

                $('#trisys-vacancy-reference').html(CVacancySummaryResponse.Reference);
                $('#trisys-vacancy-type').html(CVacancySummaryResponse.Type);
                $('#trisys-vacancy-status').html(CVacancySummaryResponse.Status);
                $('#trisys-vacancy-jobtitle').html(CVacancySummaryResponse.JobTitle);
                $('#trisys-vacancy-location').html(CVacancySummaryResponse.Location);

                if (TriSysWebJobs.Constants.LoggedInAsClient)
                {
                    $('#trisys-vacancy-location-label').html('Site Address');
                    $('#trisys-vacancy-status-group').show();
                }

                var sSummary = CVacancySummaryResponse.Reference + " &bull; " + CVacancySummaryResponse.JobTitle + " &bull; " + CVacancySummaryResponse.Location;
                $("#trisys-vacancy-summary").html(sSummary);

                var sDescription = CVacancySummaryResponse.JobDescription;
                if (sDescription)
                    sDescription = sDescription.split("\n").join("<br />");

                var sPayType = (TriSysWebJobs.Constants.LoggedInAsClient ? "Charge " : "") + "Rate";
                var sRemuneration = CVacancySummaryResponse.ChargeRateSummary;
                if (CVacancySummaryResponse.Type == "Permanent")
                {
                    sPayType = "Salary";
                    sRemuneration = CVacancySummaryResponse.MaximumSalaryRate;
                }
                else
                {
                    $('#trisys-vacancy-durationweeks-group').show();
                    $('#trisys-vacancy-durationweeks').html(CVacancySummaryResponse.DurationInWeeks);
                }

                if (sRemuneration)
                    sRemuneration = sRemuneration.replace(/\n/g, '<br />');

                $('#trisys-vacancy-remunerationtype').html(sPayType);
                $('#trisys-vacancy-remuneration').html(sRemuneration);

                if (CVacancySummaryResponse.StartDate)
                {
                    var sStartDate = moment(CVacancySummaryResponse.StartDate).format("dddd DD MMMM YYYY");
                    $('#trisys-vacancy-startdate').html(sStartDate);
                }

                $("#trisys-vacancy-jobdescription").html(sDescription);

                // Custom Fields Start
                if (CVacancySummaryResponse.Custom && CVacancySummaryResponse.Custom.HealthAndSafety)
                {
                    var sHealthAndSafety = CVacancySummaryResponse.Custom.HealthAndSafety;
                    if (sHealthAndSafety)
                        sHealthAndSafety = sHealthAndSafety.split("\n").join("<br />");
                    $('#trisys-vacancy-health-and-safety').html(sHealthAndSafety);
                }
                // Custom Fields End

                $("#trisys-vacancy-username").html(CVacancySummaryResponse.UserName);
                fnGetUser(CVacancySummaryResponse.UserId, CVacancySummaryResponse.Reference, CVacancySummaryResponse.JobTitle);

                var clientContact = CVacancySummaryResponse.ClientContact
                $("#trisys-vacancy-client-name").html(clientContact.FullName);
                $("#trisys-vacancy-client-company").html(clientContact.CompanyName);

                var sAddress = clientContact.CompanyAddressStreet;
                if (sAddress)
                {
                    sAddress = sAddress.replace(/\r\n/g, "<br />");
                    sAddress = sAddress.replace(/\n/g, "<br />");
                }
                sAddress += "<br />" +
                    clientContact.CompanyAddressCity + "<br />" +
                    clientContact.CompanyAddressCounty + "<br />" +
                    clientContact.CompanyAddressPostCode;
                if (clientContact.CompanyAddressCountry)
                    sAddress += "<br />" + clientContact.CompanyAddressCountry;
                $("#trisys-vacancy-client-address").html(sAddress);

                $("#trisys-vacancy-client-jobtitle").html(clientContact.JobTitle);
                $("#trisys-vacancy-client-worktelno").html(clientContact.WorkTelNo);
                $("#trisys-vacancy-client-mobiletelno").html(clientContact.WorkMobileTelNo);

                if (CVacancySummaryResponse.ClientCompanyLogoURL)
                    $("#trisys-vacancy-companylogo").attr('src', CVacancySummaryResponse.ClientCompanyLogoURL).show();

                $("#trisys-vacancy-client-email").attr('href', "mailto:" + clientContact.WorkEMail + "?subject=" + CVacancySummaryResponse.Reference + ": " + CVacancySummaryResponse.JobTitle);
                $("#trisys-vacancy-client-email").html(clientContact.WorkEMail);

                return true;
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            alert('ClientVacancy.ShowVacancySummary: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Vacancy...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);

        // Display the shortlist of candidates who are interested
        if (TriSysWebJobs.Constants.LoggedInAsClient)
            ClientVacancy.PopulateCandidateShortlistGrid(lRequirementId);

        // Get the recruitment consultant details
        var fnGetUser = function (lUserId, sReference, sJobTitle)
        {
            if (lUserId > 0)
            {
                var CReadUserAccountRequest = { UserId: lUserId };

                var payloadObject = {};

                payloadObject.URL = 'Users/ReadUserAccount';
                payloadObject.OutboundDataPacket = CReadUserAccountRequest;
                payloadObject.InboundDataFunction = function (CReadUserAccountResponse)
                {
                    TriSysApex.UI.HideWait();

                    var user = CReadUserAccountResponse.UserAccount;
                    var contact = user.Contact;

                    $("#trisys-vacancy-user-name").html(contact.FullName);
                    $("#trisys-vacancy-user-company").html(contact.CompanyName);
                    $("#trisys-vacancy-user-jobtitle").html(contact.JobTitle);
                    $("#trisys-vacancy-user-worktelno").html(contact.WorkTelNo);
                    $("#trisys-vacancy-user-mobiletelno").html(contact.WorkMobileTelNo);

                    if (user.Photo)
                        $("#trisys-vacancy-userphoto").attr('src', user.Photo).show();

                    $("#trisys-vacancy-user-email").attr('href', "mailto:" + contact.WorkEMail + "?subject=" + sReference + ": " + sJobTitle);
                    $("#trisys-vacancy-user-email").html(contact.WorkEMail);

                    var elemLinkedIn = $('#trisys-vacancy-user-linkedin');
                    if (elemLinkedIn && contact.LinkedIn)
                        elemLinkedIn.attr('href', contact.LinkedIn);

                    return true;
                };

                payloadObject.ErrorHandlerFunction = function (request, status, error)
                {
                    TriSysApex.UI.HideWait();
                    alert('ClientVacancy.ShowVacancySummary.fnGetUser: ' + status + ": " + error + ". responseText: " + request.responseText);
                };

                TriSysApex.UI.ShowWait(null, "Reading Contact Details...");
                TriSysAPI.Data.PostToWebAPI(payloadObject);
            };
        }
    },

    PopulateCandidateShortlistGrid: function (lRequirementId)
    {
        var sGridID = 'trisys-vacancy-ShortlistGrid', sGridName = 'ShortlistedCandidates', sTitle = 'Shortlisted Candidates';

        // Jan 2018: Use a dedicated API method which abstracts the underlying SQL and does not use 'SQLDatabase/SQL_Select'
        var fnPopulationByFunction = {
            API: "Contacts/List",                   // The Web API Controller/Function

            // The additional parameters passed into the function not including the paging metrics
            Parameters: function (request)
            {
                request.RequirementId = lRequirementId
                request.Shortlist = true;
            },

            DataTableFunction: function (response)  // Called to get a suitable data table for the grid to display
            {
                return response.List;               // The list of records from the Web API
            }
        };

        var bHorizontalScrolling = false;   //true;     // Unfortunately, this breaks row selection and therefore all menus for this grid!

        TriSysSDK.Grid.VirtualMode({
            Div: sGridID,
            ID: sGridName,
            Title: sTitle,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),
            PopulationByFunction: fnPopulationByFunction,
            Columns: ClientVacancy.Columns,
            MobileVisibleColumns: ClientVacancy.MobileVisibleColumns,
            MobileRowTemplate: ClientVacancy.MobileRowTemplate,

            KeyColumnName: "ContactId",
            DrillDownFunction: null,
            PreviewButtonFunction: function (rowData)
            {
                var lContactId = rowData.ContactId;
                ClientVacancy.OpenCandidateCV(lContactId, lRequirementId);
            },
            PreviewButtonTooltip: 'Candidate CV',
            MultiRowSelect: true,
            ColumnFilters: false,
            Grouping: false,
            HorizontalScrolling: bHorizontalScrolling
        });
    },

    Columns: [
                { field: "ContactId", title: "ID", type: "number", width: 70, hidden: true },
                { field: "Contact_FullName", title: "Candidate Name", type: "string", width: 170, locked: false },  // Set to true if Telerik fix this!
                { field: "DateShortlisted", title: "Shortlisted", type: "date", format: "{0:dd MMM yyyy }", width: 110, hidden: true },
                { field: "Called", title: "Called", type: "date", format: "{0:dd MMM yyyy }", width: 100, hidden: true },
                { field: "Interested", title: "Interested", type: "date", format: "{0:dd MMM yyyy }", width: 100, hidden: true },
                { field: "CVSend", title: "CV Send", type: "date", format: "{0:dd MMM yyyy }", width: 100 },
                { field: "TelephoneInterview", title: "Tel. Interview", type: "date", format: "{0:dd MMM yyyy }", width: 120 },
                { field: "FirstInterview", title: "First Interview", type: "date", format: "{0:dd MMM yyyy }", width: 120 },
                { field: "SecondInterview", title: "Second Interview", type: "date", format: "{0:dd MMM yyyy }", width: 130 },
                { field: "ThirdInterview", title: "Third Interview", type: "date", format: "{0:dd MMM yyyy }", hidden: true },
                { field: "FourthInterview", title: "Fourth Interview", type: "date", format: "{0:dd MMM yyyy }", hidden: true },
                { field: "FifthInterview", title: "Fifth Interview", type: "date", format: "{0:dd MMM yyyy }", hidden: true },
                { field: "ReferencesTaken", title: "References Taken", type: "date", format: "{0:dd MMM yyyy }", width: 140, hidden: true },
                { field: "OfferMade", title: "Offer Made", type: "date", format: "{0:dd MMM yyyy }", width: 110 },
                { field: "OfferAccepted", title: "Offer Accepted", type: "date", format: "{0:dd MMM yyyy }", width: 130 },
                { field: "OfferRejected", title: "Offer Rejected", type: "date", format: "{0:dd MMM yyyy }", width: 130 },
                { field: "Placed", title: "Placed", type: "date", format: "{0:dd MMM yyyy }", width: 100 },
                { field: "Withdrawn", title: "Withdrawn", type: "date", format: "{0:dd MMM yyyy }", width: 110, hidden: true },
                { field: "Rejected", title: "Rejected", type: "date", format: "{0:dd MMM yyyy }", width: 100 }
    ],
    MobileVisibleColumns: [
                { field: "Contact_FullName" }
    ],
    MobileRowTemplate: '<td colspan="1"><strong>#: Contact_FullName # </strong><br />#: ShortlistSourceName #<br />' +
                        '<i>Shortlisted: #: DateShortlisted #</i><br />' +
                        'Called: #: Called #<br />' +
                        'Interested: #: Interested #<br />' +
                        'CV Send: #: CVSend #<br />' +
                        'Tel. Interview: #: TelephoneInterview #<br />' +
                        '1st. Interview: #: FirstInterview #<br />' +
                        'Offer: #: OfferMade #<br />' +
                        'Accepted: #: OfferAccepted #<br />' +
                        'Placed: #: Placed #<br />' +
                        '<hr></td>',

    OpenCandidateCV: function (lContactId, lRequirementId)
    {
        // Open the appropriate formatted CV for this candidate

        var COpenCandidateFormattedCVRequest = {
            ContactId: lContactId,
            RequirementId: lRequirementId
        };

        var payloadObject = {};

        payloadObject.URL = 'Contact/OpenCandidateFormattedCV';
        payloadObject.OutboundDataPacket = COpenCandidateFormattedCVRequest;
        payloadObject.InboundDataFunction = function (COpenCandidateFormattedCVResponse)
        {
            TriSysApex.UI.HideWait();

            if (COpenCandidateFormattedCVResponse && COpenCandidateFormattedCVResponse.Success)
            {
                var sFilePath = COpenCandidateFormattedCVResponse.FilePath;
                var sCandidateName = COpenCandidateFormattedCVResponse.FullName;

                if (sFilePath)
                {
                    // Get a URL of this file which we can view via an asynchronous call
                    TriSysSDK.Controls.FileManager.GetOpenFileURLFromWebService("TriSys CV Viewer", sFilePath, sCandidateName + " CV");
                }
            }

            return true;
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            alert('ClientVacancy.OpenCandidateCV: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Candidate...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);        
    },

    GetSingleCandidate: function()
    {
        var sGrid = 'trisys-vacancy-ShortlistGrid';
        var lContactId = TriSysSDK.Grid.GetSelectedSingletonRowRecordIdFromGrid(sGrid, "ContactId", "candidate", true);
        if (lContactId > 0)
        {
            var sCandidateName = TriSysSDK.Grid.GetSelectedSingletonRowFieldValueFromGrid(sGrid, "Contact_FullName");
            var candidate = {
                FullName: sCandidateName,
                ContactId: lContactId
            };

            return candidate;
        }
    },

    RequestInterview: function()
    {
        var candidate = ClientVacancy.GetSingleCandidate();
        if (candidate)
        {
            candidate.Operation = "Request Interview";
            ClientVacancy.ShortlistedCandidateAction(candidate, "Request Interview with " + candidate.FullName,
                                                                "request an interview with " + candidate.FullName);
        }
    },

    MakeOffer: function ()
    {
        var candidate = ClientVacancy.GetSingleCandidate();
        if (candidate)
        {
            candidate.Operation = "Make Offer";
            ClientVacancy.ShortlistedCandidateAction(candidate, "Make Offer to " + candidate.FullName,
                                                                "make an offer to " + candidate.FullName);
        }
    },

    Reject: function ()
    {
        var candidate = ClientVacancy.GetSingleCandidate();
        if (candidate)
        {
            candidate.Operation = "Reject Candidate";
            ClientVacancy.ShortlistedCandidateAction(candidate, "Reject " + candidate.FullName,
                                                                "reject " + candidate.FullName);
        }
    },

    ShortlistedCandidateAction: function (candidate, sTitle, sDescription)
    {
        //TriSysApex.UI.ShowMessage(sAction + " [" + candidate.ContactId + "]");
        //TriSysWebJobs.Vacancies.RequirementId

        var requirement = {
            RequirementId: TriSysWebJobs.Vacancies.RequirementId,
            Reference: $('#trisys-vacancy-reference').html(),
            JobTitle: $('#trisys-vacancy-jobtitle').html()
        };

        candidate.Description = sDescription;

        var sButtonSendText = "Send Request";
        var fnSendRequest = function ()
        {
            ctrlClientShortlistAction.SendRequest(candidate, requirement);
        };

        var fnCancelSend = function ()
        {
            // OK to close
            return true;
        };

        // Show the dialogue now
        var parametersObject = new TriSysApex.UI.ShowMessageParameters();
        parametersObject.Title = sTitle;
        parametersObject.Height = 225;
        parametersObject.Resizable = false;
        parametersObject.Maximize = false;
        parametersObject.Image = 'fa-envelope-o';

        parametersObject.ContentURL = TriSysApex.Constants.UserControlFolder + 'ctrlClientShortlistAction.html';

        // Buttons
        parametersObject.ButtonLeftText = sButtonSendText;
        parametersObject.ButtonLeftFunction = fnSendRequest;
        parametersObject.ButtonLeftVisible = true;
        parametersObject.ButtonLeftWidth = 100;
        parametersObject.ButtonRightWidth = 100;
        parametersObject.ButtonRightVisible = true;
        parametersObject.ButtonRightText = "Cancel";
        parametersObject.ButtonRightFunction = fnCancelSend;

        // Callback
        parametersObject.OnLoadCallback = function ()
        {
            ctrlClientShortlistAction.Load(candidate, requirement);
        };

        TriSysApex.UI.PopupMessage(parametersObject);
    }
};

$(document).ready(function ()
{
    // 04 Mar 2017 - wait for LoadFromURL event
    //ClientVacancy.Load();
});
