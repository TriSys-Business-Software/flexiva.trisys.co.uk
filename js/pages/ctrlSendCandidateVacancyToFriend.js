var ctrlSendCandidateVacancyToFriend =
{
    JobReferenceID: 'ctrlSendCandidateVacancyToFriend_JobReference',
    JobReferenceLabelID: 'ctrlSendCandidateVacancyToFriend_JobReferenceLabel',
    JobTitleID: 'ctrlSendCandidateVacancyToFriend_JobTitle',
    JobTitleFormBlockID: 'ctrlSendCandidateVacancyToFriend_JobTitleBlock',
    ToEMailID: 'ctrlSendCandidateVacancyToFriend_ToEMail',
    FromID: 'ctrlSendCandidateVacancyToFriend_From',
    CommentsID: 'ctrlSendCandidateVacancyToFriend_Comments',

    CookieName: 'ctrlSendCandidateVacancyToFriend.Settings',


    Load: function ()
    {
        // Read from TriSysWebJobs.Vacancies.MultipleSelectedVacancies and populate screen
        var iCount = TriSysWebJobs.Vacancies.MultipleSelectedVacancies.RequirementId.length;
        var sReference = (iCount == 1 ? TriSysWebJobs.Vacancies.MultipleSelectedVacancies.Reference : iCount);
        var sJobTitle = TriSysWebJobs.Vacancies.MultipleSelectedVacancies.JobTitle;

        if (iCount > 1)
        {
            $('#' + ctrlSendCandidateVacancyToFriend.JobReferenceLabelID).html("Vacancy Count");
            $('#' + ctrlSendCandidateVacancyToFriend.JobTitleFormBlockID).hide();
        }

        $('#' + ctrlSendCandidateVacancyToFriend.JobReferenceID).html(sReference);
        $('#' + ctrlSendCandidateVacancyToFriend.JobTitleID).html(sJobTitle);

        // Use same to/from as last time
        var settings = TriSysAPI.Persistence.Read(ctrlSendCandidateVacancyToFriend.CookieName);
        if (settings)
        {
            $('#' + ctrlSendCandidateVacancyToFriend.ToEMailID).val(settings.ToEMail);
            $('#' + ctrlSendCandidateVacancyToFriend.FromID).val(settings.From);
        }
        else
        {
            // If loggedin, fill in the name of the candidate
            var fnPopulate = function (candidate)
            {
                $('#' + ctrlSendCandidateVacancyToFriend.FromID).val(candidate.Forenames + ' ' + candidate.Surname);
            };
            TriSysWebJobs.ContactUs.LoadLoggedInUserDetails(fnPopulate, true);
        }
    },

    SendJob: function()
    {
        var settings = {
            ToEMail: $('#' + ctrlSendCandidateVacancyToFriend.ToEMailID).val(),
            From: $('#' + ctrlSendCandidateVacancyToFriend.FromID).val()
        };
        var sComments = $('#' + ctrlSendCandidateVacancyToFriend.CommentsID).val();

        // Validate both to e-mail and from name
        var sError = null;
        if (!settings.ToEMail || !settings.From)
            sError = 'Please enter both a to e-mail address and a from name';
        else if (!TriSysApex.LoginCredentials.validateEmail(settings.ToEMail))
            sError = 'Invalid e-mail address';

        if (sError)
        {
            TriSysApex.UI.ShowMessage(sError, TriSysWebJobs.Constants.ApplicationName);
            return false;
        }

        // Call Web API to do all the work
        var CVacancyMultipleSendToFriend = {
            ToEMail: settings.ToEMail,
            From: settings.From,
            Comments: sComments,
            RequirementIdCollection: TriSysWebJobs.Vacancies.MultipleSelectedVacancies.RequirementId,
            WebJobsRequest: TriSysWebJobs.Agency.WebJobsRequest()
        };

        var iCount = TriSysWebJobs.Vacancies.MultipleSelectedVacancies.RequirementId.length;
        ctrlSendCandidateVacancyToFriend.SendMultipleJobDetailsToFriendViaServer(CVacancyMultipleSendToFriend, iCount, settings.ToEMail);

        // Persist for next visit to this page
        TriSysAPI.Persistence.Write(ctrlSendCandidateVacancyToFriend.CookieName, settings);

        return true;
    },

    SendMultipleJobDetailsToFriendViaServer: function (CVacancyMultipleSendToFriend, iNumberOfJobs, sToEMail)
    {
        var bAsynchronous = true;       // 26 Oct 2016
        var fnPostSend = function ()
        {
            TriSysApex.UI.HideWait();
            var sMessage = "Vacancy details of " + iNumberOfJobs + " job" + (iNumberOfJobs == 1 ? "" : "s") +
                " has been sent to: " + sToEMail;
            TriSysApex.UI.ShowMessage(sMessage, TriSysWebJobs.Constants.ApplicationName);
        };

        var sWaitMessage = "Sending " + iNumberOfJobs + " Vacancy E-Mail" + (iNumberOfJobs > 1 ? "s" : "") + "...";
        TriSysApex.UI.ShowWait(null, sWaitMessage);

        var payloadObject = {};
        payloadObject.URL = "Vacancy/SendMultipleToFriend";
        payloadObject.OutboundDataPacket = CVacancyMultipleSendToFriend;
        payloadObject.InboundDataFunction = function (data)
        {
            var CVacancySendToFriendResult = data;
            if (CVacancySendToFriendResult)
            {
                TriSysApex.UI.HideWait();

                if (CVacancySendToFriendResult.Success)
                {
                    if (!bAsynchronous)
                        fnPostSend();
                }
                else
                    TriSysApex.UI.errorAlert(CVacancySendToFriendResult.ErrorMessage, TriSysWebJobs.Constants.ApplicationName);
            }

            return true;
        };
        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.ErrorHandlerRedirector('ctrlSendCandidateVacancyToFriend.SendMultipleJobDetailsToFriendViaServer: ', request, status, error);
        };
        TriSysAPI.Data.PostToWebAPI(payloadObject);

        if (bAsynchronous)
            setTimeout(fnPostSend, 250);
    }
};

$(document).ready(function ()
{
    ctrlSendCandidateVacancyToFriend.Load();
});