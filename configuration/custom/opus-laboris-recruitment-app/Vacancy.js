var Vacancy =
{
    _RequirementId: 0,

    LoadRecord: function (lRequirementId)
    {
        // TriSys Web Jobs initialises its own data services key request every time
        // This will be called before an actual candidate login
        Vacancy._RequirementId = lRequirementId;

        WebJobsConnectivity.Connect(function () { Vacancy.LoadVacancy(lRequirementId); });
    },

    LoadVacancy: function(lRequirementId)
    {
        var CVacancySummaryRequest = {
            RequirementId: lRequirementId
        };

        var payloadObject = {};

        payloadObject.URL = "Vacancy/Summary";

        payloadObject.OutboundDataPacket = CVacancySummaryRequest;

        payloadObject.InboundDataFunction = function (CVacancySummaryResponse)
        {
            TriSysApex.UI.HideWait();

            if (CVacancySummaryResponse)
            {
                if (CVacancySummaryResponse.Success)
                    Vacancy.DisplayData(CVacancySummaryResponse);
                else
                {
                    // No data to display! or the API is not permissioned!
                }

                return;
            }

            TriSysApex.UI.ShowError('Vacancy.LoadVacancy Error: null response');
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('Vacancy.LoadVacancy: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Vacancy...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    DisplayData: function (CVacancySummaryResponse)
    {
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
                    }

                    return true;
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
        
    },

    Apply: function ()
    {
        var lRequirementId = Vacancy._RequirementId;
        var sReference = $('#trisys-vacancy-reference').html();
        var sJobTitle = $('#trisys-vacancy-jobtitle').html();

        CandidateFunctions.Apply(lRequirementId, sReference, sJobTitle);
    },

    AddToFavourites: function ()
    {
        TriSysWebJobs.Vacancies.AddToFavourites(null, TriSysWebJobs.Vacancies.AfterAddToFavourite, Vacancy._RequirementId);
    },
    RemoveFromFavourites: function ()
    {
        TriSysApex.UI.ShowMessage("RemoveFromFavourites");
    },

    SendToFriend: function ()
    {
        var lRequirementId = Vacancy._RequirementId;
        if (!lRequirementId || lRequirementId <= 0)
            return;

        var lstRequirementId = [lRequirementId];

        var sReference = $('#trisys-vacancy-reference').html();
        var sJobTitle = $('#trisys-vacancy-jobtitle').html();

        CandidateFunctions.SendToFriend(lstRequirementId, sReference, sJobTitle);
    }
};
