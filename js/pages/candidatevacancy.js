var CandidateVacancy =
{
    // URL processing to allow correct order of custom app loading before execution
    LoadFromURL: function (sParameters)
    {
        TriSysWebJobs.Vacancies.RequirementId = TriSysApex.Pages.Controller.ParseLoadRecordURLParameter(sParameters, 0, true);

        CandidateVacancy.Load(TriSysWebJobs.Vacancies.RequirementId);
    },

    Load: function (lRequirementId)
    {
        $('#webjobs-customer-name').html(TriSysWebJobs.Agency.CustomerName);

        // Display the vacancy               
        CandidateVacancy.ShowVacancySummary(lRequirementId);

        // We may have custom styles
        TriSysWebJobs.Frame.ApplyDynamicFeaturesAndStyleAfterFormLoaded();
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
                $('#trisys-vacancy-jobtitle').html(CVacancySummaryResponse.JobTitle);
                $('#trisys-vacancy-location').html(CVacancySummaryResponse.Location);

                var sSummary = CVacancySummaryResponse.Reference + " &bull; " + CVacancySummaryResponse.JobTitle + " &bull; " + CVacancySummaryResponse.Location;
                $("#trisys-vacancy-summary").html(sSummary);

                var sDescription = CVacancySummaryResponse.JobDescription;
                if (sDescription)
                    sDescription = sDescription.split("\n").join("<br />");

                var sPayType = "Rate";
                var sRemuneration = CVacancySummaryResponse.PayRateSummary;
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

                $("#trisys-vacancy-username").html(CVacancySummaryResponse.UserName);
                fnGetUser(CVacancySummaryResponse.UserId, CVacancySummaryResponse.Reference, CVacancySummaryResponse.JobTitle);

                if (CVacancySummaryResponse.Shortlisted)
                    $('#CandidateVacancy-Menu-Apply').addClass('disabled');

                if (CVacancySummaryResponse.Favourited)
                    $('#CandidateVacancy-Menu-AddToFavourites').addClass('disabled');

                // Show a list of similar vacancies either for this consultantor job title
                CandidateVacancy.DisplaySimilarVacancies(CVacancySummaryResponse.UserId, CVacancySummaryResponse.JobTitle);

                // Custom Fields Start
                if (CVacancySummaryResponse.Custom && CVacancySummaryResponse.Custom.HealthAndSafety)
                {
                    var sHealthAndSafety = CVacancySummaryResponse.Custom.HealthAndSafety;
                    if (sHealthAndSafety)
                        sHealthAndSafety = sHealthAndSafety.split("\n").join("<br />");
                    $('#trisys-vacancy-health-and-safety').html(sHealthAndSafety);
                }                
                // Custom Fields End

                return true;
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            alert('CandidateVacancy.ShowVacancySummary: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Vacancy...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);

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
                    if (user)
                    {
                        var contact = user.Contact;

                        if (contact)
                        {
                            $("#trisys-vacancy-user-name").html(contact.FullName);
                            $("#trisys-vacancy-user-company").html(contact.CompanyName);
                            $("#trisys-vacancy-user-jobtitle").html(contact.JobTitle);
                            $("#trisys-vacancy-user-worktelno").html(contact.WorkTelNo);
                            $("#trisys-vacancy-user-mobiletelno").html(contact.WorkMobileTelNo);

                            if (user.Photo)
                                $("#trisys-vacancy-userphoto").attr('src', user.Photo).show();

                            $("#trisys-vacancy-user-email").attr('href', "mailto:" + contact.WorkEMail + "?subject=" + sReference + ": " + sJobTitle);
                            $("#trisys-vacancy-user-email").html(contact.WorkEMail);

                            $('#trisys-vacancy-similar').html(contact.Forenames + "'s");

                            var elemLinkedIn = $('#trisys-vacancy-user-linkedin');
                            if (elemLinkedIn && contact.LinkedIn)
                                elemLinkedIn.attr('href', contact.LinkedIn);

                            return true;
                        }
                    }

                    // No user or contact associated with this vacancy
                    // Could be legacy data where requirement user is not linked to a contact record
                };

                payloadObject.ErrorHandlerFunction = function (request, status, error)
                {
                    TriSysApex.UI.HideWait();
                    alert('CandidateVacancy.ShowVacancySummary.fnGetUser: ' + status + ": " + error + ". responseText: " + request.responseText);
                };

                TriSysApex.UI.ShowWait(null, "Reading Contact Details...");
                TriSysAPI.Data.PostToWebAPI(payloadObject);
            }
        };
    },

    Apply: function()
    {
        var lRequirementId = TriSysWebJobs.Vacancies.RequirementId;
        if (!lRequirementId || lRequirementId <= 0)
            return;

        var lstRequirementId = [lRequirementId];

        var sReference = $('#trisys-vacancy-reference').html();
        var sJobTitle = $('#trisys-vacancy-jobtitle').html();

        TriSysWebJobs.VacancyApplications.ApplyToMultipleVacancies(lstRequirementId, sReference, sJobTitle);
    },

    AddToFavourites: function()
    {
        TriSysWebJobs.Vacancies.AddToFavourites(null, TriSysWebJobs.Vacancies.AfterAddToFavourite, TriSysWebJobs.Vacancies.RequirementId);
    },
    RemoveFromFavourites: function()
    {
        TriSysApex.UI.ShowMessage("RemoveFromFavourites");
    },

    SendToFriend: function()
    {
        var lRequirementId = TriSysWebJobs.Vacancies.RequirementId;
        if (!lRequirementId || lRequirementId <= 0)
            return;

        var lstRequirementId = [lRequirementId];

        var sReference = $('#trisys-vacancy-reference').html();
        var sJobTitle = $('#trisys-vacancy-jobtitle').html();

        TriSysWebJobs.Vacancies.SendMultipleVacanciesToFriend(lstRequirementId, sReference, sJobTitle);
    },

    DisplaySimilarVacancies: function(lUserId, sJobTitle)
    {
        var CVacancySearchCriteria =
        {
            PageNumber: 1,
            RecordsPerPage: TriSysApex.UserOptions.RecordsPerPage(),

            Status: 'Active',
            
            SortColumnName: 'StartDate',
            SortAscending: false
        };

        // TODO: Company policy on similar jobs
        var bMatchUserId = true;

        if (bMatchUserId)
            CVacancySearchCriteria.UserId = lUserId;
        else
            CVacancySearchCriteria.JobTitle = sJobTitle;

        var payloadObject = {};

        payloadObject.URL = 'Vacancies/Search';
        payloadObject.OutboundDataPacket = CVacancySearchCriteria;
        payloadObject.InboundDataFunction = function (CVacancySearchResponse)
        {
            // Show a structured rendering of the vacancy
            CandidateVacancy.RenderSimilarVacancies(CVacancySearchResponse.Vacancies);

            return true;
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            // Probably missing data services key
            console.log('CandidateVacancy.DisplaySimilarVacancies : ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    RenderSimilarVacancies: function (vacancies)
    {
        var vacancyData = [];
        for (var i = 0; i < vacancies.length; i++)
        {
            var vacancy = vacancies[i];

            var sStartDate = moment(vacancy.StartDate).format("dddd DD MMMM YYYY");

            var vacancyObject = {
                RequirementId: vacancy.RequirementId,
                Reference: vacancy.Reference,
                JobTitle: vacancy.JobTitle,
                Location: vacancy.Location,
                SalaryRate: vacancy.Salary,
                StartDate: sStartDate,
                Permanent: vacancy.Permanent,
                Contract: vacancy.Contract,
                Temporary: vacancy.Temp,
                DateFavourited: vacancy.DateFavourited,
                DateShortlisted: vacancy.DateShortlisted
            };

            vacancyData.push(vacancyObject);
        }

        var directives =
        {
            hyperlink:
            {
                //href: function (params)
                //{
                //    return "http://jobs.trisys.co.uk/customer/?RequirementId=" + this.RequirementId + "&" + TriSysCustomers.Credentials.URLCreds;
                //},

                onclick: function (params)
                {
                    return "TriSysWebJobs.Vacancies.DrillIntoRequirement(" + this.RequirementId + ")";
                }
            },
            Type:
            {
                text: function (params)
                {
                    var sType = 'Temp';
                    if (this.Permanent)
                        sType = 'Perm';
                    else if (this.Contract)
                        sType = 'Contract';

                    return sType;
                },

                class: function (params)
                {
                    var sLabel = "label label-";
                    if (this.Permanent)
                        sLabel += "info";
                    else if (this.Contract)
                        sLabel += "danger";
                    else if (this.Temporary)
                        sLabel += "warning";

                    return sLabel;
                }
            }
        };

        $('.similar-vacancies').render(vacancyData, directives);
    },

    ViewAllLiveVacancies: function()
    {
        TriSysApex.FormsManager.OpenForm(TriSysWebJobs.Constants.CandidateVacancySearchForm, 0, true);
    }
};
